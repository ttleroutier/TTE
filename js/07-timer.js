// =========================================================
//   BLOCK 15 — POMODORO TIMER
//   15.1 start · 15.2 tick · 15.3 finish & cancel · 15.4 display
//   activeTimer is persisted, so a running timer survives a reload.
//   When it ends, the linked quest is ticked automatically.
// =========================================================

/* 15.1 */
function promptStartTimer(questId) {
    var mins = prompt("Timer length in minutes:", defaultTimerMin);
    if (!mins) return;
    var m = parseInt(mins);
    if (isNaN(m) || m <= 0 || m > 240) { showNotif("Invalid duration"); return; }
    defaultTimerMin = m;
    startTimer(questId, m);
}

function startTimer(questId, minutes) {
    activeTimer = { questId:questId, endTime:Date.now() + minutes*60000, minutes:minutes };
    save(); tickTimer();
}

/* 15.2 — one interval at a time; always clear before re-arming */
function tickTimer() {
    if (timerInterval) clearInterval(timerInterval);
    if (!activeTimer) { updateTimerDisplay(); return; }
    if (Date.now() >= activeTimer.endTime) { completeTimer(); return; }
    updateTimerDisplay();
    timerInterval = setInterval(function() {
        if (!activeTimer) { clearInterval(timerInterval); return; }
        if (Date.now() >= activeTimer.endTime) { completeTimer(); return; }
        updateTimerDisplay();
    }, 1000);
}

/* 15.3 */
function completeTimer() {
    if (timerInterval) clearInterval(timerInterval);
    if (!activeTimer) return;
    var qid = activeTimer.questId;
    activeTimer = null; save();
    var q = quests.find(x => x.id === qid);
    if (q && !q.completed) toggleQuest(qid);
    showNotif("Timer finished!"); playSound('timer'); vibrate([200,100,200,100,200]);
    render();
}

function cancelTimer() {
    if (timerInterval) clearInterval(timerInterval);
    activeTimer = null; save(); render();
}

/* 15.4 */
function updateTimerDisplay() {
    var el = document.getElementById('timer-overlay');
    if (!el) return;
    if (!activeTimer) { el.style.display = 'none'; return; }
    var q = quests.find(x => x.id === activeTimer.questId);
    if (!q) { activeTimer = null; save(); el.style.display = 'none'; return; }   // quest deleted mid-timer
    var remaining = Math.max(0, activeTimer.endTime - Date.now());
    var mins = Math.floor(remaining / 60000);
    var secs = Math.floor((remaining % 60000) / 1000);
    el.style.display = 'flex';
    document.getElementById('t-quest').textContent = q.title;
    document.getElementById('t-time').textContent = mins + ':' + String(secs).padStart(2, '0');
}
