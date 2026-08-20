// =========================================================
//   BLOCK 17 — EDIT MODAL
//   17.1 open · 17.2 subtask editor · 17.3 close & save
//   modalMode drives both the form built here and the branch
//   taken by saveModal(). Add a mode in both places.
// =========================================================

/* 17.1 — modes: editQuest | editShop | editTitle */
function openModal(mode, id) {
    modalMode = mode;
    var overlay = document.getElementById("modal-overlay");
    var title = document.getElementById("modal-title");
    var body = document.getElementById("modal-body");

    if (mode === "editQuest") {
        var q = quests.find(x => x.id === id);
        modalTarget = id;
        tempSubtasks = q.subtasks ? q.subtasks.map(s => ({ id:s.id, title:s.title, done:s.done })) : [];
        var cap = REWARD_CAPS[q.level];
        title.textContent = "Edit quest";
        var h =
            '<div class="form-group"><label>Name</label><div class="form-row"><input type="text" id="m-q-title" value="' + q.title + '"></div></div>' +
            '<div class="form-group"><label>Category</label><div class="form-row"><select id="m-q-cat">' + categories.map(c => '<option value="'+c+'"'+(q.category===c?' selected':'')+'>'+c+'</option>').join("") + '</select></div></div>' +
            '<div class="form-group"><label>Tier</label><div class="form-row"><select id="m-q-level" onchange="updateRewardCap()">' +
            '<option value="1"'+(q.level===1?' selected':'')+'>Tier 1 (max 1.00)</option>' +
            '<option value="2"'+(q.level===2?' selected':'')+'>Tier 2 (max 2.00)</option>' +
            '<option value="3"'+(q.level===3?' selected':'')+'>Tier 3 (max 3.00)</option>' +
            '</select></div></div>' +
            '<div class="form-group"><label>Reward (max <span id="cap-display">'+fmt(cap)+'</span>)</label><div class="form-row"><input type="number" id="m-q-reward" value="'+q.reward+'" step="0.01" min="0" max="'+cap+'"></div></div>' +
            '<div class="form-group"><div class="toggle-row"><span class="toggle-label">Required</span><div class="toggle '+(q.mandatory?'on':'')+'" id="m-q-mandatory" onclick="this.classList.toggle(\'on\')"></div></div></div>';
        if (q.type === 'list') {
            h += '<div class="form-group"><label>Subtasks</label><div id="m-subtask-list"></div>' +
                '<div class="form-row" style="margin-top:8px"><input type="text" id="m-new-subtask" placeholder="New subtask">' +
                '<button class="edit-btn" onclick="addModalSubtask()" style="margin-left:4px;flex-shrink:0">+</button></div></div>';
        }
        body.innerHTML = h;
        if (q.type === 'list') renderModalSubtasks();

    } else if (mode === "editShop") {
        var s = shopItems.find(x => x.id === id);
        modalTarget = id;
        title.textContent = "Edit reward";
        body.innerHTML =
            '<div class="form-group"><label>Name</label><div class="form-row"><input type="text" id="m-s-name" value="'+s.name+'"></div></div>' +
            '<div class="form-group"><label>Base price</label><div class="form-row"><input type="number" id="m-s-price" value="'+s.price+'" step="0.01" min="0"></div></div>' +
            '<div class="form-group"><label>Purchase limit (-1 = unlimited)</label><div class="form-row"><input type="number" id="m-s-stock" value="'+s.stock+'" min="-1" step="1"></div></div>' +
            '<div class="form-group"><div class="toggle-row"><span class="toggle-label">Inflation (+15% per purchase)</span><div class="toggle '+(s.inflation?'on':'')+'" id="m-s-infl" onclick="this.classList.toggle(\'on\')"></div></div></div>';

    } else if (mode === "editTitle") {
        title.textContent = "Title";
        body.innerHTML = '<div class="form-group"><label>Title</label><div class="form-row"><input type="text" id="m-title" value="'+appTitle+'"></div></div>';
    }

    overlay.classList.add("show");
}

/* 17.2 — subtasks are edited in tempSubtasks and only committed on save */
function renderModalSubtasks() {
    var el = document.getElementById("m-subtask-list");
    if (!el) return;
    el.innerHTML = tempSubtasks.map((s, i) =>
        '<div class="edit-item" style="margin-bottom:4px;padding:8px 12px"><div class="edit-item-info"><div class="edit-item-title" style="font-size:12px">' + s.title + '</div></div>' +
        '<button class="delete-btn" style="width:24px;height:24px;font-size:12px" onclick="removeModalSubtask(' + i + ')">&times;</button></div>'
    ).join('');
}
function addModalSubtask() {
    var inp = document.getElementById("m-new-subtask");
    var v = inp.value.trim(); if (!v) return;
    tempSubtasks.push({ id:Date.now(), title:v, done:false });
    inp.value = ''; renderModalSubtasks();
}
function removeModalSubtask(i) { tempSubtasks.splice(i, 1); renderModalSubtasks(); }

function updateRewardCap() {
    var lv = parseInt(document.getElementById("m-q-level").value);
    document.getElementById("cap-display").textContent = fmt(REWARD_CAPS[lv]);
    document.getElementById("m-q-reward").max = REWARD_CAPS[lv];
}

/* 17.3 */
function closeModal() {
    document.getElementById("modal-overlay").classList.remove("show");
    modalMode = null; modalTarget = null; tempSubtasks = [];
}

function saveModal() {
    if (modalMode === "editQuest") {
        var q = quests.find(x => x.id === modalTarget);
        if (q) {
            q.title = document.getElementById("m-q-title").value.trim() || q.title;
            q.category = document.getElementById("m-q-cat").value;
            q.level = parseInt(document.getElementById("m-q-level").value);
            var rw = parseFloat(document.getElementById("m-q-reward").value) || q.reward;
            q.reward = Math.min(rw, REWARD_CAPS[q.level]);          // enforce the tier cap
            q.mandatory = document.getElementById("m-q-mandatory").classList.contains("on");
            if (q.type === 'list') q.subtasks = tempSubtasks.slice();
            showNotif("Quest updated");
        }
    } else if (modalMode === "editShop") {
        var s = shopItems.find(x => x.id === modalTarget);
        if (s) {
            s.name = document.getElementById("m-s-name").value.trim() || s.name;
            s.price = parseFloat(document.getElementById("m-s-price").value) || s.price;
            s.stock = parseInt(document.getElementById("m-s-stock").value);
            if (isNaN(s.stock)) s.stock = -1;
            s.inflation = document.getElementById("m-s-infl").classList.contains("on");
            showNotif("Reward updated");
        }
    } else if (modalMode === "editTitle") {
        appTitle = document.getElementById("m-title").value.trim() || appTitle;
        showNotif("Title updated");
    }
    closeModal(); save(); render();
}
