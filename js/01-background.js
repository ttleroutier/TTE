// =========================================================
//   BLOCK 9 — ANIMATED BACKDROP
//   9.1 canvas & shared state · 9.2 winter · 9.3 heat
//   9.4 autumn · 9.5 init & main loop
//   Purely decorative: pointer-events none, z-index 0.
// =========================================================

/* 9.1 — canvas, shared state */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H;
let particles = [];
let bgTheme = 'none';                 // reassigned from localStorage in js/03-state.js
let snowPile = [], blizzardBlowing = false, winterMode = 'snow', winterTimer = 0, winterInterval = 400;
let trees = [];
let rakeActive = false, rakeX = -100, leafPile = [], leafCount = 0;
const maxLeafPile = 200;
let heatWaves = [], sunRings = [], sunRingTimer = 0, sunPulse = 0;
let animFrame = 0;

function resizeCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (bgTheme === 'winter') initTrees();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* 9.2 — winter: trees, mountains, snowflakes, snow pile */
function initTrees() {
    trees = [];
    var count = Math.floor(W / 60) + 4;
    for (var i = 0; i < count; i++) {
        trees.push({
            x: (W / (count - 1)) * i + (Math.random() - 0.5) * 30,
            h: Math.random() * 90 + 50,
            w: Math.random() * 25 + 20,
            phase: Math.random() * Math.PI * 2
        });
    }
}

function drawTree(t, sway) {
    var baseY = H - 8, trunkH = t.h * 0.25, topY = baseY - t.h;
    var sx = Math.sin(animFrame * 0.015 + t.phase) * sway;
    ctx.fillStyle = 'rgba(80,50,25,0.7)';
    ctx.fillRect(t.x - 4 + sx * 0.2, baseY - trunkH, 8, trunkH);
    for (var l = 0; l < 3; l++) {
        var ly = topY + l * (t.h * 0.22) + sx * (1 - l * 0.3);
        var lw = t.w * (0.35 + l * 0.3);
        var lh = t.h * 0.4;
        ctx.fillStyle = 'rgba(25,75,35,0.75)';
        ctx.beginPath();
        ctx.moveTo(t.x + sx, ly); ctx.lineTo(t.x - lw/2, ly + lh); ctx.lineTo(t.x + lw/2, ly + lh);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(230,240,250,0.55)';
        ctx.beginPath();
        ctx.moveTo(t.x + sx, ly); ctx.lineTo(t.x - lw/3, ly + lh*0.25); ctx.lineTo(t.x + lw/3, ly + lh*0.25);
        ctx.closePath(); ctx.fill();
    }
}

function drawMountains() {
    ctx.fillStyle = 'rgba(60,80,110,0.15)';
    ctx.beginPath();
    ctx.moveTo(0, H*0.55);
    ctx.lineTo(W*0.1, H*0.35); ctx.lineTo(W*0.2, H*0.45);
    ctx.lineTo(W*0.35, H*0.25); ctx.lineTo(W*0.5, H*0.4);
    ctx.lineTo(W*0.65, H*0.3); ctx.lineTo(W*0.8, H*0.42);
    ctx.lineTo(W*0.95, H*0.28); ctx.lineTo(W, H*0.45);
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(220,235,250,0.2)';
    ctx.beginPath(); ctx.moveTo(W*0.35, H*0.25); ctx.lineTo(W*0.3, H*0.32); ctx.lineTo(W*0.4, H*0.32); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W*0.95, H*0.28); ctx.lineTo(W*0.9, H*0.35); ctx.lineTo(W, H*0.35); ctx.closePath(); ctx.fill();
}

function createSnowflake(blizzard) {
    return {
        x: Math.random()*W, y: -10,
        r: Math.random()*3 + 1.5,
        speed: blizzard ? Math.random()*8+5 : Math.random()*1.5+0.5,
        wind: blizzard ? (Math.random()*7+3) : (Math.random()*0.8-0.4),
        opacity: Math.random()*0.5+0.3,
        grey: Math.floor(Math.random()*40+170)
    };
}

function createGroundSnow(x, y, r) {
    return { x:x, y:y, r:r*0.8, opacity:Math.random()*0.3+0.5, grey:Math.floor(Math.random()*30+180), vx:0 };
}

// Height of the snow already piled up at a given x (caps at 60px)
function getSnowHeight(x) {
    let count = 0;
    for (let s of snowPile) if (Math.abs(s.x - x) < 8) count++;
    return Math.min(count * 1.2, 60);
}

/* 9.3 — heat: shimmer waves and pulsing sun */
function createHeatWave() {
    return {
        x: Math.random()*W, amplitude: Math.random()*4+2,
        frequency: Math.random()*0.03+0.01, phase: Math.random()*Math.PI*2,
        speed: Math.random()*0.06+0.03, width: Math.random()*20+10,
        opacity: Math.random()*0.06+0.03
    };
}
function createSunRing() { return { radius:30, opacity:0.25, speed:Math.random()*1+0.5 }; }

/* 9.4 — autumn: falling leaves and the rake that sweeps them away */
const leafColors = ['#c25d3a','#d4a843','#a84432','#d4783a','#8b6914','#9e5a2e','#bf8c30'];

function createLeaf() {
    return {
        x: Math.random()*W, y: -20 - Math.random()*100,
        size: Math.random()*14+10, color: leafColors[Math.floor(Math.random()*leafColors.length)],
        speed: Math.random()*1.5+0.8, sway: Math.random()*2.5-1.2,
        rot: Math.random()*360, rotSpeed: Math.random()*4-2,
        leafType: Math.floor(Math.random()*3)
    };
}
function startRake() { rakeActive = true; rakeX = -80; }

function drawLeaf(x, y, size, color, rot, leafType) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot * Math.PI/180);
    ctx.fillStyle = color;
    if (leafType === 0) {                       // lobed leaf
        ctx.beginPath();
        ctx.moveTo(0, -size/2);
        ctx.quadraticCurveTo(size/3, -size/3, size/2, -size/5);
        ctx.quadraticCurveTo(size/4, 0, size/2, size/4);
        ctx.quadraticCurveTo(size/5, size/3, 0, size/2);
        ctx.quadraticCurveTo(-size/5, size/3, -size/2, size/4);
        ctx.quadraticCurveTo(-size/4, 0, -size/2, -size/5);
        ctx.quadraticCurveTo(-size/3, -size/3, 0, -size/2);
        ctx.fill();
    } else if (leafType === 1) {                // star-shaped leaf
        ctx.beginPath();
        for (var a = 0; a < Math.PI*2; a += 0.3) {
            var r = size/2.5 + Math.sin(a*4)*size/8;
            var px = Math.cos(a)*r, py = Math.sin(a)*r;
            a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
    } else {                                    // simple oval leaf
        ctx.beginPath(); ctx.ellipse(0,0,size/2,size/3,0,0,Math.PI*2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0,-size/3); ctx.lineTo(0,size/3);
    ctx.moveTo(0,-size/8); ctx.lineTo(size/4,-size/4);
    ctx.moveTo(0,size/8); ctx.lineTo(-size/4,size/5);
    ctx.stroke();
    ctx.restore();
}

/* 9.5 — seeding and main loop */
function initParticles() {
    particles = []; snowPile = []; leafPile = []; leafCount = 0;
    rakeActive = false; blizzardBlowing = false; winterTimer = 0;
    winterMode = 'snow'; heatWaves = []; sunRings = []; trees = [];
    if (bgTheme === 'winter') { for(let i=0;i<80;i++) particles.push(createSnowflake(false)); initTrees(); }
    if (bgTheme === 'autumn') { for(let i=0;i<50;i++) particles.push(createLeaf()); }
    if (bgTheme === 'heat') { for(let i=0;i<20;i++) heatWaves.push(createHeatWave()); sunRings.push(createSunRing()); }
}

function animateBg() {
    requestAnimationFrame(animateBg);
    ctx.clearRect(0, 0, W, H);
    animFrame++;
    if (bgTheme === 'none') return;

    if (bgTheme === 'winter') {
        // alternate between calm snowfall and blizzard bursts
        winterTimer++;
        if (winterTimer > winterInterval) {
            winterTimer = 0; winterInterval = Math.random()*500+200;
            if (winterMode === 'snow') {
                winterMode = 'blizzard'; blizzardBlowing = true;
                while (particles.length < 250) particles.push(createSnowflake(true));
            } else { winterMode = 'snow'; blizzardBlowing = false; }
        }
        if (winterMode === 'blizzard') { ctx.fillStyle = 'rgba(180,195,215,0.1)'; ctx.fillRect(0,0,W,H); }
        drawMountains();
        ctx.fillStyle = 'rgba(230,238,248,0.25)';
        ctx.fillRect(0, H-15, W, 15);
        var treeSway = blizzardBlowing ? 5 : 1;
        for (var t = 0; t < trees.length; t++) drawTree(trees[t], treeSway);

        for (let i = particles.length-1; i >= 0; i--) {
            const p = particles[i];
            p.y += p.speed; p.x += p.wind;
            const groundLevel = H - 10 - getSnowHeight(p.x);
            if (p.y >= groundLevel && winterMode === 'snow') {
                snowPile.push(createGroundSnow(p.x, groundLevel, p.r));
                particles[i] = createSnowflake(false); continue;
            }
            if (p.y > H+10 || p.x > W+30 || p.x < -30) {
                particles[i] = createSnowflake(winterMode === 'blizzard'); continue;
            }
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            ctx.fillStyle = 'rgba('+p.grey+','+p.grey+','+Math.min(p.grey+20,240)+','+p.opacity+')';
            ctx.fill();
        }
        for (let i = snowPile.length-1; i >= 0; i--) {
            const s = snowPile[i];
            if (blizzardBlowing) {                       // the blizzard blows the pile away
                s.vx += Math.random()*1.5+0.5; s.x += s.vx; s.y -= Math.random()*2;
                s.opacity -= 0.008;
                if (s.x > W+50 || s.opacity <= 0) { snowPile.splice(i,1); continue; }
            }
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
            ctx.fillStyle = 'rgba('+s.grey+','+s.grey+','+Math.min(s.grey+15,240)+','+s.opacity+')';
            ctx.fill();
        }
        if (winterMode === 'blizzard') {
            for (let i = 0; i < 15; i++) {
                const sx = Math.random()*W, sy = Math.random()*H;
                ctx.beginPath(); ctx.moveTo(sx,sy);
                ctx.lineTo(sx+Math.random()*60+30, sy+Math.random()*15+5);
                ctx.strokeStyle = 'rgba(200,210,225,'+(Math.random()*0.15+0.05)+')';
                ctx.lineWidth = Math.random()*1.5+0.5; ctx.stroke();
            }
        }
        if (!blizzardBlowing && winterMode === 'snow' && particles.length > 100) particles.length = 100;
    }

    else if (bgTheme === 'heat') {
        ctx.fillStyle = 'rgba(255,245,230,0.04)'; ctx.fillRect(0,0,W,H);
        heatWaves.forEach(function(w) {
            w.phase += w.speed;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(220,120,40,'+w.opacity+')'; ctx.lineWidth = w.width;
            for (let y = 0; y < H; y += 3) {
                const x = w.x + Math.sin(y*w.frequency + w.phase)*w.amplitude;
                if (y === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            }
            ctx.stroke();
        });
        const sunX = W*0.82, sunY = 80;
        sunPulse += 0.03;
        const grd = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
        grd.addColorStop(0, 'rgba(255,200,50,0.25)');
        grd.addColorStop(0.5, 'rgba(255,150,30,0.08)');
        grd.addColorStop(1, 'rgba(255,100,0,0)');
        ctx.fillStyle = grd; ctx.fillRect(sunX-120, sunY-120, 240, 240);
        ctx.beginPath(); ctx.arc(sunX, sunY, 18+Math.sin(sunPulse)*2, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,210,80,0.6)'; ctx.fill();
        ctx.beginPath(); ctx.arc(sunX, sunY, 12, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,230,120,0.7)'; ctx.fill();
        sunRingTimer++;
        if (sunRingTimer > 40) { sunRings.push(createSunRing()); sunRingTimer = 0; }
        for (let i = sunRings.length-1; i >= 0; i--) {
            const r = sunRings[i]; r.radius += r.speed; r.opacity -= 0.0015;
            if (r.opacity <= 0 || r.radius > Math.max(W,H)) { sunRings.splice(i,1); continue; }
            ctx.beginPath(); ctx.arc(sunX, sunY, r.radius, 0, Math.PI*2);
            ctx.strokeStyle = 'rgba(255,160,40,'+r.opacity+')';
            ctx.lineWidth = 2; ctx.stroke();
        }
        for (let i = 0; i < 5; i++) {                    // floating dust motes
            const hx = Math.random()*W, hy = H - Math.random()*H*0.7;
            ctx.beginPath(); ctx.arc(hx, hy, Math.random()*1.5+0.5, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,180,60,'+(Math.random()*0.12+0.03)+')'; ctx.fill();
        }
    }

    else if (bgTheme === 'autumn') {
        ctx.fillStyle = 'rgba(245,240,230,0.03)'; ctx.fillRect(0,0,W,H);
        particles.forEach(function(p, i) {
            p.y += p.speed; p.x += Math.sin(p.y*0.02)*p.sway; p.rot += p.rotSpeed;
            if (p.y > H-30-Math.random()*40) {
                leafPile.push({ x:p.x, groundY:p.y, size:p.size, color:p.color, rot:p.rot, leafType:p.leafType });
                leafCount++; particles[i] = createLeaf();
                if (leafCount >= maxLeafPile && !rakeActive) startRake();
            }
            drawLeaf(p.x, p.y, p.size, p.color, p.rot, p.leafType);
        });
        leafPile.forEach(function(p) { drawLeaf(p.x, p.groundY, p.size, p.color, p.rot, p.leafType); });
        if (rakeActive) {
            rakeX += 3.5;
            var rBaseY = H - 15;
            ctx.strokeStyle = '#7a5a1a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(rakeX, rBaseY-130); ctx.lineTo(rakeX+8, rBaseY-15); ctx.stroke();
            ctx.strokeStyle = '#555'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(rakeX-25, rBaseY-15); ctx.lineTo(rakeX+40, rBaseY-15); ctx.stroke();
            ctx.lineWidth = 2;
            for (let t = -25; t <= 40; t += 5) {
                ctx.beginPath(); ctx.moveTo(rakeX+t, rBaseY-15); ctx.lineTo(rakeX+t+2, rBaseY); ctx.stroke();
            }
            leafPile.forEach(function(l) { if (l.x < rakeX+45 && l.x > rakeX-35) l.x = rakeX+45; });
            if (rakeX > W+60) { rakeActive = false; leafPile = []; leafCount = 0; }
        }
    }
}
