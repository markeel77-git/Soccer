// Shared page markup for the Sub Tracker app. Injected into <div id="app"> by app.js.
// Edit here once; both /boys and /girls load this file.
const APP_HTML = `
<!-- Promo bar -->
<div id="promoBar" class="promo-bar no-print">Sub Tracker</div>

<!-- Header -->
<header>
  <div class="h-left">
    <a class="h-wordmark" href="/" title="Choose a team">⚽ SUB TRACKER</a>
    <a class="h-submark" id="hTeamLink" href="#" title="Team home" onclick="nav('schedule');window.scrollTo(0,0);return false"><span class="bolt" id="hEmoji">⚽</span> <span id="hTeamName">—</span></a>
  </div>
  <div class="h-right">
    <div id="syncBadge" class="sync-dot" style="display:none"></div>
    <a href="/" class="team-switch no-print" title="Switch team">⇄ Teams</a>
  </div>
</header>

<!-- Tabs -->
<div class="tabs">
  <div class="tab on" onclick="nav('schedule',this)">Schedule</div>
  <div class="tab" id="tabPlan" onclick="navPlanTab(this)">Game Plan</div>
  <div class="tab"    onclick="nav('print',this)">Print Sheet</div>
  <div class="tab"    onclick="nav('season',this)">Season Stats</div>
  <div class="tab"    onclick="nav('settings',this)">Settings</div>
</div>

<!-- ══ PLAN ══ -->
<div id="page-plan" class="page">
  <div class="page-header-row fb mb16 wrap gap8 no-print">
    <div>
      <div class="section-eyebrow" id="planEyebrow">Game Plan</div>
      <div class="section-title" id="planTitle">—</div>
    </div>
    <div class="flex gap8 wrap">
      <button class="btn btn-secondary btn-sm" onclick="prevG()">← Prev</button>
      <button class="btn btn-secondary btn-sm" onclick="nextG()">Next →</button>
    </div>
  </div>
  <div class="page-meta" id="planMeta">—</div>

  <div id="jerseyBanner"></div>

  <!-- Captains -->
  <div class="card-group no-print" id="capCard">
    <div class="card">
      <div class="card-label">Captains <span id="capNote" class="badge badge-warn">Suggested</span></div>
      <div id="capArea"></div>
    </div>
  </div>

  <!-- Attendance -->
  <div class="card-group no-print" id="attCard">
    <div class="card">
      <div class="card-label">Attendance <span id="attBadge" class="badge">—</span></div>
      <div class="att-grid" id="attGrid"></div>
      <div class="flex gap8 wrap">
        <button class="btn btn-primary btn-sm" onclick="doGenerate()">⚡ Generate Rotation</button>
        <button class="btn btn-secondary btn-sm" onclick="allPresent()">All Present</button>
        <button class="btn btn-secondary btn-sm" id="reshuffleBtn" style="display:none" onclick="doReshuffle()">↻ Reshuffle</button>
      </div>
    </div>
  </div>

  <div id="alertBox"></div>

  <!-- Lock bar -->
  <div id="lockBar" class="lock-bar no-print" style="display:none">
    <span id="lockMsg" class="lock-msg">—</span>
    <button class="btn btn-sm" id="lockBtn" onclick="toggleLock()">🔓 Lock Plan</button>
    <button class="btn btn-secondary btn-sm" id="regenBtn" onclick="doGenerate()">↺ Regenerate</button>
  </div>

  <!-- Rotation -->
  <div id="rotArea"></div>

  <!-- Score -->
  <div id="doneCard" class="card-group no-print" style="display:none">
    <div class="card">
      <div class="card-label">Game Result</div>
      <div id="scoreDisplay"></div>
    </div>
  </div>

  <!-- Email -->
  <div id="emailCard" class="card-group no-print" style="display:none">
    <div class="card">
      <div class="card-label">Parent Game-Day Email</div>
      <div id="emailBody" class="email-box"></div>
      <button class="btn btn-primary btn-sm" onclick="copyEmail()">Copy to Clipboard</button>
    </div>
  </div>
</div>

<!-- ══ SEASON ══ -->
<div id="page-season" class="page">
  <div id="seasonEyebrow" class="section-eyebrow">—</div>
  <div class="section-title">Season Stats</div>
  <div class="card-group mb16">
    <div class="card"><div id="seasonSum" class="flex gap16 wrap"></div></div>
  </div>
  <div class="card-group mb16">
    <div class="card">
      <div class="card-label">Player Stats</div>
      <div id="statsAlerts"></div>
      <div style="overflow-x:auto;margin-top:8px">
        <table class="stats-tbl"><thead><tr>
          <th>Player</th><th>Games</th><th>Total Min</th><th>Avg/Game</th>
          <th>FWD</th><th>Mid-P</th><th>Mid-C</th><th>DEF</th>
          <th>Cap×</th><th>Position Mix</th>
        </tr></thead><tbody id="statsBody"></tbody></table>
      </div>
    </div>
  </div>
  <div class="card-group mb16">
    <div class="card">
      <div class="card-label">Playing Time Equity</div>
      <div id="equityBars" class="mt8"></div>
    </div>
  </div>
  <div class="card-group">
    <div class="card">
      <div class="card-label">Captain Rotation</div>
      <div class="xs muted mb8">Each player captains before anyone gets a 2nd turn.</div>
      <div id="capSeason" class="cap-grid"></div>
    </div>
  </div>
</div>

<!-- ══ PRINT ══ -->
<div id="page-print" class="page">
  <div id="printEyebrow" class="section-eyebrow no-print">—</div>
  <div class="section-title no-print">Game Day Sub Sheet</div>
  <div class="flex gap8 wrap mb16 no-print" style="align-items:flex-end">
    <div>
      <label>Select Game</label>
      <select id="printSel" onchange="renderPrint()"><option value="">Choose…</option></select>
    </div>
    <button class="btn btn-primary" onclick="window.print()" style="margin-top:22px">Print →</button>
    <button id="phoneViewBtn" class="btn btn-secondary" onclick="openPhoneView()" style="margin-top:22px;display:none">📱 Screenshot View</button>
  </div>
  <div id="printArea"><div class="muted sm" style="padding:24px 0">Select a game above to preview the print sheet.</div></div>
</div>

<!-- ══ SCHEDULE ══ -->
<div id="page-schedule" class="page on">
  <div id="schedEyebrow" class="section-eyebrow">—</div>
  <div class="section-title">Season Schedule</div>
  <div class="sched-grid" id="schedGrid"></div>
</div>

<!-- ══ SETTINGS ══ -->
<div id="page-settings" class="page">
  <div id="settingsEyebrow" class="section-eyebrow">—</div>
  <div class="section-title">Settings</div>
  <div class="card-group mb16">
    <div class="card">
      <div class="card-label">Roster <button class="btn btn-sm" id="rosterLockBtn" onclick="toggleRosterLock()">🔒 Locked</button></div>
      <div id="rosterList"></div>
      <div id="rosterEditArea" style="display:none">
        <hr>
        <div class="flex gap8 wrap" style="align-items:flex-end">
          <div><label>Add Player</label><input type="text" id="newName" placeholder="First name" style="width:160px"></div>
          <button class="btn btn-primary btn-sm" onclick="addPlayer()" style="margin-top:22px">+ Add</button>
        </div>
      </div>
    </div>
  </div>
  <div class="card-group mb16">
    <div class="card">
      <div class="card-label">Skill Tiers <button class="btn btn-sm" id="tierLockBtn" onclick="toggleTierLock()">🔒 Locked</button></div>
      <div class="xs muted">The rotation spreads Top-tier and Bottom-tier players across the groups so neither tier stacks in one slot (two rated players are split one per group; three allow two together). Leave everyone in Middle to turn this off.</div>
      <div id="tierArea"></div>
    </div>
  </div>
  <div class="card-group mb16">
    <div class="card">
      <div class="card-label">Team Details <button class="btn btn-sm" id="teamLockBtn" onclick="toggleTeamLock()">🔒 Locked</button></div>
      <div id="teamReadArea"></div>
      <div id="teamEditArea" style="display:none">
        <div class="flex gap16 wrap" style="align-items:flex-end;margin-top:4px">
          <div><label>Team Name</label><input type="text" id="cfgTeamName" placeholder="Thunder" style="width:160px"></div>
          <div><label>Team Code</label><input type="text" id="cfgTeamCode" placeholder="CF09A" style="width:120px"></div>
          <div><label>Location</label><input type="text" id="cfgTeamLoc" placeholder="Cedar Falls, IA" style="width:180px"></div>
          <div><label>Season</label><input type="text" id="cfgSeason" placeholder="Fall 2026" style="width:140px"></div>
          <div><label>Age Group</label><input type="text" id="cfgAgeGroup" placeholder="U9" style="width:80px"></div>
          <div><label>Home Jersey</label><input type="text" id="cfgHomeJersey" placeholder="Gray" style="width:110px"></div>
          <div><label>Away Jersey</label><input type="text" id="cfgAwayJersey" placeholder="Blue" style="width:110px"></div>
          <div><label>Coach (email sign-off)</label><input type="text" id="cfgCoachName" placeholder="Coach" style="width:140px"></div>
          <div><label>Icon (emoji)</label><input type="text" id="cfgEmoji" placeholder="⚽" style="width:60px"></div>
          <button class="btn btn-primary btn-sm" onclick="saveTeamCfg()" style="margin-top:22px">Save</button>
        </div>
      </div>
    </div>
  </div>
  <div class="card-group mb16">
    <div class="card">
      <div class="card-label">Schedule <button class="btn btn-sm" id="schedLockBtn" onclick="toggleSchedLock()">🔒 Locked</button></div>
      <div id="schedList"></div>
      <div id="schedEditArea" style="display:none">
        <hr>
        <div class="sm" id="schedFormTitle" style="font-weight:600;margin-bottom:8px">Add a game</div>
        <div class="flex gap8 wrap" style="align-items:flex-end">
          <div><label>Date</label><input type="date" id="gDate" style="width:160px"></div>
          <div><label>Kickoff</label><input type="time" id="gTime" style="width:130px"></div>
          <div><label>Arrive (min before)</label><input type="number" id="gArrive" min="0" step="5" value="30" style="width:110px"></div>
          <div><label>Home / Away</label><select id="gHome" style="width:110px"><option value="home">Home</option><option value="away">Away</option></select></div>
          <div><label>Opponent</label><input type="text" id="gOpp" placeholder="CF09F" style="width:120px"></div>
          <div><label>Location</label><input type="text" id="gLoc" placeholder="Cedar Valley Soccer Complex" style="width:220px"></div>
          <div><label>Field</label><input type="text" id="gField" placeholder="Field 2B" style="width:110px"></div>
          <button class="btn btn-primary btn-sm" id="gSaveBtn" onclick="saveGameForm()" style="margin-top:22px">+ Add Game</button>
          <button class="btn btn-secondary btn-sm" id="gCancelBtn" onclick="cancelEditGame()" style="margin-top:22px;display:none">Cancel</button>
        </div>
        <div class="xs muted mt8">Games sort by date automatically. Arrive time is computed from kickoff.</div>
      </div>
    </div>
  </div>
  <div class="card-group mb16">
    <div class="card">
      <div class="card-label">Cloud Sync</div>
      <div class="flex gap8 wrap" style="align-items:flex-end">
        <div>
          <label>Coach Token (write access)</label>
          <input type="password" id="coachTokenInput" placeholder="Enter token to enable saving" style="width:240px" autocomplete="new-password">
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveCoachToken()" style="margin-top:22px">Save Token</button>
        <button class="btn btn-secondary btn-sm" onclick="forcePullFromCloud()" style="margin-top:22px">Force Sync</button>
      </div>
      <div class="xs muted mt8" id="syncStatusMsg">Checking sync…</div>
    </div>
  </div>
  <div class="card-group">
    <div class="card">
      <div class="card-label">Data Management</div>
      <div class="flex gap8 wrap">
        <button class="btn btn-secondary btn-sm" onclick="exportData()">Export JSON</button>
        <button class="btn btn-secondary btn-sm" onclick="importData()">Import JSON</button>
        <button class="btn btn-secondary btn-sm" onclick="startNewSeason()">Start New Season</button>
        <button class="btn btn-danger btn-sm" onclick="resetAll()">Reset All Data</button>
      </div>
      <div class="xs muted mt8">Export JSON creates a local backup in case of cloud issues. Import restores from a backup. Start New Season keeps the roster and team details but clears the schedule, games and stats. Reset clears everything for this team, locally and in the cloud.</div>
    </div>
  </div>
</div>

<!-- Cell dropdown -->
<div id="cellDrop" class="cell-drop" style="display:none"></div>
<!-- Toast -->
<div id="toast" class="toast">Copied!</div>
<!-- Phone Screenshot Overlay -->
<div id="phoneOverlay" class="phone-overlay">
  <div class="phone-overlay-bar">
    <span>📱 Screenshot View</span>
    <button onclick="closePhoneView()">✕</button>
  </div>
  <div style="text-align:center;padding:8px 16px 4px;font-size:12px;color:#666">Scroll to view the full lineup, then screenshot to save.</div>
  <div id="phoneViewContent" style="padding:0 8px 40px"></div>
</div>

`;
