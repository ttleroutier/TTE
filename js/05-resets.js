// =========================================================
//   BLOCK 13 — CYCLES
//   13.1 daily & weekly resets · 13.2 bonus quests · 13.3 badges
//   checkResets() is called at startup and every 60 s (js/12-init.js)
//   so a midnight rollover is caught even with the app left open.
// =========================================================

/* 13.1 */
function checkResets() {
    var t = today();

    if (lastResetDate && lastResetDate !== t) {
        // Were all required daily quests done during the day that just ended?
        var mandatoryDaily = quests.filter(q => q.mandatory && !q.unique && !q.weekly && !q.bonus);
        var allDone = mandatoryDaily.length === 0 || mandatoryDaily.every(q => q.completed);

        if (allDone && mandatoryDaily.length > 0) {
            mandatoryStreak++;
            consecutiveMissed = 0;
        } else if (mandatoryDaily.length > 0) {
            consecutiveMissed++;
            mandatoryStreak = 0;
            if (consecutiveMissed >= 2) {                       // penalty: -15% of the balance
                var penalty = Math.round(coins * 0.15 * 100) / 100;
                coins = Math.round(Math.max(0, coins - penalty) * 100) / 100;
                showNotif("Penalty: -" + fmt(penalty) + " coins (" + consecutiveMissed + " days missed)");
            }
        }

        // Reset daily quests only (not weekly, one-time or bonus)
        quests.forEach(function(q) {
            if (!q.unique && !q.weekly && !q.bonus) {
                q.completed = false;
                if (q.subtasks) q.subtasks.forEach(s => s.done = false);
            }
        });

        quests = quests.filter(q => !q.bonus);                  // drop yesterday's bonus quests
        generateBonusQuests();                                  // draw new ones
    } else if (!lastResetDate) {
        generateBonusQuests();                                  // very first run
    }
    lastResetDate = t;

    // Weekly reset, anchored on Monday
    var now = new Date();
    var dayOfWeek = now.getDay();                               // 0 = Sunday, 1 = Monday
    var daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    var thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - daysSinceMonday);
    thisMonday.setHours(0,0,0,0);
    var thisMondayStr = dateStr(thisMonday);

    if (!lastWeeklyReset || new Date(lastWeeklyReset) < thisMonday) {
        quests.forEach(function(q) {
            if (q.weekly) {
                q.completed = false;
                if (q.subtasks) q.subtasks.forEach(s => s.done = false);
            }
        });
        lastWeeklyReset = thisMondayStr;
    }

    save();
}

/* 13.2 — draw 1 to 2 bonus quests from the pool, random reward 0.01–1.99 */
function generateBonusQuests() {
    if (bonusQuestPool.length === 0) return;
    var count = Math.min(Math.floor(Math.random()*2)+1, bonusQuestPool.length);
    var shuffled = bonusQuestPool.slice().sort(() => Math.random() - 0.5);
    for (var i = 0; i < count; i++) {
        var reward = Math.round((Math.random()*1.98 + 0.01) * 100) / 100;
        quests.push({
            id: nextQuestId++, title: shuffled[i], level: 1, reward: reward,
            completed: false, category: "", mandatory: false, unique: false,
            weekly: false, bonus: true, type: "normal", subtasks: []
        });
    }
}

/* 13.3 — badge unlocking; add a new condition here after editing BADGE_DEFS */
function checkBadges() {
    var newBadges = [];
    BADGE_DEFS.forEach(function(b) {
        if (badges.indexOf(b.id) !== -1) return;
        var unlocked = false;
        if (b.id === 'first_quest' && stats.totalQuestsCompleted >= 1) unlocked = true;
        if (b.id === 'q10' && stats.totalQuestsCompleted >= 10) unlocked = true;
        if (b.id === 'q50' && stats.totalQuestsCompleted >= 50) unlocked = true;
        if (b.id === 'q100' && stats.totalQuestsCompleted >= 100) unlocked = true;
        if (b.id === 'q500' && stats.totalQuestsCompleted >= 500) unlocked = true;
        if (b.id === 'streak3' && mandatoryStreak >= 3) unlocked = true;
        if (b.id === 'streak10' && mandatoryStreak >= 10) unlocked = true;
        if (b.id === 'streak30' && mandatoryStreak >= 30) unlocked = true;
        if (b.id === 'first_buy' && shopItems.some(s => s.bought > 0)) unlocked = true;
        if (b.id === 'rich' && coins >= 100) unlocked = true;
        if (b.id === 'unique5' && stats.uniqueCompleted >= 5) unlocked = true;
        if (b.id === 'unique20' && stats.uniqueCompleted >= 20) unlocked = true;
        if (b.id === 'lvl5' && playerLevel >= 5) unlocked = true;
        if (b.id === 'lvl10' && playerLevel >= 10) unlocked = true;
        if (b.id === 'weekly5' && weeklyCompleted >= 5) unlocked = true;
        if (b.id === 'bonus10' && bonusCompleted >= 10) unlocked = true;
        if (unlocked) { badges.push(b.id); newBadges.push(b); }
    });
    if (newBadges.length > 0) {
        setTimeout(function() {                                  // let the reward toast show first
            showNotif("Badge unlocked: " + newBadges[0].icon + " " + newBadges[0].name);
            playSound('levelup'); vibrate([200,100,200]);
        }, 500);
    }
}
