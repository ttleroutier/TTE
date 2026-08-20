// =========================================================
//   BLOCK 20 — MASTER RENDER & BOOTSTRAP
//   20.1 render() · 20.2 minute loop · 20.3 startup
//   render() rebuilds every page: cheap enough at this scale
//   and it keeps state and DOM impossible to desynchronise.
// =========================================================

/* 20.1 */
function render() {
    updateCoins();
    renderQuests();
    renderShop();
    renderTracker();
    renderCosmetics();
    renderSettings();
    updateTimerDisplay();
}

/* 20.2 — catches the midnight rollover when the app is left open */
setInterval(function() {
    var prevDate = lastResetDate;
    checkResets();
    if (prevDate !== lastResetDate) render();
}, 60000);

/* 20.3 — startup sequence (order matters) */
document.body.classList.toggle('dark-mode', darkMode);
document.body.classList.toggle('heat-active', bgTheme === 'heat');
initParticles();
animateBg();
checkResets();
checkBadges();
if (activeTimer) tickTimer();          // resume a timer that survived a reload
render();

// Browsers block audio until a user gesture: resume the context on first click.
document.addEventListener('click', function once() {
    ensureAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    document.removeEventListener('click', once);
}, { once: true });
