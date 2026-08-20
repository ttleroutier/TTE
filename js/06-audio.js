// =========================================================
//   BLOCK 14 — AUDIO & HAPTICS
//   14.1 audio context · 14.2 synthesised sounds · 14.3 haptics
//   No audio files: every sound is generated with Web Audio.
//   The context is resumed on the first click (js/12-init.js).
// =========================================================

/* 14.1 */
let audioCtx = null;
function ensureAudio() { if (!audioCtx) try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }

/* 14.2 — types: check | uncheck | buy | levelup | timer */
function playSound(type) {
    if (!soundEnabled) return;
    ensureAudio(); if (!audioCtx) return;
    var now = audioCtx.currentTime;

    if (type === 'check') {                       // rising blip
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.setValueAtTime(800, now);
        o.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        o.start(now); o.stop(now + 0.16);
    } else if (type === 'uncheck') {              // falling blip
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.setValueAtTime(600, now);
        o.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        o.start(now); o.stop(now + 0.13);
    } else if (type === 'buy') {                  // three-note sparkle
        [1200, 1600, 2000].forEach(function(freq, i) {
            var o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.connect(g); g.connect(audioCtx.destination);
            o.type = 'sine'; o.frequency.value = freq;
            g.gain.setValueAtTime(0.1, now + i*0.06);
            g.gain.exponentialRampToValueAtTime(0.001, now + i*0.06 + 0.25);
            o.start(now + i*0.06); o.stop(now + i*0.06 + 0.26);
        });
    } else if (type === 'levelup') {              // C-E-G-C arpeggio
        [523, 659, 784, 1046].forEach(function(freq, i) {
            var o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.connect(g); g.connect(audioCtx.destination);
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.1, now + i*0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.25);
            o.start(now + i*0.1); o.stop(now + i*0.1 + 0.26);
        });
    } else if (type === 'timer') {                // triple beep
        [880, 880, 880].forEach(function(freq, i) {
            var o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.connect(g); g.connect(audioCtx.destination);
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.15, now + i*0.18);
            g.gain.exponentialRampToValueAtTime(0.001, now + i*0.18 + 0.15);
            o.start(now + i*0.18); o.stop(now + i*0.18 + 0.16);
        });
    }
}

/* 14.3 */
function vibrate(pattern) { if (!hapticEnabled || !navigator.vibrate) return; try { navigator.vibrate(pattern); } catch(e){} }
