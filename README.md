# TTE
TTE turns your daily to-do list into a game: complete quests to earn coins and XP, level up, keep streaks alive and unlock badges, then spend the coins on rewards you define yourself. Single-page web app, no build, no server, no account. All data stays in your browser, with JSON export/import.


# TTE — Quests, Coins and Rewards

**TTE turns your daily to-do list into a game.** You create your own tasks ("quests"), tick them
off when they are done, and each one pays you *coins* and *XP*. You level up, build streaks, unlock
badges — and you spend the coins in a shop of rewards that you define yourself (a coffee break,
one TV episode, a day off…).

Everything runs in the browser: one `index.html`, some CSS and some JavaScript. No build step, no
server, no account. Data lives in the browser's `localStorage`, with JSON export/import so you can
back it up or move it to another device.

---

## Table of contents

1. [Technical context](#1-technical-context)
2. [Domain concepts](#2-domain-concepts)
3. [Running it](#3-running-it)
4. [File tree](#4-file-tree)
5. [Blocks → files](#5-blocks--files)
6. [Architecture conventions](#6-architecture-conventions)
7. [Where to change what](#7-where-to-change-what)
8. [Data model](#8-data-model)
9. [Automatic cycles](#9-automatic-cycles)
10. [Adding content](#10-adding-content)
11. [Pitfalls](#11-pitfalls)

---

## 1. Technical context

| Item | Value |
|---|---|
| Type | Mobile-first web app (lightweight PWA, inline base64 manifest) |
| Stack | HTML5, CSS3 (custom properties + dark theme), **classic** JS scripts (no modules) |
| Build | none — just open `index.html` |
| Dependencies | none (Inter font from Google Fonts, optional) |
| Persistence | `localStorage`, versioned keys (`coins5`, `quests6`, `shop5`…) |
| Audio | Web Audio API, sounds synthesised at runtime (no asset files) |
| Rendering | DOM rebuilt via `innerHTML` inside `render()`; one full-screen `<canvas>` for the animated backdrop |
| Max width | 520 px, centered |
| UI language | English |

## 2. Domain concepts

| Concept | Meaning |
|---|---|
| **Quest** | a task. 3 tiers (1/2/3) capping its reward at 1.00 / 2.00 / 3.00 coins |
| **Daily** | resets every day at midnight |
| **Weekly** | `weekly: true`, resets on Monday |
| **One-time** | `unique: true`, disappears once completed and moves to the archive (last 10, revertible) |
| **Bonus** | `bonus: true`, 1–2 quests drawn at random from a pool each day, random reward 0.01–1.99 |
| **Checklist** | `type: 'list'`, auto-completes when every subtask is ticked |
| **Required** | `mandatory: true`: blocks the next tier and feeds the streak |
| **Tier unlock** | tier N opens when tier N‑1 has `unlockThreshold` completions **and** no pending required quest |
| **Streak** | consecutive days with all required quests done → multiplier ×1.25 / ×1.5 / ×2 |
| **Penalty** | 2+ consecutive missed days → ‑15 % of the balance |
| **XP / level** | `reward × 10` XP; threshold = `100 × 1.55^(level‑1)`; 13 titles from Novice to Divine |
| **Shop** | rewards with an optional purchase limit and optional inflation (+15 % per purchase) |
| **Badges** | 16 unlockable badges (quests, streaks, level, purchases…) |
| **Backdrop themes** | `none`, `winter` (snow/blizzard), `heat` (heatwave + distortion), `autumn` (leaves + rake) |

## 3. Running it

```bash
python3 -m http.server 8000     # → http://localhost:8000
```
GitHub Pages: `Settings → Pages → Source: main / root`. On iOS, "Add to Home Screen" gives a
full-screen app (the manifest is already embedded).

## 4. File tree

```
tte/
├── index.html               DOM structure + load order
├── README.md
├── .gitignore
├── css/
│   ├── 01-theme.css         light/dark variables, reset, body
│   ├── 02-layout.css        canvas, header, XP, tabs, sub-tabs
│   ├── 03-quests.css        filters, tiers, quest cards, subtasks, archive
│   ├── 04-shop.css          shop cards, prices, inflation
│   ├── 05-tracker.css       chart, badges, streaks, milestones
│   ├── 06-forms.css         settings, forms, buttons, modal, toggles
│   └── 07-effects.css       themes, heatwave, notification, timer, empty states
└── js/
    ├── 01-background.js     animated backdrop (canvas)
    ├── 02-data.js           constants and default data
    ├── 03-state.js          state loading + migrations
    ├── 04-utils.js          save, dates, XP, multiplier, navigation
    ├── 05-resets.js         daily/weekly resets, bonus quests, badges
    ├── 06-audio.js          Web Audio sounds + haptics
    ├── 07-timer.js          Pomodoro timer
    ├── 08-backup.js         JSON / PNG export, import
    ├── 09-modal.js          edit modal
    ├── 10-render.js         every render function
    ├── 11-actions.js        user actions (tick, buy, CRUD)
    └── 12-init.js           master render(), minute loop, bootstrap
```

## 5. Blocks → files

| Block | Sub-parts | File |
|---|---|---|
| 1 | 1.1 reset · 1.2 light vars · 1.3 dark vars · 1.4 body | `css/01-theme.css` |
| 2 | 2.1 canvas/app · 2.2 header & XP · 2.3 tabs | `css/02-layout.css` |
| 3 | 3.1 filters · 3.2 tiers · 3.3 quest card · 3.4 subtasks · 3.5 tags · 3.6 archive | `css/03-quests.css` |
| 4 | 4.1 card · 4.2 pricing · 4.3 buy button | `css/04-shop.css` |
| 5 | 5.1 sections · 5.2 streaks · 5.3 milestones · 5.4 chart · 5.5 badges | `css/05-tracker.css` |
| 6 | 6.1 sections · 6.2 fields · 6.3 buttons · 6.4 editable lists · 6.5 modal · 6.6 toggle · 6.7 categories | `css/06-forms.css` |
| 7 | 7.1 theme picker · 7.2 coming soon · 7.3 heatwave · 7.4 notification · 7.5 timer · 7.6 misc | `css/07-effects.css` |
| 8 | 8.1 backdrop layers · 8.2 timer · 8.3 modal · 8.4 header · 8.5 tabs · 8.6 pages | `index.html` |
| 9 | 9.1 canvas · 9.2 winter · 9.3 heat · 9.4 autumn · 9.5 loop | `js/01-background.js` |
| 10 | 10.1 categories · 10.2 quests · 10.3 shop · 10.4 bonus pool · 10.5 caps/titles · 10.6 badges | `js/02-data.js` |
| 11 | 11.1 loading · 11.2 runtime state · 11.3 migrations | `js/03-state.js` |
| 12 | 12.1 persistence · 12.2 formatting · 12.3 tier rules · 12.4 streaks · 12.5 theme/UI · 12.6 XP · 12.7 multiplier | `js/04-utils.js` |
| 13 | 13.1 resets · 13.2 bonus quests · 13.3 badges | `js/05-resets.js` |
| 14 | 14.1 audio context · 14.2 sounds · 14.3 haptics | `js/06-audio.js` |
| 15 | 15.1 start · 15.2 tick · 15.3 finish/cancel · 15.4 display | `js/07-timer.js` |
| 16 | 16.1 JSON export · 16.2 import · 16.3 image export | `js/08-backup.js` |
| 17 | 17.1 open · 17.2 subtasks · 17.3 close/save | `js/09-modal.js` |
| 18 | 18.1 header · 18.2 quests · 18.3 shop · 18.4 chart · 18.5 badges · 18.6 tracker · 18.7 style · 18.8 settings | `js/10-render.js` |
| 19 | 19.1 subtasks · 19.2 bonus pool · 19.3 ticking · 19.4 archive · 19.5 purchase · 19.6 CRUD · 19.7 resets | `js/11-actions.js` |
| 20 | 20.1 master render · 20.2 minute loop · 20.3 bootstrap | `js/12-init.js` |

## 6. Architecture conventions

- **Classic scripts, shared global scope.** The `<script>` order (01 → 12) is **contractual**:
  `bgTheme` is declared in 01 then reassigned in 03; `render()` (12) assumes everything else is
  loaded. No `defer`, no `async`, no modules.
- **One rendering entry point.** Every action ends with `save(); render();`. `render()` rebuilds the
  five pages with `innerHTML`, which is why handlers are inline `onclick="…"` attributes. This is
  deliberate: do not swap them for `addEventListener` without redesigning the render cycle.
- **Always round money**: `Math.round(x * 100) / 100` after every coin operation. Reuse that idiom.
- **`lastPaidAmount`** is stored on the quest when it is completed, so unticking refunds exactly the
  multiplied amount that was paid.
- The animated backdrop is purely decorative (`pointer-events: none`, `z-index: 0`).

## 7. Where to change what

| I want to… | File | Anchor |
|---|---|---|
| change reward caps | `js/02-data.js` | `REWARD_CAPS` |
| change the XP curve or titles | `js/02-data.js` / `js/04-utils.js` | `TITLES`, `getXpForLevel` |
| change multiplier thresholds | `js/04-utils.js` | `getMultiplier` |
| change the missed-day penalty | `js/05-resets.js` | `checkResets`, `0.15` |
| add a badge | `js/02-data.js` + `js/05-resets.js` | `BADGE_DEFS`, then a condition in `checkBadges` |
| add a sound | `js/06-audio.js` | `playSound` |
| add a backdrop theme | `js/01-background.js` + `js/10-render.js` + `css/07` | `animateBg`, `renderCosmetics`, `.theme-*` |
| change shop behaviour / inflation | `js/10-render.js` + `js/11-actions.js` | `getCurrentPrice`, `buyItem` |
| change the 30-day chart | `js/10-render.js` | `renderCoinChart` |
| add a field to quests | `js/02-data.js`, `js/03-state.js` (migration), `js/09-modal.js`, `js/10-render.js`, `js/11-actions.js` | |
| add a tab | `index.html` + `switchTab` (`js/04-utils.js`) + a render function | |
| restyle a card | `css/03` (quests), `css/04` (shop), `css/05` (tracker) | |

## 8. Data model

**Quest**
```js
{ id, title, level: 1|2|3, reward, completed, category, mandatory,
  unique, weekly, bonus, type: 'normal'|'list',
  subtasks: [{ id, title, done }], lastPaidAmount }
```

**Shop item**
```js
{ id, name, price, stock /* -1 = unlimited */, bought, inflation }
```

**localStorage keys** — `coins5`, `quests6`, `shop5`, `categories2`, `history2`, `stats5`,
`appTitle`, `unlockThreshold2`, `bgTheme`, `darkMode`, `cosmetics`, `uniqueArchive`, `playerXP`,
`playerLevel`, `lastResetDate`, `lastWeeklyReset`, `mandatoryStreak`, `consecutiveMissed`,
`badges`, `bonusQuestPool`, `dailyCoinHistory`, `soundEnabled`, `hapticEnabled`, `activeTimer`,
`defaultTimerMin`, `bonusCompleted`, `weeklyCompleted`.
The trailing number is a schema version: **bump it** whenever you change a structure in a
backward-incompatible way.

## 9. Automatic cycles

```
setInterval 60 s → checkResets()                     [js/05-resets.js]
  ├─ new day?
  │    ├─ all required quests done → mandatoryStreak++
  │    ├─ otherwise → streak = 0, consecutiveMissed++, penalty if ≥ 2
  │    ├─ reset daily quests and their subtasks
  │    └─ drop then regenerate bonus quests
  └─ Monday passed? → reset weekly quests
```

## 10. Adding content

**Badge**: add an entry to `BADGE_DEFS` (`js/02-data.js`), then a condition
`if (b.id === 'my_id' && …)` inside `checkBadges` (`js/05-resets.js`).

**Bonus quest**: through the UI (Settings → Bonus quest pool) or by editing
`DEFAULT_BONUS_POOL` in `js/02-data.js`.

**Backdrop theme**: add a branch in `animateBg` (`js/01-background.js`), seed its particles in
`initParticles`, add the swatch in `renderCosmetics` (`js/10-render.js`) and the `.theme-myTheme`
class in `css/07-effects.css`.

## 11. Pitfalls

- ❌ Reordering the `<script>` tags → `ReferenceError` (`bgTheme`, `render`…).
- ❌ Declaring the same global `const`/`let` twice across two files.
- ❌ Touching coins without `Math.round(x * 100) / 100` → cent drift.
- ❌ Refunding `q.reward` instead of `q.lastPaidAmount` → mismatch when a multiplier was active.
- ❌ Adding a quest field without a migration in `js/03-state.js` → `undefined` for existing users.
- ❌ Attaching `addEventListener` to nodes rebuilt by `render()`: they are lost.
- ❌ Reusing an existing `localStorage` key with a different shape without bumping its version.



## Publishing
mkdir tte && cd tte
# create the files from parts 1-4
git init && git add . && git commit -m "feat: TTE quest tracker, modular blocks 1-20"
gh repo create tte --public --source=. --push \
  --description "TTE turns your daily to-do list into a game: complete quests to earn coins and XP, level up, keep streaks alive and unlock badges, then spend the coins on rewards you define yourself. Single-page web app, no build, no server, no account. All data stays in your browser, with JSON export/import."
