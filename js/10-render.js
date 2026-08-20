// =========================================================
//   BLOCK 18 — RENDERING
//   18.1 header · 18.2 quests · 18.3 shop · 18.4 chart
//   18.5 badges · 18.6 tracker · 18.7 style · 18.8 settings
//   Every function rebuilds its container with innerHTML,
//   which is why handlers are inline onclick attributes.
// =========================================================

var CHK = '<svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

function getCurrentPrice(item) {
    if (item.inflation) return Math.round(item.price * (1 + item.bought * 0.15) * 100) / 100;
    return item.price;
}

/* 18.1 — header: balance, level, XP bar, streak badge */
function updateCoins() {
    document.getElementById("coins-display").textContent = fmt(coins);
    document.getElementById("app-title").textContent = appTitle;
    document.title = appTitle;

    document.getElementById("player-level-num").textContent = playerLevel;
    document.getElementById("player-title").textContent = getTitle(playerLevel);
    var needed = getXpForLevel(playerLevel);
    var pct = Math.min(100, (playerXP / needed) * 100);
    document.getElementById("xp-fill").style.width = pct + '%';
    document.getElementById("xp-text").textContent = Math.floor(playerXP) + ' / ' + needed + ' XP';

    var sb = document.getElementById("streak-badge-wrap");
    if (mandatoryStreak >= 3) {
        sb.innerHTML = '<div class="streak-badge">🔥 ' + mandatoryStreak + 'd <span class="mult">x' + getMultiplier() + '</span></div>';
    } else if (mandatoryStreak > 0) {
        sb.innerHTML = '<div class="streak-badge" style="background:linear-gradient(135deg,#888,#aaa)">🔥 ' + mandatoryStreak + 'd</div>';
    } else {
        sb.innerHTML = '';
    }
}

/* 18.2 — quests: sub-tabs, filters, tier sections, cards */
function renderSubTabs() {
    document.getElementById("quest-sub-tabs").innerHTML =
        '<div class="sub-tabs">' +
        '<div class="sub-tab ' + (questMode === 'daily' ? 'active' : '') + '" onclick="setQuestMode(\'daily\')">Daily</div>' +
        '<div class="sub-tab ' + (questMode === 'weekly' ? 'active' : '') + '" onclick="setQuestMode(\'weekly\')">Weekly</div>' +
        '<div class="sub-tab ' + (questMode === 'unique' ? 'active' : '') + '" onclick="setQuestMode(\'unique\')">One-time</div>' +
        '</div>';
}

function filterByMode(q) {
    if (questMode === 'daily') return !q.unique && !q.weekly;
    if (questMode === 'weekly') return q.weekly && !q.unique;
    if (questMode === 'unique') return q.unique;
    return true;
}

function renderFilterBar() {
    var bar = document.getElementById("filter-bar");
    var src = quests.filter(filterByMode);
    var used = [...new Set(src.map(q => q.category).filter(Boolean))];
    var h = '<div class="filter-chip ' + (activeFilter === 'All' ? 'active' : '') + '" onclick="setFilter(\'All\')">All</div>';
    used.forEach(c => h += '<div class="filter-chip ' + (activeFilter === c ? 'active' : '') + '" onclick="setFilter(\'' + c + '\')">' + c + '</div>');
    bar.innerHTML = h;
}

function renderQuests() {
    renderSubTabs(); renderFilterBar();
    var container = document.getElementById("quests-list");
    var levels = [{ num:1, label:"Tier 1" }, { num:2, label:"Tier 2" }, { num:3, label:"Tier 3" }];
    var html = "";

    levels.forEach(function(lv) {
        var lq = quests.filter(q => q.level === lv.num && filterByMode(q));
        if (activeFilter !== "All") lq = lq.filter(q => q.category === activeFilter);
        if (!lq.length) return;
        lq.sort((a, b) => (b.bonus ? 1 : 0) - (a.bonus ? 1 : 0));    // bonus quests on top

        var unlocked = isLevelUnlocked(lv.num);
        var isUnique = questMode === 'unique';
        var isWeekly = questMode === 'weekly';

        html += '<div class="level-section level-' + lv.num + '">';
        html += '<div class="level-header"><div class="level-dot"></div><span class="level-label">' + lv.label + ' &middot; max ' + fmt(REWARD_CAPS[lv.num]) + '/quest</span><div class="level-line"></div></div>';

        // Tier gating only applies to daily quests
        if (!unlocked && !isUnique && !isWeekly) {
            var prev = lv.num - 1, done = getCompletedCount(prev), need = unlockThreshold;
            var ml = getMandatoryIncomplete(prev);
            var msg = 'Complete ' + need + ' tier ' + prev + ' quest' + (need > 1 ? 's' : '') + ' (' + done + '/' + need + ')';
            var detail = "";
            if (done >= need && ml.length > 0) {
                msg = 'Required quests still pending in tier ' + prev;
                detail = ml.map(q => q.title).join(", ");
            }
            html += '<div class="locked-banner"><span class="lock-icon">&#9711;</span>' + msg + (detail ? '<div class="locked-detail">' + detail + '</div>' : '') + '</div>';
        } else {
            lq.forEach(function(q) {
                var ct = q.category ? '<span class="cat-tag ' + getCatClass(q.category) + '">' + q.category + '</span>' : '';
                var mt = q.mandatory ? '<span class="quest-mandatory-tag">REQUIRED</span>' : '';
                var lt = q.type === 'list' ? '<span class="list-tag">CHECKLIST</span>' : '';
                var bt = q.bonus ? '<span class="bonus-tag">BONUS</span>' : '';
                var wt = q.weekly ? '<span class="weekly-tag">WEEKLY</span>' : '';
                var isList = q.type === 'list' && q.subtasks && q.subtasks.length > 0;
                var allDone = isList ? q.subtasks.every(s => s.done) : q.completed;
                var cbClass = 'quest-checkbox' + (allDone && q.completed ? ' done' : '') + (isList ? ' auto' : '');

                html += '<div class="quest-card ' + (q.completed ? 'completed' : '') + (q.bonus ? ' bonus' : '') + '">' +
                    '<div class="' + cbClass + '" ' + (isList ? '' : 'onclick="toggleQuest(' + q.id + ')"') + '>' + CHK + '</div>' +
                    '<div class="quest-info"><div class="quest-title">' + q.title + '</div>' +
                    '<div class="quest-meta"><span class="quest-reward">+' + fmt(q.reward) + (getMultiplier() > 1 ? ' (x' + getMultiplier() + ')' : '') + '</span>' + ct + mt + lt + bt + wt + '</div>';

                if (isList) {
                    html += '<div class="subtask-list">';
                    q.subtasks.forEach(s => {
                        html += '<div class="subtask-item ' + (s.done ? 'done' : '') + '">' +
                            '<div class="subtask-cb ' + (s.done ? 'done' : '') + '" onclick="toggleSubtask(' + q.id + ',' + s.id + ')">' + CHK + '</div>' +
                            '<span class="subtask-title">' + s.title + '</span></div>';
                    });
                    html += '</div>';
                }
                html += '</div>';

                if (!q.completed && !isList) {                 // Pomodoro shortcut
                    html += '<div class="quest-actions"><button class="timer-btn" onclick="promptStartTimer(' + q.id + ')" title="Start a timer">&#9719;</button></div>';
                }
                html += '</div>';
            });
        }
        html += '</div>';
    });

    if (!html) {
        var emptyMsg = questMode === 'unique' ? 'No one-time quests.' :
                       questMode === 'weekly' ? 'No weekly quests.' :
                       'No quests in this category.';
        html = '<div class="empty-state">' + emptyMsg + '</div>';
    }
    container.innerHTML = html;
}

/* 18.3 — shop */
function renderShop() {
    var container = document.getElementById("shop-list");
    var h = "";
    shopItems.forEach(function(item) {
        var ul = item.stock === -1;
        var rem = ul ? Infinity : item.stock - item.bought;
        var so = !ul && rem <= 0;
        var sl = ul ? "Unlimited" : rem + ' left';
        var currPrice = getCurrentPrice(item);
        var priceHtml;
        if (item.inflation && item.bought > 0) {
            priceHtml = '<span class="shop-price-old">' + fmt(item.price) + '</span>' + fmt(currPrice) + ' coins<span class="price-change price-up">+' + Math.round(((currPrice/item.price - 1) * 100)) + '%</span>';
        } else {
            priceHtml = fmt(currPrice) + ' coins' + (item.inflation ? '<span class="price-change price-up" style="background:transparent;color:var(--text-light)">INFLATION</span>' : '');
        }
        h += '<div class="shop-card ' + (so ? 'soldout' : '') + '">' +
            '<div class="shop-icon">' + getInitials(item.name) + '</div>' +
            '<div class="shop-info"><div class="shop-name">' + item.name + '</div>' +
            '<div class="shop-price">' + priceHtml + '</div>' +
            '<div class="shop-stock">' + sl + (item.bought > 0 ? ' &middot; Bought ' + item.bought + 'x' : '') + '</div></div>' +
            '<div style="text-align:center">' +
            (so ? '<span class="purchased-badge">Sold out</span>' : '<button class="buy-btn" onclick="buyItem(' + item.id + ')"' + (coins < currPrice ? ' disabled' : '') + '>Buy</button>') +
            '</div></div>';
    });
    if (!h) h = '<div class="empty-state">No rewards yet.</div>';
    container.innerHTML = h;
}

/* 18.4 — 30-day coin chart, built from dailyCoinHistory */
function renderCoinChart() {
    var t = new Date();
    var vals = [], labels = [], maxV = 0;
    for (var i = 29; i >= 0; i--) {
        var d = new Date(t); d.setDate(t.getDate() - i);
        var ds = dateStr(d);
        var v = dailyCoinHistory[ds] || 0;
        vals.push(v); labels.push(ds.substring(5));
        if (v > maxV) maxV = v;
    }
    if (maxV === 0) maxV = 1;
    var total = vals.reduce((a,b) => a+b, 0);
    var avg = total / 30;
    var bars = vals.map((v, i) => {
        var h = (v / maxV) * 90;
        return '<div class="graph-bar-wrap"><div class="graph-bar" style="height:' + Math.max(0.5, h) + 'px" title="' + labels[i] + ': ' + fmt(v) + '"></div></div>';
    }).join('');
    return '<div class="graph-card">' +
        '<div class="graph-info"><span>Last 30 days</span><span>Total: ' + fmt(total) + ' &middot; Avg: ' + fmt(avg) + '</span></div>' +
        '<div class="graph-bars">' + bars + '</div>' +
        '<div class="graph-labels"><span>' + labels[0] + '</span><span>' + labels[14] + '</span><span>' + labels[29] + '</span></div></div>';
}

/* 18.5 — badges */
function renderBadges() {
    var h = '<div class="badge-grid">';
    BADGE_DEFS.forEach(b => {
        var unlocked = badges.indexOf(b.id) !== -1;
        h += '<div class="badge-item ' + (unlocked ? 'unlocked' : 'locked') + '" title="' + b.desc + '">' +
            '<div class="badge-icon">' + b.icon + '</div>' +
            '<div class="badge-name">' + b.name + '</div>' +
            '<div class="badge-desc">' + b.desc + '</div></div>';
    });
    h += '</div>';
    return h;
}

/* 18.6 — tracker page */
function renderTracker() {
    var container = document.getElementById("tracker-content");
    var h = "";

    h += '<div class="tracker-section"><div class="tracker-section-title">Coins earned (30d)</div>' + renderCoinChart() + '</div>';
    h += '<div class="tracker-section"><div class="tracker-section-title">Badges (' + badges.length + '/' + BADGE_DEFS.length + ')</div>' + renderBadges() + '</div>';

    var streaks = getStreaks();
    h += '<div class="tracker-section"><div class="tracker-section-title">Active streaks</div>';
    if (!streaks.length) h += '<div class="empty-state">No active streak.</div>';
    else streaks.forEach(s => {
        h += '<div class="streak-card"><div class="streak-info"><div class="streak-title">' + s.quest.title + '</div>' +
            '<div class="streak-meta">Tier ' + s.quest.level + (s.quest.category ? ' &middot; ' + s.quest.category : '') + '</div></div>' +
            '<div class="streak-count">' + s.streak + ' <span class="streak-unit">d</span></div></div>';
    });
    h += '</div>';

    h += '<div class="tracker-section"><div class="tracker-section-title">Archive &middot; One-time quests (last 10)</div>';
    if (!uniqueArchive.length) h += '<div class="empty-state">No archived one-time quest.</div>';
    else uniqueArchive.slice().reverse().forEach(a => {
        h += '<div class="archive-card"><div class="archive-info"><div class="archive-title">' + a.title + '</div>' +
            '<div class="archive-meta">+' + fmt(a.reward) + ' &middot; Tier ' + a.level + ' &middot; ' + a.date + '</div></div>' +
            '<button class="archive-cancel" onclick="cancelArchive(' + a.archiveId + ')">Undo</button></div>';
    });
    h += '</div>';

    h += '<div class="tracker-section"><div class="tracker-section-title">Milestones &middot; Daily</div>';
    var td = new Set(history.map(x => x.date)).size;
    var tb = shopItems.reduce((a, s) => a + s.bought, 0);
    [{l:"Tier 1 quests",v:stats.lv1},{l:"Tier 2 quests",v:stats.lv2},{l:"Tier 3 quests",v:stats.lv3},
     {l:"Total quests",v:stats.totalQuestsCompleted},{l:"Coins earned",v:fmt(stats.totalCoinsEarned)},
     {l:"Coins spent",v:fmt(stats.totalCoinsSpent)},{l:"Purchases",v:tb},{l:"Active days",v:td},
     {l:"Required streak",v:mandatoryStreak + 'd'}
    ].forEach(m => h += '<div class="milestone-card"><div class="milestone-label">' + m.l + '</div><div class="milestone-value">' + m.v + '</div></div>');
    h += '</div>';

    h += '<div class="tracker-section"><div class="tracker-section-title">Milestones &middot; Special</div>';
    [{l:"One-time quests completed",v:stats.uniqueCompleted},
     {l:"Coins earned (one-time)",v:fmt(stats.uniqueCoinsEarned)},
     {l:"One-time quests pending",v:quests.filter(q=>q.unique).length},
     {l:"Weekly quests completed",v:weeklyCompleted},
     {l:"Bonus quests completed",v:bonusCompleted},
     {l:"Player level",v:playerLevel + ' (' + getTitle(playerLevel) + ')'},
     {l:"Total XP",v:Math.floor(playerXP) + ' / ' + getXpForLevel(playerLevel)}
    ].forEach(m => h += '<div class="milestone-card"><div class="milestone-label">' + m.l + '</div><div class="milestone-value">' + m.v + '</div></div>');
    h += '</div>';

    container.innerHTML = h;
}

/* 18.7 — style page: backdrop themes and cosmetics */
function renderCosmetics() {
    var c = document.getElementById("cosmetics-content");
    var h = '';

    h += '<div class="settings-section"><div class="settings-section-title">Animated backdrop</div>' +
        '<div class="form-group"><label>Pick a theme</label><div class="theme-grid">' +
        '<div class="theme-option theme-none ' + (bgTheme==='none'?'active':'') + '" onclick="setTheme(\'none\')">None</div>' +
        '<div class="theme-option theme-winter ' + (bgTheme==='winter'?'active':'') + '" onclick="setTheme(\'winter\')">Winter</div>' +
        '<div class="theme-option theme-heat ' + (bgTheme==='heat'?'active':'') + '" onclick="setTheme(\'heat\')">Heatwave</div>' +
        '<div class="theme-option theme-autumn ' + (bgTheme==='autumn'?'active':'') + '" onclick="setTheme(\'autumn\')">Autumn</div>' +
        '</div></div></div>';

    h += '<div class="settings-section"><div class="settings-section-title">Character</div>' +
        '<div class="coming-soon-box"><div class="coming-soon-icon">&#9634;</div>' +
        '<div class="coming-soon-title">Coming Soon</div>' +
        '<div class="coming-soon-sub">Customise your character with pixel art.</div></div></div>';

    if (cosmetics.length > 0) {
        h += '<div class="settings-section"><div class="settings-section-title">My cosmetics</div>';
        cosmetics.forEach((co, i) => {
            h += '<div class="edit-item"><img src="' + co.url + '" class="pixel-preview" onerror="this.style.display=\'none\'">' +
                '<div class="edit-item-info" style="margin-left:12px"><div class="edit-item-title">' + co.name + '</div>' +
                '<div class="edit-item-meta">' + co.url.substring(0, 40) + '...</div></div>' +
                '<button class="delete-btn" onclick="deleteCosmetic(' + i + ')">&times;</button></div>';
        });
        h += '</div>';
    }

    h += '<div class="settings-section"><div class="settings-section-title">Add a cosmetic</div>' +
        '<div class="form-group"><label>Name</label><div class="form-row"><input type="text" id="new-cos-name" placeholder="e.g. Red hat"></div></div>' +
        '<div class="form-group"><label>Image URL</label><div class="form-row"><input type="text" id="new-cos-url" placeholder="https://...png"></div></div>' +
        '<button class="action-btn primary" onclick="addCosmetic()">Add</button></div>';

    c.innerHTML = h;
}

/* 18.8 — settings page */
function renderSettings() {
    var c = document.getElementById("settings-content");
    var h = "";

    h += '<div class="settings-section"><div class="settings-section-title">Application</div>' +
        '<div class="form-group"><div class="toggle-row"><span class="toggle-label">Dark mode</span><div class="toggle '+(darkMode?'on':'')+'" onclick="toggleDarkMode()"></div></div></div>' +
        '<div class="form-group"><div class="toggle-row"><span class="toggle-label">Sounds</span><div class="toggle '+(soundEnabled?'on':'')+'" onclick="toggleSound()"></div></div></div>' +
        '<div class="form-group"><div class="toggle-row"><span class="toggle-label">Vibration (mobile)</span><div class="toggle '+(hapticEnabled?'on':'')+'" onclick="toggleHaptic()"></div></div></div>' +
        '<div class="form-group"><label>Title</label><div class="form-row">' +
        '<input type="text" value="' + appTitle + '" readonly style="cursor:pointer" onclick="openModal(\'editTitle\')">' +
        '<button class="edit-btn" onclick="openModal(\'editTitle\')" style="flex-shrink:0">&#9998;</button></div></div></div>';

    h += '<div class="settings-section"><div class="settings-section-title">Backup &amp; sharing</div>' +
        '<button class="action-btn primary" onclick="exportJSON()">Export (JSON)</button>' +
        '<button class="action-btn secondary" onclick="exportImage()" style="margin-top:6px">Export as image (PNG)</button>' +
        '<button class="action-btn danger" onclick="triggerImport()" style="margin-top:6px">Import (JSON)</button></div>';

    h += '<div class="settings-section"><div class="settings-section-title">Pomodoro timer</div>' +
        '<div class="form-group"><label>Default length (minutes)</label><div class="form-row">' +
        '<input type="number" value="'+defaultTimerMin+'" min="1" max="240" id="default-timer-input" onchange="defaultTimerMin = parseInt(this.value) || 25; save();">' +
        '</div></div></div>';

    h += '<div class="settings-section"><div class="settings-section-title">Progression</div>' +
        '<div class="form-group"><label>Quests required to unlock the next tier</label><div class="coin-adjust">' +
        '<button class="coin-adjust-btn" onclick="adjustThreshold(-1)">-</button>' +
        '<div class="coin-value">' + unlockThreshold + '</div>' +
        '<button class="coin-adjust-btn" onclick="adjustThreshold(1)">+</button></div></div></div>';

    h += '<div class="settings-section"><div class="settings-section-title">Balance</div>' +
        '<div class="form-group"><label>Adjust coins</label><div class="coin-adjust">' +
        '<button class="coin-adjust-btn" onclick="adjustCoins(-0.25)">-</button>' +
        '<div class="coin-value">' + fmt(coins) + '</div>' +
        '<button class="coin-adjust-btn" onclick="adjustCoins(0.25)">+</button></div></div></div>';

    h += '<div class="settings-section"><div class="settings-section-title">Player level</div>' +
        '<div class="form-group"><div class="edit-item-meta">Current level: <strong>' + playerLevel + ' (' + getTitle(playerLevel) + ')</strong><br>' +
        'XP: ' + Math.floor(playerXP) + ' / ' + getXpForLevel(playerLevel) + '<br>' +
        'Current multiplier: x' + getMultiplier() + ' (' + mandatoryStreak + ' days)</div></div></div>';

    h += '<div class="settings-section"><div class="settings-section-title">Categories</div>';
    categories.forEach((cat, i) => {
        h += '<div class="edit-item"><div class="edit-item-info"><div class="edit-item-title"><span class="cat-tag cat-' + (i%6) + '">' + cat + '</span></div></div>' +
            '<button class="delete-btn" onclick="deleteCategory(' + i + ')">&times;</button></div>';
    });
    h += '<div class="form-group" style="margin-top:8px"><div class="form-row"><input type="text" id="new-cat-name" placeholder="New category"></div></div>' +
        '<button class="action-btn primary" onclick="addCategory()">Add</button></div>';

    h += '<div class="settings-section"><div class="settings-section-title">Bonus quest pool</div>' +
        '<div class="form-group"><label>Candidates (1-2 drawn at random each day)</label>' +
        '<div class="subtask-chips">' + bonusQuestPool.map((b,i) => '<span class="pool-chip">' + b + '<button onclick="removeBonusPool('+i+')">&times;</button></span>').join('') + '</div>' +
        '<div class="form-row" style="margin-top:8px"><input type="text" id="new-bonus-pool" placeholder="New bonus quest">' +
        '<button class="edit-btn" onclick="addBonusPool()" style="flex-shrink:0;margin-left:4px">+</button></div></div></div>';

    var catOpts = categories.map(cat => '<option value="' + cat + '">' + cat + '</option>').join("");
    h += '<div class="settings-section"><div class="settings-section-title">Add a quest</div>' +
        '<div class="form-group"><div class="form-row"><input type="text" id="new-quest-title" placeholder="Quest name"></div></div>' +
        '<div class="form-group"><div class="form-row"><select id="new-quest-cat">' + catOpts + '</select>' +
        '<select id="new-quest-level"><option value="1">Tier 1 (max 1.00)</option><option value="2">Tier 2 (max 2.00)</option><option value="3">Tier 3 (max 3.00)</option></select>' +
        '<input type="number" id="new-quest-reward" placeholder="Coins" min="0" step="0.01"></div></div>' +
        '<div class="form-group"><div class="toggle-row"><span class="toggle-label">Required</span><div class="toggle" id="new-quest-mandatory" onclick="this.classList.toggle(\'on\')"></div></div></div>' +
        '<div class="form-group"><label>Quest type</label>' +
        '<div class="toggle-row"><span class="toggle-label">One-time quest</span><div class="toggle" id="new-quest-unique" onclick="this.classList.toggle(\'on\');"></div></div>' +
        '<div class="toggle-row" style="margin-top:8px"><span class="toggle-label">Weekly quest</span><div class="toggle" id="new-quest-weekly" onclick="this.classList.toggle(\'on\');"></div></div>' +
        '<div class="toggle-row" style="margin-top:8px"><span class="toggle-label">Checklist (subtasks)</span><div class="toggle" id="new-quest-list" onclick="this.classList.toggle(\'on\');toggleNewQuestList()"></div></div></div>' +
        '<div id="new-quest-subtasks-area" style="display:none">' +
        '<div class="form-group"><label>Subtasks</label><div id="new-subtask-chips" class="subtask-chips"></div>' +
        '<div class="form-row" style="margin-top:8px"><input type="text" id="new-subtask-input" placeholder="Add a subtask">' +
        '<button class="edit-btn" onclick="addNewSubtask()" style="flex-shrink:0;margin-left:4px">+</button></div></div></div>' +
        '<button class="action-btn primary" onclick="addQuest()">Add</button></div>';

    var ln = { 1:"Tier 1", 2:"Tier 2", 3:"Tier 3" };

    h += '<div class="settings-section"><div class="settings-section-title">My daily quests</div>';
    var daily = quests.filter(q => !q.unique && !q.weekly && !q.bonus);
    if (!daily.length) h += '<div class="empty-state">No quests</div>';
    daily.forEach(q => {
        var ct = q.category ? '<span class="cat-tag ' + getCatClass(q.category) + '">' + q.category + '</span> &middot; ' : '';
        var mt = q.mandatory ? ' &middot; <span style="color:var(--red);font-size:10px;font-weight:700">REQ.</span>' : '';
        var lt = q.type === 'list' ? ' &middot; <span style="color:#5b8fb0;font-size:10px;font-weight:700">CHECKLIST</span>' : '';
        h += '<div class="edit-item"><div class="edit-item-info"><div class="edit-item-title">' + q.title + '</div>' +
            '<div class="edit-item-meta">' + ct + ln[q.level] + ' &middot; ' + fmt(q.reward) + ' c.' + mt + lt + '</div></div>' +
            '<button class="edit-btn" onclick="openModal(\'editQuest\',' + q.id + ')">&#9998;</button>' +
            '<button class="delete-btn" onclick="deleteQuest(' + q.id + ')">&times;</button></div>';
    });
    h += '<button class="action-btn danger" onclick="resetQuests()" style="margin-top:14px">Reset daily quests</button></div>';

    h += '<div class="settings-section"><div class="settings-section-title">My weekly quests</div>';
    var wk = quests.filter(q => q.weekly && !q.unique);
    if (!wk.length) h += '<div class="empty-state">No weekly quests</div>';
    wk.forEach(q => {
        var ct = q.category ? '<span class="cat-tag ' + getCatClass(q.category) + '">' + q.category + '</span> &middot; ' : '';
        h += '<div class="edit-item"><div class="edit-item-info"><div class="edit-item-title">' + q.title + '</div>' +
            '<div class="edit-item-meta">' + ct + ln[q.level] + ' &middot; ' + fmt(q.reward) + ' c.</div></div>' +
            '<button class="edit-btn" onclick="openModal(\'editQuest\',' + q.id + ')">&#9998;</button>' +
            '<button class="delete-btn" onclick="deleteQuest(' + q.id + ')">&times;</button></div>';
    });
    h += '</div>';

    h += '<div class="settings-section"><div class="settings-section-title">My one-time quests</div>';
    var uq = quests.filter(q => q.unique);
    if (!uq.length) h += '<div class="empty-state">No one-time quests</div>';
    uq.forEach(q => {
        var ct = q.category ? '<span class="cat-tag ' + getCatClass(q.category) + '">' + q.category + '</span> &middot; ' : '';
        var lt = q.type === 'list' ? ' &middot; <span style="color:#5b8fb0;font-size:10px;font-weight:700">CHECKLIST</span>' : '';
        h += '<div class="edit-item"><div class="edit-item-info"><div class="edit-item-title">' + q.title + '</div>' +
            '<div class="edit-item-meta">' + ct + ln[q.level] + ' &middot; ' + fmt(q.reward) + ' c.' + lt + '</div></div>' +
            '<button class="edit-btn" onclick="openModal(\'editQuest\',' + q.id + ')">&#9998;</button>' +
            '<button class="delete-btn" onclick="deleteQuest(' + q.id + ')">&times;</button></div>';
    });
    h += '</div>';

    h += '<div class="settings-section"><div class="settings-section-title">Add a reward</div>' +
        '<div class="form-group"><div class="form-row"><input type="text" id="new-shop-name" placeholder="Name"></div></div>' +
        '<div class="form-group"><div class="form-row"><input type="number" id="new-shop-price" placeholder="Price" min="0" step="0.01">' +
        '<input type="number" id="new-shop-stock" placeholder="Limit (-1=unlimited)" min="-1" step="1" value="-1"></div></div>' +
        '<div class="form-group"><div class="toggle-row"><span class="toggle-label">Inflation (+15% per purchase)</span><div class="toggle" id="new-shop-infl" onclick="this.classList.toggle(\'on\')"></div></div></div>' +
        '<button class="action-btn primary" onclick="addShopItem()">Add</button></div>';

    h += '<div class="settings-section"><div class="settings-section-title">My rewards</div>';
    if (!shopItems.length) h += '<div class="empty-state">No rewards</div>';
    shopItems.forEach(s => {
        var sl = s.stock === -1 ? "Unlimited" : "Limit: " + s.stock;
        var infl = s.inflation ? ' &middot; INFLATION' : '';
        h += '<div class="edit-item"><div class="edit-item-info"><div class="edit-item-title">' + s.name + '</div>' +
            '<div class="edit-item-meta">' + fmt(s.price) + ' c. &middot; ' + sl + infl + '</div></div>' +
            '<button class="edit-btn" onclick="openModal(\'editShop\',' + s.id + ')">&#9998;</button>' +
            '<button class="delete-btn" onclick="deleteShopItem(' + s.id + ')">&times;</button></div>';
    });
    h += '<button class="action-btn danger" onclick="resetShop()" style="margin-top:14px">Reset shop</button></div>';

    h += '<div class="settings-section"><button class="action-btn danger" onclick="resetAll()">Reset everything</button></div>';

    c.innerHTML = h;
}
