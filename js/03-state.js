// =========================================================
//   BLOCK 11 — STATE
//   11.1 persisted state · 11.2 runtime state · 11.3 migrations
//   Key suffixes (coins5, quests6…) are schema versions.
//   Bump them on any breaking change of shape.
// =========================================================

/* 11.1 — loaded from localStorage, falling back to defaults */
let appTitle = localStorage.getItem("appTitle") || "TTE";
let coins = parseFloat(localStorage.getItem("coins5")) || 0;
let quests = JSON.parse(localStorage.getItem("quests6")) || JSON.parse(JSON.stringify(DEFAULT_QUESTS));
let shopItems = JSON.parse(localStorage.getItem("shop5")) || JSON.parse(JSON.stringify(DEFAULT_SHOP));
let categories = JSON.parse(localStorage.getItem("categories2")) || [...DEFAULT_CATEGORIES];
let unlockThreshold = parseInt(localStorage.getItem("unlockThreshold2")) || 2;
let history = JSON.parse(localStorage.getItem("history2")) || [];
let stats = JSON.parse(localStorage.getItem("stats5")) || { totalCoinsEarned:0, totalCoinsSpent:0, totalQuestsCompleted:0, lv1:0, lv2:0, lv3:0 };
bgTheme = localStorage.getItem("bgTheme") || "none";   // declared in js/01-background.js
let darkMode = localStorage.getItem("darkMode") === "true";
let cosmetics = JSON.parse(localStorage.getItem("cosmetics")) || [];
let uniqueArchive = JSON.parse(localStorage.getItem("uniqueArchive")) || [];

let playerXP = parseFloat(localStorage.getItem("playerXP")) || 0;
let playerLevel = parseInt(localStorage.getItem("playerLevel")) || 1;
let lastResetDate = localStorage.getItem("lastResetDate") || "";
let lastWeeklyReset = localStorage.getItem("lastWeeklyReset") || "";
let mandatoryStreak = parseInt(localStorage.getItem("mandatoryStreak")) || 0;
let consecutiveMissed = parseInt(localStorage.getItem("consecutiveMissed")) || 0;
let badges = JSON.parse(localStorage.getItem("badges")) || [];
let bonusQuestPool = JSON.parse(localStorage.getItem("bonusQuestPool")) || [...DEFAULT_BONUS_POOL];
let dailyCoinHistory = JSON.parse(localStorage.getItem("dailyCoinHistory")) || {};
let soundEnabled = localStorage.getItem("soundEnabled") !== "false";
let hapticEnabled = localStorage.getItem("hapticEnabled") !== "false";
let activeTimer = JSON.parse(localStorage.getItem("activeTimer")) || null;
let defaultTimerMin = parseInt(localStorage.getItem("defaultTimerMin")) || 25;
let bonusCompleted = parseInt(localStorage.getItem("bonusCompleted")) || 0;
let weeklyCompleted = parseInt(localStorage.getItem("weeklyCompleted")) || 0;

/* 11.2 — runtime only, never persisted */
let activeFilter = "All";
let questMode = "daily";                              // daily | weekly | unique
let nextQuestId = Math.max(...quests.map(q => q.id), 0) + 1;
let nextShopId = Math.max(...shopItems.map(s => s.id), 0) + 1;
let modalMode = null, modalTarget = null;
let tempSubtasks = [];                                // subtasks being edited in the modal
let newQuestSubtasks = [];                            // subtasks of the quest being created
let timerInterval = null;

/* 11.3 — migrations: add any new field here with a safe default */
shopItems.forEach(function(s) {
    if (s.stock === undefined) { s.stock = -1; s.bought = s.purchased ? 1 : 0; }
    if (s.inflation === undefined) s.inflation = false;
});
quests.forEach(function(q) {
    if (q.unique === undefined) q.unique = false;
    if (q.weekly === undefined) q.weekly = false;
    if (q.bonus === undefined) q.bonus = false;
    if (!q.type) q.type = "normal";
    if (!q.subtasks) q.subtasks = [];
});
if (stats.uniqueCompleted === undefined) stats.uniqueCompleted = 0;
if (stats.uniqueCoinsEarned === undefined) stats.uniqueCoinsEarned = 0;
