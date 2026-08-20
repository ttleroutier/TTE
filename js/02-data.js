// =========================================================
//   BLOCK 10 — CONSTANTS & DEFAULT DATA
//   10.1 categories · 10.2 quests · 10.3 shop · 10.4 bonus pool
//   10.5 reward caps & titles · 10.6 badges
//   Everything here is seed data: it is only used on first run
//   or after a reset. Live data lives in localStorage.
// =========================================================

/* 10.1 */
const DEFAULT_CATEGORIES = ["Health", "Productivity", "Fitness", "Wellbeing", "Learning"];

/* 10.2 */
const DEFAULT_QUESTS = [
    { id: 1, title: "Tidy my desk", level: 1, reward: 1.00, completed: false, category: "Productivity", mandatory: false, unique: false, weekly: false, type: "normal", subtasks: [] },
    { id: 2, title: "Read for 20 minutes", level: 1, reward: 0.75, completed: false, category: "Learning", mandatory: false, unique: false, weekly: false, type: "normal", subtasks: [] },
    { id: 3, title: "Drink 2L of water", level: 1, reward: 1.00, completed: false, category: "Health", mandatory: true, unique: false, weekly: false, type: "normal", subtasks: [] },
    { id: 4, title: "30 min workout", level: 2, reward: 2.00, completed: false, category: "Fitness", mandatory: false, unique: false, weekly: false, type: "normal", subtasks: [] },
    { id: 5, title: "Cook a healthy meal", level: 2, reward: 1.50, completed: false, category: "Health", mandatory: false, unique: false, weekly: false, type: "normal", subtasks: [] },
    { id: 6, title: "Finish a personal project", level: 3, reward: 3.00, completed: false, category: "Productivity", mandatory: false, unique: false, weekly: false, type: "normal", subtasks: [] },
    { id: 7, title: "Meditate 7 days in a row", level: 3, reward: 2.50, completed: false, category: "Wellbeing", mandatory: false, unique: false, weekly: false, type: "normal", subtasks: [] }
];

/* 10.3 — stock: -1 means unlimited; inflation adds +15% per purchase */
const DEFAULT_SHOP = [
    { id: 1, name: "Coffee break", price: 3.00, stock: -1, bought: 0, inflation: false },
    { id: 2, name: "One TV episode", price: 5.00, stock: -1, bought: 0, inflation: false },
    { id: 3, name: "Fast food", price: 10.00, stock: -1, bought: 0, inflation: false },
    { id: 4, name: "Restaurant", price: 15.00, stock: -1, bought: 0, inflation: false },
    { id: 5, name: "Day off", price: 20.00, stock: -1, bought: 0, inflation: false },
    { id: 6, name: "Personal gift", price: 30.00, stock: -1, bought: 0, inflation: false }
];

/* 10.4 — 1 to 2 of these are drawn at random every day */
const DEFAULT_BONUS_POOL = ["Do 10 push-ups", "Call a friend", "Tidy one drawer", "Get fresh air for 10 min", "Stretch for 5 min"];

/* 10.5 — hard reward cap per tier, and the 13 player titles */
const REWARD_CAPS = { 1: 1, 2: 2, 3: 3 };
const TITLES = ["Novice","Apprentice","Adventurer","Explorer","Fighter","Warrior","Champion","Hero","Master","Sage","Legend","Myth","Divine"];

/* 10.6 — badge catalogue; unlock conditions live in js/05-resets.js (checkBadges) */
const BADGE_DEFS = [
    { id:'first_quest', name:'First step', desc:'1 quest', icon:'✨' },
    { id:'q10', name:'Discipline', desc:'10 quests', icon:'🌱' },
    { id:'q50', name:'Determined', desc:'50 quests', icon:'🔥' },
    { id:'q100', name:'Pro', desc:'100 quests', icon:'⚡' },
    { id:'q500', name:'Unstoppable', desc:'500 quests', icon:'💎' },
    { id:'streak3', name:'Consistency', desc:'3-day streak', icon:'📅' },
    { id:'streak10', name:'Tenacious', desc:'10-day streak', icon:'💪' },
    { id:'streak30', name:'Unshakeable', desc:'30-day streak', icon:'🏆' },
    { id:'first_buy', name:'First purchase', desc:'1st reward', icon:'🛍️' },
    { id:'rich', name:'Wealthy', desc:'100 coins', icon:'💰' },
    { id:'unique5', name:'Adventurer', desc:'5 one-time quests', icon:'🗺️' },
    { id:'unique20', name:'Explorer', desc:'20 one-time quests', icon:'🧭' },
    { id:'lvl5', name:'Champion', desc:'Level 5', icon:'⭐' },
    { id:'lvl10', name:'Legend', desc:'Level 10', icon:'👑' },
    { id:'weekly5', name:'Routine', desc:'5 weekly quests', icon:'📆' },
    { id:'bonus10', name:'Hunter', desc:'10 bonus quests', icon:'🎯' }
];
