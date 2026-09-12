// ══════════════════════════════════════
// TEAM — which team this page is for comes from the URL path (/boys/ or /girls/)
// ══════════════════════════════════════
const TEAM_SLUG=((location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase().replace(/[^a-z0-9-]/g,''))||'boys';
try{localStorage.setItem('subtracker_last_team',TEAM_SLUG);}catch(e){}

// First-run defaults per team. Used only when neither this browser nor the cloud has data
// for the team yet. After that, everything below is edited in Settings and saved with the data.
// Schedule source: Scheels CVSC Recreational League Fall 2026 listings, supplied 2026-09-12.
const CVSC='Cedar Valley Soccer Complex';
const TEAM_DEFAULTS={
  boys:{
    cfg:{teamName:'Thunder',teamCode:'CF09A',ageGroup:'U9',teamLoc:'Cedar Falls, IA',season:'Fall 2026',emoji:'⚡',coachName:'Mark',
         homeJersey:'Gray',awayJersey:'Blue',tierTop:['Jack','Jacob'],tierBot:['Theo','Ronan']},
    roster:['Theo','Mateo','Beckem','Ronan','Jack','Jacob','Dayton','Wells'],
    schedule:[
      {id:1,date:'2026-09-14',time24:'18:00',arriveMin:30,home:false,opp:'AP09A',loc:CVSC,field:'CV2D'},
      {id:2,date:'2026-09-19',time24:'12:00',arriveMin:30,home:true, opp:'DN09A',loc:CVSC,field:'CV2A'},
      {id:3,date:'2026-09-26',time24:'13:30',arriveMin:30,home:false,opp:'GC09A',loc:'George Wilhelm Sports Complex',field:'GC09'},
      {id:4,date:'2026-10-03',time24:'10:30',arriveMin:30,home:true, opp:'GC09B',loc:CVSC,field:'CV2A'},
      {id:5,date:'2026-10-10',time24:'13:30',arriveMin:30,home:true, opp:'GR09A',loc:CVSC,field:'CV2A'},
      {id:6,date:'2026-10-17',time24:'13:30',arriveMin:30,home:false,opp:'HD09B',loc:CVSC,field:'CV2D'},
    ]},
  girls:{
    cfg:{teamName:'Blue Dolphins',teamCode:'CF09R',ageGroup:'U9',teamLoc:'Cedar Falls, IA',season:'Fall 2026',emoji:'🐬',coachName:'Haley',
         homeJersey:'Gray',awayJersey:'Blue',tierTop:[],tierBot:[]},
    roster:['Birkley','Collyns','Marley','Annie','Kinslee','Palmer','Riley','Zoey'],
    schedule:[
      {id:1,date:'2026-09-12',time24:'09:00',arriveMin:30,home:true, opp:'DN09T',loc:CVSC,field:'CV2A'},
      {id:2,date:'2026-09-18',time24:'17:30',arriveMin:30,home:true, opp:'JN09R',loc:'Orchard Hill Park',field:'OHP09'},
      {id:3,date:'2026-09-26',time24:'10:30',arriveMin:30,home:false,opp:'GR09T',loc:'Elmwood Park',field:'GR09'},
      {id:4,date:'2026-10-03',time24:'12:00',arriveMin:30,home:true, opp:'AP09T',loc:CVSC,field:'CV2C'},
      {id:5,date:'2026-10-10',time24:'10:30',arriveMin:30,home:false,opp:'GC09S',loc:'George Wilhelm Sports Complex',field:'GC09'},
      {id:6,date:'2026-10-17',time24:'15:00',arriveMin:30,home:false,opp:'HD09S',loc:CVSC,field:'CV2D'},
    ]},
};
const CFG_DEFAULTS={teamName:'New Team',teamCode:'',ageGroup:'U9',teamLoc:'',season:'',emoji:'⚽',coachName:'Coach',homeJersey:'Gray',awayJersey:'Blue',tierTop:[],tierBot:[]};
function getCfg(){return{...CFG_DEFAULTS,...((TEAM_DEFAULTS[TEAM_SLUG]||{}).cfg||{}),...(S&&S.cfg?S.cfg:{})};}
function sanitize(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

// ══════════════════════════════════════
// CONSTANTS — 4v4, four positions, 10-minute quarters
// ══════════════════════════════════════
const POS  = ['Forward','Mid (P)','Mid (C)','Defense'];
const PKEY = {'Forward':'fwd','Mid (P)':'mp','Mid (C)':'mc','Defense':'def'};
const PCLS = {'Forward':'cfwd','Mid (P)':'cmp','Mid (C)':'cmc','Defense':'cdef'};
const PLBL = {'Forward':'Forward','Mid (P)':'P-Mid','Mid (C)':'C-Mid','Defense':'Defense'};
const PPIP = {'Forward':'pfwd','Mid (P)':'pmp','Mid (C)':'pmc','Defense':'pdef'};
function blankStats(){return{gp:0,min:0,pos:{'Forward':0,'Mid (P)':0,'Mid (C)':0,'Defense':0}};}

// Skill tiers live in cfg (Settings → Skill Tiers). Max 2 from either group on the field per slot.
function getTiers(){
  const c=getCfg();
  return{top:(c.tierTop||[]).filter(p=>S.roster.includes(p)),bot:(c.tierBot||[]).filter(p=>S.roster.includes(p))};
}

// ── Slot-time helpers ───────────────────
// 7–8 players → rpq=2, split 5:00/5:00 (7-player: 1 carryover per quarter, all 3 bench players guaranteed slot 1)
// 6 players   → rpq=3, split 3:30/3:30/3:00 with [4,3,3] stat minutes
function fmtMin(m){
  const mins=Math.floor(m),secs=Math.round((m-mins)*60);
  return secs?`${mins}:${String(secs).padStart(2,'0')}`:`${mins}:00`;
}
function getSlotMins(rpq){
  if(rpq===3)return[4,3,3]; // approx integer stat-minutes for 3:30/3:30/3:00
  if(rpq===2)return[5,5];
  const base=Math.floor(10/rpq);
  return Array.from({length:rpq},(_,i)=>i===rpq-1?10-base*(rpq-1):base);
}
function getSlotTimes(rpq){
  if(rpq===3)return[{mS:0,mE:3.5},{mS:3.5,mE:7},{mS:7,mE:10}];
  if(rpq===2)return[{mS:0,mE:5},{mS:5,mE:10}];
  let t=0;const base=Math.floor(10/rpq);
  return Array.from({length:rpq},(_,i)=>{const s=t,e=i===rpq-1?10:t+base;t=e;return{mS:s,mE:e};});
}

// ── Jersey helpers — colors are per team in cfg (Settings → Team Details) ──
const JERSEY_COLORS={gray:'#707072',grey:'#707072',silver:'#9a9a9c',blue:'#1A5FB4',navy:'#1b2a4a',white:'#c9c9c9',black:'#111111',red:'#c0272d',
  green:'#1a7f37',yellow:'#d4a017',gold:'#d4a017',orange:'#e07020',purple:'#6a3fb5',pink:'#d6488f',teal:'#0f8a8a',maroon:'#7b1e2b'};
function jerseyName(g){const c=getCfg();return String((g.home?c.homeJersey:c.awayJersey)||'').trim()||'—';}
function jerseyHex(g){return JERSEY_COLORS[jerseyName(g).toLowerCase()]||'#707072';}

// ── Schedule helpers ─────────────────────
// S.schedule entries: {id, date:'YYYY-MM-DD', time24:'16:30', arriveMin:30, home:true, opp, loc, field}
// getGames() returns them date-sorted and decorated with display fields (num, dateStr, day, time, arrive).
function pad2(n){return String(n).padStart(2,'0');}
function parseISO(d){const[y,m,dd]=String(d||'').split('-').map(Number);return(y&&m&&dd)?new Date(y,m-1,dd):null;}
function fmtTime24(t){const[h,m]=String(t||'').split(':').map(Number);if(isNaN(h))return'';return`${((h+11)%12)+1}:${pad2(m||0)} ${h>=12?'PM':'AM'}`;}
function minusMin(t,n){const[h,m]=String(t||'').split(':').map(Number);if(isNaN(h))return'';const tot=(h*60+(m||0)-n+1440)%1440;return`${pad2(Math.floor(tot/60))}:${pad2(tot%60)}`;}
const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function decorateGame(g,i){
  const d=parseISO(g.date);
  const arriveMin=(g.arriveMin==null||g.arriveMin==='')?30:Number(g.arriveMin);
  return{...g,num:i+1,
    dateStr:d?`${pad2(d.getMonth()+1)}/${pad2(d.getDate())}`:'—',
    day:d?`${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`:'Date TBD',
    time:fmtTime24(g.time24)||'TBD',
    arrive:fmtTime24(minusMin(g.time24,arriveMin))||'—',
    opp:g.opp||'TBD',loc:g.loc||'TBD',field:g.field||''};
}
function getGames(){
  const list=[...(S.schedule||[])].sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.time24||'').localeCompare(b.time24||'')||a.id-b.id);
  return list.map(decorateGame);
}
function getGame(id){return getGames().find(g=>g.id===id)||null;}
function gameNum(id){const g=getGame(id);return g?g.num:id;}
// Next game to plan: first undone game today or later; else the first undone; else the last game.
function nextGameId(){
  const today=new Date();today.setHours(0,0,0,0);
  const gs=getGames();
  const n=gs.find(g=>!S.games[String(g.id)]?.done&&(parseISO(g.date)||today)>=today)||gs.find(g=>!S.games[String(g.id)]?.done)||gs[gs.length-1];
  return n?n.id:null;
}

// ══════════════════════════════════════
// STATE
// ══════════════════════════════════════
function fresh(){
  const d=TEAM_DEFAULTS[TEAM_SLUG]||{cfg:{},roster:[],schedule:[]};
  const ps={};d.roster.forEach(p=>ps[p]=blankStats());
  return{roster:[...d.roster],ps,cfg:{...d.cfg},schedule:(d.schedule||[]).map(g=>({...g})),capLog:[],games:{},gid:null};
}
// ══════════════════════════════════════
// CLOUD SYNC — one KV record per team at /api/<team>/data
// ══════════════════════════════════════
const STORAGE_KEY = `subtracker:${TEAM_SLUG}`;
const TOKEN_KEY   = 'subtracker_coach_token';
const WORKER_URL  = `https://soccer.theiehls.com/api/${TEAM_SLUG}`;
// One-time migration: the spring app stored the token under a Thunder-specific key.
try{if(!localStorage.getItem(TOKEN_KEY)&&localStorage.getItem('thunder_coach_token'))localStorage.setItem(TOKEN_KEY,localStorage.getItem('thunder_coach_token'));}catch(e){}

function getToken(){return localStorage.getItem(TOKEN_KEY)||'';}
function setToken(t){t?localStorage.setItem(TOKEN_KEY,t):localStorage.removeItem(TOKEN_KEY);}

function setSyncBadge(state){
  const b=document.getElementById('syncBadge');if(!b)return;
  const cfg={
    ok:      {cls:'sd-ok',     label:'Synced'},
    updated: {cls:'sd-ok',     label:'Updated'},
    syncing: {cls:'sd-syncing',label:'Syncing'},
    empty:   {cls:'sd-warn',   label:'⚠ Not in cloud yet'},
    offline: {cls:'sd-warn',   label:'⚠ Offline'},
    unauth:  {cls:'sd-unauth', label:'⚠ Token invalid'},
  };
  const c=cfg[state];
  if(!c){b.style.display='none';return;}
  b.className=`sync-dot ${c.cls}`;
  b.innerHTML=`<span class="dot"></span>${c.label}`;
  b.style.display='';
  if(state==='unauth'||state==='empty'){
    b.style.cursor='pointer';
    b.title='Click to go to Settings';
    b.onclick=()=>{const t=document.querySelector('.tab[onclick*="settings"]');nav('settings',t);};
  }else{
    b.style.cursor='';
    b.title='';
    b.onclick=null;
  }
}

// Resolves to {ok:true,data} where data may be null (team not saved to cloud yet), or {ok:false} on network/HTTP failure.
async function pullFromCloud(){
  try{const r=await fetch(WORKER_URL+'/data',{cache:'no-store'});if(!r.ok)return{ok:false};return{ok:true,data:await r.json()};}
  catch{return{ok:false};}
}

async function pushToCloud(data){
  const token=getToken();if(!token)return false;
  try{
    const r=await fetch(WORKER_URL+'/data',{
      method:'PUT',
      headers:{'Content-Type':'application/json','X-Coach-Token':token},
      body:JSON.stringify(data)
    });
    if(r.status===401)return 'unauthorized';
    return r.ok?'ok':'error';
  }catch{return 'error';}
}

function rerenderCurrentPage(){
  const name=document.querySelector('.page.on')?.id.replace('page-','')||'schedule';
  if(name==='plan')renderPlan();
  else if(name==='season')renderSeason();
  else if(name==='schedule')renderSchedule();
  else if(name==='print'){populatePrintSel();renderPrint();}
  else if(name==='settings')renderSettings();
}
async function syncFromCloud(){
  setSyncBadge('syncing');
  const res=await pullFromCloud();
  if(!res.ok){setSyncBadge('offline');updateSyncMsg();return;}
  const cloud=res.data;
  if(!cloud){
    // Nothing saved for this team yet. With a coach token, seed the cloud from this browser's data.
    if(getToken()){
      const r=await pushToCloud(S);
      setSyncBadge(r==='ok'?'ok':r==='unauthorized'?'unauth':'offline');
    }else setSyncBadge('empty');
    updateSyncMsg();return;
  }
  const localTs=S._updatedAt||0,cloudTs=cloud._updatedAt||0;
  if(cloudTs>localTs){
    S=migrate(cloud);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(S));
    setSyncBadge('updated');
    renderHeader();rerenderCurrentPage();
  }else{
    setSyncBadge('ok');
  }
  updateSyncMsg();
}

async function forcePullFromCloud(){
  setSyncBadge('syncing');
  const res=await pullFromCloud();
  if(!res.ok){setSyncBadge('offline');showToast('Could not reach cloud.');return;}
  if(!res.data){setSyncBadge('empty');showToast('Cloud has no data for this team yet.');updateSyncMsg();return;}
  S=migrate(res.data);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(S));
  setSyncBadge('updated');
  renderHeader();rerenderCurrentPage();
  updateSyncMsg();
  showToast('Loaded latest data from cloud.');
}

function updateSyncMsg(){
  const el=document.getElementById('syncStatusMsg');if(!el)return;
  const token=getToken();
  const inp=document.getElementById('coachTokenInput');
  if(inp&&token&&!inp.value)inp.value='••••••••';
  el.textContent=token
    ?`Coach mode — changes save to cloud automatically (team: ${TEAM_SLUG}).`
    :'View-only mode — data loads from cloud on refresh. Enter token to enable saving.';
}

function renderHeader(){
  const cfg=getCfg();
  document.title=`Sub Tracker — ${cfg.teamName}`;
  const fav=document.getElementById('favicon');
  if(fav)fav.href=`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23111111'/><text x='16' y='24' text-anchor='middle' font-size='22'>${encodeURIComponent(cfg.emoji||'⚽')}</text></svg>`;
  const pb=document.getElementById('promoBar');
  if(pb)pb.textContent=[`${cfg.teamName} ${cfg.ageGroup}`.trim(),cfg.teamCode,cfg.teamLoc,cfg.season].filter(Boolean).join(' · ');
  const he=document.getElementById('hEmoji');
  if(he)he.textContent=cfg.emoji||'⚽';
  const hn=document.getElementById('hTeamName');
  if(hn)hn.textContent=cfg.teamName.toUpperCase();
  const eyebrow=[cfg.teamName,cfg.teamCode].filter(Boolean).join(' · ');
  for(const id of['seasonEyebrow','printEyebrow','settingsEyebrow']){const el=document.getElementById(id);if(el)el.textContent=eyebrow;}
  const sche=document.getElementById('schedEyebrow');
  if(sche)sche.textContent=cfg.season||eyebrow;
}

function saveCoachToken(){
  const v=document.getElementById('coachTokenInput').value.trim();
  if(v==='••••••••')return;
  setToken(v);
  updateSyncMsg();
  if(!v){showToast('Token cleared — view-only mode.');return;}
  setSyncBadge('syncing');
  pushToCloud(S).then(result=>{
    if(result==='ok'){setSyncBadge('ok');showToast('Token valid — coach mode active.');}
    else if(result==='unauthorized'){setSyncBadge('unauth');showToast('Token invalid — check and re-enter.');}
    else{setSyncBadge('offline');showToast('Token saved — could not reach cloud to verify.');}
  }).catch(()=>{setSyncBadge('offline');showToast('Token saved — network error.');});
}

// Bring any stored record (local or cloud, old or new) up to the current shape.
function migrate(d){
  if(!d||typeof d!=='object')return fresh();
  if(!Array.isArray(d.roster))d.roster=[];
  if(!d.ps||typeof d.ps!=='object')d.ps={};
  d.roster.forEach(p=>{if(!d.ps[p])d.ps[p]=blankStats();});
  if(!d.games||typeof d.games!=='object')d.games={};
  if(!Array.isArray(d.capLog))d.capLog=[];
  if(!Array.isArray(d.schedule))d.schedule=[];
  if(!d.cfg||typeof d.cfg!=='object')d.cfg={};
  if(!Array.isArray(d.cfg.tierTop))delete d.cfg.tierTop;
  if(!Array.isArray(d.cfg.tierBot))delete d.cfg.tierBot;
  return d;
}
function load(){try{const s=localStorage.getItem(STORAGE_KEY);if(s)return migrate(JSON.parse(s));}catch(e){}return fresh();}
function save(){
  S._updatedAt=Date.now();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(S));
  pushToCloud(S).then(result=>{
    if(result==='ok')setSyncBadge('ok');
    else if(result==='unauthorized'){setSyncBadge('unauth');showToast('Coach token invalid — update it in Settings.');}
    else setSyncBadge('offline');
  }).catch(()=>setSyncBadge('offline'));
}
let S=load();

// ══════════════════════════════════════
// CAPTAINS
// ══════════════════════════════════════
function capCounts(){
  const c={};S.roster.forEach(p=>c[p]=0);
  (S.capLog||[]).forEach(({caps})=>caps.forEach(p=>{if(c[p]!==undefined)c[p]++;}));
  return c;
}
function suggestCaps(gid){
  // Always compute algorithmically, excluding this game's own capLog entry so confirmed
  // caps don't inflate the count and bias the next suggestion.
  const c={};S.roster.forEach(p=>c[p]=0);
  (S.capLog||[]).filter(e=>e.gid!==gid).forEach(({caps})=>caps.forEach(p=>{if(c[p]!==undefined)c[p]++;}));
  const att=getAtt(gid);
  return [...att].map(p=>({p,c:c[p]||0}))
    .sort((a,b)=>a.c!==b.c?a.c-b.c:S.roster.indexOf(a.p)-S.roster.indexOf(b.p))
    .slice(0,2).map(x=>x.p);
}
function getAtt(gid){const gd=S.games[String(gid)];return gd&&gd.att?gd.att:[...S.roster];}

// ══════════════════════════════════════
// PARENT EMAIL
// ══════════════════════════════════════
function buildEmail(gid){
  const g=getGame(gid);if(!g)return'';
  const cfg=getCfg();
  const jersey=jerseyName(g).toUpperCase();
  const homeAway=g.home?`Home vs ${g.opp}`:`Away @ ${g.opp}`;
  return `Hello ${cfg.teamName} families,

Quick note ahead of this week's game:

Game: ${homeAway}
Date: ${g.day}
Location: ${g.loc}${g.field?` — ${g.field}`:''}
Arrive by: ${g.arrive}
Game time: ${g.time}
Jerseys: Wear ${jersey}

Thanks, ${cfg.coachName}`;
}

// ══════════════════════════════════════
// ROTATION GENERATOR
// ══════════════════════════════════════
function perms4(){
  const r=[];
  for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(b!==a)for(let c=0;c<4;c++)if(c!==a&&c!==b)for(let d=0;d<4;d++)if(d!==a&&d!==b&&d!==c)r.push([a,b,c,d]);
  return r;
}
const PERMS4=perms4();

function bestPos(players,gp,sp,prevFirst,randFn,posWeights){
  posWeights=posWeights||{};
  let best=null,bestScore=Infinity;
  for(const perm of PERMS4){
    let score=0;
    for(let pi=0;pi<4;pi++){
      const pos=POS[perm[pi]],p=players[pi];
      if((gp[p]&&gp[p][pos])||0)score+=500;
      score+=((sp[p]&&sp[p][pos])||0)*3;
      if(posWeights[p]&&posWeights[p][pos])score-=posWeights[p][pos]; // bonus for underplayed FWD/DEF
    }
    if(prevFirst){let m=0;for(let pi=0;pi<4;pi++)if(prevFirst[perm[pi]]===players[pi])m++;score+=m*8;}
    score+=randFn()*0.5;
    if(score<bestScore){bestScore=score;best=perm;}
  }
  const rot=new Array(4);for(let pi=0;pi<4;pi++)rot[best[pi]]=players[pi];return rot;
}

// Returns {playerName:'first'|'second'} for up to 2 players who were exclusively
// in the same half-of-quarter group across the last 2 completed games.
function computeGroupPrefs(){
  const done=Object.entries(S.games)
    .filter(([,gd])=>gd.done&&gd.rots)
    .sort(([a],[b])=>parseInt(a)-parseInt(b));
  if(done.length<2)return{};
  const last2=done.slice(-2);
  const result={};
  S.roster.forEach(p=>{
    let alwaysFirst=true,alwaysSecond=true,gameCount=0;
    last2.forEach(([,gd])=>{
      const rpq=gd.rpq||2;let fc=0,sc=0;
      for(let q=0;q<4;q++){
        if((gd.rots[q*rpq]||[]).includes(p))fc++;
        else if((gd.rots[q*rpq+1]||[]).includes(p))sc++;
      }
      if(fc>0||sc>0)gameCount++;
      if(fc>0&&sc===0)alwaysSecond=false;
      else if(sc>0&&fc===0)alwaysFirst=false;
      else if(fc>0||sc>0){alwaysFirst=false;alwaysSecond=false;}
      // fc===0 && sc===0 → absent; don't break the streak
    });
    if(gameCount<2)return; // need data from both games
    if(alwaysFirst)result[p]='first';
    else if(alwaysSecond)result[p]='second';
  });
  const keys=Object.keys(result);
  if(keys.length>2)keys.slice(2).forEach(k=>delete result[k]); // cap at 2 per-game corrections
  return result;
}

// Swaps out up to one over-represented tier player per tier so neither top nor bottom
// tier exceeds 2 players on the field in a single rotation slot.
// guaranteed: Set of players who must not be removed (consecutive-slot protection).
// mustSit: Set of players who played the two preceding slots and must bench this slot.
function applyTierBalance(onField,avail,tgtMap,used,left,topTier,botTier,guaranteed,mustSit){
  guaranteed=guaranteed||new Set();
  mustSit=mustSit||new Set();
  let field=[...onField],bench=[...avail];
  for(const [tier,notTier] of [[topTier,p=>!topTier.includes(p)],[botTier,p=>!botTier.includes(p)]]){
    if(field.filter(p=>tier.includes(p)).length<=2)continue;
    const out=field.find(p=>tier.includes(p)&&!guaranteed.has(p)&&(tgtMap[p]-used[p])<left);
    if(!out)continue;
    const inn=bench.find(p=>notTier(p)&&!mustSit.has(p)&&(tgtMap[p]-used[p])>0);
    if(!inn)continue;
    field=field.filter(p=>p!==out); field.push(inn);
    bench=bench.filter(p=>p!==inn); bench.push(out);
  }
  return field;
}

function genRots(players,seasonStats,prevRots,seed,groupPrefs,tierConfig){
  groupPrefs=groupPrefs||{};
  const topTier=(tierConfig&&tierConfig.top)||[];
  const botTier=(tierConfig&&tierConfig.bot)||[];

  const n=players.length,rpq=n>=7?2:3,total=4*rpq,totalSlots=total*4;
  const sMins=players.map(p=>seasonStats[p]?.min||0),minS=Math.min(...sMins);
  const invW=sMins.map(m=>1/(1+(m-minS)/10)),wSum=invW.reduce((a,b)=>a+b,0);
  const raw=invW.map(w=>(w/wSum)*totalSlots),tgt=raw.map(x=>Math.floor(x));
  let rem=totalSlots-tgt.reduce((a,b)=>a+b,0);
  raw.map((x,i)=>({i,f:x-Math.floor(x)})).sort((a,b)=>b.f-a.f).forEach(({i},k)=>{if(k<rem)tgt[i]++;});
  const tgtMap={};players.forEach((p,i)=>tgtMap[p]=tgt[i]);
  const sp={};players.forEach(p=>{sp[p]={...((seasonStats[p]&&seasonStats[p].pos)||{'Forward':0,'Mid (P)':0,'Mid (C)':0,'Defense':0})};});

  // Position-imbalance weights: bonus for underplayed FWD/DEF vs season fair share
  const posWeights={};
  players.forEach(p=>{
    const pd=seasonStats[p]?.pos||{'Forward':0,'Mid (P)':0,'Mid (C)':0,'Defense':0};
    const tot=Object.values(pd).reduce((a,b)=>a+b,0);
    posWeights[p]={};
    if(tot>0){const fair=tot/4;['Forward','Defense'].forEach(pos=>{const def=fair-(pd[pos]||0);if(def>0.5)posWeights[p][pos]=Math.min(def*2,8);});}
  });

  let rng=seed||42;const rand=()=>{rng=(rng*1664525+1013904223)&0xffffffff;return(rng>>>0)/4294967296;};
  const rots=[],gpC={},used={};players.forEach(p=>{gpC[p]={};used[p]=0;});

  for(let r=0;r<total;r++){
    const left=total-r,isFirst=(r%rpq===0);

    // mustSit: players who played both of the two immediately preceding slots must bench this slot.
    // Prevents any player from playing 3+ consecutive slots (including across quarter boundaries).
    // mustSit and guaranteed are always disjoint — a player cannot have both sat and played r-1.
    const mustSit=new Set();
    if(r>=2){
      players.forEach(p=>{
        if(rots[r-1]?.includes(p)&&rots[r-2]?.includes(p))mustSit.add(p);
      });
    }

    const must=players.filter(p=>!mustSit.has(p)&&(tgtMap[p]-used[p])>=left);
    let onField=[...must];

    if(onField.length>4){
      // Too many must-play players: keep those with least season time, then by group preference
      onField=onField.sort((a,b)=>{
        const md=(sMins[players.indexOf(a)])-(sMins[players.indexOf(b)]);
        if(md)return md;
        // Prefer to keep players that belong in this slot type (lower value = kept)
        const ga=groupPrefs[a]==='first'?(isFirst?1:-1):groupPrefs[a]==='second'?(isFirst?-1:1):0;
        const gb=groupPrefs[b]==='first'?(isFirst?1:-1):groupPrefs[b]==='second'?(isFirst?-1:1):0;
        return ga-gb;
      }).slice(0,4);
    }

    if(onField.length<4){
      // Fill from bench: equity first, then prefer players in their non-usual group slot.
      // At the second slot of a 7-player quarter (rpq=2, !isFirst), bottom-tier players who played
      // the first slot are excluded from carryover — they should not play 10 unbroken minutes.
      const pool=players.filter(p=>{
        if(onField.includes(p)||mustSit.has(p))return false;
        if(rpq===2&&!isFirst&&botTier.includes(p)&&rots[r-1]?.includes(p))return false;
        return true;
      }).sort((a,b)=>{
        const td=(tgtMap[b]-used[b])-(tgtMap[a]-used[a]);if(td)return td;
        const ga=groupPrefs[a]==='first'?(isFirst?-2:2):groupPrefs[a]==='second'?(isFirst?2:-2):0;
        const gb=groupPrefs[b]==='first'?(isFirst?-2:2):groupPrefs[b]==='second'?(isFirst?2:-2):0;
        if(ga!==gb)return gb-ga; // higher score = better fit for this slot → comes first
        return(sMins[players.indexOf(a)])-(sMins[players.indexOf(b)]);
      });
      while(onField.length<4&&pool.length)onField.push(pool.shift());
    }

    // Consecutive-slot guarantee: at every slot after the first, all players who sat out
    // the immediately preceding slot must play this slot. The guaranteed set is built from
    // ALL such players (even those equity already selected) so tier balance cannot remove
    // them afterwards. Fires across quarter boundaries too.
    const guaranteed=new Set();
    if(r>0){
      const prevSlotIdx=r-1;
      players.forEach(p=>{
        if(!(rots[prevSlotIdx]&&rots[prevSlotIdx].includes(p)))guaranteed.add(p);
      });
      guaranteed.forEach(p=>{if(!onField.includes(p))onField.push(p);});
      while(onField.length>4){
        const droppable=onField.filter(p=>!guaranteed.has(p))
          .sort((a,b)=>(tgtMap[b]-used[b])-(tgtMap[a]-used[a]));
        if(droppable.length){onField.splice(onField.indexOf(droppable[0]),1);continue;}
        // More guaranteed players than spots (happens with 9+ players, where someone must sit twice).
        // Keep the ones owed the most appearances; the rest are released from the guarantee.
        const gl=onField.filter(p=>guaranteed.has(p))
          .sort((a,b)=>(tgtMap[b]-used[b])-(tgtMap[a]-used[a])||players.indexOf(a)-players.indexOf(b));
        const drop=gl[gl.length-1];guaranteed.delete(drop);onField.splice(onField.indexOf(drop),1);
      }
    }

    // Tier balance: pass guaranteed (cannot be removed) and mustSit (cannot be added)
    if(topTier.length||botTier.length){
      const avail=players.filter(p=>!onField.includes(p));
      onField=applyTierBalance(onField,avail,tgtMap,used,left,topTier,botTier,guaranteed,mustSit);
    }

    const rot=bestPos(onField,gpC,sp,r===0?prevRots?.[0]:null,rand,posWeights);
    rots.push(rot);
    onField.forEach(p=>used[p]++);
    POS.forEach((pos,i)=>{const p=rot[i];if(!p)return;if(!gpC[p])gpC[p]={};gpC[p][pos]=(gpC[p][pos]||0)+1;sp[p][pos]++;});
  }
  return{rots,rpq};
}

// ══════════════════════════════════════
// PLAN PAGE
// ══════════════════════════════════════
function renderPlan(){
  if(!getGames().length){renderPlanEmpty();return;}
  if(!S.gid||!getGame(S.gid))S.gid=nextGameId();
  const g=getGame(S.gid);
  const gd=S.games[String(S.gid)]||{};
  const done=!!gd.done,locked=!!(gd.locked||done);
  const vs=g.home?`Home vs ${g.opp}`:`Away @ ${g.opp}`;
  for(const id of['capCard','attCard'])document.getElementById(id).style.display='';

  // Header
  document.getElementById('planEyebrow').textContent=`Game ${g.num} · ${g.dateStr}`;
  document.getElementById('planTitle').textContent=vs;
  document.getElementById('planMeta').innerHTML=
    [g.day,g.time,g.loc,g.field].filter(Boolean).map(sanitize).map(x=>`<span>${x}</span>`).join('<span class="meta-sep">·</span>');

  // Jersey chip — colors from Team Details
  document.getElementById('jerseyBanner').innerHTML=
    `<div class="jersey-chip ${g.home?'jersey-home':'jersey-away'} no-print"><span class="j-dot" style="background:${jerseyHex(g)}"></span>${g.home?'Home':'Away'} Game — Wear ${sanitize(jerseyName(g).toUpperCase())}</div>`;

  renderCaps(locked||done);
  renderAttGrid(locked||done);

  const hasRot=!!(gd.rots&&gd.rots.length);
  if(hasRot){
    renderRot(gd.rots,gd.rpq||2,getAtt(S.gid),!locked);
    checkAlerts(gd.rots,getAtt(S.gid),gd.rpq||2);
    document.getElementById('reshuffleBtn').style.display=locked?'none':'';
    const lb=document.getElementById('lockBar');
    lb.style.display=done?'none':'flex';
    if(!done){
      const lbtn=document.getElementById('lockBtn'),rbtn=document.getElementById('regenBtn');
      if(locked){
        lbtn.textContent='🔒 Locked';lbtn.className='btn btn-sm btn-lock-on';
        rbtn.style.display='none';
        document.getElementById('lockMsg').textContent='Plan is locked. Click to unlock and make changes.';
      }else{
        lbtn.textContent='🔓 Lock Plan';lbtn.className='btn btn-sm btn-lock-off';
        rbtn.style.display='';
        document.getElementById('lockMsg').textContent='Plan unlocked — edit cells, reshuffle, or lock when ready.';
      }
    }
    document.getElementById('doneCard').style.display=locked&&!done?'block':'none';
    if(locked&&!done)renderScoreEntry();
    if(done){renderScoreDone(gd.score);showAlerts([{t:'a-ok',msg:`Game ${g.num} complete — ${vs}. Score: ${getCfg().teamName} ${gd.score?gd.score[0]:'?'} – ${gd.score?gd.score[1]:'?'}.`}]);}
    renderEmailCard();
    document.getElementById('emailCard').style.display='block';
  }else{
    document.getElementById('rotArea').innerHTML='';
    document.getElementById('lockBar').style.display='none';
    document.getElementById('doneCard').style.display='none';
    document.getElementById('emailCard').style.display='none';
    document.getElementById('alertBox').innerHTML='';
    document.getElementById('reshuffleBtn').style.display='none';
  }
}

function renderPlanEmpty(){
  document.getElementById('planEyebrow').textContent='Game Plan';
  document.getElementById('planTitle').textContent='No games scheduled yet';
  document.getElementById('planMeta').innerHTML='Add this season\'s games under <a href="#" onclick="nav(\'settings\');return false">Settings → Schedule</a>, then come back here to plan rotations.';
  document.getElementById('jerseyBanner').innerHTML='';
  for(const id of['capCard','attCard','lockBar','doneCard','emailCard'])document.getElementById(id).style.display='none';
  document.getElementById('rotArea').innerHTML='';
  document.getElementById('alertBox').innerHTML='';
  document.getElementById('reshuffleBtn').style.display='none';
}

function renderScoreEntry(){
  const cfg=getCfg();
  document.getElementById('scoreDisplay').innerHTML=`
    <div class="score-row">
      <div><label>${cfg.teamName} Score</label><input type="number" id="scoreUs" class="score-in" min="0" value="0"></div>
      <div style="font-size:24px;font-weight:500;color:var(--text-secondary);padding-bottom:8px;align-self:flex-end">–</div>
      <div><label>Opponent Score</label><input type="number" id="scoreThem" class="score-in" min="0" value="0"></div>
      <div style="align-self:flex-end;padding-bottom:2px"><button class="btn btn-primary btn-sm" onclick="markDone()">Mark Game Done</button></div>
    </div>
    <div class="xs muted">Marks game as complete and saves season stats.</div>`;
}

function renderScoreDone(score){
  const sc=score||[0,0];
  document.getElementById('doneCard').style.display='block';
  document.getElementById('scoreDisplay').innerHTML=`
    <div class="flex gap16 wrap" style="align-items:center;margin-bottom:16px">
      <div class="score-display">${getCfg().teamName.toUpperCase()} ${sc[0]} – ${sc[1]}</div>
      <button class="btn btn-ghost btn-sm" onclick="editScore()">Edit Score</button>
    </div>
    <div style="border-top:1px solid var(--grey-200);padding-top:16px;margin-top:4px">
      <div class="xs muted mb8">Need to undo this game? The reset below removes the rotation, score, and captain record for this game. Note that season stats (minutes and position counts) already recorded when you marked this game done are <strong>not reversed</strong> — see the info below.</div>
      <button class="btn btn-danger btn-sm" onclick="resetGamePlan()">Reset Game Plan</button>
    </div>`;
}

function editScore(){
  const cfg=getCfg();
  const gd=S.games[String(S.gid)];if(!gd)return;const sc=gd.score||[0,0];
  document.getElementById('scoreDisplay').innerHTML=`
    <div class="score-row">
      <div><label>${cfg.teamName} Score</label><input type="number" id="scoreUs" class="score-in" min="0" value="${sc[0]}"></div>
      <div style="font-size:24px;font-weight:500;color:var(--text-secondary);padding-bottom:8px;align-self:flex-end">–</div>
      <div><label>Opponent Score</label><input type="number" id="scoreThem" class="score-in" min="0" value="${sc[1]}"></div>
      <div style="align-self:flex-end;padding-bottom:2px;display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="saveScore()">Save</button>
        <button class="btn btn-secondary btn-sm" onclick="renderScoreDone(S.games[String(S.gid)]?.score)">Cancel</button>
      </div>
    </div>`;
}

function saveScore(){
  const gd=S.games[String(S.gid)];if(!gd)return;
  gd.score=[parseInt(document.getElementById('scoreUs').value)||0,parseInt(document.getElementById('scoreThem').value)||0];
  save();renderScoreDone(gd.score);
}

function renderEmailCard(){
  document.getElementById('emailBody').textContent=buildEmail(S.gid);
}
function copyEmail(){
  const txt=document.getElementById('emailBody').textContent;
  navigator.clipboard.writeText(txt).then(()=>showToast('Email copied to clipboard'));
}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}

// ── Captains ───────────────────────────
function renderCaps(locked){
  const gd=S.games[String(S.gid)]||{},assigned=!!gd.caps,done=!!gd.done;
  const cc=capCounts();
  const div=document.getElementById('capArea');
  const att=getAtt(S.gid);
  if(!att.length){div.innerHTML='<div class="sm muted">Mark attendance first.</div>';return;}

  if(done||locked){
    // Read-only: just show who was assigned
    const caps=gd.caps||suggestCaps(S.gid);
    document.getElementById('capNote').textContent='Assigned';
    document.getElementById('capNote').className='badge badge-green';
    div.innerHTML=`
      <div class="cap-row">
        ${caps.map(p=>`<div class="cap-chip"><span class="star">⭐</span>${p} <span class="badge" style="font-size:10px">${cc[p]||0}× cap</span></div>`).join('')}
      </div>
      <div class="xs muted">Rotates so everyone leads before anyone repeats.</div>`;
    return;
  }

  // Editable: show picker — each player is a toggleable button, select exactly 2
  // Suggestion is computed once here and stays frozen for the whole picker session
  // so the ⭐ never moves as the user taps players.
  _capPickerSuggested=suggestCaps(S.gid);
  _capPickerSelection=assigned?[...gd.caps]:[..._capPickerSuggested];

  document.getElementById('capNote').textContent=assigned?'Assigned':'Suggested — tap to change';
  document.getElementById('capNote').className='badge '+(assigned?'badge-green':'badge-warn');

  div.innerHTML=`
    <div class="xs muted mb8">Select 2 captains. ⭐ = suggested based on fewest prior turns.</div>
    <div class="att-grid" id="capPickerGrid" style="margin-bottom:12px"></div>
    <div class="flex gap8 wrap" id="capActions"></div>
    <div class="xs muted mt8">Rotates so everyone leads before anyone repeats.</div>`;

  renderCapPicker(att, cc);
}

function renderCapPicker(att, cc){
  const selected=_capPickerSelection||[];
  const suggested=_capPickerSuggested||[];
  const grid=document.getElementById('capPickerGrid');
  if(!grid)return;
  grid.innerHTML=att.map(p=>{
    const isSel=selected.includes(p);
    const isSug=suggested.includes(p);
    const count=cc[p]||0;
    return`<div class="att-btn ${isSel?'yes':''}" onclick="toggleCapPick('${p}')" style="position:relative">
      ${isSug?'<span style="position:absolute;top:3px;right:5px;font-size:9px;color:var(--bolt)">⭐</span>':''}
      <div style="font-weight:500">${p}</div>
      <div style="font-size:10px;color:${isSel?'rgba(255,255,255,.7)':'var(--text-secondary)'};">${count}× cap</div>
    </div>`;
  }).join('');

  const actions=document.getElementById('capActions');
  if(!actions)return;
  if(selected.length===2){
    actions.innerHTML=`
      <button class="btn btn-primary btn-sm" onclick="confirmCapsFromPicker()">✓ Confirm ${selected.join(' & ')}</button>
      <button class="btn btn-secondary btn-sm" onclick="resetCapPicker()">Reset to Suggested</button>`;
  }else{
    actions.innerHTML=`<div class="sm muted" style="padding:6px 0">Select ${2-selected.length} more player${selected.length===1?'':'s'}</div>`;
  }
}

// Temporary picker state (not persisted until Confirm)
let _capPickerSelection = null;
let _capPickerSuggested = null;

function toggleCapPick(p){
  if(!_capPickerSelection)return; // picker not open
  if(_capPickerSelection.includes(p)){
    _capPickerSelection=_capPickerSelection.filter(x=>x!==p);
  }else{
    if(_capPickerSelection.length>=2)_capPickerSelection.shift();
    _capPickerSelection.push(p);
  }
  renderCapPicker(getAtt(S.gid),capCounts());
}

function resetCapPicker(){
  _capPickerSelection=[...(_capPickerSuggested||[])];
  renderCapPicker(getAtt(S.gid),capCounts());
}

function confirmCapsFromPicker(){
  if(!_capPickerSelection||_capPickerSelection.length!==2)return;
  const caps=[..._capPickerSelection];
  _capPickerSelection=null;_capPickerSuggested=null;
  S.games[String(S.gid)]=S.games[String(S.gid)]||{};
  S.games[String(S.gid)].caps=caps;
  S.capLog=S.capLog.filter(x=>x.gid!==S.gid);
  S.capLog.push({gid:S.gid,caps});
  save();renderCaps(false);
  if(document.getElementById('emailBody'))renderEmailCard();
}

function reassignCaps(){
  const gd=S.games[String(S.gid)];
  if(gd){delete gd.caps;S.capLog=S.capLog.filter(x=>x.gid!==S.gid);}
  _capPickerSelection=null;_capPickerSuggested=null;
  save();renderCaps(false);
}

// ── Attendance ─────────────────────────
function renderAttGrid(locked){
  const att=getAtt(S.gid);
  document.getElementById('attGrid').innerHTML=S.roster.map(p=>
    `<div class="att-btn ${att.includes(p)?'yes':'no'}" ${locked?'':'onclick="toggleAtt(\''+p+'\')"'}>${p}</div>`).join('');
  document.getElementById('attBadge').textContent=`${att.length}/${S.roster.length}`;
  document.getElementById('attBadge').className='badge '+(att.length>=7?'badge-green':att.length>=5?'badge-warn':'badge-red');
}
function toggleAtt(p){
  const gd=S.games[String(S.gid)]=S.games[String(S.gid)]||{};
  let att=getAtt(S.gid);
  if(att.includes(p)){if(att.length>4)att=att.filter(x=>x!==p);}else att.push(p);
  gd.att=S.roster.filter(x=>att.includes(x));
  if(gd.rots&&!gd.locked)delete gd.rots;
  save();renderPlan();
}
function allPresent(){const gd=S.games[String(S.gid)]=S.games[String(S.gid)]||{};gd.att=[...S.roster];save();renderPlan();}

// ── Generate ───────────────────────────
function doGenerate(seedOverride){
  const att=getAtt(S.gid);if(att.length<4){showAlerts([{t:'a-warn',msg:'Need at least 4 players.'}]);return;}
  const gs=getGames(),gi=gs.findIndex(g=>g.id===S.gid);
  const prev=gi>0?(S.games[String(gs[gi-1].id)]?.rots||null):null;
  const seed=seedOverride||(Math.floor(Math.random()*1e9)+1);
  const groupPrefs=computeGroupPrefs();
  const tiers=getTiers();
  const tierConfig={top:tiers.top.filter(p=>att.includes(p)),bot:tiers.bot.filter(p=>att.includes(p))};
  const{rots,rpq}=genRots(att,S.ps,prev,seed,groupPrefs,tierConfig);
  const gd=S.games[String(S.gid)]=S.games[String(S.gid)]||{};
  gd.rots=rots;gd.rpq=rpq;gd.locked=false;gd._seed=seed;
  save();renderPlan();
}
function doReshuffle(){const gd=S.games[String(S.gid)];doGenerate(((gd?._seed||42)+Math.floor(Math.random()*9999)+1)&0xffffffff);}
function toggleLock(){const gd=S.games[String(S.gid)];if(!gd?.rots)return;gd.locked=!gd.locked;save();renderPlan();}
function markDone(){
  const gd=S.games[String(S.gid)];if(!gd?.rots)return;
  if(!gd.locked){showAlerts([{t:'a-warn',msg:'Lock the plan first.'}]);return;}
  if(gd.done)return;
  gd.score=[parseInt(document.getElementById('scoreUs').value)||0,parseInt(document.getElementById('scoreThem').value)||0];
  gd.done=true;
  const att=getAtt(S.gid);
  const rpqVal=gd.rpq||2;
  const _doneSlotMins=getSlotMins(rpqVal);
  gd.rots.forEach((rot,ri)=>{const riInQ=ri%rpqVal;const slotMin=_doneSlotMins[riInQ];POS.forEach((pos,i)=>{const p=rot[i];if(!p)return;if(!S.ps[p])S.ps[p]=blankStats();S.ps[p].min+=slotMin;S.ps[p].pos[pos]++;});});
  att.forEach(p=>{if(S.ps[p])S.ps[p].gp++;});
  if(!gd.caps){const caps=suggestCaps(S.gid);gd.caps=caps;if(!S.capLog.find(x=>x.gid===S.gid))S.capLog.push({gid:S.gid,caps});}
  save();renderPlan();
}

// ── Rotation table ─────────────────────
function renderRot(rots,rpq,att,editable){
  const QN=['Q1','Q2','Q3','Q4'];
  let html='';
  for(let q=0;q<4;q++){
    html+=`<div class="rot-block">
      <div class="rot-qhead"><span>${QN[q]}</span></div>
      <table class="rot-tbl"><thead><tr><th>Position</th>`;
    for(let r=0;r<rpq;r++){
      const{mS,mE}=getSlotTimes(rpq)[r];
      const lbl=['First','Second','Third'][r]||`Slot ${r+1}`;
      html+=`<th>${lbl} &nbsp;<span style="font-weight:400;font-size:10px">${fmtMin(mS)}–${fmtMin(mE)}</span></th>`;
    }
    html+=`</tr></thead><tbody>`;
    POS.forEach((pos,pi)=>{
      html+=`<tr><td>${PLBL[pos]}</td>`;
      for(let r=0;r<rpq;r++){
        const ri=q*rpq+r,rot=rots[ri]||[],p=rot[pi]||'—',cls=PCLS[pos];
        html+=editable
          ?`<td class="${cls} editable" id="c${ri}_${pi}" onclick="openDrop(event,${ri},${pi})">${p}</td>`
          :`<td class="${cls}">${p}</td>`;
      }
      html+=`</tr>`;
    });
    html+=`<tr><td class="cout" style="font-style:italic">Out</td>`;
    for(let r=0;r<rpq;r++){
      const ri=q*rpq+r,rot=rots[ri]||[],out=att.filter(p=>!rot.includes(p));
      html+=`<td class="cout">${out.join(', ')||'—'}</td>`;
    }
    html+=`</tr></tbody></table></div>`;
  }
  document.getElementById('rotArea').innerHTML=html;
}

// ── Cell editor ────────────────────────
let dropTarget=null;
function openDrop(e,ri,pi){
  e.stopPropagation();closeDrop();
  const gd=S.games[String(S.gid)];if(!gd?.rots)return;
  const rot=gd.rots[ri],att=getAtt(S.gid),cur=rot[pi];
  dropTarget={ri,pi};
  const drop=document.getElementById('cellDrop');
  drop.innerHTML=att.map(p=>`<div class="${p===cur?'curr':''}" onclick="setCellPlayer('${p}')">${p}${rot.includes(p)&&p!==cur?' ↔':p===cur?' ✓':''}</div>`).join('');
  const cell=document.getElementById(`c${ri}_${pi}`),rect=cell.getBoundingClientRect();
  drop.style.left=Math.min(rect.left,window.innerWidth-160)+'px';
  drop.style.top=Math.min(rect.bottom,window.innerHeight-240)+'px';
  drop.style.display='block';
}
function setCellPlayer(np){
  const{ri,pi}=dropTarget;const gd=S.games[String(S.gid)];const rot=gd.rots[ri];const op=rot[pi];
  if(op===np){closeDrop();return;}
  const oi=rot.indexOf(np);if(oi>=0)rot[oi]=op;rot[pi]=np;
  closeDrop();save();renderRot(gd.rots,gd.rpq||2,getAtt(S.gid),true);checkAlerts(gd.rots,getAtt(S.gid),gd.rpq||2);
}
function closeDrop(){document.getElementById('cellDrop').style.display='none';dropTarget=null;}
document.addEventListener('click',closeDrop);

// ── Alerts ─────────────────────────────
function checkAlerts(rots,att,rpq){
  rpq=rpq||2;
  const al=[];const gpc={};att.forEach(p=>gpc[p]={});
  rots.forEach(r=>{if(!r)return;POS.forEach((pos,i)=>{const p=r[i];if(!p)return;if(!gpc[p])gpc[p]={};gpc[p][pos]=(gpc[p][pos]||0)+1;});});
  const rep=[];att.forEach(p=>POS.forEach(pos=>{if((gpc[p]?.[pos]||0)>1)rep.push(`${p} → ${pos}`);}));
  if(rep.length)al.push({t:'a-warn',msg:'Position repeats this game: '+rep.join(', ')});
  const _alertSlotMins=getSlotMins(rpq);
  const mins={};att.forEach(p=>{let m=0;rots.forEach((rot,ri)=>{if(rot&&rot.includes(p))m+=_alertSlotMins[ri%rpq];});mins[p]=m;});
  const lo=Math.min(...Object.values(mins)),hi=Math.max(...Object.values(mins));
  if(hi-lo<=5)al.push({t:'a-ok',msg:`Playing time balanced: ${lo}–${hi} min per player.`});
  else if(hi-lo>10)al.push({t:'a-warn',msg:`Playing time spread: ${lo}–${hi} min. Check distribution.`});
  showAlerts(al);
}
function showAlerts(al){
  document.getElementById('alertBox').innerHTML=al.map(a=>`<div class="alert ${a.t}"><span>${a.t==='a-ok'?'✓':'⚠'}</span><span>${a.msg}</span></div>`).join('');
}

// ── Nav ────────────────────────────────
function prevG(){const gs=getGames(),i=gs.findIndex(g=>g.id===S.gid);if(i>0){S.gid=gs[i-1].id;renderPlan();}}
function nextG(){const gs=getGames(),i=gs.findIndex(g=>g.id===S.gid);if(i>=0&&i<gs.length-1){S.gid=gs[i+1].id;renderPlan();}}
function goToGame(id){S.gid=id;S.games[String(id)]=S.games[String(id)]||{};nav('plan');}
function navPlanTab(tabEl){
  const next=nextGameId();
  if(next){S.gid=next;S.games[String(next)]=S.games[String(next)]||{};}
  nav('plan',tabEl);
}
function nav(name,tabEl){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  document.getElementById('page-'+name).classList.add('on');
  if(tabEl)tabEl.classList.add('on');
  else{const byId=document.getElementById('tab'+name.charAt(0).toUpperCase()+name.slice(1));if(byId){byId.classList.add('on');}else document.querySelectorAll('.tab').forEach(t=>{if(t.getAttribute('onclick')?.includes("'"+name+"'"))t.classList.add('on');});}
  if(name==='plan')renderPlan();
  if(name==='season')renderSeason();
  if(name==='print'){populatePrintSel();renderPrint();}
  if(name==='schedule')renderSchedule();
  if(name==='settings')renderSettings();
}

// ══════════════════════════════════════
// SEASON PAGE
// ══════════════════════════════════════
function renderSeason(){
  const dc=Object.values(S.games).filter(g=>g.done).length;
  let wins=0,losses=0,ties=0;
  Object.values(S.games).forEach(gd=>{if(gd.done&&gd.score){const[u,t]=gd.score;if(u>t)wins++;else if(t>u)losses++;else ties++;}});
  const _tod=new Date();_tod.setHours(0,0,0,0);
  const upcoming=getGames().filter(g=>!S.games[String(g.id)]?.done&&(parseISO(g.date)||_tod)>=_tod);
  const g1=upcoming[0]||null,g2=upcoming[1]||null;
  function gameBlock(g,label){
    if(!g)return`<div style="min-width:160px"><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">${label}</div><div style="font-size:16px;font-weight:400;color:var(--text-secondary);margin-top:4px">—</div></div>`;
    const vs=g.home?`vs ${g.opp}`:`@ ${g.opp}`;
    return`<div style="min-width:160px">
      <div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">${label}</div>
      <div style="font-size:20px;font-weight:600;font-family:var(--font-mono);line-height:1.2;margin-top:2px">${g.dateStr}</div>
      <div style="font-size:13px;font-weight:400;color:var(--text-secondary);margin-top:1px">${g.time} &nbsp;·&nbsp; ${sanitize(vs)}</div>
    </div>`;
  }
  document.getElementById('seasonSum').innerHTML=`
    <div style="min-width:140px;padding-right:24px;margin-right:8px;border-right:1px solid var(--grey-200)">
      <div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">Record</div>
      <div style="font-size:34px;font-weight:700;font-family:var(--font-mono);letter-spacing:.04em;line-height:1.1">${wins}–${losses}–${ties}</div>
      <div class="xs muted">W – L – T</div>
    </div>
    <div style="min-width:100px"><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">Games Played</div><div style="font-size:28px;font-weight:500;font-family:var(--font-mono)">${dc}/${getGames().length}</div></div>
    ${gameBlock(g1,"This Week's Game")}
    ${gameBlock(g2,"Next Week's Game")}`;
  const allM=S.roster.map(p=>S.ps[p]?.min||0),loM=Math.min(...allM),hiM=Math.max(...allM);
  const sal=[];
  if(hiM-loM>15){const beh=S.roster.filter(p=>(S.ps[p]?.min||0)===loM).join(', ');sal.push({t:'a-warn',msg:`${beh} ha${beh.includes(',')?'ve':'s'} the fewest minutes (${loM}). Will be prioritized in upcoming rotations.`});}
  document.getElementById('statsAlerts').innerHTML=sal.map(a=>`<div class="alert ${a.t}"><span>⚠</span><span>${a.msg}</span></div>`).join('');
  const cc=capCounts();
  document.getElementById('statsBody').innerHTML=S.roster.map(p=>{
    const st=S.ps[p]||blankStats();
    const avg=st.gp?(st.min/st.gp).toFixed(1):'—';
    const pv=POS.map(pos=>st.pos[pos]||0);const maxP=Math.max(...pv);
    const pips=POS.map((pos,i)=>{const v=pv[i];const ov=dc>1&&v>0&&v>=maxP&&maxP>2;return`<span class="pip ${PPIP[pos]} ${ov?'hi':''}" title="${pos}: ${v}">${v}</span>`;}).join('');
    const mc=cc[p]||0;
    return`<tr><td>${p}</td><td>${st.gp}</td>
      <td><span class="badge ${st.min<dc*15?'badge-red':st.min<dc*18?'badge-warn':'badge-green'}">${st.min} min</span></td>
      <td>${avg}</td><td>${pv[0]}</td><td>${pv[1]}</td><td>${pv[2]}</td><td>${pv[3]}</td>
      <td><span class="badge ${mc>=3?'badge-warn':'badge-green'}">${mc}×</span></td>
      <td><div class="pips">${pips}</div></td></tr>`;
  }).join('');
  const maxM=Math.max(...allM,1);
  document.getElementById('equityBars').innerHTML=S.roster.map((p,i)=>{const m=allM[i];return`
    <div class="eq-row"><div class="eq-name">${p}</div>
      <div class="eq-track"><div class="eq-fill" style="width:${(m/maxM*100).toFixed(1)}%"></div></div>
      <div class="eq-val">${m} min</div>
    </div>`;}).join('');
  document.getElementById('capSeason').innerHTML=S.roster.map(p=>{const c=capCounts()[p]||0;return`
    <div class="cap-cell"><div class="cn">${p}</div><div class="cc">${c}× cap</div></div>`;}).join('');
}

// ══════════════════════════════════════
// PRINT PAGE — spreadsheet grid, B&W
// ══════════════════════════════════════
function populatePrintSel(){
  const sel=document.getElementById('printSel'),cur=sel.value;
  sel.innerHTML='<option value="">Choose…</option>'+getGames().map(g=>{
    const has=!!S.games[String(g.id)]?.rots;
    return`<option value="${g.id}" ${cur==g.id?'selected':''} ${!has?'disabled':''}>Game ${g.num} — ${g.dateStr} ${g.home?'vs':'@'} ${sanitize(g.opp)}${has?'':' (no rotation)'}</option>`;
  }).join('');
}

function renderPrint(){
  const sel=document.getElementById('printSel'),gid=parseInt(sel.value);
  const phoneBtn=document.getElementById('phoneViewBtn');
  if(!gid){if(phoneBtn)phoneBtn.style.display='none';return;}
  const g=getGame(gid),gd=S.games[String(gid)];
  if(!g||!gd?.rots){if(phoneBtn)phoneBtn.style.display='none';document.getElementById('printArea').innerHTML='<div class="muted sm" style="padding:24px 0">No rotation for this game yet.</div>';return;}
  if(phoneBtn)phoneBtn.style.display='';
  const rots=gd.rots,rpq=gd.rpq||2,att=getAtt(gid),caps=gd.caps||[];
  const jersey=sanitize(jerseyName(g).toUpperCase());
  const vs=sanitize(g.home?`HOME vs ${g.opp}`:`AWAY @ ${g.opp}`);
  const QN=['Q1','Q2','Q3','Q4'];
  const totalCols=4*rpq;

  function buildCopy(){
    const cfg=getCfg();
    // Header
    let h=`<div class="print-copy-card">
      <div class="pc-header">
        <div class="pc-title">${cfg.emoji} ${sanitize(cfg.teamName).toUpperCase()} &nbsp;·&nbsp; Game ${g.num} &nbsp;·&nbsp; ${g.dateStr}</div>
        <div class="pc-meta">${vs} &nbsp;·&nbsp; ${sanitize(g.loc)} ${sanitize(g.field)} &nbsp;·&nbsp; Arrive: ${g.arrive} &nbsp;·&nbsp; Kickoff: ${g.time} &nbsp;·&nbsp; Jersey: <strong>${jersey}</strong></div>`;
    if(caps.length)h+=`<div class="pc-meta">Captains: <strong>${caps.join(' & ')}</strong></div>`;
    if(gd.done&&gd.score){
      h+=`<div class="pc-meta">Final Score: <strong>${sanitize(cfg.teamName)} ${gd.score[0]} – ${sanitize(g.opp)} ${gd.score[1]}</strong></div>`;
    }else{
      h+=`<div class="pc-meta">Score: ${sanitize(cfg.teamName)} <span style="display:inline-block;min-width:24px;height:14px;border:1.5px solid #555;margin:0 3px;vertical-align:middle"></span> – ${sanitize(g.opp)} <span style="display:inline-block;min-width:24px;height:14px;border:1.5px solid #555;margin:0 3px;vertical-align:middle"></span></div>`;
    }
    h+=`</div>`;

    // Table — q-start class marks first column of each quarter for thick left border
    h+=`<table class="pc-table"><thead><tr><th>Position</th>`;
    for(let q=0;q<4;q++){
      for(let r=0;r<rpq;r++){
        const{mS:_mS,mE:_mE}=getSlotTimes(rpq)[r];
        const qStart=(r===0)?'q-start':'';
        h+=`<th class="${qStart}">${QN[q]}<br><span style="font-weight:400">${fmtMin(_mS)} – ${fmtMin(_mE)}</span></th>`;
      }
    }
    h+=`</tr></thead><tbody>`;
    POS.forEach((pos,pi)=>{
      h+=`<tr><td>${PLBL[pos]}</td>`;
      for(let q=0;q<4;q++){for(let r=0;r<rpq;r++){
        const ri=q*rpq+r,rot=rots[ri]||[],qStart=(r===0)?'q-start':'';
        h+=`<td class="player-name ${qStart}">${rot[pi]||'—'}</td>`;
      }}
      h+=`</tr>`;
    });
    // Out row
    h+=`<tr class="out-row"><td>Out</td>`;
    for(let q=0;q<4;q++){for(let r=0;r<rpq;r++){
      const ri=q*rpq+r,rot=rots[ri]||[],out=att.filter(p=>!rot.includes(p));
      const qStart=(r===0)?'q-start':'';
      let outHtml='—';
      if(out.length){const pairs=[];for(let i=0;i<out.length;i+=2)pairs.push(out.slice(i,i+2).join(', '));outHtml=pairs.join('<br>');}
      h+=`<td class="${qStart}">${outHtml}</td>`;
    }}
    h+=`</tr></tbody></table></div>`;
    return h;
  }

  document.getElementById('printArea').innerHTML=`
    <div class="print-copies" style="display:grid;gap:16px">${buildCopy()}${buildCopy()}${buildCopy()}</div>`;
}

function openPhoneView(){
  const sel=document.getElementById('printSel'),gid=parseInt(sel.value);if(!gid)return;
  const g=getGame(gid),gd=S.games[String(gid)];if(!g||!gd?.rots)return;
  const rots=gd.rots,rpq=gd.rpq||2,att=getAtt(gid),caps=gd.caps||[];
  const jersey=sanitize(jerseyName(g).toUpperCase());
  const vs=sanitize(g.home?`HOME vs ${g.opp}`:`AWAY @ ${g.opp}`);
  const QN=['Q1','Q2','Q3','Q4'];
  const cfg=getCfg();
  let h=`<div style="font-family:Arial,sans-serif;max-width:440px;margin:0 auto;padding:8px">`;
  h+=`<div style="border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px">
    <div style="font-size:15px;font-weight:700">${cfg.emoji} ${sanitize(cfg.teamName).toUpperCase()} · Game ${g.num} · ${g.dateStr}</div>
    <div style="font-size:12px;color:#444;margin-top:2px">${vs} · ${sanitize(g.loc)}${g.field?' · '+sanitize(g.field):''}</div>
    <div style="font-size:12px;color:#444">Arrive ${g.arrive} · Kickoff ${g.time} · Jersey: <strong>${jersey}</strong></div>
    ${caps.length?`<div style="font-size:12px;color:#444">Captains: <strong>${caps.join(' & ')}</strong></div>`:''}
  </div>`;
  for(let q=0;q<4;q++){
    h+=`<div style="margin-bottom:14px">
      <div style="font-weight:800;font-size:12px;background:#111;color:#fff;padding:4px 8px;margin-bottom:4px;letter-spacing:0.06em">${QN[q]}</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr><th style="text-align:left;padding:4px 6px;background:#e8e8e8;border:1px solid #aaa;font-size:10px">POS</th>`;
    for(let r=0;r<rpq;r++){
      const{mS:_pmS,mE:_pmE}=getSlotTimes(rpq)[r];
      h+=`<th style="padding:4px 6px;background:#e8e8e8;border:1px solid #aaa;text-align:center;font-size:10px">${fmtMin(_pmS)}–${fmtMin(_pmE)} min</th>`;
    }
    h+=`</tr></thead><tbody>`;
    POS.forEach((pos,pi)=>{
      h+=`<tr><td style="padding:4px 6px;border:1px solid #aaa;font-weight:700;font-size:9px;text-transform:uppercase;background:#f4f4f4;white-space:nowrap">${PLBL[pos]}</td>`;
      for(let r=0;r<rpq;r++){
        const ri=q*rpq+r,rot=rots[ri]||[];
        h+=`<td style="padding:4px 6px;border:1px solid #aaa;text-align:center;font-weight:600;font-size:13px">${rot[pi]||'—'}</td>`;
      }
      h+=`</tr>`;
    });
    h+=`<tr><td style="padding:4px 6px;border:1px solid #aaa;font-weight:700;font-size:9px;text-transform:uppercase;background:#f4f4f4;color:#666;font-style:italic">Out</td>`;
    for(let r=0;r<rpq;r++){
      const ri=q*rpq+r,rot=rots[ri]||[],out=att.filter(p=>!rot.includes(p));
      h+=`<td style="padding:4px 6px;border:1px solid #aaa;text-align:center;color:#666;font-style:italic;font-size:11px">${out.join(', ')||'—'}</td>`;
    }
    h+=`</tr></tbody></table></div>`;
  }
  h+=`</div>`;
  document.getElementById('phoneViewContent').innerHTML=h;
  document.getElementById('phoneOverlay').classList.add('open');
}
function closePhoneView(){document.getElementById('phoneOverlay').classList.remove('open');}

// ══════════════════════════════════════
// SCHEDULE PAGE
// ══════════════════════════════════════
function renderSchedule(){
  const gs=getGames(),grid=document.getElementById('schedGrid');
  if(!gs.length){
    grid.innerHTML=`<div style="grid-column:1/-1;background:#fff;padding:32px 24px;text-align:center" class="sm muted">No games on the schedule yet. Add them under <a href="#" onclick="nav('settings');return false">Settings → Schedule</a>.</div>`;
    return;
  }
  const nid=gs.find(g=>!S.games[String(g.id)]?.done)?.id;
  grid.innerHTML=gs.map(g=>{
    const gd=S.games[String(g.id)]||{},done=!!gd.done,isN=g.id===nid;
    const jHex=jerseyHex(g),jLabel=`${jerseyName(g)} — ${g.home?'Home':'Away'}`;
    const vs=g.home?`Home vs ${g.opp}`:`Away @ ${g.opp}`;
    return`<div class="sc ${done?'done':isN?'next':''}" onclick="goToGame(${g.id})">
      <div class="gnum">Game ${g.num}</div>
      <div class="gdate">${g.dateStr}</div>
      <div class="gtime">${g.time}</div>
      <div class="gvs">${sanitize(vs)}</div>
      <div class="gloc">${sanitize(g.loc)}${g.field?' · '+sanitize(g.field):''}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <span style="width:10px;height:10px;border-radius:50%;background:${jHex};display:inline-block;flex-shrink:0"></span>
        <span style="font-size:12px;font-weight:500;color:${jHex}">${sanitize(jLabel)}</span>
      </div>
      <div class="gstatus ${done?'std':isN?'stn':'stu'}">${done?'Done':isN?'Up Next':'Upcoming'}</div>
      ${gd.rots?`<div style="font-size:11px;color:var(--green);margin-top:6px">✓ Rotation${gd.locked?' 🔒':''}</div>`:''}
      ${gd.score&&done?`<div class="mono xs muted" style="margin-top:4px">${gd.score[0]}–${gd.score[1]}</div>`:''}
    </div>`;
  }).join('');
}

// ══════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════
let _rosterLocked=true;
let _teamLocked=true;

function renderRoster(){
  document.getElementById('rosterList').innerHTML=
    `<div class="roster-chips">`+
    S.roster.map(p=>`<div class="roster-chip">${p}${_rosterLocked?'':'<button onclick="removePlayer(\''+p+'\')">✕</button>'}</div>`).join('')+
    `</div>`;
}
function addPlayer(){
  const i=document.getElementById('newName'),n=i.value.trim();
  if(!n||S.roster.includes(n))return;
  if(!/^[A-Za-z][A-Za-z\s\-\.]*$/.test(n)){alert('Names may only contain letters, spaces, hyphens, and periods.');return;}
  S.roster.push(n);
  if(!S.ps[n])S.ps[n]=blankStats();
  i.value='';save();renderRoster();renderTiers();
}
function removePlayer(name){
  if(!confirm(`Remove ${name}? Their stats will remain on the Season Stats page but they won't appear in future rotations.`))return;
  S.roster=S.roster.filter(p=>p!==name);
  const c=getCfg();
  S.cfg.tierTop=(c.tierTop||[]).filter(p=>p!==name);S.cfg.tierBot=(c.tierBot||[]).filter(p=>p!==name);
  save();renderRoster();renderTiers();
}
function toggleRosterLock(){_rosterLocked=!_rosterLocked;renderSettings();}
function toggleTeamLock(){_teamLocked=!_teamLocked;renderSettings();}
function toggleTierLock(){_tierLocked=!_tierLocked;renderSettings();}
function toggleSchedLock(){_schedLocked=!_schedLocked;_schedEditId=null;renderSettings();}
let _tierLocked=true,_schedLocked=true,_schedEditId=null;

// ── Skill tiers ─────────────────────────
function tierOf(p){const t=getTiers();return t.top.includes(p)?'top':t.bot.includes(p)?'bot':'mid';}
function setTier(p,tier){
  const c=getCfg();
  S.cfg.tierTop=(c.tierTop||[]).filter(x=>x!==p);S.cfg.tierBot=(c.tierBot||[]).filter(x=>x!==p);
  if(tier==='top')S.cfg.tierTop.push(p);else if(tier==='bot')S.cfg.tierBot.push(p);
  save();renderTiers();
}
function renderTiers(){
  const el=document.getElementById('tierArea');if(!el)return;
  const t=getTiers();
  const lb=document.getElementById('tierLockBtn');
  if(lb){lb.textContent=_tierLocked?'🔒 Locked':'🔓 Unlocked';lb.className='btn btn-sm '+(_tierLocked?'btn-lock-on':'btn-lock-off');}
  if(_tierLocked){
    const grp=(label,list)=>`<div><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">${label}</div><div style="font-size:14px;font-weight:500;margin-top:2px">${list.length?list.map(sanitize).join(', '):'—'}</div></div>`;
    el.innerHTML=`<div class="flex gap16 wrap" style="margin-top:8px">${grp('Top',t.top)}${grp('Middle',S.roster.filter(p=>tierOf(p)==='mid'))}${grp('Bottom',t.bot)}</div>`;
    return;
  }
  el.innerHTML=`<div class="tier-grid" style="margin-top:8px">`+S.roster.map(p=>{
    const cur=tierOf(p);
    return`<div class="tier-row"><span class="tier-name">${sanitize(p)}</span>
      <select onchange="setTier('${sanitize(p)}',this.value)">
        <option value="top" ${cur==='top'?'selected':''}>Top</option>
        <option value="mid" ${cur==='mid'?'selected':''}>Middle</option>
        <option value="bot" ${cur==='bot'?'selected':''}>Bottom</option>
      </select></div>`;
  }).join('')+`</div>`;
}

// ── Schedule editor ──────────────────────
function renderScheduleEditor(){
  const list=document.getElementById('schedList'),form=document.getElementById('schedEditArea');if(!list||!form)return;
  const lb=document.getElementById('schedLockBtn');
  if(lb){lb.textContent=_schedLocked?'🔒 Locked':'🔓 Unlocked';lb.className='btn btn-sm '+(_schedLocked?'btn-lock-on':'btn-lock-off');}
  const gs=getGames();
  list.innerHTML=gs.length?`<div style="overflow-x:auto;margin-top:8px"><table class="stats-tbl sched-tbl"><thead><tr><th>#</th><th>Date</th><th>Kickoff</th><th>Arrive</th><th>H/A</th><th>Opponent</th><th>Location</th><th>Field</th>${_schedLocked?'':'<th></th>'}</tr></thead><tbody>`+
    gs.map(g=>`<tr class="${_schedEditId===g.id?'editing':''}"><td>${g.num}</td><td class="mono">${g.dateStr}</td><td>${g.time}</td><td>${g.arrive}</td><td>${g.home?'Home':'Away'}</td><td>${sanitize(g.opp)}</td><td>${sanitize(g.loc)}</td><td>${sanitize(g.field)}</td>`+
      (_schedLocked?'':`<td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" onclick="editGame(${g.id})">Edit</button> <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="deleteGame(${g.id})">✕</button></td>`)+`</tr>`).join('')+
    `</tbody></table></div>`
    :`<div class="sm muted" style="margin-top:8px">No games yet.${_schedLocked?' Unlock to add the season schedule.':''}</div>`;
  form.style.display=_schedLocked?'none':'';
  if(_schedLocked)return;
  const g=_schedEditId!=null?(S.schedule||[]).find(x=>x.id===_schedEditId):null;
  document.getElementById('schedFormTitle').textContent=g?`Editing Game ${gameNum(g.id)}`:'Add a game';
  document.getElementById('gDate').value=g?.date||'';
  document.getElementById('gTime').value=g?.time24||'';
  document.getElementById('gArrive').value=(g&&g.arriveMin!=null)?g.arriveMin:30;
  document.getElementById('gHome').value=g?(g.home?'home':'away'):'home';
  document.getElementById('gOpp').value=g?.opp||'';
  document.getElementById('gLoc').value=g?.loc||(gs.length?gs[gs.length-1].loc:'');
  document.getElementById('gField').value=g?.field||'';
  document.getElementById('gSaveBtn').textContent=g?'Save Changes':'+ Add Game';
  document.getElementById('gCancelBtn').style.display=g?'':'none';
}
function editGame(id){_schedEditId=id;renderScheduleEditor();document.getElementById('schedEditArea').scrollIntoView({behavior:'smooth',block:'nearest'});}
function cancelEditGame(){_schedEditId=null;renderScheduleEditor();}
function saveGameForm(){
  const date=document.getElementById('gDate').value,time24=document.getElementById('gTime').value;
  if(!date){alert('Pick a date for the game.');return;}
  const arriveMin=Math.max(0,parseInt(document.getElementById('gArrive').value,10)||0);
  const entry={date,time24,arriveMin,home:document.getElementById('gHome').value==='home',
    opp:document.getElementById('gOpp').value.trim(),loc:document.getElementById('gLoc').value.trim(),field:document.getElementById('gField').value.trim()};
  S.schedule=S.schedule||[];
  if(_schedEditId!=null){
    const g=S.schedule.find(x=>x.id===_schedEditId);if(g)Object.assign(g,entry);
  }else{
    const id=S.schedule.reduce((m,g)=>Math.max(m,g.id||0),0)+1;
    S.schedule.push({id,...entry});
    if(!S.gid)S.gid=id;
  }
  _schedEditId=null;
  save();renderScheduleEditor();renderSchedule();showToast('Schedule saved.');
}
function deleteGame(id){
  const gd=S.games[String(id)];
  const hasData=!!(gd&&(gd.rots||gd.done||gd.att||gd.caps));
  const g=getGame(id);
  if(!confirm(`Remove Game ${g?g.num:id}${g?` (${g.dateStr} ${g.home?'vs':'@'} ${g.opp})`:''}?`+(hasData?'\n\nThis game has a rotation, attendance or a result recorded. Removing it deletes those too (season stat totals already recorded are not reversed).':'')))return;
  S.schedule=(S.schedule||[]).filter(x=>x.id!==id);
  delete S.games[String(id)];
  S.capLog=(S.capLog||[]).filter(x=>x.gid!==id);
  if(S.gid===id)S.gid=nextGameId();
  if(_schedEditId===id)_schedEditId=null;
  save();renderScheduleEditor();renderSchedule();
}

function renderSettings(){
  const cfg=getCfg();

  // Roster, tiers, schedule
  renderRoster();renderTiers();renderScheduleEditor();
  const rlb=document.getElementById('rosterLockBtn');
  const rea=document.getElementById('rosterEditArea');
  if(rlb){rlb.textContent=_rosterLocked?'🔒 Locked':'🔓 Unlocked';rlb.className='btn btn-sm '+(_rosterLocked?'btn-lock-on':'btn-lock-off');}
  if(rea)rea.style.display=_rosterLocked?'none':'';

  // Team Details section
  const tlb=document.getElementById('teamLockBtn');
  const tea=document.getElementById('teamEditArea');
  const tra=document.getElementById('teamReadArea');
  if(tlb){tlb.textContent=_teamLocked?'🔒 Locked':'🔓 Unlocked';tlb.className='btn btn-sm '+(_teamLocked?'btn-lock-on':'btn-lock-off');}
  if(_teamLocked){
    if(tea)tea.style.display='none';
    if(tra)tra.innerHTML=`
      <div class="flex gap16 wrap" style="margin-top:8px">
        <div><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">Team Name</div><div style="font-size:14px;font-weight:500;margin-top:2px">${sanitize(cfg.teamName)}</div></div>
        <div><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">Team Code</div><div style="font-size:14px;font-weight:500;margin-top:2px">${sanitize(cfg.teamCode)}</div></div>
        <div><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">Location</div><div style="font-size:14px;font-weight:500;margin-top:2px">${sanitize(cfg.teamLoc)}</div></div>
        <div><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">Season</div><div style="font-size:14px;font-weight:500;margin-top:2px">${sanitize(cfg.season)}</div></div>
        <div><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">Age Group</div><div style="font-size:14px;font-weight:500;margin-top:2px">${sanitize(cfg.ageGroup)}</div></div>
        <div><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">Home Jersey</div><div style="font-size:14px;font-weight:500;margin-top:2px">${sanitize(cfg.homeJersey)}</div></div>
        <div><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">Away Jersey</div><div style="font-size:14px;font-weight:500;margin-top:2px">${sanitize(cfg.awayJersey)}</div></div>
        <div><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">Coach (email sign-off)</div><div style="font-size:14px;font-weight:500;margin-top:2px">${sanitize(cfg.coachName)}</div></div>
        <div><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:500">Icon</div><div style="font-size:14px;font-weight:500;margin-top:2px">${sanitize(cfg.emoji)}</div></div>
      </div>`;
  }else{
    if(tea){
      tea.style.display='';
      document.getElementById('cfgTeamName').value=cfg.teamName;
      document.getElementById('cfgTeamCode').value=cfg.teamCode;
      document.getElementById('cfgTeamLoc').value=cfg.teamLoc;
      document.getElementById('cfgSeason').value=cfg.season;
      document.getElementById('cfgAgeGroup').value=cfg.ageGroup;
      document.getElementById('cfgHomeJersey').value=cfg.homeJersey;
      document.getElementById('cfgAwayJersey').value=cfg.awayJersey;
      document.getElementById('cfgCoachName').value=cfg.coachName;
      document.getElementById('cfgEmoji').value=cfg.emoji;
    }
    if(tra)tra.innerHTML='';
  }

  updateSyncMsg();
}
function saveTeamCfg(){
  const n=document.getElementById('cfgTeamName').value.trim();
  const c=document.getElementById('cfgTeamCode').value.trim();
  const l=document.getElementById('cfgTeamLoc').value.trim();
  const s=document.getElementById('cfgSeason').value.trim();
  const v=id=>document.getElementById(id).value.trim();
  S.cfg={...S.cfg,
    teamName:n||CFG_DEFAULTS.teamName,
    teamCode:c,teamLoc:l,season:s,
    ageGroup:v('cfgAgeGroup'),homeJersey:v('cfgHomeJersey')||'Gray',awayJersey:v('cfgAwayJersey')||'Blue',
    coachName:v('cfgCoachName')||CFG_DEFAULTS.coachName,emoji:[...v('cfgEmoji')].slice(0,2).join('')||CFG_DEFAULTS.emoji
  };
  _teamLocked=true;
  save();renderHeader();renderSettings();renderSchedule();showToast('Team details saved.');
}

// ══════════════════════════════════════
// DATA
// ══════════════════════════════════════
function exportData(){
  const b=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download=`${getCfg().teamName.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${new Date().toISOString().slice(0,10)}.json`;a.click();
}
function importData(){
  const i=document.createElement('input');i.type='file';i.accept='.json';
  i.onchange=e=>{const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(!d||!Array.isArray(d.roster))throw 0;if(confirm(`Replace all data for this team (${TEAM_SLUG}) with the imported file?`)){S=migrate(d);save();location.reload();}}catch(e){alert('Invalid JSON');}};r.readAsText(e.target.files[0]);};i.click();
}
function resetAll(){
  const hasToken=!!getToken();
  const msg='RESET ALL DATA\n\nThis will permanently erase:\n  • All game rotations and scores\n  • All season stats and captain history\n  • Your roster\n\n'
    +(hasToken
      ?'Your coach token is active, so cloud data on Cloudflare will also be wiped.\n\n'
      :'No coach token is saved, so only your local browser data will be cleared — cloud data will remain.\n\n')
    +'This cannot be undone. Are you sure?';
  if(confirm(msg)){localStorage.removeItem(STORAGE_KEY);S=fresh();save();location.reload();}
}
// Keep roster, team details and tiers; clear games, schedule, stats and captain history.
function startNewSeason(){
  const msg='START NEW SEASON\n\nKeeps:\n  • Roster\n  • Team details and skill tiers\n\nClears:\n  • Schedule\n  • All game rotations and scores\n  • Season stats and captain history\n\n'
    +'Export a JSON backup first if you want to keep this season\'s history. Continue?';
  if(!confirm(msg))return;
  const season=prompt('Name for the new season (shown in the header):',getCfg().season||'')||'';
  const ps={};S.roster.forEach(p=>ps[p]=blankStats());
  S={roster:[...S.roster],ps,cfg:{...S.cfg,season:season.trim()||S.cfg.season},schedule:[],capLog:[],games:{},gid:null};
  save();location.reload();
}
function resetGamePlan(){
  const gd=S.games[String(S.gid)];
  const isDone=!!(gd&&gd.done);
  if(isDone){
    const ok=confirm(
      "Warning: Game " + S.gid + " has already been marked done.\n\n" +
      "What WILL be removed:\n" +
      "  • The rotation plan\n" +
      "  • The final score\n" +
      "  • The captain assignment\n\n" +
      "What will NOT change:\n" +
      "  • Each player\'s minute totals on the Season Stats page\n" +
      "  • Each player\'s position counts (FWD, Mid-P, Mid-C, DEF)\n" +
      "  • Each player\'s games-played count\n\n" +
      "Those stats were written when you hit \"Mark Game Done\" and are not reversed here. " +
      "If you need to correct them, use the Season Stats page or re-export/edit your JSON backup.\n\n" +
      "Reset anyway?"
    );
    if(!ok)return;
  }else{
    const ok=confirm("Reset Game " + S.gid + " plan?\n\nThis will clear the rotation, attendance, captains, and lock state. No season stats are affected since this game was never marked done.");
    if(!ok)return;
  }
  if(gd){
    delete gd.rots;
    delete gd.rpq;
    delete gd._seed;
    delete gd.locked;
    delete gd.caps;
    delete gd.score;
    delete gd.done;
  }
  S.capLog=S.capLog.filter(x=>x.gid!==S.gid);
  _capPickerSelection=null;_capPickerSuggested=null;
  save();renderPlan();
}

// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════
document.getElementById('app').innerHTML=APP_HTML;
if(!S.gid||!getGame(S.gid))S.gid=nextGameId();
renderHeader();
renderSchedule();
syncFromCloud(); // pull latest data from cloud; re-renders if cloud is newer

// ── Print auto-scale: fit all 3 slips on one page ──
window.addEventListener('beforeprint',()=>{
  const el=document.querySelector('#printArea .print-copies');
  if(!el)return;
  el.style.zoom='';
  // Letter paper 11in - 0.5in margins = 10.5in = 1008px at 96dpi
  const target=1000;
  const h=el.offsetHeight;
  if(h>target){el.style.zoom=String((target/h).toFixed(3));}
});
window.addEventListener('afterprint',()=>{
  const el=document.querySelector('#printArea .print-copies');
  if(el)el.style.zoom='';
});
