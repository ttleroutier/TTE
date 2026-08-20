// =========================================================
//   BLOCK 16 — BACKUP & SHARING
//   16.1 JSON export · 16.2 JSON import · 16.3 PNG stat card
//   The JSON file is the full state. Import replaces everything
//   and reloads the page.
// =========================================================

/* 16.1 */
function exportJSON() {
    var data = {
        version: 1, exportDate: new Date().toISOString(),
        coins, quests, shopItems, categories, appTitle, unlockThreshold,
        history, stats, bgTheme, darkMode, cosmetics, uniqueArchive,
        playerXP, playerLevel, lastResetDate, lastWeeklyReset,
        mandatoryStreak, consecutiveMissed, badges, bonusQuestPool,
        dailyCoinHistory, soundEnabled, hapticEnabled, defaultTimerMin,
        bonusCompleted, weeklyCompleted
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'tte-backup-' + today() + '.json';
    a.click(); URL.revokeObjectURL(url);
    showNotif("Export complete");
}

/* 16.2 — every field is optional so older backups still import */
function triggerImport() { document.getElementById('file-input').click(); }

function importData(event) {
    var file = event.target.files[0];
    if (!file) return;
    if (!confirm("This will replace all your data. Continue?")) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var d = JSON.parse(e.target.result);
            if (d.coins !== undefined) coins = d.coins;
            if (d.quests) quests = d.quests;
            if (d.shopItems) shopItems = d.shopItems;
            if (d.categories) categories = d.categories;
            if (d.appTitle) appTitle = d.appTitle;
            if (d.unlockThreshold) unlockThreshold = d.unlockThreshold;
            if (d.history) history = d.history;
            if (d.stats) stats = d.stats;
            if (d.bgTheme) bgTheme = d.bgTheme;
            if (d.darkMode !== undefined) darkMode = d.darkMode;
            if (d.cosmetics) cosmetics = d.cosmetics;
            if (d.uniqueArchive) uniqueArchive = d.uniqueArchive;
            if (d.playerXP !== undefined) playerXP = d.playerXP;
            if (d.playerLevel) playerLevel = d.playerLevel;
            if (d.lastResetDate) lastResetDate = d.lastResetDate;
            if (d.lastWeeklyReset) lastWeeklyReset = d.lastWeeklyReset;
            if (d.mandatoryStreak !== undefined) mandatoryStreak = d.mandatoryStreak;
            if (d.consecutiveMissed !== undefined) consecutiveMissed = d.consecutiveMissed;
            if (d.badges) badges = d.badges;
            if (d.bonusQuestPool) bonusQuestPool = d.bonusQuestPool;
            if (d.dailyCoinHistory) dailyCoinHistory = d.dailyCoinHistory;
            if (d.soundEnabled !== undefined) soundEnabled = d.soundEnabled;
            if (d.hapticEnabled !== undefined) hapticEnabled = d.hapticEnabled;
            if (d.defaultTimerMin) defaultTimerMin = d.defaultTimerMin;
            if (d.bonusCompleted !== undefined) bonusCompleted = d.bonusCompleted;
            if (d.weeklyCompleted !== undefined) weeklyCompleted = d.weeklyCompleted;
            save(); location.reload();
        } catch (err) { showNotif("Invalid file"); console.error(err); }
    };
    reader.readAsText(file);
}

/* 16.3 — shareable stat card drawn on an offscreen canvas */
function exportImage() {
    var c = document.createElement('canvas');
    c.width = 600; c.height = 800;
    var x = c.getContext('2d');
    var bg = darkMode ? '#1a1a1e' : '#f5f5f0';
    var fg = darkMode ? '#e0e0e0' : '#1a1a1a';
    var muted = darkMode ? '#999' : '#888';

    x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#b8963e';
    x.font = 'bold 32px Inter, sans-serif';
    x.textAlign = 'center';
    x.fillText(appTitle, c.width/2, 60);
    x.fillStyle = fg;
    x.font = '14px Inter, sans-serif';
    x.fillText('Stats for ' + today(), c.width/2, 90);

    var y = 150;
    var line = function(label, value) {
        x.textAlign = 'left'; x.fillStyle = muted; x.font = '14px Inter, sans-serif';
        x.fillText(label, 60, y);
        x.textAlign = 'right'; x.fillStyle = fg; x.font = 'bold 18px Inter, sans-serif';
        x.fillText(value, c.width - 60, y);
        y += 40;
    };
    line('Level', playerLevel + ' - ' + getTitle(playerLevel));
    line('Coins', fmt(coins));
    line('Quests completed', stats.totalQuestsCompleted);
    line('Coins earned (total)', fmt(stats.totalCoinsEarned));
    line('Coins spent', fmt(stats.totalCoinsSpent));
    line('Required streak', mandatoryStreak + ' days');
    line('Multiplier', 'x' + getMultiplier());
    line('One-time quests', stats.uniqueCompleted);
    line('Weekly quests', weeklyCompleted);
    line('Bonus completed', bonusCompleted);
    line('Badges', badges.length + ' / ' + BADGE_DEFS.length);

    x.fillStyle = muted; x.font = '11px Inter, sans-serif'; x.textAlign = 'center';
    x.fillText('Generated by TTE', c.width/2, c.height - 30);

    var url = c.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = url; a.download = 'tte-stats-' + today() + '.png';
    a.click();
    showNotif("Image exported");
}
