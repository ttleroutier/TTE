// =========================================================
//   BLOCK 19 — USER ACTIONS
//   19.1 subtask editor · 19.2 bonus pool · 19.3 ticking quests
//   19.4 archive · 19.5 purchase · 19.6 CRUD · 19.7 resets
//   Money rule: always Math.round(x * 100) / 100.
//   Refund rule: always q.lastPaidAmount, never q.reward.
// =========================================================

/* 19.1 — subtasks of the quest being created */
function toggleNewQuestList() {
    var area = document.getElementById("new-quest-subtasks-area");
    var on = document.getElementById("new-quest-list").classList.contains("on");
    area.style.display = on ? 'block' : 'none';
    if (!on) newQuestSubtasks = [];
    renderNewSubtasks();
}
function renderNewSubtasks() {
    var el = document.getElementById("new-subtask-chips");
    if (!el) return;
    el.innerHTML = newQuestSubtasks.map((s, i) => '<span class="subtask-chip">' + s + '<button onclick="removeNewSubtask(' + i + ')">&times;</button></span>').join('');
}
function addNewSubtask() {
    var inp = document.getElementById("new-subtask-input");
    var v = inp.value.trim(); if (!v) return;
    newQuestSubtasks.push(v); inp.value = ''; renderNewSubtasks();
}
function removeNewSubtask(i) { newQuestSubtasks.splice(i, 1); renderNewSubtasks(); }

/* 19.2 — bonus quest pool */
function addBonusPool() {
    var inp = document.getElementById("new-bonus-pool");
    var v = inp.value.trim(); if (!v) return;
    bonusQuestPool.push(v); inp.value = '';
    showNotif("Added to pool"); save(); render();
}
function removeBonusPool(i) { bonusQuestPool.splice(i, 1); save(); render(); }

/* 19.3 — complete / undo a quest (checklist quests go through toggleSubtask) */
function toggleQuest(id) {
    var q = quests.find(x => x.id === id);
    if (!q) return;
    if (q.type === 'list') return;
    var mult = getMultiplier();

    if (q.completed) {
        q.completed = false;
        var paidAmount = q.lastPaidAmount || q.reward;
        coins = Math.round((coins - paidAmount) * 100) / 100;
        if (coins < 0) coins = 0;
        var idx = history.findIndex(h => h.questId === id && h.date === today());
        if (idx !== -1) history.splice(idx, 1);
        stats.totalQuestsCompleted = Math.max(0, stats.totalQuestsCompleted - 1);
        stats["lv" + q.level] = Math.max(0, stats["lv" + q.level] - 1);
        stats.totalCoinsEarned = Math.round(Math.max(0, stats.totalCoinsEarned - paidAmount) * 100) / 100;
        if (dailyCoinHistory[today()]) {
            dailyCoinHistory[today()] = Math.max(0, dailyCoinHistory[today()] - paidAmount);
        }
        removeXP(q.reward * 10);
        if (q.bonus) bonusCompleted = Math.max(0, bonusCompleted - 1);
        if (q.weekly) weeklyCompleted = Math.max(0, weeklyCompleted - 1);
        playSound('uncheck'); vibrate(30);
        showNotif("Quest undone");

    } else {
        q.completed = true;
        var amount = Math.round(q.reward * mult * 100) / 100;
        q.lastPaidAmount = amount;                       // remember what was actually paid
        coins = Math.round((coins + amount) * 100) / 100;
        history.push({ questId:id, date:today() });
        stats.totalQuestsCompleted++;
        stats["lv" + q.level]++;
        stats.totalCoinsEarned = Math.round((stats.totalCoinsEarned + amount) * 100) / 100;
        dailyCoinHistory[today()] = Math.round(((dailyCoinHistory[today()] || 0) + amount) * 100) / 100;
        addXP(q.reward * 10);
        if (q.bonus) bonusCompleted++;
        if (q.weekly) weeklyCompleted++;
        playSound('check'); vibrate(50);
        showNotif("+" + fmt(amount) + " coins" + (mult > 1 ? " (x" + mult + ")" : ""));

        if (q.unique) {                                  // one-time quests leave the list
            stats.uniqueCompleted++;
            stats.uniqueCoinsEarned = Math.round((stats.uniqueCoinsEarned + amount) * 100) / 100;
            uniqueArchive.push({
                archiveId: Date.now(), title: q.title, reward: amount,
                level: q.level, category: q.category, date: today(),
                questData: JSON.parse(JSON.stringify(q))
            });
            if (uniqueArchive.length > 10) uniqueArchive.shift();
            quests = quests.filter(x => x.id !== id);
            showNotif("One-time quest archived! +" + fmt(amount));
        }
        // Bonus quests stay visible until the next daily reset.
    }

    checkBadges();
    save(); render();
}

/* Checklist quests: the parent completes itself when every subtask is done */
function toggleSubtask(questId, subtaskId) {
    var q = quests.find(x => x.id === questId);
    if (!q || q.type !== 'list') return;
    var st = q.subtasks.find(s => s.id === subtaskId);
    if (!st) return;
    st.done = !st.done;

    var allDone = q.subtasks.every(s => s.done);
    var mult = getMultiplier();

    if (allDone && !q.completed) {
        q.completed = true;
        var amount = Math.round(q.reward * mult * 100) / 100;
        q.lastPaidAmount = amount;
        coins = Math.round((coins + amount) * 100) / 100;
        history.push({ questId:questId, date:today() });
        stats.totalQuestsCompleted++;
        stats["lv" + q.level]++;
        stats.totalCoinsEarned = Math.round((stats.totalCoinsEarned + amount) * 100) / 100;
        dailyCoinHistory[today()] = Math.round(((dailyCoinHistory[today()] || 0) + amount) * 100) / 100;
        addXP(q.reward * 10);
        if (q.weekly) weeklyCompleted++;
        playSound('check'); vibrate(50);
        showNotif("+" + fmt(amount) + " coins!");

        if (q.unique) {
            stats.uniqueCompleted++;
            stats.uniqueCoinsEarned = Math.round((stats.uniqueCoinsEarned + amount) * 100) / 100;
            uniqueArchive.push({
                archiveId: Date.now(), title: q.title, reward: amount,
                level: q.level, category: q.category, date: today(),
                questData: JSON.parse(JSON.stringify(q))
            });
            if (uniqueArchive.length > 10) uniqueArchive.shift();
            quests = quests.filter(x => x.id !== questId);
            showNotif("One-time quest archived!");
        }

    } else if (!allDone && q.completed) {                 // unticking a subtask refunds the quest
        q.completed = false;
        var paid = q.lastPaidAmount || q.reward;
        coins = Math.round((coins - paid) * 100) / 100; if (coins < 0) coins = 0;
        var idx = history.findIndex(h => h.questId === questId && h.date === today());
        if (idx !== -1) history.splice(idx, 1);
        stats.totalQuestsCompleted = Math.max(0, stats.totalQuestsCompleted - 1);
        stats["lv" + q.level] = Math.max(0, stats["lv" + q.level] - 1);
        stats.totalCoinsEarned = Math.round(Math.max(0, stats.totalCoinsEarned - paid) * 100) / 100;
        if (dailyCoinHistory[today()]) dailyCoinHistory[today()] = Math.max(0, dailyCoinHistory[today()] - paid);
        removeXP(q.reward * 10);
        if (q.weekly) weeklyCompleted = Math.max(0, weeklyCompleted - 1);
        playSound('uncheck');

    } else {
        playSound('check'); vibrate(30);
    }

    checkBadges(); save(); render();
}

/* 19.4 — undo an archived one-time quest: refund and restore it */
function cancelArchive(archiveId) {
    var idx = uniqueArchive.findIndex(a => a.archiveId === archiveId);
    if (idx === -1) return;
    var a = uniqueArchive[idx];

    coins = Math.round(Math.max(0, coins - a.reward) * 100) / 100;
    stats.uniqueCompleted = Math.max(0, stats.uniqueCompleted - 1);
    stats.uniqueCoinsEarned = Math.round(Math.max(0, stats.uniqueCoinsEarned - a.reward) * 100) / 100;
    stats.totalQuestsCompleted = Math.max(0, stats.totalQuestsCompleted - 1);
    stats.totalCoinsEarned = Math.round(Math.max(0, stats.totalCoinsEarned - a.reward) * 100) / 100;
    stats["lv" + a.level] = Math.max(0, stats["lv" + a.level] - 1);
    if (dailyCoinHistory[a.date]) dailyCoinHistory[a.date] = Math.max(0, dailyCoinHistory[a.date] - a.reward);

    var restored = a.questData || {
        id: nextQuestId++, title: a.title, level: a.level, reward: a.reward,
        completed: false, category: a.category || "", mandatory: false,
        unique: true, weekly: false, bonus: false, type: "normal", subtasks: []
    };
    restored.completed = false; restored.id = nextQuestId++;
    if (restored.subtasks) restored.subtasks.forEach(s => s.done = false);
    quests.push(restored);
    uniqueArchive.splice(idx, 1);

    showNotif("Quest restored, -" + fmt(a.reward));
    save(); render();
}

/* 19.5 — purchase */
function buyItem(id) {
    var item = shopItems.find(s => s.id === id); if (!item) return;
    var rem = item.stock === -1 ? Infinity : item.stock - item.bought;
    var price = getCurrentPrice(item);
    if (rem <= 0 || coins < price) return;
    item.bought++;
    coins = Math.round((coins - price) * 100) / 100;
    stats.totalCoinsSpent = Math.round((stats.totalCoinsSpent + price) * 100) / 100;
    playSound('buy'); vibrate([50, 30, 100]);
    showNotif(item.name + " unlocked (-" + fmt(price) + ")");
    checkBadges(); save(); render();
}

/* 19.6 — CRUD: quests, shop items, categories, cosmetics, manual adjustments */
function addQuest() {
    var title = document.getElementById("new-quest-title").value.trim();
    var cat = document.getElementById("new-quest-cat").value;
    var level = parseInt(document.getElementById("new-quest-level").value);
    var reward = parseFloat(document.getElementById("new-quest-reward").value);
    var mandatory = document.getElementById("new-quest-mandatory").classList.contains("on");
    var isUnique = document.getElementById("new-quest-unique").classList.contains("on");
    var isWeekly = document.getElementById("new-quest-weekly").classList.contains("on");
    var isList = document.getElementById("new-quest-list").classList.contains("on");

    if (!title || isNaN(reward)) { showNotif("Fill in every field"); return; }
    reward = Math.min(reward, REWARD_CAPS[level]);
    if (reward <= 0) { showNotif("Invalid reward"); return; }
    if (isUnique && isWeekly) isWeekly = false;               // one-time wins over weekly

    var subtasks = isList ? newQuestSubtasks.map((t, i) => ({ id:Date.now()+i, title:t, done:false })) : [];
    quests.push({
        id:nextQuestId++, title:title, level:level, reward:reward, completed:false,
        category:cat, mandatory:mandatory, unique:isUnique, weekly:isWeekly, bonus:false,
        type:isList ? 'list' : 'normal', subtasks:subtasks
    });
    newQuestSubtasks = [];
    showNotif("Quest added"); save(); render();
}
function deleteQuest(id) { quests = quests.filter(q => q.id !== id); showNotif("Quest deleted"); save(); render(); }

function addShopItem() {
    var name = document.getElementById("new-shop-name").value.trim();
    var price = parseFloat(document.getElementById("new-shop-price").value);
    var stock = parseInt(document.getElementById("new-shop-stock").value); if (isNaN(stock)) stock = -1;
    var infl = document.getElementById("new-shop-infl").classList.contains("on");
    if (!name || isNaN(price)) { showNotif("Fill in every field"); return; }
    shopItems.push({ id:nextShopId++, name:name, price:price, stock:stock, bought:0, inflation:infl });
    showNotif("Reward added"); save(); render();
}
function deleteShopItem(id) { shopItems = shopItems.filter(s => s.id !== id); showNotif("Reward deleted"); save(); render(); }

function addCategory() {
    var name = document.getElementById("new-cat-name").value.trim();
    if (!name) { showNotif("Enter a name"); return; }
    if (categories.includes(name)) { showNotif("Already exists"); return; }
    categories.push(name); showNotif("Category added"); save(); render();
}
function deleteCategory(i) {
    var cat = categories[i];
    categories.splice(i, 1);
    quests.forEach(q => { if (q.category === cat) q.category = ""; });   // orphan quests keep working
    showNotif("Deleted"); save(); render();
}

function addCosmetic() {
    var name = document.getElementById("new-cos-name").value.trim();
    var url = document.getElementById("new-cos-url").value.trim();
    if (!name || !url) { showNotif("Fill in every field"); return; }
    cosmetics.push({ name:name, url:url });
    showNotif("Cosmetic added"); save(); render();
}
function deleteCosmetic(i) { cosmetics.splice(i, 1); showNotif("Deleted"); save(); render(); }

function adjustCoins(a) { coins = Math.round(Math.max(0, coins + a) * 100) / 100; save(); render(); }
function adjustThreshold(a) { unlockThreshold = Math.max(1, unlockThreshold + a); save(); render(); }

/* 19.7 — destructive resets, all behind a confirm() */
function resetQuests() {
    if (!confirm("Reset daily quests?")) return;
    quests = quests.filter(q => q.unique || q.weekly).concat(JSON.parse(JSON.stringify(DEFAULT_QUESTS)));
    nextQuestId = Math.max(...quests.map(q => q.id), 99) + 1;
    showNotif("Reset done"); save(); render();
}
function resetShop() {
    if (!confirm("Reset the shop?")) return;
    shopItems = JSON.parse(JSON.stringify(DEFAULT_SHOP));
    nextShopId = 100;
    showNotif("Reset done"); save(); render();
}
function resetAll() {
    if (!confirm("Reset everything?")) return;
    localStorage.clear(); location.reload();
}
