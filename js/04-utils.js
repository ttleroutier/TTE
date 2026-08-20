// =========================================================
//   BLOCK 12 — UTILITIES
//   12.1 persistence · 12.2 formatting · 12.3 tier rules
//   12.4 streaks · 12.5 theme & navigation · 12.6 XP · 12.7 multiplier
// =========================================================

/* 12.1 — single write point for the whole state */
function save() {
    localStorage.setItem("coins5", coins);
    localStorage.setItem("quests6", JSON.stringify(quests));
    localStorage.setItem("shop5", JSON.stringify(shopItems));
    localStorage.setItem("categories2", JSON.stringify(categories));
    localStorage.setItem("appTitle", appTitle);
    localStorage.setItem("unlockThreshold2", unlockThreshold);
    localStorage.setItem("history2", JSON.stringify(history));
    localStorage.setItem("stats5", JSON.stringify(stats));
    localStorage.setItem("bgTheme", bgTheme);
    localStorage.setItem("cosmetics", JSON.stringify(cosmetics));
    localStorage.setItem("darkMode", darkMode);
    localStorage.setItem("uniqueArchive", JSON.stringify(uniqueArchive));
    localStorage.setItem("playerXP", playerXP);
    localStorage.setItem("playerLevel", playerLevel);
    localStorage.setItem("lastResetDate", lastResetDate);
    localStorage.setItem("lastWeeklyReset", lastWeeklyReset);
    localStorage.setItem("mandatoryStreak", mandatoryStreak);
    localStorage.setItem("consecutiveMissed", consecutiveMissed);
    localStorage.setItem("badges", JSON.stringify(badges));
    localStorage.setItem("bonusQuestPool", JSON.stringify(bonusQuestPool));
    localStorage.setItem("dailyCoinHistory", JSON.stringify(dailyCoinHistory));
    localStorage.setItem("soundEnabled", soundEnabled);
    localStorage.setItem("hapticEnabled", hapticEnabled);
    localStorage.setItem("activeTimer", JSON.stringify(activeTimer));
    localStorage.setItem("defaultTimerMin", defaultTimerMin);
    localStorage.setItem("bonusCompleted", bonusCompleted);
    localStorage.setItem("weeklyCompleted", weeklyCompleted);
}

/* 12.2 — formatting helpers (dates are local, YYYY-MM-DD) */
function fmt(n) { return n.toFixed(2); }
function today() { var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function dateStr(d) { return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function showNotif(msg) {
    var el = document.getElementById("notification");
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(function() { el.classList.remove("show"); }, 1800);
}
function getCatClass(c) { var i = categories.indexOf(c); return "cat-" + (i >= 0 ? i % 6 : 5); }
function getInitials(n) { return n.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase(); }

/* 12.3 — tier unlocking: N opens when N-1 has enough completions and no pending required quest */
function getCompletedCount(lv) { return quests.filter(q => q.level===lv && q.completed && !q.unique && !q.weekly && !q.bonus).length; }
function getMandatoryIncomplete(lv) { return quests.filter(q => q.level===lv && q.mandatory && !q.completed && !q.unique && !q.weekly); }
function isLevelUnlocked(lv) {
    if (lv <= 1) return true;
    var prev = lv - 1;
    return getCompletedCount(prev) >= unlockThreshold && getMandatoryIncomplete(prev).length === 0;
}

/* 12.4 — per-quest streaks, derived from the completion history */
function getStreaks() {
    var streaks = [];
    quests.filter(q => !q.unique && !q.bonus).forEach(function(q) {
        var entries = history.filter(h => h.questId === q.id).map(h => h.date).sort().reverse();
        if (!entries.length) return;
        var unique = [...new Set(entries)];
        var streak = 1;
        // a streak stays alive if the last completion is today or yesterday
        if (unique[0] !== today()) {
            var y = new Date(today()); y.setDate(y.getDate()-1);
            var ys = dateStr(y);
            if (unique[0] !== ys) return;
        }
        for (var i = 0; i < unique.length-1; i++) {
            var d1 = new Date(unique[i]), d2 = new Date(unique[i+1]);
            if ((d1-d2)/86400000 === 1) streak++; else break;
        }
        if (streak >= 2) streaks.push({ quest:q, streak:streak });
    });
    streaks.sort((a,b) => b.streak - a.streak);
    return streaks;
}

/* 12.5 — theme, preferences and navigation */
function setTheme(t) {
    bgTheme = t; initParticles();
    document.body.classList.toggle('heat-active', t === 'heat');
    save(); render();
}
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
    save(); render();
}
function toggleSound() { soundEnabled = !soundEnabled; save(); render(); }
function toggleHaptic() { hapticEnabled = !hapticEnabled; save(); render(); }
function switchTab(tab) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    var tabs = document.querySelectorAll(".tab");
    var map = { quests:0, shop:1, tracker:2, cosmetics:3, settings:4 };
    tabs[map[tab]].classList.add("active");
    document.getElementById("page-" + tab).classList.add("active");
    render();
}
function setFilter(c) { activeFilter = c; render(); }
function setQuestMode(m) { questMode = m; activeFilter = "All"; render(); }

/* 12.6 — XP and player level (threshold = 100 * 1.55^(level-1)) */
function getXpForLevel(lvl) { return Math.floor(100 * Math.pow(1.55, lvl - 1)); }
function getTitle(lvl) { return TITLES[Math.min(lvl - 1, TITLES.length - 1)]; }
function addXP(amount) {
    playerXP += amount;
    var leveledUp = false;
    while (playerXP >= getXpForLevel(playerLevel)) {
        playerXP -= getXpForLevel(playerLevel);
        playerLevel++;
        leveledUp = true;
    }
    if (leveledUp) {
        showNotif("LEVEL UP! Level " + playerLevel + " - " + getTitle(playerLevel));
        playSound('levelup'); vibrate([100,50,100,50,200]);
    }
}
function removeXP(amount) {
    playerXP -= amount;
    while (playerXP < 0 && playerLevel > 1) {
        playerLevel--;
        playerXP += getXpForLevel(playerLevel);
    }
    if (playerXP < 0) playerXP = 0;
}

/* 12.7 — reward multiplier driven by the required-quest streak */
function getMultiplier() {
    if (mandatoryStreak >= 10) return 2;
    if (mandatoryStreak >= 5) return 1.5;
    if (mandatoryStreak >= 3) return 1.25;
    return 1;
}
