
import React,{useEffect,useMemo,useRef,useState}from'react';
import{createRoot}from'react-dom/client';
import'./styles.css';

const APP_VERSION='v100h59b';

// ── REPRESENTATIVE LEARNING DESIGN (RLD) SYSTEM ──────────────────────────────
const RLD_LEVELS=[
  {level:0,label:'Foundation',short:'RLD 0',desc:'Perceptual and movement foundations. Simplified environment, reduced uncertainty.',color:'#6b7280',bg:'#111827',textColor:'#9ca3af'},
  {level:1,label:'Coach Controlled',short:'RLD 1',desc:'Coach calls every target, task or decision. Player solves the coach\'s problem.',color:'#ef4444',bg:'#450a0a',textColor:'#fca5a5'},
  {level:2,label:'Player Choice',short:'RLD 2',desc:'Player selects own sequence or task. Early autonomous decision making.',color:'#f97316',bg:'#431407',textColor:'#fdba74'},
  {level:3,label:'Interactive',short:'RLD 3',desc:'Leader-follower interaction. Behaviour emerges through continuous adaptation.',color:'#eab308',bg:'#422006',textColor:'#fde047'},
  {level:4,label:'Pressure & Consequence',short:'RLD 4',desc:'Scoring pressure active. Risk-reward decisions and tactical choices emerge.',color:'#86efac',bg:'#052e16',textColor:'#86efac'},
  {level:5,label:'Competitive Practice',short:'RLD 5',desc:'Competitive representative practice. High uncertainty, tactical adaptation, competitive intent.',color:'#4ade80',bg:'#052e16',textColor:'#4ade80'},
  {level:6,label:'Match Play',short:'RLD 6',desc:'Competition itself. Maximum uncertainty, consequence, emotional pressure and opponent adaptation.',color:'#15803d',bg:'#052e16',textColor:'#4ade80',doubleDot:true},
];

function RLDBadge({level,size='sm'}){
  const r=RLD_LEVELS.find(x=>x.level===level)||RLD_LEVELS[0];
  if(size==='lg') return <div className="rldBadgeLg" style={{background:r.bg,borderColor:r.color}}>
    <span className="rldDot" style={{background:r.color}}>{r.doubleDot&&<><span className="rldInnerDot"/><span className="rldInnerDot"/></>}</span>
    <div><strong style={{color:r.textColor}}>{r.short} — {r.label}</strong><p style={{color:r.textColor}}>{r.desc}</p></div>
  </div>;
  return <span className="rldBadgeSm" style={{background:r.bg,borderColor:r.color,color:r.textColor}}>
    <span className="rldDotSm" style={{background:r.color}}>{r.doubleDot&&<><span className="rldInnerDotSm"/><span className="rldInnerDotSm"/></>}</span>
    {r.short}
  </span>;
}
// ─────────────────────────────────────────────────────────────────────────────
const TEAM_NAMING_STANDARD="Max's Team"; // universal setup/projection naming standard
const UNIVERSAL_DB_OPTIONS=['No DB','1 DB','2 DB','3 DB','4 DB','5 DB','Unlimited DB'];
const INVASION_UI_STATE_KEY='checkerboardInvasionUiState';
const COMPETITION_STATE_KEY='checkerboardCompetitionStateV100h43';

const PLAYER_KEY='checkerboard_master_v54_players';
const SESSION_KEY='checkerboard_master_v54_session';
const GAME_LIBRARY_KEY='checkerboard_master_v60_games';
const DB_HANDICAP_KEY='checkerboard_universal_db_handicap_v97';
const INFO_ANTICIPATION_KEY='checkerboard_info_anticipation_v92';
const GAME_LIBRARY_DRAFT_KEY='checkerboard_master_v89_logic_draft';
const GAME_LIBRARY_ATL_DRAFT_KEY='checkerboard_master_v90_atl_draft';
const GAME_LIBRARY_CLASS_KEY='checkerboard_master_v89_active_class';

const LEVELS=[
{label:'Bronze',level:1},{label:'Silver',level:2},{label:'Gold / Elite',level:3},{label:'Performance',level:4},{label:'Professional',level:5}
];



const ANIMAL_PAIRINGS=[
{name:'Eagle + Golden Retriever',theme:'Awareness Under Distraction'},
{name:'Eagle + Wolf',theme:'Observe and Stay Disciplined'},
{name:'Lion + Eagle',theme:'Recognise and Commit'},
{name:'Cat + Eagle',theme:'Patience and Recognition'},
{name:'Owl + Dolphin',theme:'Adapt and Create'},
{name:'Cheetah + Eagle',theme:'See Early, Move Early'},
{name:'Elephant + Golden Retriever',theme:'Calm Resilience'}
];

const ALL_LAYERS=['Clean Winner','Opponent Off T','T Challenge','Blind Finish','Volley Finish','Weak Side','4-Shot Window','2-Shot Window','Double Bounce','DB Handicap','Quality Length Before Attack','Quiet Eye','Opponent Information','Early Cue Search','DB Handicap'];
const CB_CODES=['None','[6-3]','[7-3]','[5-4]','[8-4]','[6-4]','[8-1]','[5-3]','[7-2]','[6-4] + [8-1]','[5-3] + [7-2]','[6-3] + [8-1]','[5-4] + [7-2]'];

const ATL_LISTS={
btlCount:['0 BTL shots','1 BTL shot','2 BTL shots','3 BTL shots'],
side:['Both sides','Right side only','Left side only'],
consecutive:['No','Yes'],
shotChoice:['Any shot','Straight drop','Crosscourt drop','Boast','Drive','Kill'],
method:['Players choice','Must be volley','No volley'],
cbRef:['None','[8-1]','[7-2]','[6-4]','[5-3]','[5-4]','[6-3]']
};

const DEFAULT_ATL={btlCount:'0 BTL shots',side:'Both sides',consecutive:'No',shot1:'Any shot',shot2:'Any shot',shot3:'Any shot',method1:'Players choice',method2:'Players choice',method3:'Players choice',cbRef:'None'};

const EMPTY_PLAYER={name:'',playerType:'Programme Player',category:'Bronze',level:1,juniorRanking:'',guestEstimate:'',attendance:'0 sessions',focus:'',present:false};

function clone(obj){return JSON.parse(JSON.stringify(obj));}

function safeLayersForSession(game){
  return Array.isArray(game?.layers)?game.layers:[];
}

function gcd(a,b){a=Math.abs(Number(a)||0);b=Math.abs(Number(b)||0);while(b){const t=b;b=a%b;a=t;}return a||1;}
function lcm(a,b){a=Math.abs(Number(a)||0);b=Math.abs(Number(b)||0);if(!a||!b)return Math.max(a,b)||1;return Math.abs(a*b)/gcd(a,b);}
function lcmList(nums){const clean=(nums||[]).map(n=>Number(n)||0).filter(n=>n>0);return clean.length?clean.reduce((acc,n)=>lcm(acc,n),1):1;}
function getFairLivesRows(teams,multiplier=2){
  const list=(teams||[]).filter(t=>(t.players||[]).length>0);
  const base=lcmList(list.map(t=>(t.players||[]).length));
  return {lcmBase:base,multiplier,rows:list.map((team,index)=>{
    const players=(team.players||[]).length||1;
    const livesPerPlayer=(base/players)*multiplier;
    return {team:team.name||`Team ${index+1}`,players,livesPerPlayer,totalCapacity:livesPerPlayer*players};
  })};
}
function playerSeedValue(player){
  if(typeof player==='string') return 9999;
  const ranking=Number(player.juniorRanking ?? player.ranking ?? player.rank);
  if(!Number.isNaN(ranking)&&ranking>0) return ranking;
  const level=Number(player.level ?? player.rating ?? 0);
  return 9000-level;
}
function playerDisplayName(player){
  if(typeof player==='string') return player;
  return player.name||player.fullName||player.playerName||'Player';
}
function playerFirstName(name){
  const clean=String(name||'Team').trim();
  return clean.split(/\s+/)[0]||'Team';
}
function possessiveTeamName(firstName){
  const first=playerFirstName(firstName);
  return `${first}${first.toLowerCase().endsWith('s')?"'":"'s"} Team`;
}
function snakeSeedPlayers(players,teamCount){
  const list=[...(players||[])].sort((a,b)=>playerSeedValue(a)-playerSeedValue(b));
  const teams=Array.from({length:teamCount},()=>[]);
  list.forEach((player,index)=>{
    const round=Math.floor(index/teamCount);
    const pos=index%teamCount;
    const teamIndex=round%2===0?pos:(teamCount-1-pos);
    teams[teamIndex].push(playerDisplayName(player));
  });
  return teams;
}







function buildAtl(options){
const count=options.btlCount.startsWith('0')?0:options.btlCount.startsWith('1')?1:options.btlCount.startsWith('2')?2:3;
const shots=[options.shot1,options.shot2,options.shot3].slice(0,count);
const methods=[options.method1,options.method2,options.method3].slice(0,count);
const shotText=count===0?'No compulsory BTL shot; use ATL / BTL as a tempo, balance and vision cue.':shots.map((shot,index)=>{
const method=methods[index]==='Players choice'?'player’s choice volley/non-volley':methods[index].toLowerCase();
return `BTL shot ${index+1}: ${shot.toLowerCase()} (${method})`;
}).join('; ');
const sideText=options.side==='Both sides'?'Applies on both sides.':`Applies on ${options.side.replace(' only','').toLowerCase()}.`;
const consecutiveText=count<=1?'':options.consecutive==='Yes'?'BTL shots must be consecutive.':'BTL shots do not need to be consecutive.';
const cbText=options.cbRef==='None'?'':` Checkerboard reference: ${options.cbRef}.`;
const rationale=['slows the rally problem down enough for players to attend to balance, vision and better information pick-up'];
if(count===0)rationale.push('uses the cue without forcing a low shot');
if(count===1)rationale.push('adds one simple low-trajectory decision inside live play');
if(count===2)rationale.push('requires repeated low-trajectory decisions under pressure');
if(count===3)rationale.push('creates a complex sequence while preserving tactical awareness');
if(options.consecutive==='Yes'&&count>1)rationale.push('tests whether players can sustain the constraint across linked shots');
if(methods.includes('Must be volley'))rationale.push('links the selected shot outcome with early interception');
if(methods.includes('No volley'))rationale.push('encourages creation after the bounce');
if(shots.includes('Boast'))rationale.push('links BTL control to angle creation and front-court disruption');
if(shots.includes('Straight drop'))rationale.push('connects BTL control to front-court pressure');
if(shots.includes('Crosscourt drop'))rationale.push('changes the opponent’s movement problem');
if(options.cbRef!=='None')rationale.push(`${options.cbRef} gives a clear spatial reference`);
const autoLayers=[];
if(methods.includes('Must be volley'))autoLayers.push('Volley Finish');
if(shots.includes('Boast')||shots.includes('Crosscourt drop'))autoLayers.push('Blind Finish');
if(count>=2)autoLayers.push('Opponent Off T');
if(options.cbRef!=='None')autoLayers.push('CB Code');
autoLayers.push('Clean Winner');
return{id:Date.now()+Math.random(),title:'ATL / BTL Structure',category:'ATL / BTL',duration:8,format:'King of Court',task:`${options.btlCount}: ${shotText}. ${consecutiveText} ${sideText}${cbText}`,rationale:`This ATL / BTL structure ${rationale.join(', ')}.`,coach:'Use the tape as an external visual cue. Keep rallies live. Coach balance, vision and shot choice rather than fixed technique.',layers:[...new Set(autoLayers)],cbCode:options.cbRef};
}

function standardGames(){
return[
{id:'length-before-attack',title:'Length Before Attack',category:'Classic Conditioned',duration:8,format:'King of Court',task:'Player must create length pressure before attacking short.',rationale:'Encourages patient pressure construction rather than rushed attacks.',coach:'Watch whether players attack only after the opponent is displaced, late or off balance.',layers:['Quality Length Before Attack'],cbCode:'None'},
{id:'off-t-bonus',title:'Opponent Off-T Bonus',category:'Classic Conditioned',duration:8,format:'King of Court',task:'Bonus if the winning shot is played while the opponent is outside the T-zone.',rationale:'Rewards recognition of opponent recovery state, not just shot execution.',coach:'Cue players to notice opponent position before selecting the attack.',layers:['Opponent Off T','Clean Winner'],cbCode:'None'},
{id:'cb-pair',title:'Checkerboard Pair Challenge',category:'Checkerboard',duration:8,format:'King of Court',task:'Complete a selected checkerboard pair before bonus scoring opens.',rationale:'Builds tactical linking and opponent displacement awareness.',coach:'Use the code as tactical intention, not a hoop to jump through.',layers:[],cbCode:'[6-4] + [8-1]'},
{id:'cb-clean-finish',title:'Checkerboard Clean Finish',category:'Checkerboard',duration:8,format:'King of Court',task:'Complete a selected CB code and win with a clean finish bonus.',rationale:'Connects tactical construction with high-quality conversion.',coach:'The clean winner sits on top of all scoring, but only after the challenge is met.',layers:['CB Code','Clean Winner','4-Shot Window'],cbCode:'[6-3]'},
{id:'midcourt-intercept',title:'Midcourt Intercept',category:'Volley & Intercept',duration:8,format:'King of Court',task:'Earn the volley/intercept from pressure and positioning.',rationale:'Links central control, pressure and early interception.',coach:'Do not let players hunt volleys recklessly; the volley should be earned.',layers:['Volley Finish','Clean Winner'],cbCode:'None'},
{id:'tempo-pressure',title:'Tempo Pressure',category:'Pressure',duration:6,format:'King of Court',task:'Maintain decision quality under increased tempo.',rationale:'Adds time pressure without making the task mindless speed.',coach:'Watch decision quality, not just intensity.',layers:['4-Shot Window','Clean Winner'],cbCode:'None'},
{id:'winner-loses-bounce',title:'Winner Loses a Bounce',category:'Pressure',duration:8,format:'Winner Stays On',task:'Winner loses a bounce after every rally they win.',rationale:'Balances mixed standards and prevents one player over-dominating.',coach:'Useful with uneven groups; keep the rally problem alive.',layers:['Double Bounce'],cbCode:'None'},
{id:'invasion-lives',title:'Invasion Lives Game',category:'Invasion',duration:8,format:'Team Courts',task:'Each court has equal total lives; individual lives adjust to player count.',rationale:'Balances uneven court numbers while keeping pressure and chaos representative.',coach:'Use equal total lives per court, not equal lives per player.',layers:['Weak Side','Clean Winner'],cbCode:'None'}
];
}


function libraryStarterGames(){
  return standardGames().map(game=>({...clone(game),saved:true,favourite:false}));
}
function emptyCustomGame(){
  return {id:Date.now()+Math.random(),title:'',category:'Custom Coach Game',duration:8,format:'King of Court',task:'',rationale:'',coach:'',layers:[],cbCode:'None',saved:true,favourite:false};
}
function sortPlayers(players){
return players.map((player,originalIndex)=>({...player,originalIndex})).sort((a,b)=>{
const aRank=a.playerType==='Programme Player'?Number(a.juniorRanking&&String(a.juniorRanking).trim()!==''?a.juniorRanking:9999):9000-Number(a.level||0);
const bRank=b.playerType==='Programme Player'?Number(b.juniorRanking&&String(b.juniorRanking).trim()!==''?b.juniorRanking:9999):9000-Number(b.level||0);
return aRank-bRank;
});
}


function startCoachProjectionSession(sessionList,index=0){
  try{
    const safeSession=Array.isArray(sessionList)?sessionList:[sessionList].filter(Boolean);
    localStorage.setItem(SESSION_KEY,JSON.stringify(safeSession));
    localStorage.setItem('checkerboardProjectionTab','session');
    localStorage.setItem('checkerboardCompetitionProjection',JSON.stringify({
      mode:'session',
      sessionProjectionActive:true,
      selectedIndex:index,
      invasionGameStarted:false
    }));
  }catch{}
}

function stopCoachProjectionSession(){
  try{
    const saved=localStorage.getItem('checkerboardCompetitionProjection');
    const current=saved?JSON.parse(saved):{};
    localStorage.setItem('checkerboardCompetitionProjection',JSON.stringify({
      ...current,
      mode:'session',
      sessionProjectionActive:false,
      invasionGameStarted:false
    }));
  }catch{}
}

function ProjectionView({session,setScreen,players=[]}){
  const [selectedIndex,setSelectedIndex]=useState(0);
  const [competitionProjection,setCompetitionProjection]=useState(null);

  useEffect(()=>{
    function loadCompetitionProjection(){
      try{
        const saved=localStorage.getItem('checkerboardCompetitionProjection');
        const parsed=saved?JSON.parse(saved):null;
        setCompetitionProjection(parsed);
        if(parsed?.mode==='session'&&typeof parsed.selectedIndex==='number'){
          setSelectedIndex(parsed.selectedIndex);
        }
      }catch{
        setCompetitionProjection(null);
      }
    }
    loadCompetitionProjection();
    const timer=setInterval(loadCompetitionProjection,1000);
    return ()=>clearInterval(timer);
  },[]);

  if(competitionProjection?.mode==='invasion'&&competitionProjection?.invasionGameStarted){
    const teams=competitionProjection.invasionTeams||[];
    const n=teams.length;
    const liveCourts=n;
    const isLive=!!competitionProjection.invasionGameStarted;
    function projBaseLives(team){
      if(!team) return Number(competitionProjection?.invasionStartingLives||5);
      const exact=Number(competitionProjection.invasionFairLivesByTeam?.[team.id] ?? competitionProjection.invasionFairLivesByTeam?.[team.name]);
      if(exact>0) return exact;
      const allTeams=competitionProjection.invasionTeams||[];
      const counts=allTeams.map(t=>(t.players||[]).length).filter(n=>n>0);
      const selected=Number(competitionProjection?.invasionStartingLives||competitionProjection?.invasionLives)||5;
      const maxPlayers=counts.length?Math.max(...counts):1;
      const baseCapacity=maxPlayers*selected;
      const playerCount=(team?.players||[]).length||1;
      if(baseCapacity>0) return Math.max(1,Math.ceil(baseCapacity/playerCount));
      return selected;
    }
    function projCarry(team){
      return competitionProjection.invasionCarryLives?.[team?.id]||0;
    }
    function projStartLives(team){
      return projBaseLives(team)+projCarry(team);
    }
    function projOrderedPlayers(team){
      return [...(team?.players||[])].sort((a,b)=>(competitionProjection.invasionRankMap?.[b]??9999)-(competitionProjection.invasionRankMap?.[a]??9999));
    }
    function projCurrentInvader(team){
      const list=projOrderedPlayers(team);
      if(!list.length) return 'Waiting';
      const override=competitionProjection.invasionInvaderOverrides?.[team?.id]||competitionProjection.invasionInvaderOverrides?.[team?.name];
      if(override) return override;
      return list[(competitionProjection.invasionPlayerRound||0)%list.length];
    }
    function projNextInvader(team){
      const list=projOrderedPlayers(team);
      if(!list.length) return 'Waiting';
      const current=projCurrentInvader(team);
      const idx=list.findIndex(name=>name===current);
      const baseIndex=idx>=0?idx:(competitionProjection.invasionPlayerRound||0)%list.length;
      return list[(baseIndex+1)%list.length];
    }
    function projTeamPoints(team){
      const manual=Number(competitionProjection.invasionTeamPoints?.[team?.id]||0);
      const playerTotal=(team?.players||[]).reduce((total,name)=>total+Number(competitionProjection.invasionPlayerPoints?.[name]||0),0);
      return manual+playerTotal;
    }
    function projPlayerRole(team,name){
      const current=projCurrentInvader(team);
      const next=projNextInvader(team);
      if(name===current) return 'invading';
      if(name===next) return 'next invader';
      return '';
    }
    function projTeamPlayerLine(team,name){
      const role=projPlayerRole(team,name);
      return <div key={name} className={role==='invading'?'projectorPlayerLine activeInvader':role==='next invader'?'projectorPlayerLine nextInvader':'projectorPlayerLine'}>
        <span>{name} <em className="playerDbInline">{competitionProjection.playerBounces?.[name]||'No DB'}</em></span>{role&&<strong>{role}</strong>}
      </div>;
    }
    function projDefending(idx){
      if(!n) return null;
      return teams[idx%n];
    }
    function projInvading(idx){
      if(!n) return null;
      return teams[(idx - 1 + (competitionProjection.invasionCourtRound||0) + n) % n];
    }
    const courts=Array.from({length:Math.max(teams.length,Number(competitionProjection.invasionCourts||0)||teams.length)},(_,idx)=>idx+1);
    function rankOf(name){return competitionProjection.invasionRankMap?.[name]??'';}
    function rankLabel(name){const rank=rankOf(name);return rank?`#${rank} `:'';}
    function dbOf(name){return competitionProjection.playerBounces?.[name]||'No DB';}
    function activeDb(name){const value=dbOf(name);return value&&value!=='No DB'?value:'';}
    function captainOf(team){
      const sorted=playersByRank(team);
      return sorted[0]||team?.captain||team?.name||'Team';
    }
    function captainTeamName(team){
      const captain=captainOf(team);
      return captain?`${captain}’s Team`:(team?.name||'Team');
    }
    function playersByRank(team){
      return [...(team?.players||[])].sort((a,b)=>(rankOf(a)||9999)-(rankOf(b)||9999));
    }
    function teamForCourt(court){return teams.find(team=>String(team.court||'').includes(String(court)))||teams[court-1]||null;}
    function nextCourtTeam(court){
      if(!teams.length) return null;
      const defender=teamForCourt(court);
      const orderedCourts=courts.map(c=>teamForCourt(c)).filter(Boolean);
      const idx=orderedCourts.findIndex(team=>team?.id===defender?.id);
      return orderedCourts[(idx-1+orderedCourts.length)%orderedCourts.length]||null;
    }
    const courtRows=courts.map(court=>{
      const defending=teamForCourt(court);
      const invading=nextCourtTeam(court);
      return {court,defending,invading,current:projCurrentInvader(invading),next:projNextInvader(invading)};
    });

    {
      const teamScores=[...teams].map(team=>({team,score:projTeamPoints(team)})).sort((a,b)=>b.score-a.score);
      return <div className="projectionPage invasionOnlyProjector invasionPointsCleanView">
        <div className="projectionTop">
          <button className="secondaryBtn" onClick={()=>setScreen('home')}>← Home</button>
          <div>
            <span className="projectionKicker">{competitionProjection.invasionFormat==='points'?'PLAYER DISPLAY / POINTS FORMAT':'PLAYER DISPLAY / LIVES FORMAT'}</span>
            <h1>{competitionProjection.invasionFormat==='points'?'Invasion Points Format':'Invasion Lives Format'}</h1>
            <p>Round {(competitionProjection.invasionPlayerRound||0)+1}</p>
          </div>
        </div>

        <div className="invasionSimplePlayerBoard">
          <div className="simpleRoundBanner">
            <span>ROUND</span>
            <strong>{(competitionProjection.invasionPlayerRound||0)+1}</strong>
          </div>

          <div className="simpleCourtGrid">
            {courtRows.map(row=><div className="simpleCourtCard" key={`simple-court-${row.court}`}>
              <span className="simpleCourtLabel">Court {row.court}</span>
              <h2>{rankLabel(row.current)}{row.current||'Waiting'}</h2>
              <p><b>Current invader</b></p>
              <p>{captainTeamName(row.invading)}</p>
              <div className="simpleNextInvader">
                <span>Next invader</span>
                <strong>{rankLabel(row.next)}{row.next||'Waiting'}</strong>
              </div>
            </div>)}
          </div>

          <div className="simpleScoresPanel">
            <h2>Team Scores</h2>
            <div className="simpleScoreGrid">
              {teamScores.map(({team,score})=><div className="simpleScoreCard simpleScoreCardWithPlayers" key={team.id}>
                <div className="simpleScoreTeamRow">
                  <span>{captainTeamName(team)}</span>
                  <strong>{score}</strong>
                </div>
                <div className="simpleScorePlayers">Players: {playersByRank(team).join(' • ')}</div>
              </div>)}
            </div>
          </div>
        </div>
      </div>;
    }

    return <div className="projectionPage invasionOnlyProjector">
      <div className="projectionTop">
        <button className="secondaryBtn" onClick={()=>setScreen('home')}>← Home</button>
        <div>
          <span className="projectionKicker">LIVE EVENT DISPLAY</span>
          <h1>Invasion Game</h1>
        </div>
      </div>

      <div className="invasionProjectorBoard invasionCleanBoard">
        <div className="invasionProjectorHeader">
          <span>PLAYER PROJECTION</span>
          <h1>Invasion Game</h1>
          <p>{competitionProjection.invasionFormat==='lives'?'Lives Format':'Points Format'} · Snake seeded teams · Random court allocation</p>
        </div>

        <div className="activeInvaderPanel">
          <h2>Current Invaders</h2>
          <div className="activeInvaderGrid">
            {courtRows.map(row=><div className="activeInvaderCard" key={`active-${row.court}`}>
              <span>Court {row.court}</span>
              <strong>{rankLabel(row.current)}{row.current||'Waiting'}</strong>
              <p><b>Invaders:</b> {captainTeamName(row.invading)}</p>
              <p><b>Defenders:</b> {captainTeamName(row.defending)}</p>
              {activeDb(row.current)&&<em>{activeDb(row.current)}</em>}
            </div>)}
          </div>
        </div>

        <div className="courtAssignmentPanel">
          <h2>Court Allocation</h2>
          <div className="courtAssignmentGrid">
            {courtRows.map(row=><div key={`court-assign-${row.court}`}>
              <strong>Court {row.court}</strong>
              <span>Invaders: {captainTeamName(row.invading)}</span>
              <span>Defenders: {captainTeamName(row.defending)}</span>
            </div>)}
          </div>
        </div>

        <div className="teamListPanel">
          <h2>Teams · Snake Seeded By Ranking</h2>
          <div className="teamListGrid">
            {[...teams].sort((a,b)=>(a.seedOrder||Number(a.id?.replace(/\D/g,''))||0)-(b.seedOrder||Number(b.id?.replace(/\D/g,''))||0)).map(team=><div className="cleanTeamCard" key={team.id}>
              <h3>{captainTeamName(team)} <small>{team.court||''}</small></h3>
              <div className="teamCurrentQueue">
                <strong>Current</strong>
                <p>{rankLabel(projCurrentInvader(team))}{projCurrentInvader(team)} {activeDb(projCurrentInvader(team))&&<em>{activeDb(projCurrentInvader(team))}</em>}</p>
                <strong>Queue</strong>
                {playersByRank(team).filter(name=>name!==projCurrentInvader(team)).map(name=><p key={name}><b>{rankLabel(name)}</b>{name} {activeDb(name)&&<em>{activeDb(name)}</em>}</p>)}
              </div>
            </div>)}
          </div>
        </div>

        <div className="courtDetailPanel">
          <h2>Court Details</h2>
          <div className="courtDetailGrid">
            {courtRows.map(row=>{
              const startLives=projStartLives(row.invading);
              const finish=competitionProjection.invasionFinishLives?.[row.invading?.id];
              return <div className="cleanCourtCard" key={`court-detail-${row.court}`}>
                <h3>Court {row.court}</h3>
                <p><b>Defenders:</b> {captainTeamName(row.defending)}</p>
                <p><b>Invaders:</b> {captainTeamName(row.invading)}</p>
                <p><b>Current:</b> {rankLabel(row.current)}{row.current||'Waiting'} {activeDb(row.current)&&<em>{activeDb(row.current)}</em>}</p>
                <div className="queueList">
                  {(playersByRank(row.invading)||[]).map(name=><span key={name} className={name===row.current?'queueCurrent':''}>{rankLabel(name)}{name}{activeDb(name)?` (${activeDb(name)})`:''}{name===row.current?' ← current':''}</span>)}
                </div>
                <div className="courtLivesCompact"><span>Lives</span><strong>{competitionProjection.invasionFormat==='lives'?startLives:'Points'}</strong><span>Remaining</span><strong>{competitionProjection.invasionFormat==='lives'?(finish!==undefined?finish:'Live'):projTeamPoints(row.invading)}</strong></div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </div>;
  }

  const hasSession=session&&session.length>0;
  const current=hasSession?session[Math.min(selectedIndex,session.length-1)]:null;
  const title=current?.title||'PLAYER VIEW';
  const task=current?.task||'Choose or add a game to Session Builder, then project this screen for simple player instructions.';
  const scoring=current?.scoring||'Scoring will appear here.';
  const focus=current?.playerFocus||current?.focus||current?.coachFocus||'Keep it simple. Read the task and play.';

  return <div className="projectionPage">
    <div className="projectionTop">
      <button className="secondaryBtn" onClick={()=>setScreen('home')}>← Home</button>
      <div>
        <span className="projectionKicker">PLAYER DISPLAY / PROJECTION VIEW</span>
        <h1>{title}</h1>
        <p className="projectionMonitorNote">Use this page on the monitor / second device for player-only display.</p>
      </div>
    </div>

    {hasSession&&<div className="projectionPicker">
      <strong>Session item</strong>
      <select value={selectedIndex} onChange={e=>setSelectedIndex(Number(e.target.value))}>
        {session.map((item,index)=><option key={item.id||index} value={index}>{index+1}. {item.title||'Game'}</option>)}
      </select>
    </div>}

    <div className="projectionGrid">
      <div className="projectionPanel"><h2>WHAT TO DO</h2><p>{task}</p></div>
      <div className="projectionPanel"><h2>HOW TO SCORE</h2><p>{scoring}</p></div>
      <div className="projectionPanel projectionFocus"><h2>KEY FOCUS</h2><p>{focus}</p></div>
    </div>

    {current?.layers?.length>0&&<div className="projectionBonus">
      <h2>ACTIVE BONUS RULES</h2>
      <div className="projectionChips">{current.layers.map(layer=><span key={layer}>{layer}</span>)}</div>
    </div>}
  </div>;
}


const TECHNICAL_OVERLAYS = [
 {id:'eyes-contact',category:'Visual',title:'Eyes on Contact Point',rule:'Player keeps visual attention on the ball/contact space through strike.',process:'This stabilises visual calibration before impact. The player preserves ball-spacing information long enough to organise contact timing rather than lifting the head early.',breakdown:'Head pulls early; eyes leave contact space; contact timing becomes rushed.',constraint:'Clear look-away before contact = loss of rally or bonus removed.',checkerboard:'Useful on [8-1], [7-2], pressure drops from [5] or [6].',pairings:['Stable head through contact','Finish balanced','Non-playing arm active'],games:['Double Bounce','Progressive ATL','Checkerboard pairs']},
 {id:'second-eye',category:'Visual',title:'Second Eye Overlay',rule:'Player organises head/body shape so the eye furthest from the opponent has access to opponent information space.',process:'Maintaining outside-eye access preserves pickup of opponent posture, racquet preparation and movement direction. It reduces informational blindness caused by excessive body closure and teaches movement organisation around continuous opponent information.',breakdown:'Player turns too far away, closes body line and reacts late to the next shot.',constraint:'If completely blind to opponent information space, coach calls “blind”.',checkerboard:'Excellent in [6-3], [5-4], [7-2] and recovery after [8-1].',pairings:['Move before bounce','Prepared before leaving T','Split before opponent contact'],games:['Progressive ATL','Double Bounce','Checkerboard pairs']},
 {id:'quiet-eye',category:'Visual',title:'Quiet Eye',rule:'Player briefly stabilises gaze on the relevant information source before action.',process:'A quiet visual hold supports timing and decision calibration under pressure, especially when the player normally rushes or guesses.',breakdown:'Player rushes attention or swings before information is stable.',constraint:'Coach calls “rushed” if action begins before visual information stabilises.',checkerboard:'Useful before attacking choices from [5]/[6] into [1]/[2].',pairings:['Second Eye Overlay','Same prep different shot','Stable head through contact'],games:['Checkerboard choice games','Double Bounce']},
 {id:'opponent-pickup',category:'Visual',title:'Early Opponent Pickup',rule:'Player recovers in a way that allows early pickup of opponent shape before opponent contact.',process:'Recovery becomes information-seeking movement. The player recovers to a position and orientation that allow earlier reading of opponent intention.',breakdown:'Player reaches a place but faces the wrong way or reads late.',constraint:'Visually late to opponent preparation = “late pickup”.',checkerboard:'Strong after [3] and [4] where opponent may volley or counter-short.',pairings:['Second Eye Overlay','Split before opponent contact','Recover through central lane'],games:['Progressive ATL','Invasion','Rotational pressure']},
 {id:'racquet-above-wrist',category:'Preparation',title:'Racquet Above Wrist',rule:'Racquet head is organised above wrist before the striking action.',process:'Improves readiness and reduces late compensatory wrist action. The racquet is available earlier as part of the movement solution.',breakdown:'Racquet drops; wrist collapses; player flicks late.',constraint:'Racquet below wrist in preparation = warning or loss.',checkerboard:'Useful for volleys to [5]/[6] and attacks [8-1], [7-2].',pairings:['Prepared before leaving T','Non-playing arm active','Stable head through contact'],games:['Volley games','Double Bounce','Checkerboard front-wall targets']},
 {id:'prepared-before-t',category:'Preparation',title:'Prepared Before Leaving T',rule:'Racquet preparation must be visible before first movement away from the T zone.',process:'Preparation and movement couple earlier. The player is not using travel time to organise the racquet, freeing perception and movement resources for spacing and decision adaptation.',breakdown:'Player leaves T empty-handed and arrives rushed.',constraint:'No visible preparation before movement = “late prep”.',checkerboard:'Strong with [6-3], [5-4], [8-1].',pairings:['Second Eye Overlay','Move before bounce','Split before opponent contact'],games:['Progressive ATL','Boast-drive rotations','Double Bounce']},
 {id:'split-contact',category:'Preparation',title:'Split Before Opponent Contact',rule:'Player shows a split/readiness action before opponent strikes.',process:'The split creates a perceptual-motor readiness point linking opponent contact information to first movement.',breakdown:'Player waits flat-footed and starts late.',constraint:'No split before opponent contact = loss or bonus removed.',checkerboard:'Useful in rapid exchanges through [3]/[4] and volley pressure from [5]/[6].',pairings:['Early opponent pickup','Prepared before leaving T','Move before bounce'],games:['Rotational pressure','Invasion','Progressive ATL']},
 {id:'non-playing-arm',category:'Balance',title:'Non-Playing Arm Active',rule:'Non-playing arm supports spacing, balance and body organisation before contact.',process:'The non-playing arm regulates trunk orientation and spacing, giving a more stable movement platform under pressure.',breakdown:'Free arm disappears and body collapses into the ball.',constraint:'Passive/trapped arm during key contact = “arm”.',checkerboard:'Useful on [8-1], [7-2], [6-3], [5-4].',pairings:['Finish balanced','Stable head through contact','Racquet above wrist'],games:['Double Bounce','Checkerboard pairs']},
 {id:'stable-head',category:'Balance',title:'Stable Head Through Contact',rule:'Head remains stable through striking phase.',process:'Head stability protects visual calibration and contact timing. Excessive movement disrupts perception of spacing and destabilises action.',breakdown:'Head lifts/dives through contact.',constraint:'Clear head pull = loss or reset.',checkerboard:'Strong on [8-1], [7-2], [6-3], [5-4].',pairings:['Eyes on contact point','Finish balanced','Non-playing arm active'],games:['Double Bounce','Front-court pressure games']},
 {id:'finish-balanced',category:'Balance',title:'Finish Balanced',rule:'Player finishes the shot without falling or collapsing out of shape.',process:'Balanced finishing shows the movement solution accounts for current shot and next action. It supports faster reorientation and recovery pickup.',breakdown:'Player over-commits and cannot recover/read next ball.',constraint:'Unnecessary fall-through = loss or bonus removed.',checkerboard:'Useful after [8-1], [7-2], [6-3].',pairings:['Stable head through contact','Non-playing arm active','Recover through central lane'],games:['Double Bounce','Progressive ATL','Invasion']},
 {id:'move-before-bounce',category:'Movement',title:'Move Before Bounce',rule:'Player initiates movement before the ball bounces when information allows.',process:'Encourages earlier coupling between visual information and movement, acting on emerging affordances rather than waiting for certainty.',breakdown:'Player waits until bounce and loses options.',constraint:'Unnecessary wait until after bounce = “late move”.',checkerboard:'Strong in [6-3], [5-4], [7-2].',pairings:['Second Eye Overlay','Early opponent pickup','Prepared before leaving T'],games:['Double Bounce','Progressive ATL','Rotational pressure']},
 {id:'recover-lane',category:'Movement',title:'Recover Through Central Lane',rule:'Player recovers through a useful central lane rather than drifting wide or standing still.',process:'Recovery becomes information-seeking movement, regaining court access and opponent visual access together.',breakdown:'Player drifts, over-recovers or blocks their next movement path.',constraint:'Recovery path removes access to likely next ball = “lane”.',checkerboard:'Useful after [3]/[4] or front finish [1]/[2].',pairings:['Second Eye Overlay','Finish balanced','Early opponent pickup'],games:['Progressive ATL','Invasion']},
 {id:'no-drifting',category:'Movement',title:'No Drifting',rule:'Player stops unnecessary movement drift after striking or recovering.',process:'Stopping drift improves readiness and stabilises perception while reading the opponent.',breakdown:'Player keeps floating and cannot split.',constraint:'Obvious drift during opponent strike = warning/loss.',checkerboard:'Useful after [6-3], [5-4] and cross-court recovery patterns.',pairings:['Split before opponent contact','Stable head through contact','Recover through central lane'],games:['ATL','Rotational pressure','Double Bounce']},
 {id:'same-prep',category:'Swing Shape',title:'Same Prep Different Shot',rule:'Player keeps preparation similar while preserving at least two shot options.',process:'Maintains informational uncertainty for the opponent and keeps multiple affordances open through preparation.',breakdown:'Shot intention is shown early.',constraint:'If preparation clearly gives away the shot, coach calls “shown”.',checkerboard:'Excellent with [6-3] or [6-1], [5-4] or [5-2].',pairings:['Quiet Eye','Second Eye Overlay','Prepared before leaving T'],games:['Checkerboard choice games','Double Bounce']},
 {id:'finish-front-wall',category:'Swing Shape',title:'Finish To Front Wall',rule:'Follow-through finishes toward the front wall/target line rather than wrapping around the body.',process:'Directs swing organisation toward intended affordance and helps players who over-rotate or pull away from target shape.',breakdown:'Swing wraps around waist/body.',constraint:'Wrap away from target line = “finish”.',checkerboard:'Useful for drives [6-3], [5-4].',pairings:['Stable head through contact','Non-playing arm active','Hit through the ball'],games:['Drive games','Progressive ATL']},
 {id:'hit-through',category:'Swing Shape',title:'Hit Through The Ball',rule:'Player sends energy through intended line/space rather than poking or steering.',process:'Strengthens coupling between target affordance, swing path and ball outcome, especially when depth/penetration is required.',breakdown:'Player pokes, decelerates or steers.',constraint:'Poked/held without tactical purpose = “through”.',checkerboard:'Useful on [6-3], [5-4], [6-4], [5-3].',pairings:['Finish to front wall','Racquet above wrist','Stable head through contact'],games:['Progressive ATL','Length games','Double Bounce']}
];


const TACTICAL_OVERLAYS = [
  {category:'Advantage', title:'Attack Only On Advantage', rule:'Attack only after a clear pressure cue: opponent late, off-balance, unrecovered or outside useful court position.', coach:'Ask: what did you see before attacking?', pairings:['Quiet Eye Before Attack','Recognise Opponent Vulnerability']},
  {category:'Volley', title:'Volley Opportunity', rule:'Player must look to volley when the opponent gives time/height through the middle or loose width.', coach:'Coach observes early split, racquet readiness and decision timing.', pairings:['Eagle','Second Eye']},
  {category:'Width', title:'Width Before Attack', rule:'Point/bonus only counts if player first creates width or body-line separation before attacking short.', coach:'Prevents reckless front-court attacks.', pairings:['Cat','Attack Only On Advantage']},
  {category:'Checkerboard', title:'Checkerboard Pair Challenge', rule:'Complete a chosen checkerboard pair such as [6-3] or [5-4] before scoring bonus opens.', coach:'Use as tactical intention layer over live rallies.', pairings:['Quiet Eye','External Target Focus']},
  {category:'Tempo', title:'Route Breaker', rule:'Player must change route or rhythm when opponent begins to predict the pattern.', coach:'Look for perception, not pre-planned variety.', pairings:['Wolf','See Space Before Strike']},
  {category:'Pressure', title:'Opponent Not Recovered To T', rule:'Attack is encouraged only when opponent has not reorganised around the T.', coach:'Helps players recognise genuine vulnerability.', pairings:['Eagle','Tiger']}
];

const MENTAL_PERFORMANCE_OVERLAYS = [
  {category:'🐾 Identity', title:'🐈 Cat', rule:'Patient Hunter: waits until useful information appears before striking. Vision priority: observe opponent, space and timing before acting.', coach:'Useful for rushed attackers. Primary animal: Cat. Secondary animal: Eagle. Cue: See before you strike.', pairings:['Quiet Eye Before Attack','Width Before Attack','External Target Focus']},
  {category:'🐾 Identity', title:'🐅 Tiger', rule:'Predatory Pressure: identifies a weakness and keeps pressure on it without becoming reckless. Vision priority: target lock on opponent vulnerability.', coach:'Useful when a player creates chances but does not capitalise. Primary animal: Tiger. Secondary animal: Eagle. Cue: Find it. Hunt it.', pairings:['Recognise Opponent Vulnerability','Attack Only On Advantage','Activation Breath']},
  {category:'🐾 Identity', title:'🐕 Golden Retriever', rule:'Resilient Re-Engagement: ignores bad calls, aggressive opponents, lucky nicks and distractions; immediately returns attention to the next ball.', coach:'Primary animal: Golden Retriever. Secondary animal: Eagle. Coach observes no complaining, eyes reconnecting to ball/opponent, and next-ball readiness within 3 seconds. Cue: Next ball.', pairings:['Reset Within 3 Seconds','Accept And Continue','Neutral Error Response','Compete To Last Ball']},
  {category:'🐾 Identity', title:'🐺 Wolf', rule:'Discipline Mode: stays with the plan and keeps reading the correct cues even when the rally becomes emotional or chaotic.', coach:'Primary animal: Wolf. Secondary animal: Eagle. Cue: Stay with the plan.', pairings:['Process Goal Focus','Attack Only On Advantage','Route Breaker']},
  {category:'🐾 Identity', title:'🦅 Eagle', rule:'Awareness Mode: sees information early. Scans opponent, ball, target, space and time before choosing.', coach:'Eagle is the anchor animal for vision-first squash. Primary animal: Eagle. Secondary animal: Owl. Cue: See first.', pairings:['Quiet Eye Before Attack','Second Eye To Opponent','Opponent Reading','Tracking']},
  {category:'🐾 Identity', title:'🦁 Lion', rule:'Courage Mode: recognises a real attacking opportunity and commits. Vision priority: see the opportunity, then take it.', coach:'Useful for passive or hesitant players. Primary animal: Lion. Secondary animal: Eagle. Cue: Be brave.', pairings:['Attack Only On Advantage','Attack Breath','Quiet Eye Before Attack']},
  {category:'🐾 Identity', title:'🐘 Elephant', rule:'Composure Mode: stays steady under pressure. Vision priority: stable attention and calm scanning when emotion rises.', coach:'Primary animal: Elephant. Secondary animal: Eagle. Cue: Nothing changes.', pairings:['Calming Breath','Neutral Error Response','Accept And Continue']},
  {category:'🐾 Identity', title:'🐆 Cheetah', rule:'Speed Mode: early visual pickup creates earlier movement. Vision priority: see early, move early.', coach:'Primary animal: Cheetah. Secondary animal: Eagle. Cue: Move now.', pairings:['Tracking','Early Opponent Pickup','Activation Breath']},
  {category:'🐾 Identity', title:'🦉 Owl', rule:'Adaptation Mode: recognises patterns, repeated errors and alternative solutions. Vision priority: observe, analyse, adapt.', coach:'Primary animal: Owl. Secondary animal: Eagle. Cue: Find the solution.', pairings:['Pattern Recognition','Route Breaker','Self Diagnose Error']},
  {category:'🐾 Identity', title:'🐬 Dolphin', rule:'Creativity Mode: sees alternative possibilities, disguise and unusual solutions without losing tactical purpose.', coach:'Primary animal: Dolphin. Secondary animal: Eagle. Cue: What else is possible?', pairings:['Route Breaker','External Target Focus','Checkerboard Pair Challenge']},

  {category:'👁 Visual Performance', title:'Quiet Eye Serve', rule:'Target → Ball → Target → Ball → Strike. Elite version: Target → Ball → Strike. Use a stable visual hold before serving.', coach:'Primary animal: Eagle. Secondary animal: Wolf. Coach observes stable gaze, reduced rushing and committed serve.', pairings:['Centering Breath','Eagle','Process Goal Focus']},
  {category:'👁 Visual Performance', title:'Quiet Eye Return', rule:'Opponent information → ball flight → movement. The player reads opponent shape before moving and avoids ball-only attention.', coach:'Primary animal: Eagle. Secondary animal: Cheetah. Coach observes earlier pickup and movement timing.', pairings:['Second Eye To Opponent','Opponent Reading','Tracking']},
  {category:'👁 Visual Performance', title:'Tracking', rule:'Track ball flight to predict trajectory, bounce, speed, interception point and available time.', coach:'Primary animal: Eagle. Secondary animal: Cheetah. Coach observes visual connection during movement.', pairings:['Early Opponent Pickup','External Target Focus','Second Eye To Opponent']},
  {category:'👁 Visual Performance', title:'Opponent Reading', rule:'Read racquet preparation, shoulder orientation, balance, movement direction, recovery state and court position.', coach:'Primary animal: Eagle. Secondary animal: Owl. Ask: what did you see before choosing?', pairings:['Second Eye To Opponent','Pattern Recognition','Recognise Opponent Vulnerability']},
  {category:'👁 Visual Performance', title:'Second Eye To Opponent', rule:'After contact, reconnect visually with opponent information before admiring the shot or watching the outcome.', coach:'Primary animal: Eagle. Secondary animal: Golden Retriever. Coach observes visual reconnection after every shot.', pairings:['No Admiring Shots','Full Recovery After Every Shot','Opponent Reading']},
  {category:'👁 Visual Performance', title:'External Focus', rule:'Attention goes to ball, target, space or opponent rather than internal body mechanics.', coach:'Primary animal: Eagle. Secondary animal: Lion. Use when the player overthinks technique.', pairings:['Quiet Eye Serve','Quiet Eye Before Attack','Checkerboard Pair Challenge']},

  {category:'🫁 Regulation', title:'Calming Breath', rule:'Inhale 4 seconds → exhale 6–8 seconds → repeat 3 cycles. Use for anxiety, rushing, panic or over-arousal.', coach:'Primary animal: Elephant. Secondary animal: Golden Retriever. Coach observes slower tempo, reduced rushing and calmer reset.', pairings:['Elephant','Accept And Continue','Quiet Eye Serve']},
  {category:'🫁 Regulation', title:'Centering Breath', rule:'Inhale 3 seconds → hold 3 seconds → exhale 3 seconds → repeat 3 cycles. Use for distraction, overthinking or wandering attention.', coach:'Primary animal: Eagle. Secondary animal: Wolf. Coach observes breath, cue, eyes up and ready posture.', pairings:['Quiet Eye Before Serve','Second Eye To Opponent','Process Goal Focus']},
  {category:'🫁 Regulation', title:'Activation Breath', rule:'Inhale sharply 1 second → exhale forcefully 1 second → repeat 2–3 times. Total time: approximately 4–6 seconds.', coach:'Primary animal: Lion. Secondary animal: Cheetah. Use for flat, passive or under-aroused players. Coach observes readiness and commitment.', pairings:['Lion','Cheetah','Attack Only On Advantage']},
  {category:'🫁 Regulation', title:'Attack Breath', rule:'Recognise opportunity → one 1-second activation inhale → one 1-second forceful exhale → attack. Single repetition inside live play.', coach:'Primary animal: Lion. Secondary animal: Eagle. Breath is linked to perception-action, not a long ritual.', pairings:['Quiet Eye Before Attack','Attack Only On Advantage','Recognise Opponent Vulnerability']},

  {category:'🏆 Competitive Behaviours', title:'Reset Within 3 Seconds', rule:'After error, bad call or disruption: breathe, cue word, eyes up, ready posture within 3 seconds.', coach:'Primary animal: Golden Retriever. Secondary animal: Elephant. Coach observes next-ball readiness.', pairings:['Accept And Continue','Neutral Error Response','Centering Breath']},
  {category:'🏆 Competitive Behaviours', title:'Process Goal Focus', rule:'Player protects today’s one process goal regardless of score, calls or opponent behaviour.', coach:'Primary animal: Wolf. Secondary animal: Eagle. Ask: what matters right now?', pairings:['Quiet Eye Serve','Full Recovery After Every Shot','Centering Breath']},
  {category:'🏆 Competitive Behaviours', title:'Positive Body Language', rule:'Player shows ready posture and no visible collapse after errors, pressure or bad calls.', coach:'Primary animal: Lion. Secondary animal: Golden Retriever.', pairings:['Reset Within 3 Seconds','Neutral Error Response','Activation Breath']},
  {category:'🏆 Competitive Behaviours', title:'Compete To The End', rule:'Player continues full effort until the rally is definitely over: no early surrender, no admiring shots.', coach:'Primary animal: Golden Retriever. Secondary animal: Tiger.', pairings:['No Admiring Shots','Full Recovery After Every Shot','Attack Breath']},

  {category:'🧭 Diagnostic Engine', title:'Challenge: Too Distracted', rule:'Use when the player is pulled away by bad calls, aggressive opponents, mistakes, crowd noise or scoreboard pressure. Recommendation: re-capture attention and return to the next ball.', coach:'Primary animal: Golden Retriever. Secondary animal: Eagle. Coach observes attention reconnecting to ball, opponent and task within 3 seconds.', pairings:['Centering Breath','Reset Within 3 Seconds','Accept And Continue','Second Eye To Opponent']},
  {category:'🧭 Diagnostic Engine', title:'Challenge: Not Observing', rule:'Use when the player is ball-only, reactive, tactically blind or missing opponent information. Recommendation: improve information pickup before action.', coach:'Primary animal: Eagle. Secondary animal: Owl. Coach asks: what did you see before choosing?', pairings:['Quiet Eye Return','Opponent Reading','Second Eye To Opponent','Tracking']},
  {category:'🧭 Diagnostic Engine', title:'Challenge: Rushing Decisions', rule:'Use when the player attacks too early or plays before information is clear. Recommendation: wait for useful information, then act.', coach:'Primary animal: Cat. Secondary animal: Eagle. Coach observes patience, balance and delayed commitment until opportunity is visible.', pairings:['Quiet Eye Before Attack','Width Before Attack','External Focus','Calming Breath']},
  {category:'🧭 Diagnostic Engine', title:'Challenge: Too Passive', rule:'Use when the player sees opportunities but does not commit. Recommendation: recognise advantage and attack with courage.', coach:'Primary animal: Lion. Secondary animal: Eagle. Coach observes attacking commitment only after the opportunity is genuinely seen.', pairings:['Attack Breath','Attack Only On Advantage','Quiet Eye Before Attack','Activation Breath']},
  {category:'🧭 Diagnostic Engine', title:'Challenge: Not Converting Pressure', rule:'Use when the player builds pressure but lets the opponent escape. Recommendation: identify weakness and keep purposeful pressure on it.', coach:'Primary animal: Tiger. Secondary animal: Eagle. Coach observes target lock on vulnerability without reckless hitting.', pairings:['Recognise Opponent Vulnerability','Opponent Not Recovered To T','Attack Breath','Compete To The End']},
  {category:'🧭 Diagnostic Engine', title:'Challenge: Undisciplined', rule:'Use when the player abandons the plan, becomes emotional, or changes tactics without information. Recommendation: protect the process goal.', coach:'Primary animal: Wolf. Secondary animal: Eagle. Coach observes plan discipline and continued cue recognition.', pairings:['Process Goal Focus','Centering Breath','Attack Only On Advantage','Route Breaker']},
  {category:'🧭 Diagnostic Engine', title:'Challenge: Slow Reactions', rule:'Use when the player moves late, picks up information slowly or waits until the ball is obvious. Recommendation: see early and move early.', coach:'Primary animal: Cheetah. Secondary animal: Eagle. Coach observes earlier visual pickup and first movement.', pairings:['Tracking','Quiet Eye Return','Opponent Reading','Activation Breath']},
  {category:'🧭 Diagnostic Engine', title:'Challenge: Too Emotional', rule:'Use when frustration, anxiety or anger changes body language and decision quality. Recommendation: regain composure while maintaining visual access.', coach:'Primary animal: Elephant. Secondary animal: Golden Retriever. Coach observes stable posture, slower tempo and clear eyes-up reset.', pairings:['Calming Breath','Neutral Error Response','Accept And Continue','Quiet Eye Serve']},
  {category:'🧭 Diagnostic Engine', title:'Challenge: Not Adapting', rule:'Use when the player repeats the same failing solution. Recommendation: observe the pattern and choose a new response.', coach:'Primary animal: Owl. Secondary animal: Eagle. Coach asks: what is the game telling you?', pairings:['Pattern Recognition','Self Diagnose Error','Route Breaker','Tactical Adjustment Challenge']},
  {category:'🧭 Diagnostic Engine', title:'Challenge: Too Predictable', rule:'Use when the player is easy to read or repeats the same rhythm. Recommendation: see alternative possibilities without losing tactical purpose.', coach:'Primary animal: Dolphin. Secondary animal: Eagle. Coach observes exploration linked to information, not random variety.', pairings:['Route Breaker','External Focus','Checkerboard Pair Challenge','Pattern Recognition']},

  {category:'🤝 Hybrid Identity', title:'Eagle + Golden Retriever', rule:'See clearly despite disruption. Best for bad refereeing, aggressive opponents, lucky nicks, mistakes and momentum swings.', coach:'Primary animal: Eagle. Secondary animal: Golden Retriever. Coach observes clear information pickup plus immediate next-ball re-engagement.', pairings:['Second Eye To Opponent','Reset Within 3 Seconds','Centering Breath','Accept And Continue']},
  {category:'🤝 Hybrid Identity', title:'Eagle + Lion', rule:'Recognise and attack. The player sees the opening before committing instead of attacking blindly.', coach:'Primary animal: Eagle. Secondary animal: Lion. Coach observes information-led courage.', pairings:['Quiet Eye Before Attack','Attack Breath','Attack Only On Advantage']},
  {category:'🤝 Hybrid Identity', title:'Tiger + Eagle', rule:'Find weakness and exploit it. The player locks onto the opponent vulnerability and keeps pressure purposeful.', coach:'Primary animal: Tiger. Secondary animal: Eagle. Coach observes pressure directed at what has actually been seen.', pairings:['Recognise Opponent Vulnerability','Opponent Not Recovered To T','Attack Breath']},
  {category:'🤝 Hybrid Identity', title:'Wolf + Eagle', rule:'Disciplined awareness. The player continues reading the right cues while staying with the plan.', coach:'Primary animal: Wolf. Secondary animal: Eagle. Coach observes tactical discipline under pressure.', pairings:['Process Goal Focus','Centering Breath','Opponent Reading']},
  {category:'🤝 Hybrid Identity', title:'Owl + Dolphin', rule:'Creative adaptation. The player recognises what is not working and explores alternatives with purpose.', coach:'Primary animal: Owl. Secondary animal: Dolphin. Coach observes variation based on pattern recognition.', pairings:['Pattern Recognition','Route Breaker','External Focus']},
  {category:'🤝 Hybrid Identity', title:'Elephant + Eagle', rule:'Calm observation under pressure. The player stays composed while continuing to see useful information.', coach:'Primary animal: Elephant. Secondary animal: Eagle. Coach observes slower tempo without visual shutdown.', pairings:['Calming Breath','Quiet Eye Serve','Second Eye To Opponent']},

  {category:'🧠 Agency', title:'Solve Before Asking Coach', rule:'Player must attempt one informed solution before asking the coach for the answer.', coach:'Primary animal: Owl. Secondary animal: Wolf. Coach observes independent problem solving and ownership.', pairings:['Self Diagnose Error','Pattern Recognition','Process Goal Focus']},
  {category:'🧠 Agency', title:'Self Diagnose Error', rule:'After a repeated error, player states what they think caused it before coach feedback.', coach:'Primary animal: Owl. Secondary animal: Eagle. Coach listens for information-based diagnosis rather than self-criticism.', pairings:['Pattern Recognition','Quiet Eye Return','Tactical Adjustment Challenge']},
  {category:'🧠 Agency', title:'Find Another Solution', rule:'If the same tactic fails three times, player must choose a different solution.', coach:'Primary animal: Dolphin. Secondary animal: Owl. Coach observes adaptive exploration instead of repeated failure.', pairings:['Route Breaker','External Focus','Checkerboard Pair Challenge']},
  {category:'🧠 Agency', title:'Tactical Adjustment Challenge', rule:'Between games or rotations, player chooses one adjustment based on what they have seen.', coach:'Primary animal: Owl. Secondary animal: Wolf. Coach asks: what will you change and why?', pairings:['Opponent Reading','Process Goal Focus','Pattern Recognition']},
  {category:'🧠 Agency', title:'Ownership Reset', rule:'Player selects their own reset strategy after pressure or error: breath, cue, visual target or animal lens.', coach:'Primary animal: Golden Retriever. Secondary animal: Elephant. Coach observes self-selected regulation without dependency.', pairings:['Reset Within 3 Seconds','Calming Breath','Centering Breath']},
  {category:'🧠 Agency', title:'Reflection Prompt', rule:'Player answers: what did I see, what did I choose, what will I try next?', coach:'Primary animal: Owl. Secondary animal: Eagle. Coach uses this to develop awareness, ownership and agency.', pairings:['Self Diagnose Error','Tactical Adjustment Challenge','Pattern Recognition']}
]
function UniversalOverlays({setScreen}){
  const [family,setFamily]=useState('Tactical');
  const [selected,setSelected]=useState(null);

  const data = family==='Tactical'
    ? TACTICAL_OVERLAYS
    : family==='Technical'
      ? TECHNICAL_OVERLAYS.map(o=>({
          category:o.category,title:o.title,rule:o.rule,coach:o.process,pairings:o.pairings||[], technical:o
        }))
      : MENTAL_PERFORMANCE_OVERLAYS;

  const categories=['All',...Array.from(new Set(data.map(o=>o.category)))];
  const [category,setCategory]=useState('All');
  useEffect(()=>{setCategory('All');setSelected(null);},[family]);
  const shown=category==='All'?data:data.filter(o=>o.category===category);
  const active=selected||shown[0];

  function isMentalOverlay(overlay){
    return !!overlay && typeof overlay.category==='string' && (
      overlay.category.includes('Identity') ||
      overlay.category.includes('Visual Performance') ||
      overlay.category.includes('Regulation') ||
      overlay.category.includes('Competitive Behaviours') ||
      overlay.category.includes('Diagnostic Engine') ||
      overlay.category.includes('Hybrid Identity') ||
      overlay.category.includes('Agency')
    );
  }

  function extractMentalAnimals(overlay){
    const text=overlay?.coach||'';
    const primary=(text.match(/Primary animal:\s*([^\.]+)/i)||[])[1]?.trim();
    const secondary=(text.match(/Secondary animal:\s*([^\.]+)/i)||[])[1]?.trim();
    return {primary,secondary};
  }

  function cleanMentalCoachText(overlay){
    const text=overlay?.coach||'';
    return text
      .replace(/Primary animal:\s*[^\.]+\.\s*/ig,'')
      .replace(/Secondary animal:\s*[^\.]+\.\s*/ig,'')
      .replace(/\s+/g,' ')
      .trim();
  }

  return <div className="page universalOverlaysPage bottomOverlayPad">
    <div className="pageTop">
      <div>
        <h1>Universal Overlays</h1>
        <p className="mutedText">{family} overlays</p>
      </div>
      <button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button>
    </div>

    {family==='Tactical'&&<div className="universalInfoNote"><strong>Tactical Overlays</strong><span>Use these to shape decisions, advantage recognition and tactical behaviours inside games.</span></div>}
    {family==='Technical'&&<div className="universalInfoNote"><strong>Technical Overlays</strong><span>Use these as observable perception–action constraints, not isolated technique commands.</span></div>}
    {family==='Mental Performance'&&<div className="universalInfoNote visionFirstNote"><strong>Vision First Mental Performance</strong><span>In squash, mental performance begins with information pickup: see → understand → act. Use the diagnostic cards to select an animal, breathing tool and overlay package.</span></div>}

    <div className="overlayCategoryTabs">{categories.map(cat=><button key={cat} className={category===cat?'activeTab':''} onClick={()=>{setCategory(cat);setSelected(null);}}>{cat}</button>)}</div>

    <div className="overlayLayout">
      <div className="overlayList">{shown.map((overlay,index)=><button key={`${overlay.title}-${index}`} className={active?.title===overlay.title?'overlayListCard active':'overlayListCard'} onClick={()=>setSelected(overlay)}>
        <strong>{overlay.title}</strong><span>{overlay.category}</span>
      </button>)}</div>

      {active&&<div className="overlayDetail">
        <span className="categoryTag">{active.category}</span>
        <h2>{active.title}</h2>
        <section><h3>Observable Rule</h3><p>{active.rule}</p></section>
        {active.technical&&<><section><h3>Perception–Action Process</h3><p>{active.technical.process}</p></section>
        <section><h3>Common Coordination Breakdown</h3><p>{active.technical.breakdown}</p></section>
        <section><h3>Constraint / Refereeing Rule</h3><p>{active.technical.constraint}</p></section>
        <section><h3>Checkerboard Applications</h3><p>{active.technical.checkerboard}</p></section></>}
        {!active.technical&&<section><h3>Coach Observation</h3><p>{isMentalOverlay(active)?cleanMentalCoachText(active):active.coach}</p></section>}
        {!active.technical&&isMentalOverlay(active)&&<section><h3>Identify Animal</h3><div className="chipRow animalIdentifyRow">
          {extractMentalAnimals(active).primary&&<span>{extractMentalAnimals(active).primary}</span>}
          {extractMentalAnimals(active).secondary&&<span>{extractMentalAnimals(active).secondary}</span>}
          {!extractMentalAnimals(active).primary&&!extractMentalAnimals(active).secondary&&<span>Coach selection</span>}
        </div></section>}
        <section><h3>{isMentalOverlay(active)?'Suggested Pairings':'Recommended Pairings'}</h3><div className="chipRow">{(active.pairings||[]).map(x=><span key={x}>{x}</span>)}</div></section>
      </div>}
    </div>

    <div className="bottomOverlayTabs" role="navigation" aria-label="Universal overlay families">
      <button className={family==='Technical'?'activeBottomOverlayTab':''} onClick={()=>setFamily('Technical')}>🔧<span>Technical</span></button>
      <button className={family==='Tactical'?'activeBottomOverlayTab':''} onClick={()=>setFamily('Tactical')}>♟<span>Tactical</span></button>
      <button className={family==='Mental Performance'?'activeBottomOverlayTab':''} onClick={()=>setFamily('Mental Performance')}>🧠<span>Mental Performance</span></button>
    </div>
  </div>;
}

function TechnicalOverlays({setScreen}){
  const [category,setCategory]=useState('All');
  const [selected,setSelected]=useState(TECHNICAL_OVERLAYS[0]);
  const categories=['All',...Array.from(new Set(TECHNICAL_OVERLAYS.map(o=>o.category)))];
  const shown=category==='All'?TECHNICAL_OVERLAYS:TECHNICAL_OVERLAYS.filter(o=>o.category===category);
  return <div className="page technicalOverlaysPage">
    <div className="pageTop"><div><h1>Technical Overlays</h1><p className="mutedText">Perception–action constraints layered onto live games, checkerboard codes and conditioned rallies.</p></div><button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button></div>
    <div className="overlayCategoryTabs">{categories.map(cat=><button key={cat} className={category===cat?'activeTab':''} onClick={()=>setCategory(cat)}>{cat}</button>)}</div>
    <div className="overlayLayout">
      <div className="overlayList">{shown.map(overlay=><button key={overlay.id} className={selected.id===overlay.id?'overlayListCard active':'overlayListCard'} onClick={()=>setSelected(overlay)}><strong>{overlay.title}</strong><span>{overlay.category}</span></button>)}</div>
      <div className="overlayDetail"><span className="categoryTag">{selected.category}</span><h2>{selected.title}</h2>
        <section><h3>Observable Rule</h3><p>{selected.rule}</p></section>
        <section><h3>Perception–Action Process</h3><p>{selected.process}</p></section>
        <section><h3>Common Coordination Breakdown</h3><p>{selected.breakdown}</p></section>
        <section><h3>Constraint / Refereeing Rule</h3><p>{selected.constraint}</p></section>
        <section><h3>Checkerboard Applications</h3><p>{selected.checkerboard}</p></section>
        <section><h3>Recommended Overlay Pairings</h3><div className="chipRow">{selected.pairings.map(x=><span key={x}>{x}</span>)}</div></section>
        <section><h3>Best Game Environments</h3><div className="chipRow">{selected.games.map(x=><span key={x}>{x}</span>)}</div></section>
      </div>
    </div>
  </div>;
}




function CoachInvaderSelectorReadOnly({teams}){
  if(!teams||teams.length===0) return null;
  return <section className="coachInvaderSelector">
    <h2>Coach Invader Selection</h2>
    <p>Default order is lowest-ranked player first. Use this order unless the coach/team chooses a tactical invader order.</p>
    <div className="coachInvaderGrid">
      {teams.map((team,index)=>{
        const players=cbSortLowestRankFirst(team.players||[]);
        return <div className="coachInvaderCard" key={team.id||team.name||index}>
          <h3>{team.name||`Team ${index+1}`}</h3>
          <p><strong>Default first invader:</strong> {cbPlayerLabel(players[0])}</p>
          <p>{players.map(cbPlayerLabel).join(' → ')}</p>
        </div>
      })}
    </div>
  </section>;
}


function DoubleBounceTool({setScreen}){
  const rationale=[
    ['Encourages a Move Mindset','Because players know they still have a realistic chance of retrieval after the first bounce, they continue moving, chase more balls and develop persistence behaviours. The athlete shifts from “I can’t get there” toward “I still have a chance.”'],
    ['Improves Short-Ball Judgement','Weak opponents may fail to retrieve poor short balls in normal one-bounce play, creating false success. Double bounce exposes whether a short ball is genuinely effective and encourages better selection, disguise and timing of attack.'],
    ['Makes the Ball Die Quickly','Because opponents may still retrieve after the first bounce, attackers are encouraged to produce softer dying length, tighter front-court control, better height and angle, and improved touch.'],
    ['Extends Rallies for Physical Development','Double bounce naturally increases rally duration, movement volume, recovery demands and repeated acceleration/deceleration while preserving decision-making under fatigue.'],
    ['Supports Hold and Deception Development','Used deliberately, the extra time can support delayed striking, disguise, hold mechanics, opponent manipulation and late racket acceleration. This should be intentional rather than accidental passive play.'],
    ['Improves Recovery Behaviour','Players learn that rallies continue longer and retrieval remains possible, encouraging continued recovery effort, reorganisation after poor shots and persistence under pressure.'],
    ['More Representative Than Feeding','Double bounce keeps live opposition, uncertainty, tactical interaction, movement adaptation and perception-action coupling while reducing time pressure.']
  ];
  return <div className="page doubleBounceToolPage">
    <div className="pageTop">
      <div><h1>Double Bounce</h1><p className="mutedText">Development constraint · rally extender · tactical intelligence tool</p></div>
    <MentalOverlaySelector context="Double Bounce"/>

      <button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button>
    </div>
    <section className="doubleBounceHero">
      <span className="categoryTag">Major Tool</span>
      <h2>Double Bounce Conditioned Games</h2>
      <p>Selected players may use two bounces before returning the ball. The second bounce is a developmental constraint rather than simply a way of making the game easier.</p>
    </section>
    <section className="protocolGrid">
      <div className="protocolCard"><h3>Core Protocol</h3><p>Allow selected players to use two bounces before returning. The coach can apply this to one player, both players, a team, a rotation role or a specific game phase.</p></div>
      <div className="protocolCard warningCard"><h3>Important Principle</h3><p>Double bounce should not encourage passive holding unless the objective is deception, disguise, late contact manipulation or hold development.</p></div>
      <div className="protocolCard"><h3>Player Intention</h3><p>Players should still move dynamically, intercept early where appropriate, maintain rally flow and apply tactical pressure. The objective is not delayed play.</p></div>
    </section>
    <section className="dbSection">
      <h2>Development Rationale</h2>
      <div className="rationaleGrid">{rationale.map((item,index)=><div className="rationaleCard" key={item[0]}><span>{index+1}</span><h3>{item[0]}</h3><p>{item[1]}</p></div>)}</div>
    </section>
    <section className="dbTwoCol">
      <div className="protocolCard"><h3>Encourage</h3><ul><li>active movement</li><li>persistence and recovery effort</li><li>tactical patience</li><li>quality short-ball construction</li><li>rally flow and pressure</li></ul></div>
      <div className="protocolCard warningCard"><h3>Discourage</h3><ul><li>standing and waiting</li><li>passive holding</li><li>artificially slowing rallies</li><li>non-competitive movement</li><li>delay behaviours unless deception is the aim</li></ul></div>
    </section>
    <section className="dbSection"><h2>Best Uses</h2><div className="chipRow">{['Junior development','Mixed-level groups','Movement confidence','Front-court development','Tactical patience','Conditioning phases','Deception progressions','Extending rally quality','Reducing panic behaviours'].map(x=><span key={x}>{x}</span>)}</div></section>
    <section className="claPanel"><h2>CLA Perspective</h2><p>Double bounce changes the temporal constraint, retrieval affordances, tactical possibilities and pressure landscape without removing opponent interaction, uncertainty, movement adaptation or tactical decision-making.</p><p>This allows players to develop functional movement and tactical behaviours inside representative play.</p></section>
  </div>;
}






const UNIVERSAL_MENTAL_OVERLAYS = [
  {cat:'Attention', name:'Quiet Eye Before Serve', rule:'Target → Ball → Target → Ball → Strike. Elite: Target → Ball → Strike. Primary: Eagle. Secondary: Wolf.'},
  {cat:'Attention', name:'Quiet Eye Before Attack', rule:'Stabilise gaze on target/space before attack. See the opportunity, then commit. Primary: Eagle. Secondary: Lion.'},
  {cat:'Attention', name:'Second Eye To Opponent', rule:'After contact, visually reconnect with opponent information. Primary: Eagle. Secondary: Golden Retriever.'},
  {cat:'Attention', name:'External Target Focus', rule:'Use ball, target, space or opponent information rather than internal technical chatter. Primary: Eagle. Secondary: Lion.'},
  {cat:'Attention', name:'Tracking', rule:'Track ball flight to predict trajectory, bounce, speed, interception point and time. Primary: Eagle. Secondary: Cheetah.'},
  {cat:'Attention', name:'Opponent Awareness', rule:'Read opponent position, movement direction and recovery status before choosing. Primary: Eagle. Secondary: Owl.'},
  {cat:'Attention', name:'Pattern Recognition', rule:'Notice repeated opponent habits and repeated success/failure patterns. Primary: Owl. Secondary: Eagle.'},
  {cat:'Attention', name:'Early Pick-Up', rule:'Read body, racquet and movement cues before ball contact. Primary: Cheetah. Secondary: Eagle.'},
  {cat:'Breathing', name:'Long Exhale Before Serve', rule:'Calm Breath: inhale 4 seconds → exhale 6–8 seconds → repeat 3 cycles. Primary: Elephant. Secondary: Golden Retriever.'},
  {cat:'Breathing', name:'Breath Before Serve', rule:'Centering Breath: inhale 3 seconds → hold 3 seconds → exhale 3 seconds → repeat 3 cycles. Primary: Eagle. Secondary: Wolf.'},
  {cat:'Breathing', name:'Attack Breath', rule:'One 1-second activation inhale → one 1-second forceful exhale → attack. Primary: Lion. Secondary: Eagle.'},
  {cat:'Breathing', name:'Activation Breath', rule:'Inhale 1 second → forceful exhale 1 second → repeat 2–3 times. Total 4–6 seconds. Primary: Lion. Secondary: Cheetah.'},
  {cat:'Reset', name:'Reset Within 3 Seconds', rule:'After error/lost rally: breathe, cue word, eyes up, ready posture within 3 seconds. Primary: Golden Retriever. Secondary: Elephant.'},
  {cat:'Reset', name:'Cue Word After Error', rule:'Use one short cue word after error, then reconnect to ball/opponent. Primary: Golden Retriever. Secondary: Wolf.'},
  {cat:'Competitive Behaviour', name:'No Admiring Shots', rule:'After every shot, visually reconnect and recover immediately. Primary: Eagle. Secondary: Golden Retriever.'},
  {cat:'Competitive Behaviour', name:'Full Recovery After Every Shot', rule:'Attempt recovery even after poor shots or apparent winners. Primary: Golden Retriever. Secondary: Wolf.'},
  {cat:'Competitive Behaviour', name:'Compete To Last Ball', rule:'Continue effort until rally is definitely over. Primary: Golden Retriever. Secondary: Tiger.'},
  {cat:'Emotional Regulation', name:'Neutral Error Response', rule:'After error, show neutral body language and immediate next-ball readiness. Primary: Elephant. Secondary: Golden Retriever.'},
  {cat:'Emotional Regulation', name:'Accept And Continue', rule:'After bad call, bad bounce or disruption, accept and return attention to the next ball. Primary: Golden Retriever. Secondary: Elephant.'},
  {cat:'Tactical Awareness', name:'Recognise Opponent Vulnerability', rule:'Attack only when opponent is off-balance, late, unrecovered or out of position. Primary: Eagle. Secondary: Tiger.'},
  {cat:'Tactical Awareness', name:'Attack Only On Advantage', rule:'Attack only after a clear pressure cue or positional advantage. Primary: Lion. Secondary: Eagle.'},
  {cat:'Agency', name:'Solve Before Asking Coach', rule:'Player attempts one tactical or attentional solution before coach intervenes. Primary: Owl. Secondary: Wolf.'},
  {cat:'Agency', name:'Self Diagnose Error', rule:'Player names the likely cause before receiving coach feedback. Primary: Owl. Secondary: Eagle.'},
  {cat:'Agency', name:'Find Another Solution', rule:'If a tactic fails three times, player must try an alternative. Primary: Dolphin. Secondary: Owl.'},
  {cat:'Agency', name:'Ownership Reset', rule:'Player selects their own reset strategy and applies it without coach prompt. Primary: Golden Retriever. Secondary: Owl.'}
]

function cbPlayerRankValue(player){
  if(!player || typeof player==='string') return 9999;
  const raw=player.juniorRanking ?? player.ranking ?? player.rank ?? player.seed ?? player.level ?? player.rating;
  const n=Number(raw);
  return (!Number.isNaN(n) && n>0) ? n : 9999;
}
function cbPlayerLabel(player){
  if(!player) return 'Player';
  if(typeof player==='string') return player;
  return player.name || player.fullName || player.playerName || 'Player';
}
function cbSortLowestRankFirst(players){
  return [...(players||[])].sort((a,b)=>cbPlayerRankValue(b)-cbPlayerRankValue(a));
}
function cbFairLivesRows(teams,multiplier=2){
  try{
    if(typeof getFairLivesRows==='function') return getFairLivesRows(teams,multiplier);
  }catch(e){}
  const list=(teams||[]).filter(t=>(t.players||[]).length>0);
  const counts=list.map(t=>(t.players||[]).length).filter(Boolean);
  const gcd=(a,b)=>{a=Math.abs(Number(a)||0);b=Math.abs(Number(b)||0);while(b){const t=b;b=a%b;a=t;}return a||1;};
  const lcm=(a,b)=>{a=Math.abs(Number(a)||0);b=Math.abs(Number(b)||0);if(!a||!b)return Math.max(a,b,1);return Math.abs(a*b)/gcd(a,b);};
  const base=counts.reduce((acc,n)=>lcm(acc,n),counts[0]||1);
  return {lcmBase:base,multiplier,rows:list.map((team,index)=>{
    const players=(team.players||[]).length||1;
    const livesPerPlayer=(base/players)*multiplier;
    return {team:team.name||`Team ${index+1}`,teamId:team.id,players,livesPerPlayer,totalCapacity:livesPerPlayer*players};
  })};
}
function cbFairLivesForTeam(team,teams,startingLives=5,multiplier=2){
  const fair=cbFairLivesRows(teams,multiplier);
  const row=(fair.rows||[]).find(r=>r.teamId===team?.id || r.team===team?.name);
  return row ? row.livesPerPlayer : Number(startingLives||5);
}
function cbDefaultInvader(team){
  return cbSortLowestRankFirst(team?.players||[])[0];
}


function MentalOverlaySelector({context='Game'}){
  const [mode,setMode]=useState('single');
  const [selected,setSelected]=useState([]);
  const limit=mode==='single'?1:mode==='pair'?2:3;
  function toggleOverlay(name){
    if(selected.includes(name)){
      setSelected(selected.filter(x=>x!==name));
      return;
    }
    if(selected.length>=limit){
      setSelected([...selected.slice(1),name]);
    }else{
      setSelected([...selected,name]);
    }
  }
  const active=UNIVERSAL_MENTAL_OVERLAYS.filter(o=>selected.includes(o.name));
  return <section className="mentalOverlaySelector">
    <div className="sectionHead">
      <div>
        <h2>Mental Overlays</h2>
        <p>Observable performance behaviours for {context}. Select single, pair or triple.</p>
      </div>
      <div className="overlayModeButtons">
        <button className={mode==='single'?'activeMode':''} onClick={()=>{setMode('single');setSelected(selected.slice(0,1));}}>Single</button>
        <button className={mode==='pair'?'activeMode':''} onClick={()=>{setMode('pair');setSelected(selected.slice(0,2));}}>Pair</button>
        <button className={mode==='triple'?'activeMode':''} onClick={()=>setMode('triple')}>Triple</button>
      </div>
    </div>
    <div className="mentalOverlayChips">
      {UNIVERSAL_MENTAL_OVERLAYS.map(o=><button key={o.name} className={selected.includes(o.name)?'selectedOverlay':''} onClick={()=>toggleOverlay(o.name)}>
        <strong>{o.name}</strong><span>{o.cat}</span>
      </button>)}
    </div>
    <div className="activeOverlayPanel">
      <h3>Active Overlay Rules</h3>
      {active.length===0?<p>No mental overlays selected.</p>:active.map(o=><div className="activeOverlayRule" key={o.name}><strong>{o.name}</strong><p>{o.rule}</p></div>)}
    </div>
  </section>;
}






function OverlayFamilyTabs({selectedOverlays=[],onToggle,context='Competition'}){
  const [family,setFamily]=useState('Tactical');

  const technicalOptions=TECHNICAL_OVERLAYS.map(o=>({name:o.title,category:o.category,rule:o.rule,coach:o.process}));
  const tacticalOptions=TACTICAL_OVERLAYS.map(o=>({name:o.title,category:o.category,rule:o.rule,coach:o.coach}));
  const mentalOptions=UNIVERSAL_MENTAL_OVERLAYS.map(o=>({name:o.name,category:o.cat,rule:o.rule,coach:o.rule}));
  const source = family==='Technical' ? technicalOptions : family==='Tactical' ? tacticalOptions : mentalOptions;
  const allOptions=[...technicalOptions,...tacticalOptions,...mentalOptions];
  const active = selectedOverlays.map(name=>allOptions.find(o=>o.name===name)||{name,category:'Overlay',rule:'Legacy overlay selected.',coach:''});

  return <div className="overlayFamilyEngine">
    <div className="overlayFamilyTabs">
      <button type="button" className={family==='Technical'?'activeFamilyTab':''} onClick={()=>setFamily('Technical')}>🔧 Technical</button>
      <button type="button" className={family==='Tactical'?'activeFamilyTab':''} onClick={()=>setFamily('Tactical')}>♟ Tactical</button>
      <button type="button" className={family==='Mental Performance'?'activeFamilyTab':''} onClick={()=>setFamily('Mental Performance')}>🧠 Mental Performance</button>
    </div>

    <p className="overlayExplain">Select {family.toLowerCase()} overlays for {context}. Selected overlays continue to feed the Active Overlay Rules section and projection text.</p>

    <div className="mentalOverlayChips overlayFamilyChips">
      {source.map(o=><button key={`${family}-${o.name}`} type="button" className={selectedOverlays.includes(o.name)?'selectedOverlay':''} onClick={()=>onToggle(o.name)}>
        <strong>{o.name}</strong><span>{o.category}</span>
      </button>)}
    </div>

    <div className="activeOverlayPanel">
      <h3>Active Overlay Rules</h3>
      {active.length===0
        ? <p>No overlays selected.</p>
        : active.map(o=><div className="activeOverlayRule" key={o.name}><strong>{o.name}</strong><p>{o.rule}</p></div>)}
    </div>
  </div>;
}

function MentalSkillsPlaceholder({setScreen}){
  const [section,setSection]=useState('menu');
  const [selectedAnimal,setSelectedAnimal]=useState(null);
  const [visualTopic,setVisualTopic]=useState('overview');
  const [diagnosticChallenge,setDiagnosticChallenge]=useState('Too distracted / bad calls / aggressive opponent');
  const [custom,setCustom]=useState(()=>{try{return JSON.parse(localStorage.getItem('checkerboard_custom_animal')||'{}')}catch(e){return {}}});

  const animals=[
    {emoji:'🦅',name:'Eagle',core:'Awareness & Information Pickup',vision:'Scan opponent, ball, target, space and time before acting.',strategy:'Performs by seeing early, rising above chaos and choosing from useful information.',behaviours:['Scan before acting','Read opponent cues','Recognise opportunities','Stay visually connected'],activation:['Head-up ghosting','Scan before moving','Opponent-reading knock-up'],breakdown:['Ball-only attention','Late recognition','Gets drawn into chaos','Moves before seeing'],cue:'See first.',overlays:['Quiet Eye Before Attack','Second Eye To Opponent','Opponent Reading','Tracking']},
    {emoji:'🐕',name:'Golden Retriever',core:'Resilience & Attention Re-Capture',vision:'Reconnect eyes to ball, opponent and task after every distraction.',strategy:'Performs by ignoring bad calls, aggressive opponents, lucky nicks and external noise, then chasing the next ball with non-aggressive persistence.',behaviours:['Ignore distractions and controversy','Return attention to next ball','Maintain visual connection','Recover without complaint','Persistent non-aggressive effort'],activation:['Recover after every ghost','Chase every feed','Reset without complaint'],breakdown:['Complains','Dwells on errors','Stops chasing','Reacts to opponent or referee'],cue:'Next ball.',overlays:['Reset Within 3 Seconds','Accept And Continue','Neutral Error Response','Compete To Last Ball']},
    {emoji:'🐈',name:'Cat',core:'Patience & Timing',vision:'Wait until enough information appears before striking.',strategy:'Performs by observing carefully, staying balanced and attacking only when the moment is right.',behaviours:['Observe before acting','Stay balanced','Wait for real opportunity','Strike efficiently'],activation:['Smooth ghosting','Pause-scan-accelerate','Controlled feed and strike'],breakdown:['Rushes attacks','Forces low-percentage shots','Moves before seeing'],cue:'See before you strike.',overlays:['Width Before Attack','Quiet Eye Before Attack','External Target Focus']},
    {emoji:'🦁',name:'Lion',core:'Courage & Commitment',vision:'Recognise the attacking opportunity and commit immediately.',strategy:'Performs by stepping forward when genuine advantage appears.',behaviours:['Commit to opportunity','Take initiative','Show courage under pressure','No hesitation when advantage is clear'],activation:['Strong posture','Assertive first movement','Activation breath then attack'],breakdown:['Hesitates','Waits for opponent mistakes','Shrinks from opportunity'],cue:'Be brave.',overlays:['Attack Only On Advantage','Attack Breath','Quiet Eye Before Attack']},
    {emoji:'🐅',name:'Tiger',core:'Predatory Pressure',vision:'Lock onto opponent vulnerability and keep pressure on it.',strategy:'Performs by finding a weakness and hunting it with sustained pressure.',behaviours:['Identify vulnerability','Sustain pressure','Capitalise on weak recovery','Attack with purpose'],activation:['Explosive ghosting','Fast first step','Targeted feed-and-strike'],breakdown:['Creates chances but lets pressure drop','Attacks without seeing vulnerability','Forces random aggression'],cue:'Find it. Hunt it.',overlays:['Recognise Opponent Vulnerability','Activation Breath','Attack Only On Advantage']},
    {emoji:'🐺',name:'Wolf',core:'Discipline & Tactical Intelligence',vision:'Keep watching the cues linked to the tactical plan.',strategy:'Performs by staying with the plan and making intelligent decisions under pressure.',behaviours:['Follow the plan','Build pressure','Stay disciplined','Make intelligent choices'],activation:['Ghost tactical patterns','Vary pace with purpose','Feed and strike into planned targets'],breakdown:['Over-attacks','Forgets plan','Gets emotional','Changes plan without information'],cue:'Stay with the plan.',overlays:['Process Goal Focus','Route Breaker','Attack Only On Advantage']},
    {emoji:'🐆',name:'Cheetah',core:'Speed & Early Pick-Up',vision:'See early so movement starts early.',strategy:'Performs by recognising information sooner and moving before time disappears.',behaviours:['Early visual pickup','Explosive first movement','Ready before the bounce','Fast intercept intent'],activation:['Fast split-step games','Early pickup feeds','1-second activation breath'],breakdown:['Late movement','Flat-footed waiting','Moves after bounce only'],cue:'Move now.',overlays:['Tracking','Early Pick-Up','Activation Breath']},
    {emoji:'🐘',name:'Elephant',core:'Composure & Stability',vision:'Keep attention stable when pressure or emotion rises.',strategy:'Performs by staying steady and protecting the next useful action.',behaviours:['Stay composed','Keep routines','Slow the panic response','Protect process goals'],activation:['Stable ghosting','Deliberate reset','Calm breathing'],breakdown:['Panics after errors','Chases score','Overreacts emotionally'],cue:'Nothing changes.',overlays:['Calming Breath','Neutral Error Response','Accept And Continue']},
    {emoji:'🦉',name:'Owl',core:'Adaptation & Problem Solving',vision:'Recognise patterns, repeated errors and alternative solutions.',strategy:'Performs by observing what the game is telling them and adjusting.',behaviours:['Analyse patterns','Adapt behaviour','Self-diagnose','Change solution when needed'],activation:['Pattern recognition games','Between-rally self-question','Route change challenges'],breakdown:['Repeats same error','Waits for coach answer','Cannot adjust tactically'],cue:'Find the solution.',overlays:['Pattern Recognition','Self Diagnose Error','Find Another Solution']},
    {emoji:'🐬',name:'Dolphin',core:'Creativity & Alternatives',vision:'See possibilities others miss.',strategy:'Performs by exploring disguise, variety and unexpected solutions without becoming random.',behaviours:['Explore alternatives','Use disguise','Change rhythm','Create options'],activation:['Route breaker games','Disguise feeds','Checkerboard choice tasks'],breakdown:['Predictable patterns','No variety','Creativity without purpose'],cue:'What else is possible?',overlays:['Route Breaker','External Target Focus','Checkerboard Pair Challenge']}
  ];

  const menu=[
    ['🐾 Performance Identity','Animals, custom identity, survival strategy and observable behaviours','identity'],
    ['🧭 Animal Diagnostic Engine','Choose the player challenge and get animal, breath and overlay recommendations','diagnostic'],
    ['👁 Visual Performance','Quiet Eye, tracking, opponent reading, second eye and external focus','visual'],
    ['🚀 Pre-Performance Preparation','Identity, cue statement, breathing, process goal and greatest hits video','ppp'],
    ['🏃 Activation & Calibration','Ghosting, animal ghosting, coach feed & strike and court-available options','activation'],
    ['👁 Court Calibration','Official knock-up, opponent observation, Quiet Eye and information gathering','court'],
    ['🎯 Cue Statements','Animal-linked cues and custom performance cues','cues'],
    ['🫁 Breathing & Regulation','Calm (4 in / 6-8 out x3), Centre (3-3-3 x3), Activate (1 in / 1 out x2-3)','breathing'],
    ['🎬 Greatest Hits Videos','Performance identity reinforcement for players, parents and coaches','greatest'],
    ['🎮 Mental Overlays','Use Universal Overlays to apply mental performance behaviours inside games','overlays'],['📈 Player Mental Profile','Track attention, regulation, recovery, identity and agency development','profile']
  ];

  const visualTopics=[
    ['overview','👁 Overview','Visual performance is directing attention to information that supports successful action: ball, opponent, target, space and time.'],
    ['quiet','👁 Quiet Eye','Quiet Eye is the final fixation or tracking gaze directed toward task-relevant information before movement execution. It is not just targeting.'],
    ['tracking','🎾 Tracking','Tracking is continuous visual monitoring of the ball to predict trajectory, bounce, speed, available time and interception point.'],
    ['opponent','👤 Opponent Information Pickup','Read racquet preparation, shoulder orientation, balance, movement direction, recovery state and court position.'],
    ['second','👀 Second Eye','Maintain access to opponent information while interacting with the ball. Avoid ball-only attention.'],
    ['external','🎯 External Focus','Focus on ball, target, space or opponent rather than wrist, elbow or swing mechanics unless used temporarily as a correction.']
  ];

  const diagnosticItems=[
    {challenge:'Too distracted / bad calls / aggressive opponent',animal:'🐕 Golden Retriever',hybrid:'Golden Retriever + Eagle',breath:'Centre Breath: inhale 3 sec → hold 3 sec → exhale 3 sec × 3 cycles',process:'Return attention to the next ball within 3 seconds.',ppp:'Stage 1 Solution Activation: watch a mental resilience highlight. Stage 3 Squash Activation: chase every feed and reset immediately.',overlays:['Reset Within 3 Seconds','Accept And Continue','Second Eye To Opponent','Compete To Last Ball'],reflection:'What is the next ball asking me to do?',why:'The player is losing useful information to distractions. Golden Retriever restores resilient attention; Eagle keeps the player seeing ball, opponent and task.'},
    {challenge:'Not observing enough',animal:'🦅 Eagle',hybrid:'Eagle + Owl',breath:'Centre Breath: inhale 3 sec → hold 3 sec → exhale 3 sec × 3 cycles',process:'See first, then act.',ppp:'Stage 3 Squash Activation: tracking feeds, call high/low or short/long before striking. Stage 4 Official Warm-Up: gather information about volley, height and movement.',overlays:['Quiet Eye Before Attack','Opponent Reading','Tracking','Second Eye To Opponent'],reflection:'What information did I miss?',why:'The player needs better information pickup before decisions. Eagle prioritises vision; Owl supports pattern recognition and adaptation.'},
    {challenge:'Rushing decisions',animal:'🐈 Cat',hybrid:'Cat + Eagle',breath:'Centre Breath: inhale 3 sec → hold 3 sec → exhale 3 sec × 3 cycles',process:'Wait until the opportunity is visible.',ppp:'Stage 3 Squash Activation: controlled hand feeds with pause-scan-strike. Stage 4 Official Warm-Up: notice whether opponent rushes or gives time.',overlays:['Quiet Eye Before Attack','External Target Focus','Width Before Attack'],reflection:'Did I wait until I saw the opportunity?',why:'Rushing often comes from acting before enough information is available. Cat waits; Eagle sees.'},
    {challenge:'Too passive / hesitant',animal:'🦁 Lion',hybrid:'Lion + Eagle',breath:'Activate Breath: inhale 1 sec → forceful exhale 1 sec × 2–3 repetitions',process:'Recognise advantage and commit.',ppp:'Stage 3 Squash Activation: attacking volleys, front-court movement and strike, activation breath before attack.',overlays:['Attack Only On Advantage','Attack Breath','Compete To Last Ball','Quiet Eye Before Attack'],reflection:'Did I recognise and commit?',why:'The player is not acting on opportunity. Lion adds commitment; Eagle ensures the attack is based on information rather than blind aggression.'},
    {challenge:'Not converting pressure',animal:'🐅 Tiger',hybrid:'Tiger + Eagle',breath:'Activate Breath: inhale 1 sec → forceful exhale 1 sec × 2–3 repetitions',process:'Find vulnerability and keep pressure on it.',ppp:'Stage 3 Squash Activation: targeted feed-and-strike; choose one weakness to pressure. Stage 4 Official Warm-Up: identify forehand/backhand/volley vulnerability.',overlays:['Recognise Opponent Vulnerability','Attack Only On Advantage','Quiet Eye Before Attack'],reflection:'What weakness did I keep pressure on?',why:'The player may create openings but let pressure disappear. Tiger sustains pressure; Eagle identifies the target.'},
    {challenge:'Undisciplined / abandoning plan',animal:'🐺 Wolf',hybrid:'Wolf + Eagle',breath:'Centre Breath: inhale 3 sec → hold 3 sec → exhale 3 sec × 3 cycles',process:'Stay with the agreed plan until information says change.',ppp:'Stage 1 Solution Activation: review one tactical highlight. Stage 3 Squash Activation: hit planned targets repeatedly under light randomness.',overlays:['Process Goal Focus','Attack Only On Advantage','Route Breaker'],reflection:'What was my plan and did I stay with it?',why:'The player needs disciplined attention and tactical consistency. Wolf stays with the plan; Eagle monitors whether the plan is still appropriate.'},
    {challenge:'Slow reactions / late movement',animal:'🐆 Cheetah',hybrid:'Cheetah + Eagle',breath:'Activate Breath: inhale 1 sec → forceful exhale 1 sec × 2–3 repetitions',process:'See early. Move early.',ppp:'Stage 3 Squash Activation: random hand feeds, early pickup calls and movement-before-bounce tasks.',overlays:['Early Pick-Up','Tracking','Move Before Bounce'],reflection:'What could I see earlier?',why:'Late movement is often late information pickup. Cheetah creates action readiness; Eagle improves early visual detection.'},
    {challenge:'Too emotional / frustrated',animal:'🐘 Elephant',hybrid:'Elephant + Golden Retriever',breath:'Calm Breath: inhale 4 sec → exhale 6–8 sec × 3 cycles',process:'Nothing changes; return to the next useful action.',ppp:'Stage 1 Solution Activation: mental highlight showing calm recovery. Stage 2 General Warm-Up: slow tempo breathing and mobility.',overlays:['Neutral Error Response','Accept And Continue','Reset Within 3 Seconds'],reflection:'What matters now?',why:'The player is carrying emotion into the next rally. Elephant stabilises; Golden Retriever re-engages despite disruption.'},
    {challenge:'Not adapting',animal:'🦉 Owl',hybrid:'Owl + Dolphin',breath:'Centre Breath: inhale 3 sec → hold 3 sec → exhale 3 sec × 3 cycles',process:'Observe the pattern and change the solution.',ppp:'Stage 4 Official Warm-Up: identify one opponent pattern and one tactical opportunity before the match starts.',overlays:['Pattern Recognition','Find Another Solution','Route Breaker'],reflection:'What is the game telling me?',why:'The player is repeating ineffective solutions. Owl diagnoses patterns; Dolphin creates alternatives.'},
    {challenge:'Too predictable',animal:'🐬 Dolphin',hybrid:'Dolphin + Eagle',breath:'Centre Breath or Activate Breath depending on state',process:'See alternatives and vary with purpose.',ppp:'Stage 3 Squash Activation: route-breaker feeds, disguise options and two-choice striking tasks.',overlays:['Route Breaker','External Target Focus','Checkerboard Pair Challenge'],reflection:'What else is possible?',why:'Predictability is reduced when players see more possibilities. Dolphin explores; Eagle keeps creativity attached to information.'}
  ];

  const selectedDiagnostic=diagnosticItems.find(item=>item.challenge===diagnosticChallenge)||diagnosticItems[0];

  function saveCustom(){
    localStorage.setItem('checkerboard_custom_animal',JSON.stringify(custom));
    alert('Custom animal saved.');
  }

  function SquashBallGraphic(){
    return <div className="squashBallGraphic">
      <div className="trajectoryArc"></div>
      <div className="squashBallCore">●</div>
      <span className="trackLabel labelTrajectory">Trajectory</span>
      <span className="trackLabel labelBounce">Bounce</span>
      <span className="trackLabel labelSpeed">Speed</span>
      <span className="trackLabel labelIntercept">Interception</span>
      <div className="bounceDot"></div>
      <div className="interceptDot"></div>
    </div>;
  }

  const activeAnimal=selectedAnimal?animals.find(a=>a.name===selectedAnimal):null;

  return <div className="page mentalPerformancePage">
    <div className="pageTop">
      <div><h1>Mental Performance</h1><p className="mutedText">Survive • Prosper • Perform</p></div>
      <button className="secondaryBtn" onClick={()=>activeAnimal?setSelectedAnimal(null):section==='menu'?setScreen('home'):setSection('menu')}>{activeAnimal?'Animals':section==='menu'?'Home':'Back'}</button>
    </div>

    {activeAnimal&&<div className="animalFullPage">
      <div className="animalHero"><div className="animalEmoji">{activeAnimal.emoji}</div><div><h2>{activeAnimal.name}</h2><h3>{activeAnimal.core}</h3><p>{activeAnimal.strategy}</p></div></div>
      <div className="mentalGrid">
        <div className="mentalCard visionFirstCard"><h3>Vision Priority</h3><p>{activeAnimal.vision}</p></div>
        <div className="mentalCard"><h3>Observable Behaviours</h3>{activeAnimal.behaviours.map(x=><p key={x}>✓ {x}</p>)}</div>
        <div className="mentalCard"><h3>Activation Exercises</h3>{activeAnimal.activation.map(x=><p key={x}>• {x}</p>)}</div>
        <div className="mentalCard"><h3>Breakdown Behaviours</h3>{activeAnimal.breakdown.map(x=><p key={x}>✗ {x}</p>)}</div>
        <div className="mentalCard"><h3>Recovery Cue</h3><p className="largeCue">“{activeAnimal.cue}”</p></div>
      </div>
      <div className="overlaySuggestionBox"><h3>Suggested Overlays</h3><div className="chipRow">{activeAnimal.overlays.map(x=><span key={x}>{x}</span>)}</div></div>
    </div>}

    {!activeAnimal&&section==='menu'&&<div>
      <div className="mentalPhilosophyBox"><h2>Vision First: See → Understand → Act</h2><p>In squash, mental performance begins with information pickup. Time is limited, so players must keep seeing useful information: ball, opponent, target, space and time. Better information creates better decisions, better regulation and greater agency.</p></div>
      <div className="mentalMenuGrid">{menu.map(item=><button key={item[2]} className="mentalMenuCard" onClick={()=>setSection(item[2])}><h2>{item[0]}</h2><p>{item[1]}</p></button>)}</div>
    </div>}

    {!activeAnimal&&section==='diagnostic'&&<div className="mentalContentPanel diagnosticMentalEngine">
      <h2>🧭 Animal Diagnostic Engine</h2>
      <p><strong>Question:</strong> What is the player's biggest challenge today?</p>
      <p className="mutedText">Select one challenge to generate a practical animal, hybrid, breathing, overlay and PPP recommendation. The animal is a performance lens, not a personality label.</p>

      <div className="diagnosticChallengeTabs">
        {diagnosticItems.map(item=><button key={item.challenge} className={diagnosticChallenge===item.challenge?'activeDiagnosticChallenge':''} onClick={()=>setDiagnosticChallenge(item.challenge)}>{item.challenge}</button>)}
      </div>

      <div className="diagnosticRecommendationHero">
        <div className="diagnosticAnimalBlock">
          <span>Recommended Animal</span>
          <strong>{selectedDiagnostic.animal}</strong>
          <em>{selectedDiagnostic.hybrid}</em>
        </div>
        <div className="diagnosticAnimalBlock">
          <span>Recommended Breath</span>
          <strong>{selectedDiagnostic.breath}</strong>
        </div>
      </div>

      <div className="mentalGrid">
        <div className="mentalCard"><h3>Process Goal</h3><p>{selectedDiagnostic.process}</p></div>
        <div className="mentalCard"><h3>PPP Emphasis</h3><p>{selectedDiagnostic.ppp}</p></div>
        <div className="mentalCard"><h3>Reflection Question</h3><p>{selectedDiagnostic.reflection}</p></div>
        <div className="mentalCard"><h3>Why This Recommendation?</h3><p>{selectedDiagnostic.why}</p></div>
      </div>

      <div className="overlaySuggestionBox">
        <h3>Recommended Overlay Package</h3>
        <div className="chipRow">{selectedDiagnostic.overlays.map(x=><span key={x}>{x}</span>)}</div>
      </div>

      <div className="mentalCard" style={{marginTop:'20px'}}>
        <h2>Animal Pairings</h2>
        <p><strong>🦅 Eagle + 🦮 Golden Retriever</strong> — Awareness Under Distraction</p>
        <p><strong>🦅 Eagle + 🐺 Wolf</strong> — Observe & Stay Disciplined</p>
        <p><strong>🦁 Lion + 🦅 Eagle</strong> — Recognise & Commit</p>
        <p><strong>🐱 Cat + 🦅 Eagle</strong> — Patience & Recognition</p>
        <p><strong>🦉 Owl + 🐬 Dolphin</strong> — Adapt & Create</p>
        <p><strong>🐆 Cheetah + 🦅 Eagle</strong> — See Early, Move Early</p>
        <p><strong>🐘 Elephant + 🦮 Golden Retriever</strong> — Calm Resilience</p>
      </div>
    </div>}

    {!activeAnimal&&section==='profile'&&<div className="mentalContentPanel">
      <h2>📈 Player Mental Profile</h2>
      <div className="mentalGrid">
        <div className="mentalCard"><h3>Attention</h3><p>1–5 Rating</p></div>
        <div className="mentalCard"><h3>Regulation</h3><p>1–5 Rating</p></div>
        <div className="mentalCard"><h3>Recovery</h3><p>1–5 Rating</p></div>
        <div className="mentalCard"><h3>Competitive Identity</h3><p>1–5 Rating</p></div>
        <div className="mentalCard"><h3>Agency</h3><p>1–5 Rating</p></div>
        <div className="mentalCard"><h3>Profile Notes</h3><p>Primary Animal • Secondary Animal • Preferred Breath • PPP Preference • Coach Notes</p></div>
      </div>
    </div>}

    {!activeAnimal&&section==='identity'&&<div>
      <h2 className="sectionTitle">🐾 Performance Identity</h2>
      <p className="mutedText">The animal is not the intervention. It is a memorable way to connect identity to observable performance behaviours.</p>
      <div className="animalGrid">{animals.map(a=><button className="animalCard animalButtonCard" key={a.name} onClick={()=>setSelectedAnimal(a.name)}>
        <div className="animalEmoji">{a.emoji}</div><h2>{a.name}</h2><h3>{a.core}</h3><p>{a.strategy}</p><p><strong>Cue:</strong> “{a.cue}”</p>
      </button>)}</div>
      <div className="customAnimalBox"><h2>➕ Create Your Own Animal</h2><p>Choose an animal that fits the player. The key question is: why did you choose it?</p>
        <div className="customAnimalGrid"><input placeholder="Animal" value={custom.animal||''} onChange={e=>setCustom({...custom,animal:e.target.value})}/><input placeholder="Cue phrase" value={custom.cue||''} onChange={e=>setCustom({...custom,cue:e.target.value})}/><textarea placeholder="Why did you choose this animal?" value={custom.why||''} onChange={e=>setCustom({...custom,why:e.target.value})}/><textarea placeholder="What behaviours should a coach see?" value={custom.behaviours||''} onChange={e=>setCustom({...custom,behaviours:e.target.value})}/></div>
        <button className="primaryBtn" onClick={saveCustom}>Save Custom Animal</button>
      </div>
    </div>}

    {!activeAnimal&&section==='visual'&&<div className="mentalContentPanel visualPerformancePanel">
      <h2>👁 Visual Performance</h2><p><strong>Vision First:</strong> squash decisions are limited by the information players detect. Coach the eyes so the action has better information to solve from.</p>
      <div className="visualTopicTabs">{visualTopics.map(t=><button key={t[0]} className={visualTopic===t[0]?'activeVisualTab':''} onClick={()=>setVisualTopic(t[0])}>{t[1]}</button>)}</div>
      {visualTopic==='overview'&&<div className="mentalGrid"><div className="mentalCard"><h3>Information Sources</h3><p>🎾 Ball</p><p>👤 Opponent</p><p>🎯 Target</p><p>📍 Space</p><p>⏱ Time</p></div><div className="mentalCard"><h3>Coaching Question</h3><p>What information is the player attending to?</p></div><div className="mentalCard"><h3>Visual Pillars</h3><p>Quiet Eye, Tracking, Opponent Reading, Second Eye and External Focus.</p><p><strong>Animal anchor:</strong> Eagle + one secondary animal.</p></div></div>}
      {visualTopic==='quiet'&&<div className="mentalGrid"><div className="mentalCard"><h3>Definition</h3><p>Final fixation or tracking gaze directed toward task-relevant information before movement execution.</p></div><div className="mentalCard"><h3>Serve</h3><p>Target → Ball → Strike</p></div><div className="mentalCard"><h3>Return</h3><p>Opponent → Ball → Movement</p></div><div className="mentalCard"><h3>Attack / Volley</h3><p>Space or ball flight → Interception point → Strike</p></div><div className="mentalCard"><h3>Common Errors</h3><p>Excessive scanning, outcome watching, changing targets, internal technical focus.</p></div></div>}
      {visualTopic==='tracking'&&<div><SquashBallGraphic/><div className="mentalGrid"><div className="mentalCard"><h3>Purpose</h3><p>Predict trajectory, bounce, speed, interception point and available time.</p></div><div className="mentalCard"><h3>Progression</h3><p>1. Track → Move → Strike</p><p>2. Variable height feed</p><p>3. Variable depth feed</p><p>4. Variable pace feed</p><p>5. Opponent cue → Ball flight → Strike</p></div><div className="mentalCard"><h3>Common Errors</h3><p>Looking away early, looking at target before contact, losing ball during movement, outcome watching.</p></div></div></div>}
      {visualTopic==='opponent'&&<div className="mentalGrid"><div className="mentalCard"><h3>Information To Read</h3><p>Racquet preparation, shoulder orientation, balance, movement direction, recovery state and court position.</p></div><div className="mentalCard"><h3>Knock-Up Intelligence</h3><p>Use the 4-minute warm-up to assess pace tolerance, height tolerance, volley confidence, preparation quality and movement confidence.</p></div><div className="mentalCard"><h3>Coach Cue</h3><p>Watch the player, not just the ball.</p></div></div>}
      {visualTopic==='second'&&<div className="mentalGrid"><div className="mentalCard"><h3>Definition</h3><p>Maintain visual access to opponent information while interacting with the ball.</p></div><div className="mentalCard"><h3>Benefits</h3><p>Anticipation, tactical awareness, earlier recognition and better adaptation.</p></div><div className="mentalCard"><h3>Common Error</h3><p>Opponent blindness: ball, ball, ball — with no opponent information.</p></div></div>}
      {visualTopic==='external'&&<div className="mentalGrid"><div className="mentalCard"><h3>Attend To</h3><p>🎾 Ball</p><p>🎯 Target</p><p>📍 Space</p><p>👤 Opponent</p></div><div className="mentalCard"><h3>Avoid</h3><p>Wrist, elbow, swing mechanics, foot position — unless temporarily used as a correction.</p></div><div className="mentalCard"><h3>Example</h3><p>Instead of “keep your wrist firm”, use “send the ball through the back corner.”</p></div></div>}
    </div>}

    {!activeAnimal&&section==='greatest'&&<div className="mentalContentPanel"><h2>🎬 Greatest Hits Video</h2><p>A short video of the player’s best moments can reinforce performance identity before competition.</p><div className="mentalGrid"><div className="mentalCard"><h3>Purpose</h3><p>Remind the player: “This is what I do when I perform well.”</p></div><div className="mentalCard"><h3>Length</h3><p>60–180 seconds with the player’s chosen music.</p></div><div className="mentalCard"><h3>Include</h3><p>Movement, retrievals, resilience, good decisions, pressure moments, rallies and winners.</p></div><div className="mentalCard"><h3>Avoid</h3><p>Only trick shots, only winners, unrealistic editing or clips that promote low-percentage play.</p></div></div></div>}
    {!activeAnimal&&section==='ppp'&&<div className="mentalContentPanel"><h2>🚀 Pre-Performance Preparation (PPP)</h2><p><strong>Common Principles. Individual Solutions.</strong> PPP is a preparation framework, not a fixed routine. Players may integrate personal behaviours that help them arrive ready to perform.</p><div className="mentalGrid"><div className="mentalCard"><h3>1️⃣ Solution Activation</h3><p><strong>My Highlights:</strong> Watch a technical, tactical and mental success clip (30–60 sec) or use brief visualisation if no video is available.</p></div><div className="mentalCard"><h3>2️⃣ General Warm-Up</h3><p>Jogging, skipping, mobility, activation exercises or personal preparation methods. Purpose: prepare the body.</p></div><div className="mentalCard"><h3>3️⃣ Squash Activation</h3><p>Coach hand feeds, partner feeds or self-feeds. Move, strike and recover like a squash player. Representative striking preferred over tennis-ball catching.</p></div><div className="mentalCard"><h3>4️⃣ Official Warm-Up</h3><p>Use the 4-minute knock-up to gather information: forehand, backhand, volley habits, movement quality, reactions to height and pace, strengths, weaknesses and opportunities.</p></div></div><div className="prepFlow"><span>Highlights</span><span>Warm-Up</span><span>Squash Activation</span><span>Official Warm-Up</span><span>Compete</span></div></div>}
    {!activeAnimal&&section==='activation'&&<div className="mentalContentPanel"><h2>🏃 Activation & Calibration</h2><p>This is the physical bridge from preparation to performance.</p><div className="mentalGrid"><div className="mentalCard"><h3>Ghosting</h3><p>Used for movement readiness and court-orientation imagery, not just fitness.</p></div><div className="mentalCard"><h3>Animal Ghosting</h3><p>Show the animal: Eagle scans, Golden Retriever re-engages, Tiger applies pressure, Elephant controls tempo.</p></div><div className="mentalCard"><h3>Coach Feed & Strike</h3><p>Small-space squash-ball feed: player lunges and strikes controlled ball back to coach to catch.</p></div><div className="mentalCard"><h3>If Court Available</h3><p>Use representative rally prep: lengths, volley activation, boast-drive or tactical imagery.</p></div></div></div>}
    {!activeAnimal&&section==='court'&&<div className="mentalContentPanel"><h2>👁 Court Calibration</h2><p>The official 4-minute knock-up is information gathering, not just warming up.</p><div className="mentalGrid"><div className="mentalCard"><h3>Self Calibration</h3><p>Check timing, length, movement, racket preparation and touch.</p></div><div className="mentalCard"><h3>Opponent Observation</h3><p>Notice whether opponent handles height, pace, volleys, late preparation or rotational swing paths.</p></div><div className="mentalCard"><h3>Quiet Eye</h3><p>Now the ball, court and opponent exist. Use target → ball → strike to launch into performance.</p></div></div></div>}
    {!activeAnimal&&section==='cues'&&<div className="mentalContentPanel"><h2>🎯 Cue Statements</h2><div className="mentalGrid">{animals.map(a=><div className="mentalCard" key={a.name}><h3>{a.emoji} {a.name}</h3><p>“{a.cue}”</p></div>)}</div></div>}
    {!activeAnimal&&section==='breathing'&&<div className="mentalContentPanel"><h2>🫁 Breathing & Regulation</h2><p className="mutedText">Breathing is a tool selected when useful. The aim is agency, not dependency on a ritual.</p><div className="mentalGrid"><div className="mentalCard"><h3>😌 Calm Breath</h3><p><strong>Use:</strong> anxiety, rushing, panic, over-arousal.</p><p><strong>Protocol:</strong> inhale 4 seconds → exhale 6–8 seconds → repeat 3 cycles.</p><p><strong>Total time:</strong> approximately 30 seconds.</p><p><strong>Animals:</strong> Elephant + Golden Retriever.</p><p><strong>Coach observes:</strong> slower tempo, reduced rushing, calmer reset.</p></div><div className="mentalCard"><h3>🎯 Centre Breath</h3><p><strong>Use:</strong> refocus, distraction, overthinking, between rallies.</p><p><strong>Protocol:</strong> inhale 3 seconds → hold 3 seconds → exhale 3 seconds → repeat 3 cycles.</p><p><strong>Total time:</strong> approximately 20–30 seconds.</p><p><strong>Animals:</strong> Eagle + Wolf.</p><p><strong>Coach observes:</strong> breath, cue, eyes up, ready posture.</p></div><div className="mentalCard"><h3>⚡ Activate Breath</h3><p><strong>Use:</strong> flat, passive or under-aroused players.</p><p><strong>Protocol:</strong> inhale 1 second → forceful exhale 1 second → repeat 2–3 times.</p><p><strong>Total time:</strong> approximately 4–6 seconds.</p><p><strong>Animals:</strong> Lion + Cheetah.</p><p><strong>Coach observes:</strong> stronger posture, faster first movement, commitment.</p></div><div className="mentalCard"><h3>🦁 Attack Breath</h3><p><strong>Use:</strong> immediately before an attacking opportunity.</p><p><strong>Protocol:</strong> recognise opportunity → 1-second inhale → 1-second forceful exhale → attack.</p><p><strong>Total time:</strong> 1–2 seconds, single repetition.</p><p><strong>Animals:</strong> Lion + Eagle.</p><p><strong>Coach observes:</strong> attack linked to information, not a blind rush.</p></div></div></div>}
    {!activeAnimal&&section==='overlays'&&<div className="mentalContentPanel"><h2>🎮 Mental Overlays</h2><p>Mental overlays are applied through the Universal Overlays section so coaches can combine tactical, technical and mental performance behaviours in one place.</p><button className="primaryBtn" onClick={()=>setScreen('technical')}>Open Universal Overlays</button></div>}
  </div>;
}



function ShotsModule({setScreen}){
  const [section,setSection]=useState('learn');
  const [learnTab,setLearnTab]=useState('quick');
  const [wristTab,setWristTab]=useState('coach');

  const shotSections=[
    {id:'learn',title:'How Shots Are Learned',tag:'Function first · Perception-action · Self-discovery'},
    {id:'pressure',title:'Build Pressure',tag:'Working Length'},
    {id:'increase',title:'Increase Pressure',tag:'Penetrating Drive · Time Taker'},
    {id:'crosscourts',title:'Functional Crosscourts',tag:'Solve problem · avoid time donation'},
    {id:'movement',title:'Force Movement',tag:'Drop · Soft Dying Shot · Trickle Boast'},
    {id:'time',title:'Gain Time',tag:'Lob · High Defensive Crosscourt'},
    {id:'finish',title:'Finish',tag:'Kill · Nick · Attacking Boast'},
    {id:'wrist',title:'Wrist Mechanics',tag:'Elastic Release · Smiley Face Protocol'},
    {id:'biomech',title:'Swing Biomechanics',tag:'Bow · Spring · Whip · Torch'}
  ];

  const quickStartCards=[
    {id:'f',title:'Function Before Form',subtitle:'Shots are defined by their purpose, not their appearance.'},
    {id:'i',title:'Coach Intention Not Action',subtitle:'Focus on what the player is trying to achieve.'},
    {id:'e',title:'External Focus',subtitle:'Direct attention to ball, opponent, space and time.'},
    {id:'c',title:'Constraints Before Correction',subtitle:'Change the task before changing the player.'},
    {id:'v',title:'Adaptation Over Repetition',subtitle:'Learning requires adaptation to fluid events, not copying a grooved technique with metric adjustments.'},
    {id:'r',title:'Representative Practice',subtitle:'Practice should look like the game.'},
    {id:'s',title:'Individual Solutions',subtitle:'Different players may solve the same problem differently.'},
    {id:'t',title:'Technique Serves Function',subtitle:'Technique matters, but serves the task.'}
  ];

  const workingLength=[
    ['What is Working Length?','Working Length is a shot played primarily to make your opponent’s next shot more difficult. It is not usually played to win the rally. It is played to improve your position within the rally.'],
    ['Why is it important?','Most rallies are not won by spectacular winners. Most rallies are won because one player gradually creates a better situation than the other. Working Length builds pressure, restricts attacking options, improves court position and creates future opportunities.'],
    ['Traditional View','Hit the ball deep and tight. Keep the ball in the back corners. Maintain good length and width. These descriptions are useful, but they focus mainly on the ball.'],
    ['Checkerboard View','Force the opponent to play from positions that reduce their attacking options. Judge the shot by what happens to the opponent, not by landing position alone.'],
    ['Example A','Player A hits a length. Player B arrives comfortably, maintains T position, volleys easily and attacks. Result: poor Working Length, even if the ball landed in a traditional target area.'],
    ['Example B','Player A hits a length. Player B arrives late, cannot volley and is forced to defend. Result: good Working Length, even if the ball did not land in a textbook target area.'],
    ['Coach Observation Questions','1. Where is the opponent hitting from? 2. How many attacking options do they have? 3. Did my shot reduce those options?'],
    ['Checkerboard Principle','A Working Length is not defined solely by where it lands. A Working Length is defined by the effect it has on the opponent.'],
    ['Coach Takeaway','Before teaching players how to attack, teach them how to build pressure. Working Length is the first move on the squash checkerboard.']
  ];

  const categoryCards={
    movement:{title:'Force Movement',intro:'Future shot pages will show how players stretch the court and create instability without attacking too early.',items:['Straight Drop — move opponent forward','Soft Dying Shot — make the ball stop being available','Trickle Boast — change the movement problem']},
    time:{title:'Gain Time',intro:'Future shot pages will show how players reset the rally, change tempo and recover court position. Lob will include defensive, organising and attacking functions.',items:['Lob — gain time, move opponent or attack','High Defensive Crosscourt — change height and recover','Reset Length — slow the rally problem down']},
    finish:{title:'Finish',intro:'Future shot pages will show how players convert advantage only when the information says the finish is available.',items:['Kill — finish a loose ball','Nick — exploit vulnerable front space','Attacking Boast — finish when opponent organisation is poor']}
  };

  function addWorkingLengthToSession(){
    const card={
      id:'shot-working-length-foundation',
      title:'Working Length — First Move on the Squash Checkerboard',
      type:'Shots Module',
      rationale:'Build pressure before attack. Judge the shot by its effect on the opponent, not by a fixed technical model.',
      task:'Use Working Length to make the opponent’s next shot more difficult before looking to attack.',
      scoring:'Coach awards success when opponent arrives late, cannot volley, cannot attack, loses T position or produces a weak return.',
      focus:'Watch the opponent, not just the ball.'
    };
    try{
      const existing=JSON.parse(localStorage.getItem(SESSION_KEY)||'[]');
      localStorage.setItem(SESSION_KEY,JSON.stringify([...existing,card]));
    }catch(e){}
    setScreen('sessions');
  }

  return <div className="page shotsPage shotsFoundationPage">
    <div className="pageTop">
      <div><h1>Shots</h1><p className="mutedText">Function first · Perception-action · Constraints-led shot development</p></div>
      <div className="buttonRow"><button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button><button className="secondaryBtn" onClick={()=>setScreen('gamesLibrary')}>Games Library</button></div>
    </div>

    <div className="libraryStageIntro shotsIntro">
      <h2>Shots are defined by their function, not their form</h2>
      <p>Checkerboard coaches shots by the problem they solve, the opportunity they exploit and the effect they have on the opponent.</p>
    </div>

    <div className="shotSelectorRow shotFunctionRow">
      {shotSections.map(s=><button key={s.id} className={section===s.id?'activeShotBtn':''} onClick={()=>setSection(s.id)}>{s.title}<span>{s.tag}</span></button>)}
    </div>

    {section==='learn'&&<div className="shotDetailPanel shotsLearnPanel">
      <div className="shotDetailHeader">
        <div>
          <div className="categoryTag">How Shots Are Learned</div>
          <h2>Coach the Shot Function</h2>
          <p className="mutedText">Quick coaching principles first. Deeper CLA theory sits behind a tab.</p>
        </div>
      </div>

      <section className="shotsTimePanel shotsTimePanelReadable">
        <div className="shotsTimeHeader">
          <span className="timeBadge take">🟢 TIME TAKER</span>
          <span className="timeBadge give">🔴 TIME GIVER</span>
        </div>
        <h3>Time Givers vs Time Takers</h3>
        <p className="timeLead">Many actions in squash either give time to the opponent or take time away.</p>
        <p className="timeCoachQuestion"><strong>Coach question:</strong> Did that action give the opponent more time or less time?</p>
        <div className="shotsTimeGrid readableTimeGrid">
          <div className="timeListBox giveBox">
            <h4>🔴 Time Givers</h4>
            <ul>
              <li>Non-functional crosscourt</li>
              <li>Failure to volley return of serve</li>
              <li>Floating length</li>
              <li>Late preparation</li>
              <li>Passing up interception opportunities</li>
              <li>Unnecessary retreat</li>
            </ul>
          </div>
          <div className="timeListBox takeBox">
            <h4>🟢 Time Takers</h4>
            <ul>
              <li>Penetrating drive</li>
              <li>Volley return of serve</li>
              <li>Early intercept</li>
              <li>Effective working length</li>
              <li>Front-court pressure</li>
              <li>Taking the ball before side wall</li>
            </ul>
          </div>
        </div>
        <p className="shotsCallout">Instead of only asking if the shot looked technically correct, ask whether it gave time or took time away.</p>
      </section>






      <div className="shotsLearnTabs">
        <button className={learnTab==='quick'?'activeShotTab':''} onClick={()=>setLearnTab('quick')}>Quick Start</button>
        <button className={learnTab==='cla'?'activeShotTab':''} onClick={()=>setLearnTab('cla')}>CLA Principles</button>
        <button className={learnTab==='why'?'activeShotTab':''} onClick={()=>setLearnTab('why')}>Why It Works</button>
      </div>

      {learnTab==='quick'&&<div>
        <div className="shotQuickGrid">{quickStartCards.map(card=><div key={card.id} className="shotQuickCard"><h3>{card.title}</h3><p>{card.subtitle}</p></div>)}</div>
        <div className="shotCoachRule"><h3>10 second rule</h3><p>Before correcting technique, ask: <strong>what effect should this shot have on the opponent?</strong></p></div>
      </div>}

      {learnTab==='cla'&&<div>
        <div className="claPrincipleList">
          <div><h3>Checkerboard Coaching Principles</h3><p>Function before form · intention not action · external focus · constraints before correction · variability · representative practice · individual solutions · technique serves function.</p></div>
          <div><h3>Ecological Dynamics</h3><p>Learning happens through the relationship between the player, opponent, ball, court and task.</p></div>
          <div><h3>Perception ↔ Action Coupling</h3><p>Players learn by seeing and acting together. Decision emerges while the player moves, not as a separate classroom calculation.</p></div>
          <div><h3>Affordances</h3><p>A shot is an opportunity for action: a loose ball may afford a kill; a dominant opponent may afford a lob.</p></div>
          <div><h3>Guided Discovery</h3><p>The coach designs the task so players discover useful solutions, rather than copying one fixed model.</p></div>
          <div><h3>Self-Organisation</h3><p>Players may solve the same rally problem with different movement solutions.</p></div>
          <div><h3>Deep Attractor States</h3><p>Stable habits can be useful or limiting. Change the task constraints to help better solutions emerge.</p></div>
          <div><h3>Implicit Learning</h3><p>Use external focus, analogies and representative games to reduce over-thinking of body parts.</p></div>
          <div><h3>Reinvestment</h3><p>Under pressure, players may consciously monitor movement mechanics. Checkerboard cues return attention to information and intention.</p></div>
          <div><h3>Representative Learning Design</h3><p>Practice should preserve the information, pressure, timing and choices of the game.</p></div>
        </div>
      </div>}

      {learnTab==='why'&&<div className="whyWorksPanel">
        <div className="whyCompareGrid">
          <div className="whyBox traditionalBox"><h3>Traditional response</h3><p>Player misses a volley return.</p><p><strong>“Keep your racket up.”</strong></p><p><strong>“Turn sideways.”</strong></p><p>Attention shifts internally to body positions and movement control.</p></div>
          <div className="whyBox checkerboardBox"><h3>Checkerboard response</h3><p>Player misses a volley return.</p><p><strong>“Intercept earlier.”</strong></p><p><strong>“Take time away.”</strong></p><p>Attention stays on the task, the opponent, the ball, space and time.</p></div>
        </div>
        <div className="shotCoachRule"><h3>Reinvestment</h3><p>Under pressure, players can shift attention away from information and opportunities and towards conscious movement control. The coaching aim is to refocus attention on the task, the opponent and the intended effect.</p></div>
      </div>}

      <div className="playerViewCard shotPlayerView"><h3>Player View</h3><p><strong>WHAT TO DO</strong><br/>Solve the rally problem. Notice the opponent, the ball, the space and the time available.</p><p><strong>KEY FOCUS</strong><br/>Information → Opportunity → Intention → Effect.</p></div>
    </div>}

    {section==='pressure'&&<div className="shotDetailPanel">
      <div className="shotDetailHeader"><div><div className="categoryTag">Build Pressure</div><h2>Working Length</h2><p className="mutedText">The first move on the squash checkerboard.</p></div><button className="primaryBtn" onClick={addWorkingLengthToSession}>Add to session</button></div>
      <div className="shotsTimeMini"><span className="timeBadge take">🟢 TIME TAKER</span><p>Working Length usually acts as a Time Taker because it reduces opponent options and often reduces available time.</p></div>
      <div className="workingLengthGrid">{workingLength.map(([title,body])=><div className="gameCard workingLengthCard" key={title}><h3>{title}</h3><p>{body}</p></div>)}</div>
      <div className="playerViewCard shotPlayerView"><h3>Player View</h3><p><strong>WHAT TO DO</strong><br/>Use Working Length to make your opponent’s next shot more difficult.</p><p><strong>HOW TO SCORE</strong><br/>Success if the opponent arrives late, cannot volley, cannot attack, loses T position or gives a weak return.</p><p><strong>KEY FOCUS</strong><br/>Watch the opponent, not just the ball.</p></div>
    </div>}

    {section==='increase'&&<div className="shotDetailPanel">
      <section className="shotPageBlock penetratingDrivePage">
        <div className="shotHero">
          <span className="timeBadge take">🟢 STRONG TIME TAKER</span>
          <h2>Penetrating Drive</h2>
          <p>The second move on the squash checkerboard: once pressure is built, take time away.</p>
        </div>
        <div className="shotGridTwo">
          <div className="shotInfoCard"><h3>What is a Penetrating Drive?</h3><p>A Penetrating Drive is a drive whose primary function is to reduce the opponent’s available time.</p><p>It is not simply a hard drive. It is a shot that forces later arrival, less preparation and weaker responses.</p></div>
          <div className="shotInfoCard"><h3>Why is it important?</h3><ul><li>Reduces preparation time</li><li>Reduces volley opportunities</li><li>Forces later arrival</li><li>Increases defensive responses</li><li>Creates weaker returns</li></ul></div>
        </div>
        <div className="shotGridTwo">
          <div className="shotInfoCard traditionalCard"><h3>Traditional View</h3><p>A coach may describe a Penetrating Drive as:</p><ul><li>Hit hard</li><li>Hit deep</li><li>Hit tight</li><li>Keep the ball low</li><li>Drive the ball through the back of the court</li></ul><p>These descriptions focus primarily on the characteristics of the ball.</p></div>
          <div className="shotInfoCard checkerboardCard"><h3>Checkerboard View</h3><p>A Penetrating Drive is successful if the opponent:</p><ul><li>Arrives later</li><li>Cannot volley comfortably</li><li>Loses T position</li><li>Produces a weaker return</li><li>Is forced to defend</li></ul></div>
        </div>
        <div className="shotGridTwo">
          <div className="shotInfoCard exampleCard"><h3>Example A</h3><p>Player A hits a drive.</p><p>Player B arrives comfortably, maintains T position and volleys aggressively.</p><p><strong>Result:</strong> Poor Penetrating Drive, even if the ball looked technically accurate.</p></div>
          <div className="shotInfoCard exampleCard"><h3>Example B</h3><p>Player A hits a drive.</p><p>Player B arrives late, cannot volley and produces a defensive return.</p><p><strong>Result:</strong> Good Penetrating Drive, even if it was not textbook perfect.</p></div>
        </div>
        <div className="shotInfoCard coachObservationCard"><h3>Coach Observation Questions</h3><ol><li>Did the opponent arrive later?</li><li>Could they volley?</li><li>Did they attack or defend?</li><li>Was the return weaker?</li><li>Did I remove time?</li></ol></div>
        <div className="shotPrincipleBox"><h3>Checkerboard Principle</h3><p>A Penetrating Drive is not defined by racket speed.</p><p>A Penetrating Drive is not defined by side-wall contact.</p><p><strong>A Penetrating Drive is defined by the time it removes from the opponent.</strong></p></div>
        <div className="shotTakeaway"><p><strong>Working Length asks:</strong> How many options does the opponent have?</p><p><strong>Penetrating Drive asks:</strong> How much time does the opponent have?</p></div>
      </section>
    </div>}

    {section==='crosscourts'&&<div className="shotDetailPanel">
      <section className="shotPageBlock functionalCrosscourtPage">
        <div className="shotHero crosscourtHero">
          <span className="timeBadge give">🔴 TIME GIVER RISK</span>
          <h2>Functional Crosscourts</h2>
          <p>A major junior development issue: crosscourts are not bad, but non-functional crosscourts donate time.</p>
        </div>
        <div className="shotGridTwo">
          <div className="shotInfoCard checkerboardCard"><h3>Functional Crosscourt</h3><p>A crosscourt is functional when it solves a tactical problem.</p><ul><li>Gain time under pressure</li><li>Move the opponent away from the T</li><li>Change the shape of the rally</li><li>Attack exposed space</li><li>Create uncertainty</li></ul></div>
          <div className="shotInfoCard dangerCard"><h3>Non-Functional Crosscourt</h3><p>A crosscourt is non-functional when it solves no tactical problem.</p><ul><li>Gives the opponent time</li><li>Gives volley opportunities</li><li>Surrenders T position</li><li>Creates pressure against yourself</li><li>Becomes an automatic panic response</li></ul></div>
        </div>
        <div className="shotInfoCard coachObservationCard"><h3>Coach Observation Tool</h3><ol><li>What problem was the player trying to solve?</li><li>Did the crosscourt solve it?</li><li>What happened to the opponent?</li><li>Did it give time or take time away?</li><li>Was there a better option?</li></ol></div>
        <div className="shotPrincipleBox"><h3>Checkerboard Principle</h3><p>A crosscourt is not good because it reaches the opposite side of the court.</p><p><strong>A crosscourt is good because of the effect it creates.</strong></p></div>
        <div className="shotTakeaway"><p><strong>Junior warning:</strong> Non-functional crosscourts and failure to volley return of serve are two of the biggest time donations in developing squash.</p></div>
      </section>
    </div>}

    {['movement','time','finish'].includes(section)&&<div className="shotDetailPanel">
      <div className="shotDetailHeader"><div><div className="categoryTag">Shot Function Family</div><h2>{categoryCards[section].title}</h2><p className="mutedText">Placeholder category for the next content release.</p></div></div>
      <p>{categoryCards[section].intro}</p>
      <div className="shotsPrincipleGrid">{categoryCards[section].items.map(x=><div className="gameCard shotsPrincipleCard" key={x}><h3>{x.split(' — ')[0]}</h3><p>{x.split(' — ')[1]}</p></div>)}</div>
    </div>}



    {section==='biomech'&&<div className="shotDetailPanel biomechModulePanel">
      <div className="shotDetailHeader"><div><div className="categoryTag">Swing Biomechanics · Elastic Release · Movement Organisation</div><h2>Swing Biomechanics</h2><p className="mutedText">A CLA coaching framework for organising the chain rather than teaching fixed technique.</p></div></div>

      <section className="shotPageBlock sscBiomechanicsPage">
        <div className="shotHero springHero">
          <span className="timeBadge take">🟢 ELASTIC ENERGY</span>
          <h2>The Spring — SSC</h2>
          <p>Load the spring. Let it rebound. Land and go.</p>
        </div>
        <div className="shotGridTwo">
          <div className="shotInfoCard">
            <h3>What It Teaches</h3>
            <p>The Spring explains stretch-shortening cycle behaviour in simple coaching language.</p>
            <p>Rapid loading followed by rapid release can produce greater racket speed than muscular effort alone.</p>
            <p>The longer the delay between load and release, the more energy is lost.</p>
          </div>
          <div className="shotInfoCard dangerCard">
            <h3>Common Error: Load-Hold-Release</h3>
            <p>The player loads correctly, then pauses before swinging.</p>
            <p><strong>Result:</strong> energy leaks away and elastic contribution is reduced.</p>
            <p><strong>Cue:</strong> Land and go.</p>
          </div>
        </div>
      </section>

      <section className="shotPageBlock">
        <div className="shotInfoCard coachObservationCard">
          <h3>Before You Intervene: Rob Gray Diagnostic Filter</h3>
          <ol>
            <li><strong>Is the output consistent and effective?</strong> If yes, why change it?</li>
            <li><strong>Is the visible movement actually the problem?</strong> Or is it a compensation for something missing earlier in the chain?</li>
          </ol>
          <p><strong>Checkerboard principle:</strong> Do not coach the symptom. Find the earliest breakdown.</p>
        </div>
      </section>

      <section className="shotPageBlock">
        <div className="shotHero diagnosticBioHero"><h2>The Four Analogies</h2><p>Memorable tools for self-monitoring movement organisation.</p></div>
        <div className="shotGridTwo">
          <div className="shotInfoCard"><h3>🏹 The Bow — Loading</h3><p><strong>Player message:</strong> Lift the bow. Draw the string. Release the arrow.</p><p><strong>Checkpoint 1:</strong> Prepare on the T before moving.</p><p><strong>Checkpoint 2:</strong> Final plant and trunk rotation. Land loaded.</p><p><strong>Cue:</strong> Prepare before you move. Draw and release.</p></div>
          <div className="shotInfoCard"><h3>〰️ The Whip — Sequencing</h3><p><strong>Player message:</strong> Move the body. Let the crack appear.</p><p>Power does not come from consciously moving the racket head. Power emerges when the chain is organised.</p><p>The body moves first. The racket follows.</p></div>
          <div className="shotInfoCard"><h3>🙂 The Smiley Face — Elastic Release</h3><p><strong>Backhand:</strong> Neutral → Smile. Arrive neutral. Deliver the smile.</p><p><strong>Forehand:</strong> Smile → Neutral. Start with a smile. Deliver a straight face.</p><p>The marker runs from the thumb/index junction across the back of the hand for easy self-monitoring.</p></div>
          <div className="shotInfoCard"><h3>🔦 The Torch — Plane Consistency</h3><p>Imagine a torch attached to the racket face.</p><p>The beam remains broadly directed toward the front wall through preparation, movement and final load.</p><p><strong>Cue:</strong> Keep the torch on the front wall.</p></div>
        </div>
      </section>

      <section className="shotPageBlock">
        <div className="shotInfoCard dangerCard">
          <h3>Micro Drop — Diagnostic Marker, Not A Technique</h3>
          <p>The micro drop is a small downward movement of the racket head immediately before the forward swing.</p>
          <p><strong>Do not coach it directly.</strong> Do not tell players to create a racket drop.</p>
          <p>If it appears naturally, usually leave it alone. If it does not appear, ask what is missing earlier in the chain.</p>
        </div>
        <div className="shotGridTwo">
          <div className="shotInfoCard checkerboardCard"><h3>Natural Micro Drop</h3><ul><li>Small</li><li>Emergent</li><li>Vertical</li><li>Maintains torch direction</li><li>Appears when the chain is organised</li></ul><p><strong>Coach response:</strong> Leave it alone.</p></div>
          <div className="shotInfoCard dangerCard"><h3>Looping Backswing</h3><ul><li>Large</li><li>Habitual or conscious</li><li>Turns the torch away from the front wall</li><li>Creates timing problems</li></ul><p><strong>Coach response:</strong> Reduce it through constraints.</p></div>
        </div>
      </section>

      <section className="shotPageBlock biomechanicsDiagnosticPage">
        <div className="shotHero diagnosticBioHero"><span className="timeBadge give">🔍 DIAGNOSTIC</span><h2>Missing Micro Drop Pathway</h2><p>Do not coach the drop. Trace the chain backwards.</p></div>
        <div className="shotInfoCard coachObservationCard">
          <h3>Diagnostic Questions</h3>
          <ol>
            <li>Was the bow lifted? If no, improve preparation.</li>
            <li>Was the string drawn? If no, look for passive landing.</li>
            <li>Was the spring compressed? If no, create loading constraints.</li>
            <li>Was there a load-hold-release pause? If yes, use Land and Go.</li>
            <li>Did the torch stay on the front wall? If no, reduce looping.</li>
            <li>Was the whip organised? If no, use Move the Body / Let the Crack Appear.</li>
          </ol>
        </div>
        <div className="shotGridTwo">
          <div className="shotInfoCard"><h3>Common Observations</h3><ul><li>Missing micro drop</li><li>Early backhand smile</li><li>Forehand roll-over</li><li>Pre-tensed wrist</li><li>Excessive loop</li><li>Load-hold-release pause</li><li>Passive landing</li></ul></div>
          <div className="shotInfoCard checkerboardCard"><h3>Suggested Challenges</h3><ul><li>Bow Challenge</li><li>Spring / Land and Go Challenge</li><li>Whip Challenge</li><li>Torch Challenge</li><li>Smiley Face Challenge</li><li>Natural Release Challenge</li></ul></div>
        </div>
        <div className="shotPrincipleBox"><h3>Attractor State Link</h3><p><strong>Type 1:</strong> Technique learned in isolation. Looks stable in feeding. Fails under pressure.</p><p><strong>Type 2:</strong> Match-developed compensation. Worked at previous level. Now limits progression.</p></div>
      </section>

      <div className="shotPrincipleBox"><h3>Checkerboard Swing Sequence</h3><p>Lift the bow → Draw the string → Compress the spring → Move the body → Keep the torch on the front wall → Deliver the smile → Let the crack appear → The arrow leaves.</p></div>
      <div className="shotTakeaway"><p><strong>Final player message:</strong> Lift the bow. Draw the string. Land and go. Move the body. Keep the torch on the front wall. Deliver the smile. Let the crack appear.</p></div>
    </div>}

    {section==='wrist'&&<div className="shotDetailPanel wristModulePanel">
      <div className="shotDetailHeader"><div><div className="categoryTag">Wrist Mechanics & Elastic Release</div><h2>Wrist Mechanics</h2><p className="mutedText">A CLA approach to loading, release and racket-face self-monitoring.</p></div></div>
      <div className="shotsLearnTabs wristTabs">
        <button className={wristTab==='coach'?'activeShotTab':''} onClick={()=>setWristTab('coach')}>Coach View</button>
        <button className={wristTab==='challenges'?'activeShotTab':''} onClick={()=>setWristTab('challenges')}>Player Challenges</button>
        <button className={wristTab==='errors'?'activeShotTab':''} onClick={()=>setWristTab('errors')}>Error Cards</button>
      </div>
      {wristTab==='coach'&&<div>
        <div className="wristHeroCard"><h3>The Debate</h3><p>Wrist mechanics remain one of the most debated topics in squash coaching. Some coaches advocate maintaining a cocked wrist throughout the swing. Others advocate maintaining a largely neutral wrist throughout the swing.</p><p><strong>Checkerboard takes a different position.</strong> The wrist is viewed as a dynamic component of the movement system rather than a position to be held.</p></div>
        <div className="wristPathGrid"><div className="wristPathCard"><h3>Backhand</h3><div className="wristPath">Neutral → Smile</div><p>Arrive neutral. Deliver the smile.</p></div><div className="wristPathCard"><h3>Forehand</h3><div className="wristPath">Smile → Neutral</div><p>Start with a smile. Deliver a straight face.</p></div></div>
        <div className="wristCoachGrid"><div className="gameCard"><h3>Core Concept</h3><p>Efficient racket acceleration emerges from preparation, movement to the ball, sequencing and elastic release. The wrist should not be coached as an isolated body part.</p></div><div className="gameCard"><h3>Plane-Consistent Preparation</h3><p>Many elite players appear to generate high racket speed while using relatively economical preparations. Reduce unnecessary loops and racket-face turning to preserve decision-making time.</p><p><strong>Cue:</strong> Show the front wall the strings.</p></div><div className="gameCard"><h3>Under Pressure</h3><p>Many players try to consciously control the wrist when pressure increases. This can create timing problems, face-control problems and increased variability.</p><p><strong>Cue:</strong> Organise the swing. Trust the release.</p></div></div>
      </div>}
      {wristTab==='challenges'&&<div><div className="wristChallengeGrid"><div className="wristChallengeCard"><h3>Smiley Face Challenge</h3><p><strong>Objective:</strong> Develop awareness of wrist position using visual feedback.</p><p><strong>How:</strong> Mark the back of the hand with the neutral line from the thumb/index junction. Use video or partner observation.</p><p><strong>Overlay:</strong> Self-Monitoring Challenge · RLD 3</p></div><div className="wristChallengeCard"><h3>Neutral → Smile Challenge</h3><p><strong>Objective:</strong> Backhand loading and release.</p><p><strong>Cue:</strong> Arrive neutral. Deliver the smile.</p><p><strong>Common error:</strong> Early Backhand Smile.</p></div><div className="wristChallengeCard"><h3>Smile → Neutral Challenge</h3><p><strong>Objective:</strong> Forehand loading and release without roll-over.</p><p><strong>Cue:</strong> Start with a smile. Deliver a straight face.</p><p><strong>Common error:</strong> Forehand Roll-Over.</p></div><div className="wristChallengeCard"><h3>Plane Consistency Challenge</h3><p><strong>Objective:</strong> Reduce unnecessary racket-face turning.</p><p><strong>Cue:</strong> Show the front wall the strings.</p><p><strong>Video prompt:</strong> Did the strings stay simple during preparation?</p></div><div className="wristChallengeCard"><h3>Elastic Release Challenge</h3><p><strong>Objective:</strong> Encourage natural release without conscious wrist action.</p><p><strong>Cue:</strong> Firm through the ball, not before.</p><p><strong>Overlay:</strong> External Focus · Variable Pace</p></div></div></div>}
      {wristTab==='errors'&&<div><div className="wristErrorGrid"><div className="wristErrorCard"><h3>Early Backhand Smile</h3><p><strong>Description:</strong> Player arrives with wrist already flexed.</p><p><strong>Consequence:</strong> Loading opportunity is reduced before impact.</p><p><strong>Cue:</strong> Keep the face neutral until delivery.</p></div><div className="wristErrorCard"><h3>Forehand Roll-Over</h3><p><strong>Description:</strong> Player continues into excessive wrist flexion through impact.</p><p><strong>Consequence:</strong> Reduced face control and accuracy.</p><p><strong>Cue:</strong> Deliver a straight face.</p></div><div className="wristErrorCard"><h3>Pre-Tensed Wrist</h3><p><strong>Description:</strong> Player actively holds the wrist rigid throughout the swing.</p><p><strong>Consequence:</strong> Reduced elastic contribution and mechanical movement.</p><p><strong>Cue:</strong> Firm through the ball, not before.</p></div><div className="wristErrorCard"><h3>Preparation Loop</h3><p><strong>Description:</strong> Excessive racket-face turning during preparation.</p><p><strong>Consequence:</strong> Additional timing demand and reduced robustness under pressure.</p><p><strong>Cue:</strong> Show the front wall the strings.</p></div></div></div>}
      <div className="playerViewCard wristPlayerMessage"><h3>Player Message</h3><p>Do not try to use your wrist. Do not try to keep your wrist fixed.</p><p><strong>Organise the swing. The loading and release will emerge naturally.</strong></p></div>
    </div>}
  </div>;
}


function PlugAndPlay({setScreen,setSession}){
  const [active,setActive]=useState('Pressure');
  const outcomes=['Pressure','Length','Volleys','Movement','T-Zone','Double Bounce','Power Play'];
  const games=[
    {
      id:'PNP01',title:'Server ATL — Receiver Anywhere',tags:['Pressure','Length','T-Zone'],type:'Two Player · Conditioned Game',players:'2',level:'Level 2 → Level 4',
      develops:['Defensive patience','Attacking decision making','Length under pressure','Offence vs defence contrast'],
      why:'Creates a clear attacker-defender contrast within a single game. The server must attack above the line with unlimited double bounce — lowering the risk threshold for attacking decisions. The receiver plays freely, developing defensive resilience and length under pressure from an attacking opponent.',
      what:'Server must play ATL (above the line on the front wall) on every shot. Server has unlimited double bounce. Receiver can play anywhere — ATL or BTL — with no restrictions. Rotate after a set number of points or a timed rotation.',
      score:'Win rally = +1. Server earns bonus +1 for a clean ATL winner. Receiver earns +1 for forcing a rally of 5+ shots. Normal scoring otherwise.',
      coach:'Watch the quality of the receiver length. Does the receiver use length to push the server deep and reduce ATL angles? Does the server attack from poor positions? The constraint reveals decision quality under role pressure.',
      player:'Server: play ATL every shot. You have unlimited double bounce. Receiver: play freely — anywhere on the court.',
      load:'Server ATL — Receiver Anywhere'
    },
    {
      id:'PPA01',title:'Open Power Play™',tags:['Power Play','Pressure','Decision Making'],type:'King of Court · Power Play',players:'3–8',level:'Intermediate → Professional',
      develops:['Opportunity recognition','Momentum awareness','Risk management','Confidence'],
      why:'The player must decide when conditions are favourable enough to commit a valuable resource. Declaring Power Play publicly raises the stakes and develops pressure tolerance and commitment. The opponent knows — which forces both players to raise their game.',
      what:'King of Court. Winner stays. Loser rotates. Before any rally a player may announce "Power Play". Power Play applies to that rally only. Token is consumed whether the rally is won or lost.',
      score:'Win rally = +1. Successful Power Play (win the rally) = +3 (1 rally point + 2 PP bonus). Failed Power Play = 0. Each player receives 2 tokens per rotation (coach configurable).',
      coach:'Watch when players choose to activate. Early activation under pressure is different to activation from a position of control. The timing decision is your coaching point.',
      player:'Announce Power Play before the rally. Win it for +3. Lose it for 0. Choose your moment.',
      load:'Open Power Play™'
    },
    {
      id:'PPA02',title:'Blind Power Play™',tags:['Power Play','Decision Making','Anticipation'],type:'King of Court · Blind Power Play',players:'3–8',level:'Junior Elite → Professional',
      develops:['Tactical judgement','Opportunity recognition','Risk management','Decision making under uncertainty'],
      why:'Unlike Open Power Play, the challenge is not public pressure but selecting the perfect moment to gamble without anyone knowing. Opponents must also remain alert — they cannot see the Power Play but they can feel it in the rally outcome.',
      what:'King of Court. Winner stays. Loser rotates. Before any rally a player secretly activates a token. Opponent does not know. Power Play applies to that rally only. Token consumed after the rally regardless of outcome.',
      score:'Win rally = +1. Successful Blind Power Play (win the rally) = +3. Failed Blind Power Play = 0. Each player receives 3 tokens per rotation (coach configurable).',
      coach:'Post-session debrief: when did each player activate? Was it the right moment? Blind PP reveals tactical timing judgement without the pressure of public declaration.',
      player:'Secretly activate before a rally. Win it for +3. No-one knows when your token is active.',
      load:'Blind Power Play™'
    },
    {
      id:'PPA03',title:'Pressure Power Play™',tags:['Power Play','Pressure','Movement'],type:'King of Court · Pressure Power Play',players:'3–8',level:'Intermediate → Professional',
      develops:['Competitive resilience','Confidence','Momentum management','Commitment under pressure'],
      why:'The player publicly commits to winning three consecutive rallies across opponents. The sequence continues across rotations — making it a true test of sustained performance under pressure and against different opponents.',
      what:'King of Court. Winner stays. Loser rotates. Player announces "Pressure Power Play". Objective: win 3 consecutive rallies. Sequence continues across opponents — e.g. beat Player A, beat Player B, beat Player C. Lose any rally before three consecutive wins and the sequence ends, token consumed, no bonus.',
      score:'Each rally win = +1. Complete three consecutive wins = +6 bonus. Total available = 9 points. Each player receives 2 tokens per rotation (coach configurable).',
      coach:'Three consecutive wins across different opponents is genuinely difficult. Watch for players who activate when they have momentum vs players who activate defensively. The public commitment is the pressure tool.',
      player:'Announce Pressure Power Play. Win 3 rallies in a row — across any opponents. Rally 1 = +1, Rally 2 = +1, Rally 3 = +1 + 6 bonus = 9 total.',
      load:'Pressure Power Play™'
    },
    {
      id:'PPA04',title:'Power Play Duel™',tags:['Power Play','Pressure','T-Zone'],type:'King of Court · Duel',players:'3–8',level:'Intermediate → Professional',
      develops:['Attacker vs disruptor mentality','Pressure vs break resistance','Momentum management','Competitive investment'],
      why:'Creates a genuine attacker-versus-defender battle. Normal rotation pauses. Both players remain fully invested — the PP player hunting maximum reward, the disruptor hunting a break. Both roles require different tactical thinking.',
      what:'King of Court. Winner stays. Loser rotates. Player announces "Power Play Duel". The two players on court lock together. Normal rotation pauses. They play exactly 3 consecutive rallies. After the third rally, normal King of Court rotation resumes regardless of outcome.',
      score:'PP Player wins all 3 rallies: +1+1+1 = 3 rally points + 3 completion bonus = 6 total. Disruptor wins 2 consecutive rallies during the duel: +2 disruptor bonus. Partial: PP player keeps rally points earned. Token consumed. Each player receives 2 tokens per rotation (coach configurable).',
      coach:'Example 1: PP wins all 3 — PP Player 6, Disruptor 0. Example 2: PP wins R1, Disruptor wins R2+R3 — PP Player 1, Disruptor 2. Example 3: Disruptor wins R1, PP wins R2, Disruptor wins R3 — no consecutive disruption — PP Player 1, Disruptor 0.',
      player:'Announce Power Play Duel. You and your opponent play 3 rallies. Win all 3 for +6. Opponent earns a bonus if they win 2 in a row against you.',
      load:'Power Play Duel™'
    },
    {
      id:'PP001',title:'Build Pressure Before Attack',tags:['Pressure','Length','Decision Making'],type:'Plug & Play Pressure',players:'2–4',level:'Intermediate → Professional',
      develops:['Patience','Pressure recognition','Shot selection'],
      why:'Stops players attacking from neutral positions and teaches them to earn the right to attack through depth, width or opponent displacement.',
      what:'Rally normally. A player may only attack short or go for a finish after creating two quality pressure shots.',
      score:'Win rally = 1. Bonus +1 if the winning attack comes after the pressure requirement.',
      coach:'Build pressure before attacking.',player:'Create the problem first, then attack the space.',load:'Build Pressure Before Attack'
    },
    {
      id:'PP002',title:'Opponent Off T',tags:['Pressure','T-Zone','Decision Making'],type:'Universal Overlay',players:'2–4',level:'Junior Elite → Professional',
      develops:['Opportunity recognition','Tactical patience','Finishing decisions'],
      why:'Links attacking decisions to opponent position rather than pre-planned shot choice. Players learn to attack advantage, not hope.',
      what:'Player may attack or claim attack bonus only when the opponent is visibly off the T at striker contact.',
      score:'Win rally = 1. Bonus +1 if attack is made when opponent is off T.',
      coach:'Only attack when the opponent has been moved.',player:'Attack advantage, not opportunity.',load:'Opponent Off T'
    },
    {
      id:'PP003',title:'Last Shot While Opponent Off T',tags:['Pressure','T-Zone','Decision Making'],type:'Finishing Overlay',players:'2–4',level:'Intermediate → Professional',
      develops:['Finishing awareness','Opponent information pickup','Composure'],
      why:'Rewards players for noticing the actual finishing moment and discourages random attacking from poor positions.',
      what:'Rally normally. Bonus only counts if the final winning shot is played while the opponent is clearly off T.',
      score:'Win rally = 1. Bonus +2 for a finish while opponent is off T.',
      coach:'Recognise the finishing moment.',player:'Move them first. Finish second.',load:'Last Shot While Opponent Off T'
    },
    {
      id:'PP101',title:'Length Before Attack',tags:['Length','Pressure','Decision Making'],type:'Length Overlay',players:'2–4',level:'Junior Beginner → Professional',
      develops:['Rally construction','Depth control','Attack selection'],
      why:'Creates a simple structure for players who attack too early. It makes length a tactical requirement rather than a technical drill.',
      what:'Player must hit three quality length shots before any short attack can score a bonus.',
      score:'Win rally = 1. Bonus +1 if player completes the length requirement then wins with an attack.',
      coach:'Use length to create the attack.',player:'Length first, attack second.',load:'Length Before Attack'
    },
    {
      id:'PP102',title:'Deep Attractor',tags:['Length','Pressure','Movement'],type:'Conditioned Game',players:'2–4',level:'Intermediate → Professional',
      develops:['Back-court pressure','Depth habits','Patient construction'],
      why:'Rewards repeated purposeful depth and helps replace loose mid-court hitting with a stable pressure-building attractor.',
      what:'Rally normally. Bonus is awarded for consecutive quality balls landing or dying in the back-court target area.',
      score:'Win rally = 1. Two consecutive deep targets = +1 bonus.',
      coach:'Make the back of the court the problem.',player:'Keep the ball working deep until the court opens.',load:'Deep Attractor'
    },
    {
      id:'PP103',title:'Break The Middle',tags:['Length','Width','Pressure','Movement'],type:'Conditioned Game',players:'2–4',level:'Intermediate → Professional',
      develops:['Width creation','Opponent displacement','Court geometry'],
      why:'Encourages players to move the opponent away from central control rather than simply hitting harder through the middle.',
      what:'Score bonuses for shots that force the opponent outside the central corridor or away from the T-zone.',
      score:'Win rally = 1. Bonus +1 when opponent is forced clearly outside central corridor.',
      coach:'Break the middle before trying to finish.',player:'Move them away from the centre.',load:'Break The Middle'
    },
    {
      id:'PP201',title:'First Volley',tags:['Volleys','T-Zone','Anticipation'],type:'Volley Game',players:'2–4',level:'Junior Beginner → Professional',
      develops:['Early interception','T-zone connection','Anticipation'],
      why:'Creates a simple invitation to look for the first realistic interception opportunity instead of waiting behind the ball.',
      what:'During each rally, the first player to take a realistic volley opportunity earns a bonus.',
      score:'Win rally = 1. First volley opportunity taken = +1 bonus.',
      coach:'Look early and take time away.',player:'See it early. Step in early.',load:'First Volley'
    },
    {
      id:'PP202',title:'Volley Finish',tags:['Volleys','Pressure','T-Zone'],type:'Volley Overlay',players:'2–4',level:'Intermediate → Professional',
      develops:['Front-foot pressure','Finishing from the air','Central control'],
      why:'Makes volleying part of the scoring problem and encourages players to search for attacking interceptions in live rallies.',
      what:'Rally normally, but the bonus finish must be made with a volley.',
      score:'Win rally = 1. Volley winner = +2 bonus.',
      coach:'Take time away when the ball presents.',player:'Own the space in front of you.',load:'Volley Finish'
    },
    {
      id:'PP203',title:'Intercept Bonus',tags:['Volleys','Anticipation','Movement'],type:'Interception Overlay',players:'2–4',level:'Intermediate → Professional',
      develops:['Opponent information pickup','Early movement','Interception skills'],
      why:'Links anticipation to action by rewarding players for moving early enough to intercept rather than simply reacting late.',
      what:'Bonus for a successful interception that changes the rally problem, even if it is not a winner.',
      score:'Win rally = 1. Successful intercept = +1 bonus.',
      coach:'Read earlier, arrive earlier.',player:'Move before the ball has already passed you.',load:'Intercept Bonus'
    },
    {
      id:'PP301',title:'Move Mindset',tags:['Movement','Double Bounce','Pressure'],type:'Double Bounce Game',players:'2–8',level:'Junior Beginner → Professional',
      develops:['Retrieval mentality','Early movement','Confidence under pressure'],
      why:'Double bounce gives slow or doubtful movers permission to commit. They learn that most balls are reachable if they move early.',
      what:'Use DB allowance so players can chase more balls and keep rallies alive while still trying to play on first bounce where possible.',
      score:'Win rally = 1. Coach may add bonus for early movement/retrieval effort.',
      coach:'Use the extra bounce to move, not to wait.',player:'Go early. You have time.',load:'Move Mindset'
    },
    {
      id:'PP302',title:'Recover To T',tags:['Movement','T-Zone','Pressure'],type:'Movement Overlay',players:'2–4',level:'Junior Beginner → Performance',
      develops:['Recovery habits','Court balance','Repeat movement'],
      why:'Makes recovery visible and scoreable without turning the session into isolated movement lines.',
      what:'Rally normally. Coach awards bonus when player recovers to an effective central position after shot execution.',
      score:'Win rally = 1. Quality recovery = +1 coach bonus.',
      coach:'Recover into the next problem.',player:'Hit, recover, read again.',load:'Recover To T'
    },
    {
      id:'PP303',title:'Continuous Pressure',tags:['Movement','Pressure','Conditioning'],type:'Conditioned Game',players:'2–8',level:'Intermediate → Professional',
      develops:['Physical resilience','Repeat effort','Decision making under fatigue'],
      why:'Extends rallies and keeps players solving squash problems while tired, rather than separating conditioning from perception and decision making.',
      what:'Use extended-rally scoring or DB support to keep rallies alive and maintain repeated movement pressure.',
      score:'Win rally = 1. Optional bonus for winning after 8+ shots.',
      coach:'Keep solving the rally problem when tired.',player:'Stay organised under pressure.',load:'Continuous Pressure'
    },
    {
      id:'PP401',title:'Off T Recognition',tags:['T-Zone','Pressure','Decision Making'],type:'T-Zone Game',players:'2–4',level:'Intermediate → Professional',
      develops:['Tactical awareness','Opponent displacement','Shot selection'],
      why:'Teaches players to recognise when they have created positional advantage rather than attacking automatically.',
      what:'Player calls or identifies when opponent is off T and may then use an attacking option.',
      score:'Win rally = 1. Correct off-T attack = +1 bonus.',
      coach:'Notice the opponent, not just the ball.',player:'See when the middle opens.',load:'Off T Recognition'
    },
    {
      id:'PP402',title:'T Challenge',tags:['T-Zone','Movement','Pressure'],type:'Checkerboard Overlay',players:'2–4',level:'Junior Elite → Professional',
      develops:['Central control','Recovery pressure','Opponent management'],
      why:'Connects scoring to court position and makes players fight for useful central control instead of standing passively on the T.',
      what:'Use T-zone bonus or requirement linked to the selected base game.',
      score:'Win rally = 1. T challenge achieved = +1 bonus.',
      coach:'Control the middle through better shots and better recovery.',player:'Win space, then use it.',load:'T Challenge'
    },
    {
      id:'PP403',title:'T + Finish',tags:['T-Zone','Volleys','Pressure'],type:'Finishing Game',players:'2–4',level:'Performance → Professional',
      develops:['Conversion','Central control','Finishing under pressure'],
      why:'Requires players to create a central advantage and then convert it rather than simply earning a position and resetting.',
      what:'Player must create T-zone advantage before the finish can score a bonus.',
      score:'Win rally = 1. T advantage + finish = +2 bonus.',
      coach:'Create the advantage and convert it.',player:'Use the middle to finish the rally.',load:'T + Finish'
    },
    {
      id:'PP501',title:'DB Move Mindset',tags:['Double Bounce','Movement','Anticipation'],type:'DB Protocol',players:'2–8',level:'Junior Beginner → Performance',
      develops:['Move-first behaviour','Anticipation','Confidence'],
      why:'The extra bounce gives players a genuine chance to reach the ball, reducing hesitation and encouraging earlier commitment.',
      what:'Give selected players DB allowance and reward early movement attempts.',
      score:'Win rally = 1. Optional movement bonus for high-effort retrievals.',
      coach:'The DB is there to help you move sooner.',player:'Move first, solve second.',load:'DB Move Mindset'
    },
    {
      id:'PP502',title:'DB Physical Pressure',tags:['Double Bounce','Conditioning','Pressure','Movement'],type:'DB Protocol',players:'2–8',level:'Intermediate → Professional',
      develops:['Physical pressure','Long-rally tolerance','Repeat decisions'],
      why:'DB keeps rallies alive and creates squash-specific conditioning while maintaining perception, decision making and tactical pressure.',
      what:'Use DB allowances to extend rallies and increase the number of meaningful movement problems.',
      score:'Win rally = 1. Optional bonus for winning after extended rally length.',
      coach:'Keep the rally alive and keep solving.',player:'Stay organised as the rally gets longer.',load:'DB Physical Pressure'
    },
    {
      id:'PP503',title:'DB Early Deception',tags:['Double Bounce','Deception','Anticipation','Short Game'],type:'DB Deception Game',players:'2–4',level:'Intermediate → Professional',
      develops:['Hold','Disguise','Opponent movement reading'],
      why:'The extra time allows players to experiment with hold and deception without the rally collapsing immediately.',
      what:'Allow DB and encourage players to hold long enough to move the opponent before choosing the space.',
      score:'Win rally = 1. Deceptive shot that moves opponent wrong way = +1 bonus.',
      coach:'Hold to move the opponent, not to show off.',player:'Move them with your shape, then use the space.',load:'DB Early Deception'
    },
    {
      id:'PP504',title:'DB Dying Ball',tags:['Double Bounce','Short Game','Pressure'],type:'DB Short Game',players:'2–4',level:'Junior Beginner → Professional',
      develops:['Short-ball quality','Touch under pressure','Judicious attack'],
      why:'Because the opponent can often still reach the ball, players learn that a good short ball must die or create genuine pressure.',
      what:'Use DB while rewarding short balls that bounce twice quickly or force a very poor retrieval.',
      score:'Win rally = 1. Dying short ball = +1 bonus.',
      coach:'Make the ball die, not just land short.',player:'Short ball must lose energy.',load:'DB Dying Ball'
    },
    {
      id:'PP505',title:'DB Extended Rally Conditioning',tags:['Double Bounce','Conditioning','Pressure','Movement'],type:'DB Conditioning Game',players:'2–8',level:'Intermediate → Professional',
      develops:['Physical resilience','Rally extension','Pressure tolerance'],
      why:'Useful for conditioning phases because rallies last longer while still preserving squash decisions and opponent information.',
      what:'Run DB matchplay with team or player DB allocations to extend rallies for a defined work period.',
      score:'Win rally = 1. Optional team bonus for longest rally or repeated retrievals.',
      coach:'Use the support to create more meaningful work.',player:'Keep moving and keep deciding.',load:'DB Extended Rally Conditioning'
    }
  ];
  const filtered=active==='Power Play'?games.filter(g=>g.tags.includes('Power Play')):games.filter(g=>g.tags.includes(active)&&!g.tags.includes('Power Play'));
  const [constraintAppliesTo,setConstraintAppliesTo]=useState('Both Players');
  const [constraintTiming,setConstraintTiming]=useState('Whole Session');

  function loadGame(game){
    const card={
      title:game.title,
      category:game.tags.includes('Power Play')?'Power Play':'Plug & Play',
      task:`${game.type} · ${game.players} · ${game.level} · Constraint: ${constraintAppliesTo} · ${constraintTiming}`,
      rationale:game.why,
      coach:game.coach,
      playerFocus:game.player,
      scoring:game.score,
      whatToDo:game.what,
      constraintAppliesTo,constraintTiming,
      antiGaming:'Keep the constraint tied to the learning purpose. Remove or reduce it if players start exploiting it.',
      suggestedOverlays:game.tags.filter(t=>['Pressure','Length','Volleys','T-Zone','Double Bounce','Movement'].includes(t))
    };
    if(typeof setSession==='function') setSession(prev=>[...(prev||[]),card]);
  }
  return <div className="page plugPlayPage">
    <div className="pageTop"><div><h1>Plug & Play</h1><p className="mutedText">Select an outcome. Run a proven game.</p></div><button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button></div>
    <div className="libraryStageIntro plugPlayIntro"><h2>Coach View: What do you want to improve today?</h2><p>Plug & Play organises games by coaching outcome. A game can appear in several categories because the same constraint can solve several coaching problems.</p></div>

    <div className="plugPlayConstraintBar">
      <div className="plugPlayConstraintRow">
        <strong>Constraint Applies To</strong>
        <div className="plugPlayConstraintBtns">
          {['Both Players','Server Only','Receiver Only'].map(opt=><button key={opt} type="button"
            className={constraintAppliesTo===opt?'plugConstraintActive':'plugConstraintBtn'}
            onClick={()=>setConstraintAppliesTo(opt)}>{opt}</button>)}
        </div>
      </div>
      <div className="plugPlayConstraintRow">
        <strong>Constraint Duration</strong>
        <div className="plugPlayConstraintBtns">
          {['Whole Session','Per Rotation','Per Round'].map(opt=><button key={opt} type="button"
            className={constraintTiming===opt?'plugConstraintActive':'plugConstraintBtn'}
            onClick={()=>setConstraintTiming(opt)}>{opt}</button>)}
        </div>
      </div>
    </div>

    <div className="universalFamilyTabs plugPlayTabs">{outcomes.map(o=><button key={o} className={active===o?'activeFamilyTab':''}  onClick={()=>setActive(o)}>{o}</button>)}</div>

    {active==='Power Play'
      ?<div className="ppPlugPlaySection">
        <div className="ppPlugPlayIntro">
          <span className="ppEngineTag" style={{marginBottom:'10px',display:'inline-block'}}>⚡ Power Play™</span>
          <h2>Power Play Games</h2>
          <p className="mutedText">Tactical decision-making games built around the question: <em>"When should I commit?"</em> All games use King of Court format. Select a game to add to session.</p>
        </div>
        <div className="plugPlayGrid">{filtered.map(game=><div className="gameCard plugPlayCard ppPlugCard" key={game.id}>
          <div className="plugPlayCardTop">
            <span className="categoryTag">{game.id} · {game.type}</span>
            <span className="plugLevel">{game.level}</span>
          </div>
          <h2>{game.title}</h2>
          <div className="ppPlugCardBody">
            <div className="ppPlugSection"><strong>Why Use It</strong><p>{game.why}</p></div>
            <div className="ppPlugSection"><strong>What To Do</strong><p>{game.what}</p></div>
            <div className="ppPlugSection ppPlugScoring"><strong>Scoring</strong><p>{game.score}</p></div>
            <div className="ppPlugSection ppPlugCoach"><strong>Coach Note</strong><p>{game.coach}</p></div>
            <div className="ppPlugSection ppPlugPlayer"><strong>Player Instruction</strong><p>{game.player}</p></div>
          </div>
          <button className="primaryBtn ppPlugAddBtn" onClick={()=>loadGame(game)}>Add to Session</button>
        </div>)}</div>
        <div className="ppPlugPlayBuilderLink">
          <p className="mutedText">Want to customise a Power Play game?</p>
          <button className="secondaryBtn" onClick={()=>setScreen('gamesLibrary')}>Open Power Play™ Builder in Games Library</button>
        </div>
      </div>
      :<>
        <div className="plugPlayOutcomeBar"><strong>{active}</strong><span>{filtered.length} ready-to-run games</span></div>
        <div className="plugPlayGrid">{filtered.map(game=><div className="gameCard plugPlayCard" key={game.id}>
          <div className="plugPlayCardTop"><span className="categoryTag">{game.id} · {game.type}</span><span className="plugLevel">{game.level}</span></div>
          <RLDBadge level={3}/>
      <h2>{game.title}</h2>
      <div className="plugTags">{game.tags.map(t=><span key={t}>{t}</span>)}</div>
      <p><strong>Develops</strong><br/>{game.develops.join(' · ')}</p>
      <p><strong>Why use it?</strong><br/>{game.why}</p>
      <p><strong>What to do</strong><br/>{game.what}</p>
      <p><strong>How to score</strong><br/>{game.score}</p>
      <p><strong>Coach instruction</strong><br/>{game.coach}</p>
      <p><strong>Player focus</strong><br/>{game.player}</p>
      <p><strong>Players:</strong> {game.players}</p>
      <button className="primaryBtn" onClick={()=>loadGame(game)}>Load Game</button>
    </div>)}</div>
      </>
    }
  </div>;
}


function GameConstraintsEngine({setScreen,setSession,onAddToSession,embedded=false,initialBaseGame='ATL / BTL',onClose}){
  const [family,setFamily]=useState('Tactical Constraints');
  const [selected,setSelected]=useState({});
  const [status,setStatus]=useState('');
  const [baseGame,setBaseGame]=useState(initialBaseGame||'ATL / BTL');
  const [appliesTo,setAppliesTo]=useState('Whole game');
  const [consequence,setConsequence]=useState('No Bonus');
  const [customCode,setCustomCode]=useState('[5-4]');
  const baseGames=['ATL / BTL','Checkerboard','Matchplay','Invasion','Pressure','Double Bounce','Plug & Play'];
  const applicationOptions=['Whole game','Selected player','Stronger player','Selected team','Both players'];
  const consequenceOptions=['No Bonus','Opponent +1','Lose Rally','Warning Then Penalty','Bonus +1','Bonus +2'];
  const constraintFamilies={
    'Tactical Constraints':[
      {id:'TC01',title:'Opponent Off T',type:'Required / Bonus',develops:'Opportunity recognition',rule:'Attack, score or gain bonus only when the opponent is visibly off the T at striker contact.',rationale:'Encourages players to attack genuine advantage rather than attacking by habit.',best:'ATL/BTL · Matchplay · Plug & Play · Pressure'},
      {id:'TC02',title:'Quality Length Before Attack',type:'Required',develops:'Pressure before attack',rule:'Player must create a quality length before attacking short or going BTL.',rationale:'Builds rally construction and reduces premature attacking.',best:'ATL/BTL · Length games · Pressure games'},
      {id:'TC03',title:'Checkerboard Gate',type:'Required',develops:'Tactical preparation',rule:'Complete a selected Checkerboard challenge before the attack is valid. Example: complete [5-4] before BTL.',rationale:'Links attack to a clear tactical affordance gate using the app language.',best:'ATL/BTL · Checkerboard · Matchplay'},
      {id:'TC04',title:'Weak Side Access',type:'Required / Bonus',develops:'Targeting opponent weakness',rule:'Attack or bonus must use the nominated weak-side zone or route.',rationale:'Connects decision making to opponent-specific tactical information.',best:'Matchplay · Plug & Play · Pressure'},
      {id:'TC05',title:'First Volley Opportunity',type:'Tactical behaviour',develops:'Interception intent',rule:'If a realistic volley opportunity appears, player is rewarded for taking it.',rationale:'Encourages volley behaviour without forcing impossible volleys.',best:'Volley games · T-Zone · Anticipation'},
      {id:'TC06',title:'4 Shot Conversion Window',type:'Conversion',develops:'Opportunity conversion',rule:'Complete constraint, then win within 4 shots.',rationale:'Turns recognition into a conversion challenge under time pressure.',best:'Checkerboard Level 4 · Pressure'},
      {id:'TC07',title:'2 Shot Conversion Window',type:'Conversion',develops:'Elite urgency',rule:'Complete constraint, then win within 2 shots.',rationale:'Creates high-level urgency and punishes slow conversion.',best:'Checkerboard Level 5 · Performance'}
    ],
    'Behaviour Constraints':[
      {id:'BC01',title:'Racquet Above Wrist',type:'Technical',develops:'Ready shape',rule:'If racquet head drops below wrist in preparation, apply selected consequence.',rationale:'Establishes a useful preparation behaviour through the game rather than stopping for instruction.',best:'Group sessions · Volleys · Technical focus'},
      {id:'BC02',title:'Early Preparation',type:'Technical',develops:'Earlier organisation',rule:'Preparation must be visible before leaving the T or before the final approach step.',rationale:'Couples movement and preparation earlier under representative pressure.',best:'ATL/BTL · Checkerboard · Movement games'},
      {id:'BC03',title:'Non-Playing Arm Visible',type:'Technical',develops:'Body organisation',rule:'Non-playing arm must remain useful/visible during preparation and spacing.',rationale:'Constrains body shape without over-coaching swing mechanics.',best:'Drive games · Back-court games'},
      {id:'BC04',title:'Finish To Front Wall',type:'Technical',develops:'Target-directed swing',rule:'If follow-through wraps away from the front-wall target line, apply consequence.',rationale:'Uses an external target finish to reduce wrap-around habits.',best:'Forehand follow-through · Drives'},
      {id:'BC05',title:'Positive Body Language',type:'Mental',develops:'Reset behaviour',rule:'Negative reaction after error triggers warning or point consequence.',rationale:'Builds competitive stability in group sessions without long coach lectures.',best:'Competition · Matchplay · Junior groups'},
      {id:'BC06',title:'Move First',type:'Mental / Movement',develops:'Commitment to movement',rule:'Hesitation or stopping when ball is reachable triggers coach consequence.',rationale:'Builds a move-first mindset, especially with slow or doubtful movers.',best:'Double Bounce · Movement · Invasion'},
      {id:'BC07',title:'Commit To Decision',type:'Mental',develops:'Decisive action',rule:'Indecisive half-attack or pull-out triggers no bonus or opponent point.',rationale:'Encourages players to make and own decisions under pressure.',best:'Pressure · Deception · Matchplay'}
    ],
    'Handicap Constraints':[
      {id:'HC01',title:'Bounce Handicap',type:'DB Allocation',develops:'Balancing movement/time',rule:'Assign No DB, 1 DB, 2 DB, 3 DB, 4 DB, 5 DB or Unlimited DB to present players.',rationale:'Balances mismatches while keeping players solving the same rally problem.',best:'Groups · Invasion · Matchplay'},
      {id:'HC02',title:'ATL Only',type:'Restriction Handicap',develops:'Balance stronger player',rule:'Selected stronger player may only play above-the-line until handicap is removed.',rationale:'Limits attacking power while preserving recognisable squash patterns.',best:'Mismatched pairs · Team games'},
      {id:'HC03',title:'Straight Only',type:'Restriction Handicap',develops:'Limits angle/width',rule:'Selected stronger player may only play straight.',rationale:'Reduces available options and forces better rally construction.',best:'Mismatched pairs · Length focus'},
      {id:'HC04',title:'Right Side Only',type:'Spatial Restriction',develops:'Court-side limitation',rule:'Selected stronger player can only use right-side targets/zones.',rationale:'Creates an understandable court restriction without inventing a new rule language.',best:'Groups · Side-specific development'},
      {id:'HC05',title:'Left Side Only',type:'Spatial Restriction',develops:'Court-side limitation',rule:'Selected stronger player can only use left-side targets/zones.',rationale:'Balances challenge and supports side-specific tactical work.',best:'Groups · Side-specific development'},
      {id:'HC06',title:'Checkerboard Gate Handicap',type:'Checkerboard Restriction',develops:'Work harder before attack',rule:'Selected stronger player must complete a single/pair/triple code before attack. Example: [5-4] before BTL.',rationale:'The stronger player is handicapped by needing to create a tactical gate, not by silly non-representative rules.',best:'Checkerboard culture · ATL/BTL · Matchplay'},
      {id:'HC07',title:'Spatial Allowed Zones',type:'Checkerboard Spatial Restriction',develops:'Universal code restriction',rule:'Selected stronger player may only play into nominated zones. Example: [5]+[7] or [5-4]+[6-3].',rationale:'Uses Checkerboard notation as the universal app language, reducing clutter and increasing consistency.',best:'Advanced handicaps · Tactical targeting'},
      {id:'HC08',title:'Spatial Forbidden Zones',type:'Checkerboard Spatial Restriction',develops:'Option removal',rule:'Selected stronger player may not use nominated zones/routes. Example: cannot use [8-1].',rationale:'Removes a strength or habit while preserving representative rally play.',best:'Opponent-specific prep · Match analysis transfer'}
    ],
    'Consequences':[
      {id:'CE01',title:'No Bonus',type:'Soft consequence',develops:'Low-friction learning',rule:'constraint failure means no bonus awarded but rally continues.',rationale:'Good first step for learning without over-penalising.',best:'Junior beginner · New condition'},
      {id:'CE02',title:'Opponent +1',type:'Point consequence',develops:'Accountability',rule:'constraint failure gives opponent one point.',rationale:'Useful when behaviour is established but needs pressure.',best:'Groups · Behaviour conditions'},
      {id:'CE03',title:'Lose Rally',type:'Hard consequence',develops:'Strong behaviour shaping',rule:'constraint failure immediately loses rally.',rationale:'Use sparingly for clear behaviours that are already understood.',best:'Performance · Strong habit correction'},
      {id:'CE04',title:'Warning Then Penalty',type:'Progressive consequence',develops:'Fair behaviour change',rule:'First offence warning, second offence penalty.',rationale:'Good for mental/technical behaviours in groups.',best:'Junior groups · Behaviour conditions'},
      {id:'CE05',title:'Bonus +1 / +2',type:'Reward consequence',develops:'Positive shaping',rule:'Constraint success earns bonus.',rationale:'Encourages desired behaviour without making game feel punitive.',best:'Plug & Play · Tactical constraints'}
    ]
  };
  const families=Object.keys(constraintFamilies);
  const activeList=constraintFamilies[family]||[];
  function toggle(item){setStatus('');setSelected(prev=>({...prev,[item.id]:prev[item.id]?undefined:item}));}
  const picked=Object.values(selected).filter(Boolean);
  const selectedSummary=picked.length?picked.map(x=>`${x.title} (${x.type})`).join(' · '):'No constraints selected';
  function addToSession(){
    const title=`${baseGame} + Game Constraints`;
    const game={
      id:Date.now()+Math.random(),title,category:'Game Constraints',duration:10,
      task:`Base game: ${baseGame}. Apply to: ${appliesTo}. Checkerboard code / spatial code: ${customCode}.`,
      rationale:'Conditions keep the base game simple while shaping tactical decisions, behaviour standards or handicap restrictions.',
      whatToDo:picked.length?picked.map(x=>`${x.title}: ${x.rule}`).join(' '):'Select conditions, then apply them to a base game.',
      scoring:`Consequence: ${consequence}. Use only the minimum consequence needed to shape the behaviour.`,
      coach:'Choose the base game first, then add the minimum constraint needed for the coaching problem.',
      playerFocus:'Understand the constraint. Solve the rally problem inside it.',
      suggestedOverlays:picked.map(x=>x.title),layers:['Game Constraints'],cbCode:customCode,conditions:picked,applyTo:appliesTo,consequence
    };
    if(typeof onAddToSession==='function'){onAddToSession(game);setStatus('Game Constraints card added to session.');return;}
    if(typeof setSession==='function'){setSession(prev=>[...(prev||[]),game]);setStatus('Game Constraints card added to session.');return;}
    setStatus('Session connection not available.');
  }
  return <div className="page gameConstraintsPage">
    {!embedded&&<div className="pageTop"><div><h1>Game Constraints</h1><p className="mutedText">Base game first. Then tactical, behaviour and handicap constraints with clear rationale.</p></div><button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button></div>}
    {embedded&&<div className="constraintsEmbeddedTop"><div><h2>Game Constraints</h2><p className="mutedText">Add tactical, behaviour or handicap constraints to this base game without leaving the page.</p></div><button className="secondaryBtn" onClick={onClose}>Close Conditions</button></div>}
    <div className="constraintsIntro"><h2>v100h10 Embedded Conditions Workflow</h2><p>Stop separating overlays, game logic and special rules. Choose the base game, add a small number of conditions, then choose the consequence.</p><p><strong>Decision test:</strong> tactical decision, behaviour standard or handicap restriction?</p></div>
    <div className="constraintBuilderPanel">
      <div><label>Base Game</label><select value={baseGame} onChange={e=>setBaseGame(e.target.value)}>{baseGames.map(x=><option key={x}>{x}</option>)}</select></div>
      <div><label>Apply To</label><select value={appliesTo} onChange={e=>setAppliesTo(e.target.value)}>{applicationOptions.map(x=><option key={x}>{x}</option>)}</select></div>
      <div><label>Consequence</label><select value={consequence} onChange={e=>setConsequence(e.target.value)}>{consequenceOptions.map(x=><option key={x}>{x}</option>)}</select></div>
      <div><label>CB Code / Spatial Code</label><input value={customCode} onChange={e=>setCustomCode(e.target.value)} placeholder="[5-4] or [5]+[7]"/></div>
    </div>
    <div className="constraintsExampleBox"><h2>Example</h2><p><strong>Base Game:</strong> ATL / BTL</p><p><strong>Tactical condition:</strong> Complete <strong>[5-4]</strong> before BTL.</p><p><strong>Handicap restriction:</strong> Stronger player allowed zones <strong>[5]+[7]</strong> only.</p><p><strong>Behaviour condition:</strong> Racquet above wrist. Consequence: {consequence}.</p></div>
    <div className="constraintsTabs">{families.map(f=><button key={f} className={family===f?'activeConstraintTab':''} onClick={()=>setFamily(f)}>{f}</button>)}</div>
    <div className="constraintsLayout">
      <div className="constraintsGrid">{activeList.map(item=><button key={item.id} className={selected[item.id]?'constraintCard selectedConditionCard':'constraintCard'} onClick={()=>toggle(item)}>
        <span className="conditionCode">{item.id} · {item.type}</span><h2>{item.title}</h2><p><strong>Develops</strong><br/>{item.develops}</p><p><strong>Rule</strong><br/>{item.rule}</p><p><strong>Rationale</strong><br/>{item.rationale}</p><p><strong>Best used with</strong><br/>{item.best}</p>
      </button>)}</div>
      <aside className="activeConstraintsPanel"><h2>Selected Constraints</h2><div className="activeConstraintMeta"><p><strong>Base:</strong> {baseGame}</p><p><strong>Apply to:</strong> {appliesTo}</p><p><strong>Consequence:</strong> {consequence}</p><p><strong>CB / Spatial:</strong> {customCode}</p></div>{picked.length===0?<p>No constraints selected.</p>:picked.map(item=><div key={item.id} className="activeConstraintItem"><strong>{item.title}</strong><span>{item.type}</span><p>{item.rule}</p></div>)}<button className="primaryBtn" onClick={addToSession}>Add Constraints Card To Session</button>{status&&<div className="statusBox">{status}</div>}<div className="playerViewMini"><h3>Player View Preview</h3><p><strong>WHAT TO DO</strong><br/>{baseGame} with selected constraints.</p><p><strong>HOW TO SCORE</strong><br/>{consequence}</p><p><strong>KEY FOCUS</strong><br/>{selectedSummary}</p></div></aside>
    </div>
  </div>;
}
function RLDScreen({setScreen}){
  const [activeSection,setActiveSection]=useState('rld');

  const rldExamples={
    0:{
      activities:['Tau Development','Ball Tracking','Chipping (0A–0G)','Arrive and Strike','Movement Calibration','Catch and Track'],
      characteristics:['Simplified environment','Reduced uncertainty','Reduced opponent influence','High success rates'],
      rationale:'Players cannot solve squash problems if they cannot yet judge time to contact, contact distance or ball flight. Level 0 develops the foundations for representative practice.',
      cpfGuide:'When a player achieves 90%+ success on a chipping or tracking task, move to RLD 1. Do not add more repetitions — increase representativeness.',
    },
    1:{
      activities:['Coach calls zone sequence 1→2→3→4','Coach directs feed to specified area','Coach calls shot type before rally','Structured feed with called targets'],
      characteristics:['Low uncertainty','High coach control','Minimal decision making','Player solves the coach\'s problem'],
      rationale:'Useful for introducing a task or concept. The player follows coach direction. Limited transfer to competition — use briefly before moving to RLD 2.',
      cpfGuide:'When a player achieves 90%+ success following coach calls, move to RLD 2 and give the player the decision.',
    },
    2:{
      activities:['Player selects own zone sequence','Player chooses shot type','Player-directed Around The Board','Self-selected ATL/BTL pattern'],
      characteristics:['Increased choice','Reduced coach control','Early autonomous decision making','Player begins solving their own problem'],
      rationale:'The player begins making their own decisions. This is a critical step toward competitive transfer — the player must learn to generate problems and solutions.',
      cpfGuide:'When a player achieves 90%+ success on self-directed tasks, move to RLD 3 and add an opponent to interact with.',
    },
    3:{
      activities:['Leader-Follower Around The Board','ATL/BTL with leader-follower','Cooperative rally with zone targets','Checkerboard with partner interaction'],
      characteristics:['Continuous adaptation','Opponent interaction','Variable solutions required','Behaviour emerges through interaction'],
      rationale:'Behaviour emerges through interaction with another player. The follower must read, respond and find their own solution. This is the first genuinely interactive level.',
      cpfGuide:'When a player achieves 90%+ success in leader-follower tasks, move to RLD 4 by adding scoring consequences.',
    },
    4:{
      activities:['Checkerboard challenge scoring','Power Play games','Conditioned games with point scoring','Around The Board with scoring'],
      characteristics:['Consequences matter','Risk-reward decisions emerge','Tactical choices increase','Players solve problems while trying to win'],
      rationale:'Scoring changes behaviour. Players begin to make risk-reward decisions. The consequence of failure now matters — which is closer to competition.',
      cpfGuide:'When a player achieves 90%+ success in scored conditioned games, move to RLD 5 with competitive intent.',
    },
    5:{
      activities:['Competitive Checkerboard','Conditioned matchplay','Pressure games','Competitive Around The Board','Invasion games'],
      characteristics:['High uncertainty','Tactical adaptation required','Competitive intent','Closest approximation to competition below Level 6'],
      rationale:'The activity resembles competition in most important ways. The player must adapt tactically, manage pressure and execute under competitive consequence.',
      cpfGuide:'When a player achieves 90%+ success in competitive practice, they are ready for RLD 6 — actual competition.',
    },
    6:{
      activities:['Tournament match','League match','Box league','National League','Monrad draw','Championship finals','Invasion finals'],
      characteristics:['Maximum uncertainty','Maximum consequence','Emotional pressure','Tactical and opponent adaptation','Nothing is more representative'],
      rationale:'Competition itself. All lower RLD levels exist to prepare players for this. The double dot represents the double yellow dots of a competition squash ball.',
      cpfGuide:'The Challenge Point Framework still applies in competition. If a player is achieving 90%+ success in matches, they need harder competition. If below 50%, they need more time at RLD 4–5.',
    },
  };

  return <div className="page rldPage">
    <div className="pageTop">
      <div><h1>RLD & Challenge Point</h1><p className="mutedText">Representativeness · When to move · How to progress</p></div>
      <button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button>
    </div>

    <div className="rldSectionNav">
      {[{id:'rld',label:'RLD Scale',emoji:'📊'},{id:'cpf',label:'Challenge Point',emoji:'🎯'},{id:'together',label:'Using Together',emoji:'🔗'}].map(s=>
        <button key={s.id} type="button"
          className={activeSection===s.id?'rldNavActive':'rldNavBtn'}
          onClick={()=>setActiveSection(s.id)}>
          <span>{s.emoji}</span>{s.label}
        </button>
      )}
    </div>

    {/* ── RLD SCALE ── */}
    {activeSection==='rld'&&<div>
      <div className="rldHero">
        <h2>Representative Learning Design Scale</h2>
        <p>RLD is a <strong>representativeness scale</strong> — not a difficulty ladder. It describes how closely an activity resembles the perceptual, decision-making and adaptive demands of real squash competition.</p>
        <div className="rldHeroPrinciple">"How much does this look and feel like real squash?"</div>
        <p className="mutedText">Move players to higher RLD as quickly as their development allows. Use the Challenge Point Framework to judge when they are ready. The goal is always RLD 6.</p>
      </div>

      <div className="rldLevelsStack">
        {RLD_LEVELS.map(r=>{
          const ex=rldExamples[r.level];
          return <div key={r.level} className="rldLevelCardFull" style={{borderColor:r.color,background:r.bg}}>
            <div className="rldLevelCardTop">
              <div className="rldLevelDotLg" style={{background:r.color}}>
                {r.doubleDot&&<><span className="rldInnerDotLg"/><span className="rldInnerDotLg"/></>}
              </div>
              <div className="rldLevelCardTitle">
                <strong style={{color:r.textColor}}>{r.short} — {r.label}</strong>
                <p style={{color:r.textColor,opacity:.85,fontSize:'13px',margin:'3px 0 0'}}>{r.desc}</p>
              </div>
            </div>
            <div className="rldLevelCardBody">
              <div className="rldLevelSection">
                <span className="rldLevelSectionLabel">Examples</span>
                <div className="rldExamplePills">
                  {ex.activities.map(a=><span key={a} style={{borderColor:r.color+'66',color:r.textColor}}>{a}</span>)}
                </div>
              </div>
              <div className="rldLevelSection">
                <span className="rldLevelSectionLabel">Characteristics</span>
                <div className="rldCharList">
                  {ex.characteristics.map(c=><span key={c}>· {c}</span>)}
                </div>
              </div>
              <div className="rldLevelSection rldRationale">
                <span className="rldLevelSectionLabel">Rationale</span>
                <p style={{color:r.textColor,opacity:.9}}>{ex.rationale}</p>
              </div>
              <div className="rldCPFGuide" style={{borderColor:r.color+'88',background:r.color+'11'}}>
                <span style={{color:r.textColor,fontSize:'11px',fontWeight:900,textTransform:'uppercase',letterSpacing:'.05em'}}>Challenge Point Guide</span>
                <p style={{color:r.textColor,opacity:.9,fontSize:'13px',margin:'4px 0 0'}}>{ex.cpfGuide}</p>
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>}

    {/* ── CHALLENGE POINT ── */}
    {activeSection==='cpf'&&<div>
      <div className="rldHero">
        <h2>Challenge Point Framework</h2>
        <div className="cpAttributionRow">
          <div className="cpAttributionCard">
            <strong>Academic Foundation</strong>
            <p>Guadagnoli & Lee (2004) — <em>Journal of Motor Behavior</em></p>
            <p>Learning is maximised when task difficulty is matched to performer skill so that the learner receives the greatest amount of meaningful information without becoming overwhelmed.</p>
          </div>
          <div className="cpAttributionCard">
            <strong>Practical Application</strong>
            <p>Ecological dynamics practitioners including Rob Gray have translated the Challenge Point Framework into practical coaching guidance — monitoring success rates and adjusting task difficulty accordingly.</p>
          </div>
        </div>
        <div className="rldHeroPrinciple">The Checkerboard 70% Rule: Target approximately 70% success. Success is frequent enough to maintain confidence. Failure is frequent enough to require adaptation.</div>
      </div>

      <div className="cpVisualZones">
        <div className="cpVisualCard cpVisualHard">
          <div className="cpVisualIcon">🔴</div>
          <div className="cpVisualPct">Below 50%</div>
          <div className="cpVisualLabel">Too Difficult</div>
          <div className="cpVisualSigns">
            <strong>Signs</strong>
            <span>Constant failure</span><span>Frustration</span><span>Loss of confidence</span><span>No adaptation visible</span><span>Reduced tactical awareness</span>
          </div>
          <div className="cpVisualAction">
            <strong>Reduce Challenge</strong>
            <span>Move down an RLD level</span><span>Simplify the task</span><span>Increase ball size</span><span>Reduce uncertainty</span><span>Reduce opponent pressure</span>
          </div>
        </div>
        <div className="cpVisualCard cpVisualOptimal">
          <div className="cpVisualIcon">🟡</div>
          <div className="cpVisualPct">Around 70%</div>
          <div className="cpVisualLabel">Optimal Zone ✓</div>
          <div className="cpVisualSigns">
            <strong>Signs</strong>
            <span>Regular success</span><span>Regular adaptation</span><span>High engagement</span><span>High concentration</span><span>Active problem solving</span>
          </div>
          <div className="cpVisualAction">
            <strong>Stay Here</strong>
            <span>This is where learning is maximised</span><span>Do not reduce challenge because failure occurs</span><span>Failure at this rate is part of the process</span>
          </div>
        </div>
        <div className="cpVisualCard cpVisualEasy">
          <div className="cpVisualIcon">🟢</div>
          <div className="cpVisualPct">Above 90%</div>
          <div className="cpVisualLabel">Too Easy</div>
          <div className="cpVisualSigns">
            <strong>Signs</strong>
            <span>Very few errors</span><span>Little adaptation</span><span>Reduced concentration</span><span>Boredom</span><span>Automatic performance</span>
          </div>
          <div className="cpVisualAction">
            <strong>Increase Challenge</strong>
            <span>Move up an RLD level</span><span>Add opponent interaction</span><span>Add scoring consequences</span><span>Increase variability</span><span>Increase uncertainty</span>
          </div>
        </div>
      </div>

      <div className="cpReference">
        <strong>Reference</strong>
        <p>Guadagnoli, M.A., & Lee, T.D. (2004). Challenge point: A framework for conceptualizing the effects of various practice conditions in motor learning. <em>Journal of Motor Behavior, 36</em>(2), 212–224.</p>
      </div>
    </div>}

    {/* ── USING TOGETHER ── */}
    {activeSection==='together'&&<div>
      <div className="rldHero">
        <h2>Using RLD and Challenge Point Together</h2>
        <p>RLD and the Challenge Point Framework answer different questions. Together they give the coach a complete picture of what to do next.</p>
      </div>

      <div className="rldTogetherGrid">
        <div className="rldTogetherCard rldTogetherRLD">
          <strong>RLD asks:</strong>
          <p>"How representative is this activity?"</p>
          <span>How close to real squash does it feel?</span>
        </div>
        <div className="rldTogetherCard rldTogetherCPF">
          <strong>Challenge Point asks:</strong>
          <p>"Is the difficulty right for this player?"</p>
          <span>Are they in the 70% learning zone?</span>
        </div>
        <div className="rldTogetherCard rldTogetherGoal">
          <strong>The coaching goal:</strong>
          <p>"Find the highest RLD level at which meaningful adaptation can still occur."</p>
          <span>That is where learning is maximised.</span>
        </div>
      </div>

      <div className="rldDecisionFlow">
        <h3>Practical Decision Flow</h3>
        <div className="rldFlowSteps">
          <div className="rldFlowStep">
            <span className="rldFlowNum">1</span>
            <div><strong>Observe success rate</strong><p>Watch during the activity. Is the player succeeding most of the time, some of the time, or rarely?</p></div>
          </div>
          <div className="rldFlowArrow">↓</div>
          <div className="rldFlowStep rldFlowRed">
            <span className="rldFlowNum" style={{background:'#ef4444'}}>🔴</span>
            <div><strong>Below 50% — reduce challenge</strong><p>Simplify the task, use a larger ball, reduce feed pace, or move down an RLD level.</p></div>
          </div>
          <div className="rldFlowArrow">↓</div>
          <div className="rldFlowStep rldFlowYellow">
            <span className="rldFlowNum" style={{background:'#eab308'}}>🟡</span>
            <div><strong>Around 70% — stay here</strong><p>This is the learning zone. Keep the activity running. Observe adaptation. Do not intervene.</p></div>
          </div>
          <div className="rldFlowArrow">↓</div>
          <div className="rldFlowStep rldFlowGreen">
            <span className="rldFlowNum" style={{background:'#4ade80',color:'#000'}}>🟢</span>
            <div><strong>Above 90% — move up</strong><p>Increase the RLD level. Add opponent pressure. Add scoring. Increase representativeness.</p></div>
          </div>
        </div>
      </div>

      <div className="rldPrincipleFinal">
        <div className="cpPrincipleAsk cpPrincipleNo" style={{marginBottom:'10px'}}>
          <span className="cpPrincipleNo" style={{color:'#ef4444',display:'block',fontSize:'12px',fontWeight:900,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'6px'}}>Do not ask:</span>
          <p style={{color:'#9fb0c8',fontStyle:'italic',fontSize:'14px',margin:0}}>"What is the hardest task?"</p>
        </div>
        <div className="cpPrincipleAsk cpPrincipleYes" style={{background:'#052e16',border:'1px solid #4ade80',borderRadius:'12px',padding:'14px 16px'}}>
          <span style={{display:'block',color:'#4ade80',fontSize:'12px',fontWeight:900,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'6px'}}>Ask instead:</span>
          <p style={{color:'#fff',fontWeight:700,fontStyle:'italic',fontSize:'14px',margin:0}}>"What is the hardest task this player can successfully adapt to?"</p>
        </div>
      </div>

      <div className="cpUniversalNote">
        <strong>Applies to all Checkerboard activities</strong>
        <div className="cpUniversalList">
          {['Level 0','Around The Board','ATL / BTL','Checkerboard','Pressure','Matchplay','Competition'].map(a=><span key={a}>{a}</span>)}
        </div>
      </div>
    </div>}
  </div>;
}

function Home({setScreen}){
return <div className="homeGrid homeGridV99h52">
      <div className="homeBrandCard compactHomeBrand"><h1>Checkerboard Squash™</h1><p className="homeBrandSubtitle">"A Constraint Is Worth a Thousand Words"</p></div>

      <button className="homeRLDTile homeBrandCard" onClick={()=>setScreen('rld')}>
        <div className="homeRLDLeft">
          <strong>RLD & Challenge Point Framework</strong>
          <p>Representativeness scale · 70% rule · Move players toward competition</p>
        </div>
        <div className="homeRLDDots">
          {RLD_LEVELS.map(r=><span key={r.level} className="homeRLDDot" style={{background:r.color}}>{r.doubleDot&&<><span className="rldInnerDotSm"/><span className="rldInnerDotSm"/></>}</span>)}
        </div>
      </button>

      <button className="tile green homeTitleOnly" onClick={()=>setScreen('players')}><h2>Players</h2></button>
      <button className="homeCard gamesLibraryHomeCard homeTitleOnly" onClick={()=>setScreen('gamesLibrary')}><h2>Games Library</h2></button>
      <button className="homeCard plugPlayHomeCard homeTitleOnly" onClick={()=>setScreen('plugPlay')}><h2>Plug & Play</h2></button>
      <button className="homeCard constraintsHomeCard homeTitleOnly" onClick={()=>setScreen('constraints')}><h2>Game Constraints</h2></button>

      <button className="homeCard shotsHomeCard homeTitleOnly" onClick={()=>setScreen('shots')}><h2>Shots</h2></button>
      <button className="tile red homeTitleOnly" onClick={()=>setScreen('competition')}><h2>Competition</h2></button>
      <button className="homeCard pressureHomeCard homeTitleOnly" onClick={()=>setScreen('pressure')}><h2>Pressure</h2><span className="homeTileSubtitle">Session Coaching Module</span></button>

      <button className="tile blue homeTitleOnly" onClick={()=>setScreen('sessions')}><h2>Sessions</h2></button>
      <button className="homeCard projectionHomeCard homeTitleOnly" onClick={()=>setScreen('projection')}><h2>Project</h2></button>

      <button className="homeCard diagnosticHomeCard homeTitleOnly" onClick={()=>setScreen('diagnosticIntervention')}><h2>Diagnostic & Intervention</h2></button>
      <button className="homeCard toolsHomeCard homeTitleOnly" onClick={()=>setScreen('tools')}><h2>Tools</h2><span className="homeTileSubtitle">Quick Fix Intervention</span></button>

      
      <button className="homeTile technicalOverlayTile homeTitleOnly" onClick={()=>setScreen('technical')}><h2>Universal Overlays</h2></button>

      <button className="homeTile mentalSkillsTile homeTitleOnly" onClick={()=>setScreen('mentalSkills')}><h2>Mental Performance</h2></button>
    </div>;
}

function GamesLibrary({setScreen,setSession}){
  const [tab,setTab]=useState('stabilise');
  return <div className="page gamesLibraryPage">
    <div className="pageTop"><div><h1>Games Library</h1><p className="mutedText">Explore · Stabilise · Compete</p></div><button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button></div>
    <div className="universalFamilyTabs gamesLibraryTabs">
      <button className={tab==='explore'?'activeFamilyTab':''} onClick={()=>setTab('explore')}>🔍 Explore</button>
      <button className={tab==='stabilise'?'activeFamilyTab':''} onClick={()=>setTab('stabilise')}>🎯 Stabilise</button>
      <button className={tab==='compete'?'activeFamilyTab':''} onClick={()=>setTab('compete')}>🏆 Compete</button>
    </div>
    {tab==='explore'&&<div>
      <div className="libraryStageIntro"><h2>🔍 Explore</h2><p>Discovery, affordance exploration, movement confidence and simple representative tasks. The entry point for beginner coaching.</p></div>
      <div className="exploreEntryCard" onClick={()=>setScreen('level0')}>
        <div className="exploreEntryLeft">
          <span className="categoryTag" style={{background:'#166534',marginBottom:'10px',display:'inline-block'}}>Beginner Coaching</span>
          <h2>Level 0 Foundations</h2>
          <p className="exploreEntrySubtitle">Perception Before Technique</p>
          <p>Tau development · Chipping system · Spacing · Rotating rally · Blue Danube</p>
          <div className="exploreEntryMeta">
            <span>5 modules</span>
            <span>Coaching cards</span>
            <span>Audio constraints</span>
          </div>
        </div>
        <div className="exploreEntryArrow">→</div>
      </div>
    </div>}
    {tab==='stabilise'&&<div><div className="libraryStageIntro"><h2>🎯 Stabilise</h2><p>Levels 1–3: recognition, adaptation, tactical understanding and functional solution building.</p></div><Games setSession={setSession} setScreen={setScreen}/></div>}
    {tab==='compete'&&<div><div className="libraryStageIntro"><h2>🏆 Compete</h2><p>Levels 4–5: pressure, performance, matchplay themes and competition application.</p><div className="stageHintGrid"><div><strong>Use with</strong><span>Pressure games · Invasion · Matchplay</span></div><div><strong>Overlay focus</strong><span>Tactical · Technical · Mental Performance</span></div><div><strong>Coach aim</strong><span>Decision quality under consequence</span></div></div></div><Games setSession={setSession} setScreen={setScreen}/></div>}
  </div>;
}


function GameSelector({onAddToSession,addButtonText='Add To Session'}){
const[category,setCategory]=useState(null);
const[atl,setAtl]=useState(DEFAULT_ATL);
const[selectedGame,setSelectedGame]=useState(null);
const[manualLayers,setManualLayers]=useState([]);const[atlHistory,setAtlHistory]=useState([]);const[showConditions,setShowConditions]=useState(false);
const cats=['ATL / BTL','Classic Conditioned','Checkerboard','Volley & Intercept','Pressure','Information & Anticipation','Double Bounce','Technical','Invasion','Matchplay'];
const builtAtl=useMemo(()=>buildAtl(atl),[atl]);
const composedAtl=useMemo(()=>({...builtAtl,layers:[...new Set([...(builtAtl.layers||[]),...manualLayers])]}),[builtAtl,manualLayers]);
const games=standardGames();
function saveAtlSnapshot(){setAtlHistory(prev=>[...prev,{atl:clone(atl),manualLayers:clone(manualLayers)}]);}
function setAtlOption(key,value){saveAtlSnapshot();setAtl(prev=>({...prev,[key]:value}));}
function toggleManualLayer(layer){saveAtlSnapshot();setManualLayers(prev=>prev.includes(layer)?prev.filter(x=>x!==layer):[...prev,layer]);}
function clearAtlOverlays(){saveAtlSnapshot();setManualLayers([]);}
function resetAtlBuilder(){saveAtlSnapshot();setAtl(DEFAULT_ATL);setManualLayers([]);}
function undoAtl(){const last=atlHistory[atlHistory.length-1];if(!last)return;setAtl(last.atl);setManualLayers(last.manualLayers);setAtlHistory(atlHistory.slice(0,-1));}
function addGame(game){onAddToSession({...clone(game),id:Date.now()+Math.random()});}
const filtered=games.filter(game=>game.category===category);
const conditionsBaseGame=category==='ATL / BTL'?'ATL / BTL':category==='Checkerboard'?'Checkerboard':category==='Invasion'?'Invasion':category==='Double Bounce'?'Double Bounce':category||'Selected Game';
return <div>
<div className="gameMenuGrid">{cats.map(cat=><button key={cat} className={category===cat?'gameMenu activeGameMenu':'gameMenu'} onClick={()=>{setCategory(cat);setSelectedGame(null);setShowConditions(false);}}>{cat}</button>)}</div>
{category&&<div className="conditionsAttachBar"><div><strong>Base game:</strong> {conditionsBaseGame}<br/><span className="mutedText">Design the base game, then add tactical, behaviour or handicap constraints from this same page.</span></div><button className="primaryBtn" onClick={()=>setShowConditions(v=>!v)}>{showConditions?'Hide Conditions':'Add Game Constraints'}</button></div>}
{showConditions&&category&&<GameConstraintsEngine embedded initialBaseGame={conditionsBaseGame} onClose={()=>setShowConditions(false)} onAddToSession={addGame}/>} 
{!category&&<div className="placeholder">Choose a game category. No game opens by default.</div>}
{category==='Information & Anticipation'&&<InformationAnticipationBuilder onAddToSession={addGame}/>}
{category&&category!=='Saved Cards'&&<UniversalDBHandicapPanel onAddToSession={addGame}/>}  
{category==='Double Bounce'&&<div className="gameCard"><div className="categoryTag">Double Bounce</div><DoubleBounceTool setScreen={()=>{}}/></div>}
{category==='ATL / BTL'&&<div className="gameCard">
<div className="categoryTag">ATL / BTL</div><h2>ATL / BTL Full Structure Builder</h2>
<div className="atlOptionsGrid">
<label>BTL Count<select value={atl.btlCount} onChange={e=>setAtlOption('btlCount',e.target.value)}>{ATL_LISTS.btlCount.map(option=><option key={option}>{option}</option>)}</select></label>
<label>Side<select value={atl.side} onChange={e=>setAtlOption('side',e.target.value)}>{ATL_LISTS.side.map(option=><option key={option}>{option}</option>)}</select></label>
<label>Consecutive<select value={atl.consecutive} onChange={e=>setAtlOption('consecutive',e.target.value)}>{ATL_LISTS.consecutive.map(option=><option key={option}>{option}</option>)}</select></label>
<label>CB Ref<select value={atl.cbRef} onChange={e=>setAtlOption('cbRef',e.target.value)}>{ATL_LISTS.cbRef.map(option=><option key={option}>{option}</option>)}</select></label>
{atl.btlCount!=='0 BTL shots'&&<label>BTL Shot 1<select value={atl.shot1} onChange={e=>setAtlOption('shot1',e.target.value)}>{ATL_LISTS.shotChoice.map(option=><option key={option}>{option}</option>)}</select></label>}
{atl.btlCount!=='0 BTL shots'&&<label>Shot 1 Method<select value={atl.method1} onChange={e=>setAtlOption('method1',e.target.value)}>{ATL_LISTS.method.map(option=><option key={option}>{option}</option>)}</select></label>}
{(atl.btlCount==='2 BTL shots'||atl.btlCount==='3 BTL shots')&&<label>BTL Shot 2<select value={atl.shot2} onChange={e=>setAtlOption('shot2',e.target.value)}>{ATL_LISTS.shotChoice.map(option=><option key={option}>{option}</option>)}</select></label>}
{(atl.btlCount==='2 BTL shots'||atl.btlCount==='3 BTL shots')&&<label>Shot 2 Method<select value={atl.method2} onChange={e=>setAtlOption('method2',e.target.value)}>{ATL_LISTS.method.map(option=><option key={option}>{option}</option>)}</select></label>}
{atl.btlCount==='3 BTL shots'&&<label>BTL Shot 3<select value={atl.shot3} onChange={e=>setAtlOption('shot3',e.target.value)}>{ATL_LISTS.shotChoice.map(option=><option key={option}>{option}</option>)}</select></label>}
{atl.btlCount==='3 BTL shots'&&<label>Shot 3 Method<select value={atl.method3} onChange={e=>setAtlOption('method3',e.target.value)}>{ATL_LISTS.method.map(option=><option key={option}>{option}</option>)}</select></label>}
</div>
<div className="infoBox"><strong>Task / Rules</strong><p>{composedAtl.task}</p></div>
<div className="infoBox"><strong>Rationale</strong><p>{composedAtl.rationale}</p></div>
<div className="infoBox"><strong>Coach Help</strong><p>{composedAtl.coach}</p></div>
<div className="chips">{composedAtl.layers.map(layer=><span className="badge" key={layer}>{layer}</span>)}</div>
<div className="technicalScoringBox alwaysVisibleScoring"><strong>Universal Overlays</strong><OverlayFamilyTabs selectedOverlays={manualLayers} onToggle={toggleManualLayer} context="Session Builder ATL / BTL" /><div className="buttonRow"><button className="secondaryBtn" onClick={undoAtl} disabled={atlHistory.length===0}>Undo ATL Change</button><button className="secondaryBtn" onClick={clearAtlOverlays}>Clear Overlays</button><button className="secondaryBtn" onClick={resetAtlBuilder}>Reset ATL / BTL</button></div></div>
<button className="primaryBtn" onClick={()=>addGame(composedAtl)}>{addButtonText}</button>
</div>}
{category==='Checkerboard'&&<CheckerboardEngine onAddToSession={addGame}/>}{category&&category!=='ATL / BTL'&&category!=='Checkerboard'&&<div className="gameList">
{filtered.map((game,index)=><button className="gameRow" key={index} onClick={()=>setSelectedGame(game)}><strong>{game.title}</strong><span>{game.task}</span></button>)}
{filtered.length===0&&<div className="placeholder">{category} games will be built next. Current working categories: ATL / BTL, Classic Conditioned, Checkerboard, Volley & Intercept, Pressure, Invasion.</div>}
</div>}
{selectedGame&&<div className="gameCard">
<div className="categoryTag">{selectedGame.category}</div><h2>{selectedGame.title}</h2>
<div className="infoBox"><strong>Task / Rules</strong><p>{selectedGame.task}</p></div>
<div className="infoBox"><strong>Rationale</strong><p>{selectedGame.rationale}</p></div>
<div className="infoBox"><strong>Coach Help</strong><p>{selectedGame.coach}</p></div>
<div className="chips">{selectedGame.layers.map(layer=><span className="badge" key={layer}>{layer}</span>)}</div>
<button className="primaryBtn" onClick={()=>addGame(selectedGame)}>{addButtonText}</button>
</div>}
</div>;
}

function Sessions({session,setSession,setScreen}){const[sessionHistory,setSessionHistory]=useState([]);function saveSessionSnapshot(){setSessionHistory(prev=>[...prev,clone(session)]);}function undoSession(){const last=sessionHistory[sessionHistory.length-1];if(!last)return;setSession(last);setSessionHistory(sessionHistory.slice(0,-1));}
const total=session.reduce((sum,game)=>sum+Number(game.duration||0),0);
function addGame(game){saveSessionSnapshot();setSession(prev=>[...prev,game]);}
function remove(index){saveSessionSnapshot();setSession(session.filter((_,i)=>i!==index));}
function duplicate(index){saveSessionSnapshot();const copy=clone(session[index]);copy.id=Date.now()+Math.random();copy.title=copy.title+' + progression';setSession([...session.slice(0,index+1),copy,...session.slice(index+1)]);}
function startRotationProjection(index){
  startCoachProjectionSession(session,index);
}
function stopRotationProjection(){
  stopCoachProjectionSession();
}

function addLayer(index,layer){saveSessionSnapshot();const updated=clone(session);updated[index].layers=safeLayersForSession(updated[index]);if(!updated[index].layers.includes(layer))updated[index].layers.push(layer);setSession(updated);}
function updateCb(index,code){saveSessionSnapshot();const updated=clone(session);updated[index].layers=safeLayersForSession(updated[index]);updated[index].cbCode=code;if(code!=='None'&&!updated[index].layers.includes('CB Code'))updated[index].layers.push('CB Code');if(code==='None')updated[index].layers=updated[index].layers.filter(layer=>layer!=='CB Code');setSession(updated);}
return <div className="page">
<div className="pageTop"><h1>Session Builder</h1><div className="buttonRow"><div className="totalBox">Total: {total} mins</div><button className="secondaryBtn" onClick={undoSession} disabled={sessionHistory.length===0}>Undo</button><button className="secondaryBtn" onClick={()=>{saveSessionSnapshot();setSession([])}}>Clear Session</button><button className="primaryBtn" onClick={()=>setScreen('games')}>Open Games Library</button></div></div>
<GameSelector onAddToSession={addGame} addButtonText="Add To Session"/>
<h2>Session Rotations</h2>
{session.length===0&&<div className="placeholder">No rotations added yet. Choose a game above and tap Add To Session.</div>}
{session.map((game,index)=><div className="rotationCard" key={game.id||index}>
<div className="rotationTop"><div><strong>Rotation {index+1} · {game.duration} min · {game.format}</strong><h3>{game.title}</h3></div><button className="secondaryBtn" onClick={()=>remove(index)}>Remove</button></div>
<div className="infoBox"><strong>Task</strong><p>{game.task}</p></div>
<div className="infoBox"><strong>Rationale</strong><p>{game.rationale}</p></div>
<div className="infoBox"><strong>Coach Focus</strong><p>{game.coach}</p></div><div className="infoBox"><strong>Player Focus</strong><p>{game.playerFocus||'Focus on the cue that unlocks the scoring constraint.'}</p></div>
<div className="cbBox"><strong>Checkerboard Code</strong><select value={game.cbCode||'None'} onChange={e=>updateCb(index,e.target.value)}>{CB_CODES.map(code=><option key={code}>{code}</option>)}</select></div>
<div className="chips">{safeLayersForSession(game).map(layer=><span className="badge" key={layer}>{layer}</span>)}</div>
<div className="quickLayers">{ALL_LAYERS.filter(layer=>!safeLayersForSession(game).includes(layer)).map(layer=><button key={layer} onClick={()=>addLayer(index,layer)}>+ {layer}</button>)}</div>
<div className="actionRow">
<button onClick={()=>duplicate(index)}>Duplicate + Progress</button>
<button className="primaryBtn" onClick={()=>startRotationProjection(index)}>START PROJECTOR</button>
<button className="secondaryBtn dangerBtn" onClick={stopRotationProjection}>STOP PROJECTOR</button>
</div>
</div>)}
</div>;
}



const CHECKERBOARD_CHALLENGES=[
  {id:'single',label:'Single Zone',type:'Single',baseCode:'[6-3]',description:'Complete one selected checkerboard target before bonus scoring opens.'},
  {id:'pair',label:'Pair Challenge',type:'Pair',baseCode:'[6-4] + [8-1]',description:'Complete a two-shot checkerboard pair before bonus scoring opens.'},
  {id:'triple',label:'Triple Challenge',type:'Triple',baseCode:'[6-3] + [8-1] + [5-4]',description:'Complete a three-shot checkerboard sequence before bonus scoring opens.'},
  {id:'blind-pair',label:'Blind Pair',type:'Blind',baseCode:'Hidden card pair',description:'Player receives a secret pair challenge; opponent plays normal rally.'},
  {id:'blind-finish',label:'Blind Finish',type:'Blind',baseCode:'Hidden finish',description:'Player secretly receives front-wall or floor finish target.'},
  {id:'clean-conversion',label:'Clean Conversion',type:'Conversion',baseCode:'[6-4] + [8-1]',description:'Complete challenge then win with clean winner bonus available.'}
];

const CHECKERBOARD_PAIR_OPTIONS=[
  '[6-4] + [8-1]',
  '[5-3] + [7-2]',
  '[6-3] + [8-1]',
  '[5-4] + [7-2]',
  '[6-3] + [5-4]',
  '[7-2] + [8-1]'
];

const CHECKERBOARD_TRIPLE_OPTIONS=[
  '[6-4] + [8-1] + [5-3]',
  '[5-3] + [7-2] + [8-1]',
  '[6-3] + [8-1] + [5-4]',
  '[7-2] + [5-4] + [6-3]'
];

const BLIND_OPTIONS=[
  'None',
  'Blind finish: front wall zone',
  'Blind finish: floor zone',
  'Blind pair from cards',
  'Blind triple from cards'
];


const CHECKERBOARD_LEVELS=[
  {level:1,label:'Level 1 — Single',challenge:'single',window:'No window',tZone:false,description:'Single challenge. Challenge is banked once completed.'},
  {level:2,label:'Level 2 — Pair',challenge:'pair',window:'No window',tZone:false,description:'Pair challenge. Challenge is banked once completed.'},
  {level:3,label:'Level 3 — Triple',challenge:'triple',window:'No window',tZone:false,description:'Triple challenge. T Challenge is selectable as an overlay.'},
  {level:4,label:'Level 4 — Triple + 4-shot window',challenge:'triple',window:'4-shot window',tZone:false,description:'Triple challenge with 4-shot window. T Challenge is selectable as an overlay.'},
  {level:5,label:'Level 5 — Triple + 2-shot window',challenge:'triple',window:'2-shot window',tZone:false,description:'Triple challenge with 2-shot window. T Challenge is selectable as an overlay.'}
];
const COMPLETION_CONSTRAINTS=['Clean winner','Volley finish','Opposite side finish','Weak-side finish','Front wall finish','Floor finish','Opponent moving forward','Opponent off balance','Opponent off T','T Challenge'];
const DELIVERY_MODES=['Open','Blind'];

function buildCheckerboardGame(config){
  const level=CHECKERBOARD_LEVELS.find(item=>item.level===Number(config.level))||CHECKERBOARD_LEVELS[1];
  const sequence=config.customSequence&&config.customSequence.trim()!==''?config.customSequence:config.sequence;
  const completion=config.completionConstraints||[];
  const layers=[...new Set(config.layers||[])];
  
  if(level.tZone&&!layers.includes('Opponent Off T')) layers.push('Opponent Off T');
  if(level.window==='4-shot window'&&!layers.includes('4-Shot Window')) layers.push('4-Shot Window');
  if(level.window==='2-shot window'&&!layers.includes('2-Shot Window')) layers.push('2-Shot Window');
  if(completion.includes('Clean winner')&&!layers.includes('Clean Winner')) layers.push('Clean Winner');
  if(completion.includes('Volley finish')&&!layers.includes('Volley Finish')) layers.push('Volley Finish');
  if(config.deliveryMode==='Blind'&&!layers.includes('Blind Finish')) layers.push('Blind Finish');
  const challengeName=level.challenge==='single'?'Single challenge':level.challenge==='pair'?'Pair challenge':'Triple challenge';
  const taskParts=[
    `${level.label}: ${level.description}`,
    `${challengeName}: ${sequence}.`,
    config.deliveryMode==='Blind'?'Delivery: blind mode. Use the checkerboard challenge deck and/or finish challenge deck. Player reveals, acknowledges, then the card closes ready for the next player.':'Delivery: open challenge.',
    completion.length?`Completion constraint: ${completion.join(' · ')}.`:'',
    level.tZone?'T-zone prevention applies automatically at this level.':'',
    level.window!=='No window'?`Conversion window: ${level.window}. Challenge resets if not converted inside the window.`:'Levels 1–3: challenge is banked once completed.'
  ].filter(Boolean);
  const scoring=['Win rally = 1',level.challenge==='single'?'Complete single = +1':level.challenge==='pair'?'Complete pair = +2':'Complete triple = +3','Win after completing challenge = +3'];
  if(completion.includes('Clean winner')) scoring.push('Clean winner = +2 and sits on top of all scoring');
  return {id:Date.now()+Math.random(),title:`Checkerboard · ${level.label}`,category:'Checkerboard',duration:Number(config.duration)||8,format:config.format||'King of Court',task:taskParts.join(' '),rationale:'Uses the agreed checkerboard level progression so the tactical complexity, T-zone prevention and conversion windows scale automatically.',coach:'Coach the recognition of the affordance, not just the code. At Levels 4–5, remind players that the challenge resets if they do not convert within the shot window.',layers,cbCode:sequence,scoring:scoring.join(' · ')};
}

function CheckerboardEngine({onAddToSession}){
  const[config,setConfig]=useState({level:2,sequence:'[6-4] + [8-1]',customSequence:'',showCustomSequence:false,deliveryMode:'Open',blindChallengeCard:'',blindChallengeFace:'closed',blindFinishCard:'',blindFinishFace:'closed',completionConstraints:[],format:'King of Court',duration:8,layers:[]});
  const [cbDbAssign,setCbDbAssign]=useState('Both Players');
  const [cbDbPlayer,setCbDbPlayer]=useState('');
  const [cbDbAmount,setCbDbAmount]=useState('No DB');
  const levelInfo=CHECKERBOARD_LEVELS.find(item=>item.level===Number(config.level))||CHECKERBOARD_LEVELS[1];
  const sequenceOptions=levelInfo.challenge==='single'?CB_CODES.filter(code=>code!=='None'&&!code.includes('+')):levelInfo.challenge==='pair'?CHECKERBOARD_PAIR_OPTIONS:CHECKERBOARD_TRIPLE_OPTIONS;
  const built=buildCheckerboardGame(config);
  function update(field,value){setConfig(prev=>({...prev,[field]:value}));}
  function setLevel(value){
    const next=CHECKERBOARD_LEVELS.find(item=>item.level===Number(value));
    const nextSeq=next.challenge==='single'?'[6-3]':next.challenge==='pair'?CHECKERBOARD_PAIR_OPTIONS[0]:CHECKERBOARD_TRIPLE_OPTIONS[0];
    setConfig(prev=>({...prev,level:Number(value),sequence:nextSeq,customSequence:'',showCustomSequence:false}));
  }
  function toggleCompletion(item){setConfig(prev=>{const current=prev.completionConstraints||[];return {...prev,completionConstraints:current.includes(item)?current.filter(x=>x!==item):[...current,item]};});}
  function toggleLayer(layer){setConfig(prev=>{const current=prev.layers||[];return {...prev,layers:current.includes(layer)?current.filter(item=>item!==layer):[...current,layer]};});}
  
  function generateBlindChallengeCard(){
    let card='';
    if(config.deliveryMode!=='Blind') card='Blind mode is off.';
    else if(levelInfo.challenge==='single'){
      const singles=CB_CODES.filter(code=>code!=='None'&&!code.includes('+'));
      card=singles[Math.floor(Math.random()*singles.length)];
    }else if(levelInfo.challenge==='pair'){
      card=CHECKERBOARD_PAIR_OPTIONS[Math.floor(Math.random()*CHECKERBOARD_PAIR_OPTIONS.length)];
    }else{
      card=CHECKERBOARD_TRIPLE_OPTIONS[Math.floor(Math.random()*CHECKERBOARD_TRIPLE_OPTIONS.length)];
    }
    setConfig(prev=>({...prev,blindChallengeCard:card,blindChallengeFace:'closed'}));
  }

  function revealBlindChallengeCard(){
    if(!config.blindChallengeCard){generateBlindChallengeCard();}
    setConfig(prev=>({...prev,blindChallengeFace:'revealed'}));
  }

  function acknowledgeBlindChallengeCard(){
    setConfig(prev=>({...prev,blindChallengeCard:'',blindChallengeFace:'closed'}));
  }

  function generateBlindFinishCard(){
    const finishDeck=[
      'Clean winner',
      'Volley finish',
      'Opposite side finish',
      'Weak-side finish',
      'Front wall finish',
      'Floor finish',
      'Opponent moving forward',
      'Opponent off balance',
      'Opponent off T'
    ];
    const card=finishDeck[Math.floor(Math.random()*finishDeck.length)];
    setConfig(prev=>({...prev,blindFinishCard:card,blindFinishFace:'closed'}));
  }

  function revealBlindFinishCard(){
    if(!config.blindFinishCard){generateBlindFinishCard();}
    setConfig(prev=>({...prev,blindFinishFace:'revealed'}));
  }

  function acknowledgeBlindFinishCard(){
    setConfig(prev=>({...prev,blindFinishCard:'',blindFinishFace:'closed'}));
  }

return <div className="checkerboardEngine">
    <h2>Checkerboard Builder</h2>
    <p className="engineIntro">Select a base game then open the layers you need.</p>

    {/* BASE GAME — always visible */}
    <div className="baseGamePanel">
      <div className="baseGamePanelHeader"><span className="baseGamePanelNum">Base</span><strong>Base Game</strong><span className="baseGamePanelSub">What players do</span></div>
      <div className="levelSystemBox">{CHECKERBOARD_LEVELS.map(item=><button key={item.level} className={Number(config.level)===item.level?'levelBtn activeLevel':'levelBtn'} onClick={()=>setLevel(item.level)}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div>
      <div className="engineGrid">
        <label>Level<select value={config.level} onChange={e=>setLevel(e.target.value)}>{CHECKERBOARD_LEVELS.map(item=><option key={item.level} value={item.level}>{item.label}</option>)}</select></label>
        <label>Delivery Mode<select value={config.deliveryMode} onChange={e=>update('deliveryMode',e.target.value)}>{DELIVERY_MODES.map(item=><option key={item}>{item}</option>)}</select></label>
        <label>Format<select value={config.format} onChange={e=>update('format',e.target.value)}><option>King of Court</option><option>Winner Stays On</option><option>Pairs</option><option>Team Courts</option><option>Rally Game</option></select></label>
        <label>Duration<input type="number" min="1" value={config.duration} onChange={e=>update('duration',e.target.value)}/></label>
      </div>
      <div className="engineGrid"><label>Sequence Code<select value={config.sequence} onChange={e=>update('sequence',e.target.value)}>{sequenceOptions.map(code=><option key={code}>{code}</option>)}</select></label></div>
      <div className="customSeqToggle">
        {!config.showCustomSequence&&<button className="secondaryBtn" onClick={()=>update('showCustomSequence',true)}>+ Custom Sequence</button>}
        {config.showCustomSequence&&<div className="customSeqBox"><strong>Custom Checkerboard Sequence</strong><input value={config.customSequence} onChange={e=>update('customSequence',e.target.value)} placeholder="[6-4] + [8-1] + [5-3]" /><div className="buttonRow"><button className="secondaryBtn" onClick={()=>{update('customSequence','');update('showCustomSequence',false);}}>Remove Custom Sequence</button></div></div>}
      </div>
    </div>

    {/* GAME LOGIC */}
    <CollapsibleLayer num="1" title="Game Logic" subtitle="What counts — eligibility and validity" color="green">
      <div className="quickLayers">{COMPLETION_CONSTRAINTS.map(item=><button key={item} className={(config.completionConstraints||[]).includes(item)?'activeLayer':''} onClick={()=>toggleCompletion(item)}>{(config.completionConstraints||[]).includes(item)?'✓ ':'+ '}{item}</button>)}</div>
    </CollapsibleLayer>

    {/* SCORING LOGIC */}
    <CollapsibleLayer num="2" title="Scoring Logic" subtitle="How points are awarded" color="gold">
      <div className="quickLayers"><OverlayFamilyTabs selectedOverlays={config.layers||[]} onToggle={toggleLayer} context="Checkerboard"/></div>
    </CollapsibleLayer>

    {/* CONSTRAINTS */}
    <CollapsibleLayer num="3" title="Constraints" subtitle="Shape behaviour without changing rules" color="blue">
      {config.deliveryMode==='Blind'?<div className="blindCardPanel">
        <p>Blind Card delivery uses two hidden decks — challenge and finish.</p>
        <div className="blindDeckGrid">
          <div className="blindDeckBox">
            <h3>Blind Challenge Deck</h3>
            <div className="buttonRow">
              <button className="primaryBtn" onClick={generateBlindChallengeCard}>Generate</button>
              <button className="secondaryBtn" onClick={revealBlindChallengeCard}>Reveal</button>
              <button className="secondaryBtn" onClick={acknowledgeBlindChallengeCard}>Close</button>
            </div>
            <div className={config.blindChallengeFace==='revealed'?'blindCard revealedCard':'blindCard'}>
              {config.blindChallengeFace==='revealed'&&config.blindChallengeCard
                ?<div><span>My Challenge</span><strong>{config.blindChallengeCard}</strong></div>
                :<div><span>Hidden Card</span><strong>Tap Reveal</strong></div>}
            </div>
          </div>
          <div className="blindDeckBox">
            <h3>Blind Finish Deck</h3>
            <div className="buttonRow">
              <button className="primaryBtn" onClick={generateBlindFinishCard}>Generate</button>
              <button className="secondaryBtn" onClick={revealBlindFinishCard}>Reveal</button>
              <button className="secondaryBtn" onClick={acknowledgeBlindFinishCard}>Close</button>
            </div>
            <div className={config.blindFinishFace==='revealed'?'blindCard revealedCard':'blindCard'}>
              {config.blindFinishFace==='revealed'&&config.blindFinishCard
                ?<div><span>My Finish</span><strong>{config.blindFinishCard}</strong></div>
                :<div><span>Hidden Card</span><strong>Tap Reveal</strong></div>}
            </div>
          </div>
        </div>
      </div>:<p className="mutedText" style={{padding:'8px 0'}}>Switch Delivery Mode to Blind above to access blind card constraints.</p>}
    </CollapsibleLayer>

    {/* DB HANDICAP */}
    <CollapsibleLayer num="4" title="DB Handicap" subtitle="Double bounce allowance — assign selectively" color="purple">
      <InlineDBSelector dbAssign={cbDbAssign} setDbAssign={setCbDbAssign} dbPlayer={cbDbPlayer} setDbPlayer={setCbDbPlayer} dbAmount={cbDbAmount} setDbAmount={setCbDbAmount}/>
    </CollapsibleLayer>

    <div className="gameCard previewCard"><div className="categoryTag">Checkerboard Preview</div><h2>{built.title}</h2><div className="infoBox"><strong>Task / Rules</strong><p>{built.task}</p></div><div className="infoBox"><strong>Scoring</strong><p>{built.scoring}</p></div><div className="infoBox"><strong>Rationale</strong><p>{built.rationale}</p></div><div className="infoBox"><strong>Coach Help</strong><p>{built.coach}</p></div><div className="chips">{built.layers.map(layer=><span className="badge" key={layer}>{layer}</span>)}</div>
    <button className="primaryBtn" onClick={()=>onAddToSession({...built,dbHandicap:cbDbAmount!=='No DB'?cbDbAssign+': '+cbDbAmount:'No DB'})}>Add Checkerboard To Session</button></div>
  </div>;
}



const ATL_CB_ZONE_OPTIONS=[
  'None','[5]','[6]','[7]','[8]','[1]','[2]','[3]','[4]',
  '[5-4]','[5-1]','[6-3]','[6-2]','[7-3]','[7-2]','[8-4]','[8-1]',
  '[5-4] + [5-1]','[6-3] + [6-2]',
  '[5-4] + [8-1]','[6-3] + [7-2]',
  '[5-1] + [8-4]','[6-2] + [7-3]',
  '[5-4] + [8-1] + [6-3]','[6-3] + [7-2] + [5-4]',
  'Custom'
];

// ─── COLLAPSIBLE LAYER PANEL ─────────────────────────────────────────────────
function CollapsibleLayer({num,title,subtitle,color,defaultOpen,children}){
  const [open,setOpen]=useState(defaultOpen||false);
  const colors={
    green:{bg:'#0a1a0e',border:'#4ade80',label:'#4ade80',numBg:'#166534'},
    gold:{bg:'#0e0c00',border:'#ffd980',label:'#ffd980',numBg:'#78350f'},
    blue:{bg:'#071015',border:'#9bc1ff',label:'#9bc1ff',numBg:'#1e3a8a'},
    purple:{bg:'#0b0820',border:'#c4b5fd',label:'#c4b5fd',numBg:'#4c1d95'},
    teal:{bg:'#071015',border:'#22d3ee',label:'#22d3ee',numBg:'#0e7490'},
  };
  const c=colors[color]||colors.blue;
  return <div className="collapsibleLayer" style={{borderColor:c.border,background:c.bg}}>
    <div className="collapsibleLayerHeader" onClick={()=>setOpen(!open)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&setOpen(!open)}>
      <span className="collapsibleLayerNum" style={{background:c.numBg}}>{num}</span>
      <div className="collapsibleLayerTitle">
        <strong style={{color:c.label}}>{title}</strong>
        {subtitle&&<span className="collapsibleLayerSub">{subtitle}</span>}
      </div>
      <span className="collapsibleLayerChevron" style={{color:c.label}}>{open?'▲':'▼'}</span>
    </div>
    {open&&<div className="collapsibleLayerBody">{children}</div>}
  </div>;
}
// ─────────────────────────────────────────────────────────────────────────────

function ATLBTLDirectBuilder({onAddToSession}){
  const savedAtlDraft=(()=>{try{const saved=localStorage.getItem(GAME_LIBRARY_ATL_DRAFT_KEY);return saved?JSON.parse(saved):null;}catch{return null;}})();
  const [atl,setAtl]=useState(savedAtlDraft?.atl||DEFAULT_ATL); const [side,setSide]=useState(savedAtlDraft?.side||'Right side'); const [useCustomCb,setUseCustomCb]=useState(!!savedAtlDraft?.useCustomCb); const [customCbZone,setCustomCbZone]=useState(savedAtlDraft?.customCbZone||'');
  const [manualLayers,setManualLayers]=useState(savedAtlDraft?.manualLayers||[]);
  const [atlHistory,setAtlHistory]=useState([]);
  const [atlDbAssign,setAtlDbAssign]=useState('Both Players');
  const [atlDbPlayer,setAtlDbPlayer]=useState('');
  const [atlDbAmount,setAtlDbAmount]=useState('No DB');

  const builtAtl=useMemo(()=>buildAtl(atl),[atl]);
  function sideToCbZone(value){
    if(value==='Right side') return '[6-3] + [6-2]';
    if(value==='Left side') return '[5-4] + [5-1]';
    if(value==='Both sides') return '[5-4] + [5-1] / [6-3] + [6-2]';
    if(value==='Player choice') return 'Player choice: [5-4] + [5-1] or [6-3] + [6-2]';
    return '[6-3] + [6-2]';
  }
  const autoCbZone=sideToCbZone(side);
  const composedAtl=useMemo(()=>{const chosen=useCustomCb?(customCbZone||'Custom CB sequence'):autoCbZone;return {...builtAtl,side,cbCode:chosen,task:`${builtAtl.task} Side: ${side}. Checkerboard zone focus: ${chosen}.`,layers:[...new Set([...manualLayers])]};},[builtAtl,manualLayers,side,useCustomCb,customCbZone,autoCbZone]);
  useEffect(()=>{
    localStorage.setItem(GAME_LIBRARY_ATL_DRAFT_KEY,JSON.stringify({atl,side,useCustomCb,customCbZone,manualLayers}));
  },[atl,side,useCustomCb,customCbZone,manualLayers]);

  function saveAtlSnapshot(){
    setAtlHistory(prev=>[...prev,{atl:clone(atl),manualLayers:clone(manualLayers)}]);
  }

  function setAtlOption(key,value){
    saveAtlSnapshot();
    setAtl(prev=>({...prev,[key]:value}));
  }

  function toggleManualLayer(layer){
    saveAtlSnapshot();
    setManualLayers(prev=>prev.includes(layer)?prev.filter(x=>x!==layer):[...prev,layer]);
  }

  function clearAtlOverlays(){
    saveAtlSnapshot();
    setManualLayers([]);
  }

  function resetAtlBuilder(){
    saveAtlSnapshot();
    setAtl(DEFAULT_ATL);
    setManualLayers([]);
  }

  function undoAtl(){
    const last=atlHistory[atlHistory.length-1];
    if(!last)return;
    setAtl(last.atl);
    setManualLayers(last.manualLayers);
    setAtlHistory(atlHistory.slice(0,-1));
  }

  function addGame(game){
    onAddToSession({...clone(game),id:Date.now()+Math.random()});
  }

  return <div className="gameCard">
    <div className="categoryTag">ATL / BTL</div>
    <h2>ATL / BTL Builder</h2>

    <div className="baseGamePanel">
      <div className="baseGamePanelHeader"><span className="baseGamePanelNum">Base</span><strong>Base Game</strong><span className="baseGamePanelSub">ATL/BTL structure</span></div>
      <div className="statusBox atlDraftSavedNote">Draft saved automatically.</div>
      <div className="atlOptionsGrid">
        <label>BTL Count<select value={atl.btlCount} onChange={e=>setAtlOption('btlCount',e.target.value)}>{ATL_LISTS.btlCount.map(option=><option key={option}>{option}</option>)}</select></label>
        <label>Consecutive<select value={atl.consecutive} onChange={e=>setAtlOption('consecutive',e.target.value)}>{ATL_LISTS.consecutive.map(option=><option key={option}>{option}</option>)}</select></label>
        <label>Side<select value={side} onChange={e=>setSide(e.target.value)}><option>Right side</option><option>Left side</option><option>Both sides</option><option>Player choice</option></select></label>
        <label>Auto CB Zone<input value={autoCbZone} readOnly /></label>
        <label>Custom Override<select value={useCustomCb?'Yes':'No'} onChange={e=>setUseCustomCb(e.target.value==='Yes')}><option>No</option><option>Yes</option></select></label>
        {useCustomCb&&<label>Custom CB<input value={customCbZone} onChange={e=>setCustomCbZone(e.target.value)} placeholder="[6-3] + [6-2]"/></label>}
        {atl.btlCount!=='0 BTL shots'&&<label>BTL Shot 1<select value={atl.shot1} onChange={e=>setAtlOption('shot1',e.target.value)}>{ATL_LISTS.shotChoice.map(option=><option key={option}>{option}</option>)}</select></label>}
        {atl.btlCount!=='0 BTL shots'&&<label>Shot 1 Method<select value={atl.method1} onChange={e=>setAtlOption('method1',e.target.value)}>{ATL_LISTS.method.map(option=><option key={option}>{option}</option>)}</select></label>}
        {(atl.btlCount==='2 BTL shots'||atl.btlCount==='3 BTL shots')&&<label>BTL Shot 2<select value={atl.shot2} onChange={e=>setAtlOption('shot2',e.target.value)}>{ATL_LISTS.shotChoice.map(option=><option key={option}>{option}</option>)}</select></label>}
        {(atl.btlCount==='2 BTL shots'||atl.btlCount==='3 BTL shots')&&<label>Shot 2 Method<select value={atl.method2} onChange={e=>setAtlOption('method2',e.target.value)}>{ATL_LISTS.method.map(option=><option key={option}>{option}</option>)}</select></label>}
        {atl.btlCount==='3 BTL shots'&&<label>BTL Shot 3<select value={atl.shot3} onChange={e=>setAtlOption('shot3',e.target.value)}>{ATL_LISTS.shotChoice.map(option=><option key={option}>{option}</option>)}</select></label>}
        {atl.btlCount==='3 BTL shots'&&<label>Shot 3 Method<select value={atl.method3} onChange={e=>setAtlOption('method3',e.target.value)}>{ATL_LISTS.method.map(option=><option key={option}>{option}</option>)}</select></label>}
      </div>
      <div className="infoBox" style={{marginTop:'10px'}}><strong>Task</strong><p>{composedAtl.task}</p></div>
    </div>

    <CollapsibleLayer num="1" title="Game Logic" subtitle="What counts — eligibility and validity" color="green">
      <div className="quickLayers">{COMPLETION_CONSTRAINTS.map(item=><button key={item} className={manualLayers.includes(item)?'activeLayer':''} onClick={()=>toggleManualLayer(item)}>{manualLayers.includes(item)?'✓ ':'+ '}{item}</button>)}</div>
    </CollapsibleLayer>

    <CollapsibleLayer num="2" title="Scoring Logic" subtitle="How points are awarded" color="gold">
      <OverlayFamilyTabs selectedOverlays={manualLayers} onToggle={toggleManualLayer} context="ATL / BTL"/>
    </CollapsibleLayer>

    <CollapsibleLayer num="3" title="Constraints" subtitle="Shape behaviour without changing rules" color="blue">
      <p className="mutedText" style={{fontSize:'13px',padding:'4px 0'}}>Use Universal Overlays above to add ball, movement or behavioural constraints.</p>
    </CollapsibleLayer>

    <CollapsibleLayer num="4" title="DB Handicap" subtitle="Double bounce allowance — assign selectively" color="purple">
      <InlineDBSelector dbAssign={atlDbAssign} setDbAssign={setAtlDbAssign} dbPlayer={atlDbPlayer} setDbPlayer={setAtlDbPlayer} dbAmount={atlDbAmount} setDbAmount={setAtlDbAmount}/>
    </CollapsibleLayer>

    <div className="buttonRow">
      <button className="secondaryBtn" onClick={undoAtl} disabled={atlHistory.length===0}>Undo</button>
      <button className="secondaryBtn" onClick={clearAtlOverlays}>Clear Overlays</button>
      <button className="secondaryBtn" onClick={resetAtlBuilder}>Reset</button>
    </div>
    <button className="primaryBtn" onClick={()=>addGame({...composedAtl,dbHandicap:atlDbAmount!=='No DB'?atlDbAssign+': '+atlDbAmount:'No DB'})}>Add ATL / BTL To Session</button>
  </div>;
}





function ClassicConditionedBuilder({onAddToSession}){
  const [selectedProblem,setSelectedProblem]=useState(null);
  const [selectedGame,setSelectedGame]=useState(null);
  const [scoringChoices,setScoringChoices]=useState({});
  const [selectedOverlays,setSelectedOverlays]=useState({});
  const [classicDbAssign,setClassicDbAssign]=useState('Both Players');
  const [classicDbPlayer,setClassicDbPlayer]=useState('');
  const [classicDbAmount,setClassicDbAmount]=useState('No DB');

  const games=[
    {title:'Return to Sender',problem:'Opponent Awareness',shortRationale:'Discourages repeatedly hitting back to opponent position.',level:'Levels 2–5',task:'Players only receive bonus points if the winning shot is played away from the opponent recovery line/body-line rather than back towards the opponent.',rationale:'Develops perception of opponent positioning before target selection.',coach:'Reward recognition of opponent position rather than pure shot quality.',playerFocus:'Notice where the opponent is recovering and avoid sending the ball back into that space.',scoring:'Win rally = 1 · Win away from opponent recovery line = +3 · Clean winner = +2',antiGaming:'No bonus if the direction change is accidental or unclear.',suggestedOverlays:['Weak Side','Opponent Off T','Clean Winner']},
    {title:'Opposite Side Finish',problem:'Opponent Awareness',shortRationale:'Encourages players to finish away from opponent body-line and recovery direction.',level:'Levels 3–5',task:'Bonus applies when the finishing shot is played to the opposite side of the opponent’s body line or recovery direction.',rationale:'Links finishing choice to opponent orientation rather than a fixed target.',coach:'Use body-line and recovery direction as the reference, not simply left/right court side.',playerFocus:'Read the opponent’s recovery direction before choosing the finish.',scoring:'Win rally = 1 · Opposite side finish = +3 · Clean winner = +2',antiGaming:'If body-line reference is unclear, no bonus.',suggestedOverlays:['Weak Side','Opponent Off T','Clean Winner']},
    {title:'Server Above The Line',problem:'Neutralise vs Attack',shortRationale:'Develops recognition of neutralising versus attacking situations.',level:'Levels 2–5',task:'Server must strike above the line. Receiver may use double bounces initially to stabilise rallies and recognise when to neutralise versus when to attack.',rationale:'Helps players distinguish survival/neutral phases from genuine attacking opportunities.',coach:'Observe whether players attack from neutral positions or only after creating advantage.',playerFocus:'Recognise when you are under pressure versus when the rally has shifted in your favour.',scoring:'Win rally = 1 · Correct attack recognition = +3',antiGaming:'Do not reward random attacking from neutral or defensive positions.',suggestedOverlays:['Quality Length Before Attack','Double Bounce','Opponent Off T']},
    {title:'Length Before Attack',problem:'Neutralise vs Attack',shortRationale:'Prevents rushed attacking before pressure has been created.',level:'Levels 2–5',task:'Player must create length pressure before attacking short. Attack bonus opens only after the opponent is delayed, displaced or unable to recover normally.',rationale:'Encourages patient pressure construction rather than premature front-court attacks.',coach:'Watch whether the attack is invited by opponent state or forced without advantage.',playerFocus:'Build length pressure first, then attack when the opponent is delayed or displaced.',scoring:'Win rally = 1 · Win after length-created advantage = +3 · Clean winner = +2',antiGaming:'If a player hits short before any pressure is created, only the rally point is available.',suggestedOverlays:['Quality Length Before Attack','Opponent Off T','4-Shot Window','Clean Winner']},
    {title:'T-Zone Denial',problem:'T-Zone Games',shortRationale:'Rewards displacement before attack.',level:'Levels 2–5',task:'Bonus unlocks when the opponent is outside the marked T-zone before the finishing shot.',rationale:'Connects tactical pressure with recovery denial.',coach:'Use a clearly marked T-zone. Award only when the opponent is clearly outside it.',playerFocus:'Move opponent away from central recovery before attacking.',scoring:'Win rally = 1 · Opponent outside T-zone finish = +3 · Clean winner = +2',antiGaming:'Opponent cannot intentionally stop recovering to manipulate the constraint.',suggestedOverlays:['Opponent Off T','4-Shot Window','Clean Winner']},
    {title:'Central Control Volley Finish',problem:'T-Zone Games',shortRationale:'Encourages earned volley interception from central control.',level:'Levels 3–5',task:'Bonus only applies when the winning shot is a volley played from central control.',rationale:'Encourages players to earn intercepting opportunities through pressure and positioning.',coach:'The volley should be earned, not hunted recklessly.',playerFocus:'Use central pressure to create an intercepting opportunity.',scoring:'Win rally = 1 · Volley finish from central control = +3 · Clean winner = +2',antiGaming:'Do not award bonus for speculative/unsafe volley attempts that ignore rally information.',suggestedOverlays:['Volley Finish','Opponent Off T','Clean Winner']},
    {title:'Route Breaker',problem:'Pressure Construction',shortRationale:'Develops route disruption before finishing.',level:'Levels 3–5',task:'Player must alter opponent movement route before the bonus is unlocked.',rationale:'Encourages tactical disruption instead of repetitive pattern hitting.',coach:'Confirm that the opponent movement route was genuinely changed.',playerFocus:'Create a movement problem before attempting to finish the rally.',scoring:'Win rally = 1 · Route broken before finish = +3 · Clean winner = +2',antiGaming:'No bonus if opponent movement route was unchanged.',suggestedOverlays:['Weak Side','Volley Finish','Opponent Off T']},
    {title:'Double Bounce Pressure',problem:'Adapted Rules',shortRationale:'Balances mixed standards while preserving live rally information.',level:'Mixed Standard',task:'Weaker player may use allocated double bounces. Stronger player has fewer or none. Winner can lose one double bounce after each rally won if coach wants progressive balancing.',rationale:'Balances mixed ability groups without removing perception, movement or rally pressure.',coach:'Use double bounce as a player-specific constraint, not a permanent advantage.',playerFocus:'Use the extra bounce to organise better decisions, not simply to wait passively.',scoring:'Normal rally scoring · optional: winner loses one double bounce after each rally won',antiGaming:'Players should not intentionally wait for a second bounce if they could safely play the first bounce unless that is the learning purpose.',suggestedOverlays:['Double Bounce']},
    {title:'Blind Finish Progression',problem:'Blind / Hidden Conditions',shortRationale:'Creates hidden tactical intention while preserving live rally decision-making.',level:'Levels 3–5',task:'Before the rally, player secretly receives a finish condition: front wall finish, floor finish, volley finish, opposite side finish or clean winner.',rationale:'Creates tactical intention while preserving live decision-making and secrecy.',coach:'The hidden condition should shape the player’s perception, not force a bad shot.',playerFocus:'Hold the hidden intention while still responding to the live rally.',scoring:'Win rally = 1 · Achieve hidden finish = +2 · Win after hidden finish condition = +3 · Clean winner = +2',antiGaming:'If the hidden condition is impossible in the rally, player should continue normal rally rather than force it.',suggestedOverlays:['Blind Finish','Clean Winner','Volley Finish']}
  ];

  const problems=[
    {name:'Opponent Awareness',rationale:'Stop hitting back to opponent and improve body-line / recovery-line recognition.'},
    {name:'Neutralise vs Attack',rationale:'Distinguish survival, neutralising and true attacking moments.'},
    {name:'T-Zone Games',rationale:'Connect opponent displacement, recovery denial and central control.'},
    {name:'Pressure Construction',rationale:'Require a pressure-building phase before attack is rewarded.'},
    {name:'Adapted Rules',rationale:'Balance mixed ability groups while keeping rallies representative.'},
    {name:'Blind / Hidden Conditions',rationale:'Create hidden tactical intention without removing live decisions.'}
  ];

  const visibleGames=selectedProblem?games.filter(game=>game.problem===selectedProblem):[];
  function overlayKey(game){return game.title;}
  function toggleGameOverlay(game,layer){
    const key=overlayKey(game);
    setSelectedOverlays(prev=>{
      const current=prev[key]||[];
      return {...prev,[key]:current.includes(layer)?current.filter(item=>item!==layer):[...current,layer]};
    });
  }
  function addGame(game){
    onAddToSession({...game,id:Date.now()+Math.random(),category:'Classic Conditioned',family:game.problem,layers:selectedOverlays[overlayKey(game)]||[],coachFocus:game.coach,cbCode:'None'});
  }

  return <div className="gameCard">
    <div className="categoryTag">Classic Conditioned</div>
    <h2>Classic Conditioned Games</h2>
    <p className="engineIntro">Choose the coaching problem first, then choose a game, then expand and edit overlays.</p>
    <div className="gameCard serverConditionPlaceholder">
      <div className="categoryTag">Server Condition Games</div>
      <h2>Server Condition Games — Placeholder</h2>
      <p className="engineIntro">Games where the server carries the constraint. These are useful when the coach wants one player to train a specific tactical or technical behaviour while the receiver plays more freely.</p>
      <div className="infoBox"><strong>Example 1</strong><p>Server can only play straight.</p></div>
      <div className="infoBox"><strong>Example 2</strong><p>Server can only win with a volley.</p></div>
      <div className="infoBox"><strong>Future Build</strong><p>This subsection will become a selectable library with editable scoring, overlays, checkerboard codes and player-facing projection text.</p></div>
    </div>


    <div className="hierarchyHelp"><strong>Workflow</strong><p>Game class → coaching problem → game options → expanded game card → overlay/adaptation choices → Add To Session.</p></div>

    <div className="problemGrid">
      {problems.map(problem=><button key={problem.name} className={selectedProblem===problem.name?'problemBtn activeProblem':'problemBtn'} onClick={()=>{setSelectedProblem(problem.name);setSelectedGame(null);}}>
        <strong>{problem.name}</strong><span>{problem.rationale}</span>
      </button>)}
    </div>

    {!selectedProblem&&<div className="placeholder">Select a coaching problem area above to see matching conditioned games.</div>}

    {selectedProblem&&<div className="gameOptionList">
      <h3>{selectedProblem}: game options</h3>
      {visibleGames.map(game=><button key={game.title} className={selectedGame===game.title?'gameOption activeGameOption':'gameOption'} onClick={()=>setSelectedGame(selectedGame===game.title?null:game.title)}>
        <span>{game.title}</span><small>{game.shortRationale}</small>
      </button>)}
    </div>}

    {visibleGames.map(game=> selectedGame===game.title && <div className="expandedGame selectedExpandedGame" key={game.title}>
      <span className="categoryTag">{game.problem}</span><h3>{game.title}</h3><span className="levelPill">{game.level}</span>
      <div className="infoBox"><strong>Task / Rules</strong><p>{game.task}</p></div>
      <div className="infoBox"><strong>Rationale</strong><p>{game.rationale}</p></div>
      <div className="infoBox"><strong>Coach Focus</strong><p>{game.coach}</p></div>
      <div className="infoBox"><strong>Player Focus</strong><p>{game.playerFocus}</p></div>
      <div className="infoBox"><strong>Scoring</strong><p>{game.scoring}</p></div>

      <CollapsibleLayer num="1" title="Game Logic" subtitle="What counts — eligibility and validity" color="green">
        <div className="quickLayers">{COMPLETION_CONSTRAINTS.map(item=><button key={item} className={(selectedOverlays[overlayKey(game)]||[]).includes(item)?'activeLayer':''} onClick={()=>toggleGameOverlay(game,item)}>{(selectedOverlays[overlayKey(game)]||[]).includes(item)?'✓ ':'+ '}{item}</button>)}</div>
      </CollapsibleLayer>
      <CollapsibleLayer num="2" title="Scoring Logic" subtitle="How points are awarded" color="gold">
        <OverlayFamilyTabs selectedOverlays={selectedOverlays[overlayKey(game)]||[]} onToggle={layer=>toggleGameOverlay(game,layer)} context={game.title}/>
      </CollapsibleLayer>
      <CollapsibleLayer num="3" title="Constraints" subtitle="Shape behaviour without changing rules" color="blue">
        <p className="mutedText" style={{fontSize:'13px',padding:'4px 0'}}>Use Scoring Logic overlays above to add behavioural constraints.</p>
      </CollapsibleLayer>
      <CollapsibleLayer num="4" title="DB Handicap" subtitle="Double bounce allowance — assign selectively" color="purple">
        <InlineDBSelector dbAssign={classicDbAssign} setDbAssign={setClassicDbAssign} dbPlayer={classicDbPlayer} setDbPlayer={setClassicDbPlayer} dbAmount={classicDbAmount} setDbAmount={setClassicDbAmount}/>
      </CollapsibleLayer>
      <button className="primaryBtn" onClick={()=>addGame(game)}>Add To Session</button>
    </div>)}
  </div>;
}



function TechnicalFocusBuilder({onAddToSession}){
  const [family,setFamily]=useState(null);
  const [error,setError]=useState(null);
  const [origins,setOrigins]=useState({});
  const [types,setTypes]=useState({});
  const [scoring,setScoring]=useState({});
  const [selectedOverlays,setSelectedOverlays]=useState({});

  const originInfo={
    'Isolated Technique Practice':{
      title:'Isolated Technique Practice',
      explanation:'The behaviour was repeated in stable, predictable conditions with little opponent pressure or time constraint.',
      system:'A deep attractor forms for a low-pressure context. It may become dominant and context-insensitive when transferred into live rallies.',
      approach:'Usually add alternative attractor states and increase meta-stability rather than simply deleting the existing solution.'
    },
    'Unguided Match Play':{
      title:'Unguided Match Play',
      explanation:'The player self-organised a good-enough solution under match pressure without coaching intervention.',
      system:'The compensatory attractor stabilises because it wins enough points at the current level, even if it limits future development.',
      approach:'Often requires destabilising and replacing the shortcut because it may never have been appropriate, only functional enough.'
    },
    'Underdeveloped Coordination':{
      title:'Underdeveloped Coordination',
      explanation:'The player has not yet developed a stable functional coordination solution for this context.',
      system:'There may be no strong attractor yet, only inconsistent attempts or compensatory workarounds.',
      approach:'Build coordination progressively: simplify first, then increase representative complexity.'
    },
    'Mixed Origin':{
      title:'Mixed Origin',
      explanation:'The behaviour may have elements of isolated repetition and match-play compensation.',
      system:'The attractor may be stable in some contexts and maladaptive in others.',
      approach:'Use exploration first: test whether the player needs added variability or genuine replacement.'
    },
    'Unknown / investigate':{
      title:'Unknown / investigate',
      explanation:'The origin is not clear yet.',
      system:'Avoid over-prescribing until you know whether the player lacks a solution or is dominated by an inefficient one.',
      approach:'Use diagnostic constraints and observation before deciding add vs replace.'
    }
  };

  const typeInfo={
    'Type 1 — Underdeveloped Coordination Solution':{
      title:'Type 1 — Underdeveloped Coordination Solution',
      explanation:'No stable functional coordination exists for this movement context.',
      approach:'Build from scratch. Introduce the coordination in a simplified task, then progressively increase representativeness.',
      warning:'Do not punish heavily too early; the player is still building the solution.'
    },
    'Type 2 — Dominant Inefficient Solution':{
      title:'Type 2 — Dominant Inefficient Solution',
      explanation:'A stable but limiting movement attractor has become deeply embedded.',
      approach:'Origin determines the strategy: add alternatives if the attractor is useful in some contexts; destabilise and replace if it is a maladaptive shortcut.',
      warning:'Instruction alone rarely changes a deep attractor. The task constraints must make the old solution less useful.'
    },
    'Mixed Type':{
      title:'Mixed Type',
      explanation:'The player has partial coordination but an inefficient solution dominates under pressure.',
      approach:'Use representative constraints to reveal when the solution works and when it fails. Then decide whether to add or replace.',
      warning:'Do not assume one intervention will work across all contexts.'
    },
    'Unknown / investigate':{
      title:'Unknown / investigate',
      explanation:'The error type is not yet clear.',
      approach:'Use small diagnostic constraints and observe whether the player lacks a solution or repeatedly returns to an inefficient one.',
      warning:'Avoid fixed correction before the attractor pattern is understood.'
    }
  };

  const constraintGames={
    'Early Preparation Trigger':{
      task:'Technical bonus only counts when preparation is visible before the opponent’s ball reaches or hits the front wall.',
      rationale:'Links preparation to earlier information pickup instead of rushed late correction.'
    },
    'Forward-Only Swing':{
      task:'Once the forward swing begins, the racquet may not travel backwards again.',
      rationale:'Discourages late re-preparation, double-loading and excessive backswing.'
    },
    'Environmental Tempo Compression':{
      task:'Use movable front-wall tape as a height modifier. Lower tape gradually to increase tempo and compress available preparation time.',
      rationale:'The environment shapes preparation and swing economy without constant verbal correction.'
    },
    'Racquet Above Wrist':{
      task:'Racquet head must remain above wrist level during preparation and recovery for the bonus to count.',
      rationale:'Maintains functional racquet readiness under movement and tempo pressure.'
    },
    'Volley Finish':{
      task:'Bonus only applies when the player earns and finishes with a volley.',
      rationale:'Rewards early interception and readiness.'
    },
    'Non-Racquet Hand Integrity':{
      task:'Non-racquet hand must remain active and useful in preparation/swing organisation.',
      rationale:'Supports spacing, balance and shoulder organisation.'
    },
    'Functional Finish Direction':{
      task:'Forehand finish should organise toward side wall; backhand finish toward back wall. Bonus only counts if finish supports recovery.',
      rationale:'Constrains follow-through organisation while keeping the rally representative.'
    },
    'Quiet Head Contact':{
      task:'Head and eyes remain stable through contact.',
      rationale:'Supports timing, spacing and cleaner interception under pressure.'
    },
    'No Spin-Out Recovery':{
      task:'Player must finish without uncontrolled spin-out.',
      rationale:'Keeps striking and recovery linked as one functional movement solution.'
    },
    'Continuous Recovery Organisation':{
      task:'Recovery must emerge continuously from the end of follow-through.',
      rationale:'Prevents hit–pause–recover separation.'
    },
    'Opponent Off T':{
      task:'Bonus applies when the opponent is outside the T-zone at the moment of attack/finish.',
      rationale:'Links technical behaviour to tactical pressure and recovery denial.'
    },
    '4-Shot Window':{
      task:'After the target behaviour/advantage appears, the player must convert within four shots.',
      rationale:'Adds conversion pressure without becoming too severe.'
    }
  };

  const cards=[
    {title:'Late Preparation',family:'Preparation & Swing Organisation',desc:'Preparation begins too late relative to ball-flight information.',origin:'Unguided Match Play',type:'Type 2 — Dominant Inefficient Solution',why:'A late but functional shortcut can stabilise because it works at the player’s current challenge level.',constraints:['Early Preparation Trigger','Forward-Only Swing','Environmental Tempo Compression'],coach:'Look for when preparation begins relative to ball flight.',player:'Use earlier information to organise preparation before the situation becomes rushed.'},
    {title:'Excessive Backswing',family:'Preparation & Swing Organisation',desc:'Large preparation, often with racquet travelling too far back.',origin:'Isolated Technique Practice',type:'Type 2 — Dominant Inefficient Solution',why:'A large stable swing can become dominant in low-pressure practice but fail under rally time pressure.',constraints:['Forward-Only Swing','Environmental Tempo Compression','Racquet Above Wrist'],coach:'Reduce available time/space rather than only saying “shorten the swing”.',player:'Find a swing size that survives pressure and still allows recovery.'},
    {title:'Racquet Below Wrist',family:'Preparation & Swing Organisation',desc:'Racquet collapses below wrist level during preparation or recovery.',origin:'Unguided Match Play',type:'Type 2 — Dominant Inefficient Solution',why:'A low resting position can be good enough until pace and interception demands rise.',constraints:['Racquet Above Wrist','Early Preparation Trigger','Volley Finish'],coach:'Observe racquet readiness during movement, not just at contact.',player:'Keep the racquet functionally alive while moving.'},
    {title:'Non-Racquet Hand Absent',family:'Body Organisation',desc:'Non-racquet hand does not support balance, spacing or swing organisation.',origin:'Underdeveloped Coordination',type:'Type 1 — Underdeveloped Coordination Solution',why:'The coordination role of the non-racquet hand may never have developed.',constraints:['Non-Racquet Hand Integrity','Functional Finish Direction'],coach:'Build a functional counterbalance role, not a cosmetic arm position.',player:'Use the non-racquet hand to organise balance and spacing.'},
    {title:'Wrist Break',family:'Body Organisation',desc:'Racquet face collapses at contact.',origin:'Unguided Match Play',type:'Type 2 — Dominant Inefficient Solution',why:'A compensatory contact solution may work at low pace but break down under pressure.',constraints:['Racquet Above Wrist','Forward-Only Swing'],coach:'Use constraints that make stable face organisation functional.',player:'Feel racquet-face stability through contact.'},
    {title:'Early Head Movement',family:'Visual Stability',desc:'Eyes/head leave the contact area too early.',origin:'Unguided Match Play',type:'Type 2 — Dominant Inefficient Solution',why:'Looking early can survive at low levels but collapses as pace and disguise increase.',constraints:['Quiet Head Contact','Environmental Tempo Compression'],coach:'Watch visual stability through contact, especially under tempo.',player:'Stay visually connected through contact before reorienting.'},
    {title:'Visual Tracking Error',family:'Visual Stability',desc:'Player watches front wall/opponent too long and loses ball-flight information.',origin:'Underdeveloped Coordination',type:'Type 1 — Underdeveloped Coordination Solution',why:'The specifying information may never have been learned in live rally contexts.',constraints:['Quiet Head Contact','Early Preparation Trigger'],coach:'Clarify what information should be picked up from ball flight.',player:'Track the ball early enough to organise spacing and preparation.'},
    {title:'Spin-Out Recovery',family:'Balance & Recovery',desc:'Player over-rotates out of the shot and cannot recover efficiently.',origin:'Unguided Match Play',type:'Type 2 — Dominant Inefficient Solution',why:'A powerful rotational solution can win points while damaging next-shot readiness.',constraints:['No Spin-Out Recovery','Continuous Recovery Organisation','Functional Finish Direction'],coach:'Reward recoverable finishes rather than impressive-looking rotation.',player:'Finish in a way that lets you move again immediately.'},
    {title:'Delayed Recovery',family:'Balance & Recovery',desc:'Player hits, pauses, then recovers as a separate action.',origin:'Unguided Match Play',type:'Type 2 — Dominant Inefficient Solution',why:'The player has separated strike and recovery rather than integrating them.',constraints:['Continuous Recovery Organisation','Opponent Off T','4-Shot Window'],coach:'Look for follow-through flowing into recovery without a stop.',player:'Let the end of the swing become the start of the next movement.'},
    {title:'Preparation Collapse Under Tempo',family:'Environmental Tempo',desc:'Organisation looks fine slowly but collapses when time and space compress.',origin:'Isolated Technique Practice',type:'Type 2 — Dominant Inefficient Solution',why:'A low-pressure attractor dominates because it was not tested against representative time pressure.',constraints:['Environmental Tempo Compression','Early Preparation Trigger','Forward-Only Swing'],coach:'Use tape/pace compression gradually; maintain representative rally quality.',player:'Adapt preparation and movement as time compresses.'}
  ];

  const families=['Preparation & Swing Organisation','Body Organisation','Visual Stability','Balance & Recovery','Environmental Tempo'];
  const shown=family?cards.filter(c=>c.family===family):[];
  const protocols=[
    ['Encouragement: bonus only','Win rally = 1 · Technical behaviour present = +2','If absent, no bonus; rally result stands.'],
    ['Penalty: opponent +1','Win rally = 1 · Each transgression = +1 to opponent','Rally continues with scoring consequence.'],
    ['Strict: lose rally','Technical transgression = lose rally','Use only when behaviour is stable enough to demand.'],
    ['Progressive pressure','First = warning · Second = no bonus · Third = opponent +1 · Fourth = lose rally','Builds pressure gradually.'],
    ['Coach custom','Coach-designed scoring protocol','Coach adapts to player and session aim.']
  ];

  function k(card){return card.title;}
  function origin(card){return origins[k(card)]||card.origin;}
  function type(card){return types[k(card)]||card.type;}
  function choice(card){return scoring[k(card)]||{name:'Encouragement: bonus only',customScore:'',customConsequence:''};}
  function protocol(card){
    const ch=choice(card);
    const found=protocols.find(p=>p[0]===ch.name)||protocols[0];
    if(ch.name==='Coach custom')return {score:ch.customScore||found[1],consequence:ch.customConsequence||found[2],name:ch.name};
    return {score:found[1],consequence:found[2],name:found[0]};
  }
  function setScore(card,field,value){
    setScoring(prev=>({...prev,[k(card)]:{...choice(card),[field]:value}}));
  }
  function toggleTechnicalOverlay(card,layer){
    const key=k(card);
    setSelectedOverlays(prev=>{
      const current=prev[key]||[];
      return {...prev,[key]:current.includes(layer)?current.filter(item=>item!==layer):[...current,layer]};
    });
  }
  function remedialApproach(card){
    const o=origin(card);
    const t=type(card);
    if(t.includes('Type 1'))return 'Build from scratch: simplify the task first, then progressively increase representative pressure.';
    if(t.includes('Type 2')&&o==='Isolated Technique Practice')return 'Add alternatives / meta-stability: keep useful contexts but reduce dominance by adding variable representative constraints.';
    if(t.includes('Type 2')&&o==='Unguided Match Play')return 'Destabilise and replace: the shortcut was functional enough but not appropriate, so the task must make the old attractor less useful.';
    return 'Investigate first: use diagnostic constraints to decide whether to add alternatives or replace the dominant solution.';
  }
  function addDiagnostic(card){
    const p=protocol(card);
    onAddToSession({
      id:Date.now()+Math.random(),
      title:`Technical Diagnostic · ${card.title}`,
      category:'Technical',
      family:card.family,
      level:type(card),
      task:`Diagnostic target: ${card.desc} Constraint suggestions: ${card.constraints.join(' · ')}.`,
      rationale:`Origin: ${origin(card)}. Type: ${type(card)}. Remedial approach: ${remedialApproach(card)} Why it stabilises: ${card.why}`,
      coachFocus:card.coach,
      playerFocus:card.player,
      scoring:p.score,
      antiGaming:p.consequence,
      consequence:p.consequence,
      scoringProtocol:p.name,
      layers:selectedOverlays[k(card)]||[],
      cbCode:'None'
    });
  }

  return <div className="gameCard">
    <div className="categoryTag">Technical Diagnostic</div>
    <h2>Technical Diagnostic Full Pathway</h2>
    <p className="engineIntro">Behaviour Family → Specific Error → Origin → Type → Remedial Approach → Constraint Games → Editable Scoring → Session.</p>

    <div className="diagnosticPrinciple"><strong>Key principle</strong><p>Errors are stable movement solutions that became good enough for the player’s current challenge level. Origin determines whether to add alternatives or replace a dominant attractor.</p></div>

    <div className="problemGrid">{families.map(f=><button key={f} className={family===f?'problemBtn activeProblem':'problemBtn'} onClick={()=>{setFamily(f);setError(null);}}><strong>{f}</strong></button>)}</div>

    {!family&&<div className="placeholder">Select a behaviour family to see specific technical errors.</div>}

    {family&&<div className="gameOptionList"><h3>{family}: specific errors / behaviours</h3>{shown.map(card=><button key={card.title} className={error===card.title?'gameOption activeGameOption':'gameOption'} onClick={()=>setError(error===card.title?null:card.title)}><span>{card.title}</span><small>{card.desc}</small></button>)}</div>}

    {shown.map(card=>error===card.title&&<div className="expandedGame selectedExpandedGame" key={card.title}>
      <span className="categoryTag">{card.family}</span><h3>{card.title}</h3>
      <div className="infoBox"><strong>Error / behaviour</strong><p>{card.desc}</p></div>
      <div className="infoBox"><strong>Why it becomes stable</strong><p>{card.why}</p></div>

      <div className="diagnosticControls">
        <label>Error origin<select value={origin(card)} onChange={e=>setOrigins(prev=>({...prev,[k(card)]:e.target.value}))}><option>Isolated Technique Practice</option><option>Unguided Match Play</option><option>Underdeveloped Coordination</option><option>Mixed Origin</option><option>Unknown / investigate</option></select></label>
        <label>Error type<select value={type(card)} onChange={e=>setTypes(prev=>({...prev,[k(card)]:e.target.value}))}><option>Type 1 — Underdeveloped Coordination Solution</option><option>Type 2 — Dominant Inefficient Solution</option><option>Mixed Type</option><option>Unknown / investigate</option></select></label>
      </div>

      <div className="diagnosticTheoryGrid">
        <div className="diagnosticTheoryCard"><h4>Origin explanation</h4><p>{originInfo[origin(card)]?.explanation}</p><p>{originInfo[origin(card)]?.system}</p><strong>Implication</strong><p>{originInfo[origin(card)]?.approach}</p></div>
        <div className="diagnosticTheoryCard"><h4>Type explanation</h4><p>{typeInfo[type(card)]?.explanation}</p><strong>Approach</strong><p>{typeInfo[type(card)]?.approach}</p><strong>Warning</strong><p>{typeInfo[type(card)]?.warning}</p></div>
      </div>

      <div className="infoBox"><strong>Remedial Approach</strong><p>{remedialApproach(card)}</p></div>
      <div className="infoBox"><strong>Coach Focus</strong><p>{card.coach}</p></div>
      <div className="infoBox"><strong>Player Focus</strong><p>{card.player}</p></div>

      <div className="constraintSuggestionBox"><strong>Constraint Game Suggestions</strong>{card.constraints.map(c=><div className="constraintGameCard" key={c}><h4>{c}</h4><p>{constraintGames[c]?.task||'Constraint game option.'}</p><p><strong>Rationale: </strong>{constraintGames[c]?.rationale||'Shapes the target behaviour through representative task design.'}</p></div>)}</div>

      <CollapsibleLayer num="1" title="Game Logic" subtitle="Editable scoring and consequence" color="green">
        <label>Scoring protocol<select value={choice(card).name} onChange={e=>setScore(card,'name',e.target.value)}>{protocols.map(p=><option key={p[0]}>{p[0]}</option>)}</select></label>
        {choice(card).name==='Coach custom'&&<div className="customScoringGrid"><label>Custom scoring<textarea value={choice(card).customScore} onChange={e=>setScore(card,'customScore',e.target.value)} placeholder="Example: each transgression = +1 to opponent"/></label><label>Custom consequence<textarea value={choice(card).customConsequence} onChange={e=>setScore(card,'customConsequence',e.target.value)} placeholder="Example: rally continues but bonus is removed"/></label></div>}
        <div className="infoBox"><strong>Selected scoring</strong><p>{protocol(card).score}</p></div>
        <div className="infoBox"><strong>Selected consequence</strong><p>{protocol(card).consequence}</p></div>
      </CollapsibleLayer>

      <CollapsibleLayer num="2" title="Scoring Logic" subtitle="Universal overlays" color="gold">
        <OverlayFamilyTabs selectedOverlays={selectedOverlays[k(card)]||[]} onToggle={layer=>toggleTechnicalOverlay(card,layer)} context={'Technical Diagnostic · '+card.title} />
      </CollapsibleLayer>

      <CollapsibleLayer num="3" title="Constraints" subtitle="Shape behaviour without changing rules" color="blue">
        <p className="mutedText" style={{fontSize:'13px',padding:'4px 0'}}>Constraint games are shown above. Use Scoring Logic overlays to add additional behavioural constraints.</p>
      </CollapsibleLayer>

      <CollapsibleLayer num="4" title="DB Handicap" subtitle="Double bounce allowance — assign selectively" color="purple">
        <InlineDBSelector dbAssign="Both Players" setDbAssign={()=>{}} dbPlayer="" setDbPlayer={()=>{}} dbAmount="No DB" setDbAmount={()=>{}}/>
      </CollapsibleLayer>

      <button className="primaryBtn" onClick={()=>addDiagnostic(card)}>Add Diagnostic To Session</button>
    </div>)}
  </div>;
}

function Level0Exploration(){
  return <Level0Foundations setScreen={()=>{}} setSession={null}/>;
}

function Level0Foundations({setScreen,setSession}){
  const [activeModule,setActiveModule]=useState('home');
  const [audioPlaying,setAudioPlaying]=useState(false);
  const [audioObj,setAudioObj]=useState(null);
  const [tempoLabel,setTempoLabel]=useState('Standard');

  function playBlueDanube(tempo){
    if(audioObj){audioObj.pause();setAudioObj(null);setAudioPlaying(false);}
    const url='https://archive.org/download/blue-danube-waltz/blue-danube-waltz.mp3';
    const rates={Slow:0.75,Standard:1.0,Fast:1.25};
    const audio=new Audio(url);
    audio.playbackRate=rates[tempo]||1.0;
    audio.loop=true;
    audio.play().then(()=>{setAudioObj(audio);setAudioPlaying(true);setTempoLabel(tempo);}).catch(()=>{});
  }

  function stopBlueDanube(){
    if(audioObj){audioObj.pause();setAudioObj(null);}
    setAudioPlaying(false);
  }

  const modules=[
    {id:'home',label:'Overview',emoji:'🏠'},
    {id:'tau',label:'Tau Development',emoji:'👁'},
    {id:'chipping',label:'Chipping System',emoji:'🎾'},
    {id:'spacing',label:'Spacing',emoji:'📐'},
    {id:'rally',label:'Rotating Rally',emoji:'🔄'},
    {id:'bluedanube',label:'Blue Danube',emoji:'🎵'},
  ];

  const [tauTab,setTauTab]=useState('science');

  const tauCards=[
    {code:'TAU-1',title:'Large Ball Tracking',purpose:'Develop basic ball awareness and tracking.',task:'Player watches and tracks a foam or large ball. No striking required initially.',constraint:'Foam ball. Coach rolls or bounces the ball slowly.',cue:'Watch the ball all the way until it stops.',simplify:'Reduce speed. Larger ball.',progress:'Add a simple tap or catch on arrival.'},
    {code:'TAU-2',title:'Variable Ball Size',purpose:'Prevent fixed timing solution. Develop adaptive tracking.',task:'Chip or strike using different ball sizes within the same session.',constraint:'Mix foam, red dot and orange dot balls randomly.',cue:'See the ball clearly before you move.',simplify:'Start with foam only.',progress:'Introduce yellow ball briefly.'},
    {code:'TAU-3',title:'Self-Feed Tracking',purpose:'Player controls timing. Easiest perceptual environment.',task:'Player self-drops and strikes. Full control over when the ball arrives.',constraint:'Red or orange dot. Player drops from waist height.',cue:'Watch it bounce, then strike.',simplify:'Larger ball. Drop from lower height.',progress:'Vary drop height to change bounce.'},
    {code:'TAU-4',title:'Coach Hand-Feed Tracking',purpose:'Introduce trajectory variation from an external source.',task:'Coach feeds underarm. Player adapts to slightly unpredictable arrival.',constraint:'Red or orange dot. Underarm feed at medium pace.',cue:'Track the ball from the coach hand.',simplify:'Slower feed. Lower trajectory.',progress:'Vary pace and height of feed.'},
    {code:'TAU-5',title:'Front Wall Tracking',purpose:'Introduce wall rebound timing.',task:'Ball fed to front wall, rebounds to player who strikes.',constraint:'Orange or green dot. Medium pace feed.',cue:'See the ball hit the wall, then move.',simplify:'Slow feed. Player stands close.',progress:'Add recovery movement after strike.'},
    {code:'TAU-6',title:'Mixed Feed Source',purpose:'Develop adaptable timing across different sources.',task:'Alternate between hand feed, drop feed and wall rebound within the activity.',constraint:'Orange or green dot. Coach varies source each rally.',cue:'Stay ready — the ball might come from anywhere.',simplify:'Announce the source before each feed.',progress:'Random source without announcement.'},
    {code:'TAU-7',title:'Random Feed Tracking',purpose:'Full variable practice condition.',task:'Coach varies trajectory, speed and source unpredictably. Player solves each ball independently.',constraint:'Yellow ball preferred. Full variation.',cue:'Every ball is different. See each one freshly.',simplify:'Return to TAU-5 or TAU-6.',progress:'Add movement recovery between feeds.'},
  ];

  const chippingCards=[
    {code:'0A',title:'Stationary Chipping',purpose:'Ball control, consistency, confidence.',task:'Player repeatedly chips the ball into a wall target. No movement required.',constraint:'Any ball. Side wall or front wall target.',goal:'Personal best consecutive contacts.',variations:'Forehand · Backhand · Front wall · Side wall',cue:'Watch the ball hit the wall.',simplify:'Larger ball, closer to wall.',progress:'Set consecutive targets: 5 then 10 then 20.'},
    {code:'0B',title:'Consecutive Success',purpose:'Build repeatability and focus.',task:'Chip into the same target zone repeatedly.',constraint:'Set a clear target zone on the wall.',goal:'Reach 5 · 10 · 20 · 50 consecutive successful contacts.',cue:'Same spot. Every time.',simplify:'Reduce the target count.',progress:'Increase the target. Add backhand alternation.'},
    {code:'0C',title:'Progressive Distance',purpose:'Force regulation, distance calibration, trajectory awareness.',task:'Chip to wall target. Move further away after reaching the success target.',constraint:'Mark distances on the floor.',goal:'Reach the maximum manageable distance.',cue:'Same swing — more pace.',simplify:'Return to closer distance.',progress:'Add consecutive success requirement at each distance.'},
    {code:'0D',title:'Chip and Move',purpose:'Integrate movement and contact.',task:'Chip. Move to a new position. Chip again. The ball trajectory creates the next movement problem.',constraint:'Player must move between each contact.',cue:'Move as soon as you strike.',simplify:'Slow feed. Large ball.',progress:'Set a target number of consecutive chip-and-moves.'},
    {code:'0E',title:'Continuous Chip and Move',purpose:'Continuous perception-action coupling.',task:'Maintain a continuous chip and move sequence without stopping.',constraint:'No stationary striking allowed.',goal:'Longest unbroken sequence.',cue:'Keep moving.',simplify:'Reduce the target. Allow one stationary contact.',progress:'Smaller target zone. Increase court area used.'},
    {code:'0F',title:'Volley Chip and Move',purpose:'Earlier interception, racket preparation, spatial awareness.',task:'Maintain control using volleys where appropriate.',constraint:'Forehand only then Backhand only then Alternating then Free play.',cue:'Take it before it bounces where you can.',simplify:'Allow bounces. Large ball.',progress:'Random forehand and backhand volley target.'},
    {code:'0G',title:'Arrive and Strike',purpose:'Spacing development. Perception-driven movement.',task:'Feed. Move. Find the ball with a final lunge. Strike.',constraint:'Feed varies to force genuine movement. Player may not pre-position.',coachCue:'Find the ball with your lunge.',avoid:'Move away from the ball · Give yourself more room',simplify:'Slow feed. Large ball. Short distance.',progress:'Forehand then Backhand then Random side then Live rally entry.'},
  ];

  const spacingCards=[
    {code:'SP-1',title:'Feed and Arrive',purpose:'Develop functional contact distance through movement.',task:'Coach feeds to varying positions. Player moves and arrives at the ball before striking.',constraint:'Player must move before every strike — no pre-positioning.',cue:'Find the ball with your lunge.',simplify:'Shorter feeds. Slower pace.',progress:'Increase feed variation. Add recovery.'},
    {code:'SP-2',title:'Lunge Gate',purpose:'Direct attention to arrival position, not body mechanics.',task:'Place a cone or marker at an appropriate contact distance. Player must arrive with their lunge reaching the marker.',constraint:'The marker is the spatial reference — not a body instruction.',cue:'The marker tells you where to arrive.',simplify:'Larger marker zone.',progress:'Remove the marker once spacing is consistent.'},
    {code:'SP-3',title:'Ball Size Constraint',purpose:'Use ball size to shape spatial relationship without instruction.',task:'Use a large ball to develop a wider contact relationship. Reduce ball size progressively.',constraint:'Foam then Red then Orange then Green then Yellow.',cue:'Let the ball tell you where to stand.',simplify:'Return to larger ball.',progress:'Alternate ball sizes within one activity.'},
    {code:'SP-4',title:'Variability Feed',purpose:'Prevent fixed spacing pattern. Develop adaptive arrival.',task:'Coach varies feed position randomly. Player solves the spacing problem independently on each ball.',constraint:'No two feeds to the same position.',cue:'Every ball is a new problem.',simplify:'Reduce variation. Announce feed side.',progress:'Add movement recovery between feeds.'},
  ];

  const rallyCards=[
    {code:'RR-1',title:'Zone 1 Rally',purpose:'Basic control. Cooperative accuracy.',task:'All players direct shots to Zone 1 — front area. Cooperative — aim is to keep the ball alive.',constraint:'Clear zone marking. All shots to Zone 1.',goal:'Highest number of consecutive cooperative shots.',cue:'Aim for the zone — not the winner.',simplify:'Start with a hand feed. Allow double bounce.',progress:'Increase consecutive target.'},
    {code:'RR-2',title:'Zone 2 Rally',purpose:'Length development. Force calibration.',task:'All players hit to Zone 2 — back area. Cooperative.',constraint:'Zone 2 marking. All shots must land in Zone 2.',goal:'Consecutive shots in Zone 2.',cue:'Hit it to the back.',simplify:'Allow Zone 1 if Zone 2 fails.',progress:'Combine with Zone 1 in alternate pattern.'},
    {code:'RR-3',title:'Alternate Zones',purpose:'Directional decision making.',task:'Players alternate between Zone 1 and Zone 2 on each shot.',constraint:'Zone 1 then Zone 2 then Zone 1 pattern.',cue:'Zone 1 or Zone 2 — decide before you strike.',simplify:'Return to single zone.',progress:'Add random zone call from coach.'},
    {code:'RR-4',title:'Random Zones',purpose:'Full directional variation.',task:'Players choose zone freely. Opponent must track and move.',constraint:'No restriction on zone choice.',cue:'Vary your target.',simplify:'Return to alternate zones.',progress:'Add a third zone — middle.'},
    {code:'RR-5',title:'Team Challenge',purpose:'Cooperation, communication, movement recovery.',task:'Team cooperates to reach a target number of consecutive shots. All shots within target zones.',constraint:'Set a team target: 10 then 20 then 50 consecutive.',cue:'Help the next player.',simplify:'Reduce target. Allow any zone.',progress:'Increase target. Reduce zone size.'},
    {code:'RR-6',title:'Last Player Standing',purpose:'Competitive pressure. Recovery. Focus.',task:'Players compete in rotation. Losing a rally means running court sprints. Last player remaining wins.',constraint:'Loser runs court sprints before rejoining queue.',cue:'Stay focused on every rally.',simplify:'Replace sprints with a simple forfeit.',progress:'Add zone requirements to count as a valid rally.'},
  ];

  const bdCards=[
    {code:'BD-1',title:'Waltz Rhythm — Stationary',purpose:'Establish movement rhythm without movement pressure.',task:'Player chips or rallies with a partner while the Blue Danube plays. No instruction about timing — let the music shape the rhythm.',constraint:'Blue Danube at standard tempo. No verbal rhythm cues.',cue:'No verbal cue — let the music work.',simplify:'Slow tempo version.',progress:'Add movement.'},
    {code:'BD-2',title:'Waltz Rhythm — Movement',purpose:'Rhythm-regulated movement to the ball.',task:'Player moves to feeds with the Blue Danube playing. Preparation aligns with the 1-2-3 waltz beat naturally.',constraint:'Coach feeds in waltz timing where possible.',cue:'Move with the music.',simplify:'Slow tempo. Short feeds.',progress:'Remove music once rhythm is established.'},
    {code:'BD-3',title:'Waltz Rhythm — Rally',purpose:'Relaxed, rhythmic rally play.',task:'Cooperative rally with Blue Danube playing. Both players aim to maintain a waltz-tempo rhythm across the rally.',constraint:'Music constraint active throughout rally.',cue:'Stay with the music.',simplify:'Zone targets to keep pace manageable.',progress:'Competitive rally with rhythm constraint.'},
  ];

  function CoachCard({card,onAdd}){
    const [expanded,setExpanded]=useState(false);
    return <div className={'l0CoachCard'+(expanded?' l0CoachCardOpen':'')}>
      <button type="button" className="l0CoachCardHeader" onClick={()=>setExpanded(!expanded)}>
        <span className="l0CoachCardCode">{card.code}</span>
        <strong>{card.title}</strong>
        <span className="l0CoachCardChevron">{expanded?'▲':'▼'}</span>
      </button>
      {expanded&&<div className="l0CoachCardBody">
        <div className="l0CoachCardPurpose"><strong>Purpose</strong><p>{card.purpose}</p></div>
        <div className="l0CoachCardTask"><strong>Task</strong><p>{card.task}</p></div>
        {card.constraint&&<div className="l0CoachCardSection"><strong>Constraint</strong><p>{card.constraint}</p></div>}
        {card.goal&&<div className="l0CoachCardSection"><strong>Goal</strong><p>{card.goal}</p></div>}
        {card.variations&&<div className="l0CoachCardSection"><strong>Variations</strong><p>{card.variations}</p></div>}
        {card.coachCue&&<div className="l0CoachCardCue"><strong>Coach Cue</strong><blockquote>{'"'}{card.coachCue}{'"'}</blockquote></div>}
        {card.avoid&&<div className="l0CoachCardAvoid"><strong>Avoid</strong><p>{card.avoid}</p></div>}
        {!card.coachCue&&card.cue&&<div className="l0CoachCardCue"><strong>Coach Cue</strong><blockquote>{'"'}{card.cue}{'"'}</blockquote></div>}
        {card.simplify&&<div className="l0CoachCardSection simplifySection"><strong>Simplify</strong><p>{card.simplify}</p></div>}
        {card.progress&&<div className="l0CoachCardSection progressSection"><strong>Progress</strong><p>{card.progress}</p></div>}
        {onAdd&&<button type="button" className="primaryBtn l0AddBtn" onClick={()=>onAdd(card)}>Add to Session</button>}
      </div>}
    </div>;
  }

  function addToSession(card){
    if(setSession) setSession(prev=>[...(prev||[]),{
      title:card.title,category:'Level 0',
      task:card.code+' · '+(card.task||card.purpose),
      coach:card.coachCue||card.cue||'',
      rationale:card.purpose,duration:10
    }]);
  }

  return <div className="page level0Page">
    <div className="pageTop">
      <div><h1>Level 0 Foundations</h1><p className="mutedText">Perception Before Technique</p></div>
      <button className="secondaryBtn" onClick={()=>setScreen('gamesLibrary')}>{'← Explore'}</button>
    </div>

    <div className="l0ModuleNav">
      {modules.map(m=><button key={m.id} type="button"
        className={activeModule===m.id?'l0ModuleNavActive':'l0ModuleNavBtn'}
        onClick={()=>setActiveModule(m.id)}>
        <span>{m.emoji}</span>{m.label}
      </button>)}
    </div>

    {activeModule==='home'&&<div className="l0Overview">
      <div className="l0HeroBanner">
        <h2>Level 0 Foundations</h2>
        <p className="l0HeroSub">Perception Before Technique</p>
        <p>Level 0 develops the perceptual and movement foundations that make later technique possible. Players learn to track the ball, judge time to contact, control contact distance, move to the ball and coordinate perception and action.</p>
        <div className="l0Warning">Do not assume technical faults are technical. Many beginner errors are perceptual-development issues.</div>
      </div>
      <div className="l0PrinciplesPanel">
        <strong>Level 0 Coach Principles</strong>
        <div className="l0PrinciplesList">
          {['Perception before technique','Representative learning','Variability over repetition','External focus','Discovery over instruction','Constraints before correction'].map(p=><div key={p} className="l0Principle">{'✓ '+p}</div>)}
        </div>
      </div>
      <div className="l0FourQ">
        <strong>Before coaching technique — ask these four questions:</strong>
        <div className="l0FourQRow">
          {[{n:'1',q:'Can they see it?'},{n:'2',q:'Can they move to it?'},{n:'3',q:'Can they contact it?'},{n:'4',q:'Can they sustain it?'}].map(q=><div key={q.n} className="l0FourQCard"><span>{q.n}</span><strong>{q.q}</strong></div>)}
        </div>
        <div className="l0OnlyThen">Only then ask: How should they swing?</div>
      </div>
    </div>}

    {activeModule==='tau'&&<div className="l0ModuleSection">
      <div className="l0ModuleIntro">
        <span className="categoryTag">Module 1 · Perception</span>
        <h2>Tau Development</h2>
        <p className="l0ModuleSub">Learning Time To Contact</p>
        <p>Many beginner timing errors are perception-action problems rather than technical problems.</p>
        <div className="l0PrincipleCallout">"Before you coach the swing, check what the player can see."</div>
      </div>

      <div className="tauTabBar">
        <button type="button" className={tauTab==='science'?'tauTabActive':'tauTabBtn'} onClick={()=>setTauTab('science')}>🔬 The Science</button>
        <button type="button" className={tauTab==='cards'?'tauTabActive':'tauTabBtn'} onClick={()=>setTauTab('cards')}>🎾 Coaching Cards</button>
      </div>

      {tauTab==='science'&&<div className="tauSciencePanel">

        <div className="tauScienceHero">
          <h3>What Is Tau?</h3>
          <p>Tau (τ) is an optic variable first described by David Lee in 1976. It refers to information available in the visual array that specifies <em>time to contact</em> — how long until a moving object arrives at the observer.</p>
          <p>When a ball approaches, its retinal image expands. The ratio of the current retinal image size to its rate of expansion provides a direct optical specification of time to contact. Crucially, this information is available in the light <strong>without any calculation</strong> — the visual system can pick it up directly if attuned to it.</p>
        </div>

        <div className="tauScienceGrid">
          <div className="tauScienceCard">
            <h4>The Optical Variable τ</h4>
            <p>τ = θ ÷ (dθ/dt)</p>
            <p>Where θ is the retinal angle of the object and dθ/dt is its rate of change. When this ratio reaches zero, contact occurs.</p>
            <p>Players do not calculate this. They become attuned to the optical information through experience — if that information is available and the environment supports attunement.</p>
          </div>
          <div className="tauScienceCard">
            <h4>Optical Expansion</h4>
            <p>As a ball approaches the eye, its retinal image grows. The rate of expansion is the key variable. A ball arriving quickly expands faster than a ball arriving slowly.</p>
            <p>This expansion pattern is the perceptual information that underpins timing. A player who is not tracking the ball — or is tracking it too late — will not access this information reliably.</p>
          </div>
          <div className="tauScienceCard">
            <h4>Attunement vs Instruction</h4>
            <p>Players cannot learn tau through instruction. You cannot tell a player to use optical expansion. The skill develops through practice in environments that make the relevant information available and accessible.</p>
            <p>This is why the coach's role is environment design — not explanation. The constraint creates the conditions. The player becomes attuned through experience.</p>
          </div>
          <div className="tauScienceCard">
            <h4>Why Beginners Struggle</h4>
            <p>Young and beginner players often rely on cruder perceptual information — ball visibility, apparent size, familiar flight paths — before becoming sensitive to the more precise optical expansion information that specifies time to contact.</p>
            <p>This is not a technique problem. It is an attunement problem. Technical instruction will not solve it. Changing the information environment will.</p>
          </div>
          <div className="tauScienceCard">
            <h4>Ball Size and Tau</h4>
            <p>Larger balls produce a stronger, more detectable optical expansion signal. A foam ball approaching at slow speed gives a young player far more time to detect expansion and organise a movement response than a yellow dot at full pace.</p>
            <p>Ball size reduction is therefore a principled perceptual constraint — not just a difficulty adjustment. It changes what information is available and how detectable it is.</p>
          </div>
          <div className="tauScienceCard">
            <h4>Feed Source and Tau</h4>
            <p>Self-drop feeds allow the player to control the timing entirely. The ball's arrival is almost fully predictable. This is the easiest perceptual condition.</p>
            <p>Coach hand feeds introduce slight trajectory variation — the player must now read information they did not create. Wall rebound feeds add the perceptual challenge of rebound timing. Each step places increasing demands on optical attunement.</p>
          </div>
          <div className="tauScienceCard">
            <h4>Variability and Attunement</h4>
            <p>Constant identical feeds allow a player to time the ball using memory and rhythm rather than optical information. They are not using tau — they are using a learned timing pattern.</p>
            <p>Variable practice forces genuine optical pickup on every ball. The player cannot rely on pattern memory. This is slower to learn but produces genuinely attuned timing that transfers to competition.</p>
          </div>
          <div className="tauScienceCard">
            <h4>The Development Timeline</h4>
            <p>There is no fixed age at which tau becomes the primary timing cue. Attunement develops gradually through experience. Very young beginners may rely on visibility and apparent size for many months before optical expansion becomes the dominant timing information source.</p>
            <p>Do not rush this process with technical correction. Provide rich, variable perceptual environments and let attunement develop.</p>
          </div>
        </div>

        <div className="tauCoachImplication">
          <h3>Coach Implication</h3>
          <div className="tauImplicationGrid">
            <div className="tauImplicationCard tauImplProblem">
              <strong>If a player mis-times the ball</strong>
              <p>Before assuming a technique problem, ask: Is this player receiving useful optical expansion information? Are they watching the ball early enough to access tau? Is the ball size and feed source appropriate for their current attunement level?</p>
            </div>
            <div className="tauImplicationCard tauImplSolution">
              <strong>The perceptual-first response</strong>
              <p>Change the ball. Change the feed source. Slow the feed. Add variability. Create a richer optical information environment. Only after these adjustments fail to improve timing should you consider a technical intervention.</p>
            </div>
            <div className="tauImplicationCard tauImplPrinciple">
              <strong>The fundamental principle</strong>
              <p>Perception and action are coupled. The quality of the movement depends on the quality of the perceptual information available. Improve the information environment first. The movement will follow.</p>
            </div>
          </div>
        </div>

        <div className="tauReferences">
          <strong>Key Reference</strong>
          <p>Lee, D.N. (1976). A theory of visual control of braking based on information about time-to-collision. <em>Perception, 5</em>(4), 437–459.</p>
          <p>This paper introduced the tau hypothesis and remains foundational to understanding time-to-contact perception in sport.</p>
        </div>

      </div>}

      {tauTab==='cards'&&<div className="l0CardStack">
        {tauCards.map(card=><CoachCard key={card.code} card={card} onAdd={addToSession}/>)}
      </div>}
    </div>}

    {activeModule==='chipping'&&<div className="l0ModuleSection">
      <div className="l0ModuleIntro">
        <span className="categoryTag">Module 2 · Ball Control</span>
        <h2>Chipping Progression System</h2>
        <p className="l0ModuleSub">0A → 0G · All stages visible</p>
        <p>Seven stages from stationary chipping to perception-driven movement. All stages available — select the right one for the player.</p>
        <div className="l0CompLayer"><strong>Competitive Layer — applies to any stage</strong><div className="l0CompPills">{['Personal Best','Consecutive Success','Partner Challenge','Team Challenge','Last Player Standing'].map(p=><span key={p}>{p}</span>)}</div></div>
      </div>
      <div className="l0CardStack">
        {chippingCards.map(card=><CoachCard key={card.code} card={card} onAdd={addToSession}/>)}
      </div>
    </div>}

    {activeModule==='spacing'&&<div className="l0ModuleSection">
      <div className="l0ModuleIntro">
        <span className="categoryTag">Module 3 · Movement</span>
        <h2>Spacing Development</h2>
        <p className="l0ModuleSub">Functional Contact Distance</p>
        <p>Players do not learn spacing through verbal instruction. They learn through movement experiences.</p>
        <div className="l0PrincipleCallout">"Find the ball with your lunge."</div>
        <div className="l0AvoidNote">Avoid: "Move away from the ball" · "Give yourself more room"</div>
      </div>
      <div className="l0CardStack">
        {spacingCards.map(card=><CoachCard key={card.code} card={card} onAdd={addToSession}/>)}
      </div>
    </div>}

    {activeModule==='rally'&&<div className="l0ModuleSection">
      <div className="l0ModuleIntro">
        <span className="categoryTag">Module 4 · Rallying</span>
        <h2>Rotating Rally</h2>
        <p className="l0ModuleSub">Cooperative Rally System · All 6 progressions</p>
        <p>From basic zone cooperation through to competitive Last Player Standing. All progressions visible — select the right level.</p>
      </div>
      <div className="l0CardStack">
        {rallyCards.map(card=><CoachCard key={card.code} card={card} onAdd={addToSession}/>)}
      </div>
    </div>}

    {activeModule==='bluedanube'&&<div className="l0ModuleSection">
      <div className="l0ModuleIntro">
        <span className="categoryTag">Module 5 · Rhythm Constraint</span>
        <h2>🎵 Blue Danube Tempo</h2>
        <p className="l0ModuleSub">Movement Rhythm Constraint</p>
        <p>Music used as a movement constraint — not background entertainment. The 3/4 waltz rhythm regulates movement tempo and reduces rushing without any verbal instruction.</p>
        <div className="l0PrincipleCallout">Start the music before the activity. Do not mention rhythm. Let the constraint work.</div>
      </div>

      <div className="l0BDPlayer">
        <div className="l0BDTitle">
          <span className="l0BDIcon">🎵</span>
          <div>
            <strong>Blue Danube Waltz</strong>
            <span>Johann Strauss II · 3/4 Waltz · Movement constraint</span>
          </div>
          <div className={'l0BDStatus'+(audioPlaying?' l0BDPlaying':'')}>{audioPlaying?'▶ Playing':'■ Stopped'}</div>
        </div>
        <div className="l0BDControls">
          {['Slow','Standard','Fast'].map(tempo=><button key={tempo} type="button"
            className={'l0BDBtn'+(audioPlaying&&tempoLabel===tempo?' l0BDBtnActive':'')}
            onClick={()=>audioPlaying&&tempoLabel===tempo?stopBlueDanube():playBlueDanube(tempo)}>
            {audioPlaying&&tempoLabel===tempo?'■ Stop '+tempo:'▶ '+tempo}
          </button>)}
        </div>
        <div className="l0BDTempoNotes">
          <span><strong>Slow</strong> — beginners or highly tense players</span>
          <span><strong>Standard</strong> — default waltz tempo</span>
          <span><strong>Fast</strong> — players who are too slow in preparation</span>
        </div>
      </div>

      <div className="l0CardStack" style={{marginTop:'16px'}}>
        {bdCards.map(card=><CoachCard key={card.code} card={card} onAdd={addToSession}/>)}
      </div>
    </div>}
  </div>;
}



// ─── PRESSURE MODULE ─────────────────────────────────────────────────────────

const PRESSURE_FOCUS_PRINCIPLES=[
  {id:'tzone',label:'T-Zone Return',desc:'After every shot, recover to the T before the next feed arrives. Do not watch your shot — move immediately.',cue:'Hit and move.'},
  {id:'racquet',label:'Racquet Head Above Wrist',desc:'Between shots and at the moment of contact, the racquet head should be above the wrist. This organises the swing path and face control.',cue:'Check your racquet before you move.'},
  {id:'head',label:'Head Still on Contact',desc:'Head stays level and still through contact. Do not lift the head to look where the ball is going — the flight will tell you.',cue:'See the contact, then move.'},
  {id:'stay',label:'Stay in the Shot',desc:'Follow through fully before beginning recovery. Cutting the follow through short reduces both control and spacing.',cue:'Finish the shot, then go.'},
  {id:'quieteye',label:'Quiet Eye',desc:'Fix gaze briefly on the contact point before and through the strike. This brief visual hold improves timing under pressure.',cue:'Find it, hold it, hit it.'},
];

const PRESSURE_122_EXERCISES=[
  {
    id:'p122-1',code:'P1',
    title:'Tempo Drives',
    subtitle:'Rhythm and racquet control under continuous feed',
    setup:'Coach stands at the service box and volley feeds to the same wall side. Two players rotate after each shot — P1 drives then recovers to back, P2 steps in, drives, recovers to back. Coach sets the tempo.',
    task:'Players maintain a continuous drive rhythm. Target a consistent, controlled drive landing in the back quarter of the court. Racquet head above wrist before every contact. Head still through the shot. Full follow through before moving.',
    focusPoints:[
      {label:'Racquet Head Above Wrist',detail:'Check racquet position as you step in. Head above wrist before the ball arrives — not after.'},
      {label:'Head Still on Contact',detail:'Eyes find the ball early. Head stays level through contact. Do not lift to watch the drive.'},
      {label:'Stay in the Shot',detail:'Follow through fully before stepping away. Short follow throughs reduce control and accuracy.'},
      {label:'T-Zone Return',detail:'Rotate cleanly to the back after each drive. Do not stand and watch — move immediately.'},
    ],
    coachNote:'Watch the racquet head on arrival — many players drop the wrist under fatigue or feed pressure. Slow the feed tempo if racquet control breaks down. The target is consistent head-above-wrist organisation, not maximum pace.',
    constraint:'Drive must land in the back quarter of the court. Drives landing short lose the point.',
    rld:3,duration:'3–5 min per set',
  },
  {
    id:'p122-2',code:'P2',
    title:'Drive and Counter Drop',
    subtitle:'Decision making — deception under feed pressure',
    setup:'Same as P1. Coach volley feeds from service box to the wall side. Two players rotate. Player decides on each feed whether to drive or drop.',
    task:'Player drives or drops based on their own decision each rally. Key focus: deception. Show the shape of a drop but execute a drive. Show the shape of a drive but execute a drop. All shots must travel tight to the side wall.',
    focusPoints:[
      {label:'Same Preparation for Both Shots',detail:'Drive and drop must use the same backswing and racquet path. The difference happens only at the moment of contact.'},
      {label:'Show Drop — Drive',detail:'Commit to drop shape. At the last moment, add pace and depth. Opponent reads drop — gets drive.'},
      {label:'Show Drive — Drop',detail:'Commit to drive shape. At the last moment, soften the face and take pace off. Opponent reads drive — gets drop.'},
      {label:'Side Wall Only',detail:'All shots must travel close to the side wall. Wide drops or drives invite easy interception.'},
    ],
    coachNote:'If deception is absent, both shots will look different from the start and the opponent will read both. Look for early differentiation in preparation — that is the tell. The coaching target is identical preparation, not identical shots.',
    constraint:'All shots must be side-wall tight. Drives score normally. Successful drops landing in front third earn a bonus point.',
    rld:3,duration:'3 min per set — swap roles',
  },
  {
    id:'p122-3',code:'P3',
    title:'Drives Front and Back',
    subtitle:'Movement range — covering both front and back court',
    setup:'Coach on service box volley feeds. Feed varies between a short feed (front court) and a deep feed (back corner). Two players rotate.',
    task:'Player reads the feed length and covers both front and back positions. Drive from wherever the ball lands. Recover to T after every shot.',
    focusPoints:[
      {label:'Read the Feed Early',detail:'Watch the coach hand and racquet face for cues to feed depth. Do not wait for the ball to reach its peak.'},
      {label:'T-Zone Recovery',detail:'After front court shots especially — recover quickly. The next feed comes from T position and can go anywhere.'},
      {label:'Racquet Ready on Arrival',detail:'Racquet head above wrist before arriving at the ball, whether front or back court.'},
      {label:'Head Still',detail:'Particularly important on front court shots where the temptation is to look up early for position.'},
    ],
    coachNote:'Watch recovery speed after the front court shot — this is where T-zone return breaks down most. If a player is slow recovering, reduce feed tempo until the recovery pattern is established before increasing pace.',
    constraint:'Drives must land past the service box line. Front court shots landing short of that line lose the point.',
    rld:3,duration:'3 min per set — swap roles',
  },
  {
    id:'p122-4',code:'P4',
    title:'Drives Front and Back with Cross Court',
    subtitle:'Three-option reading — drive, drop or boast return',
    setup:'Coach on service box volley feeds. Feed can be short (front court), deep (back corner) or cross court. Two players rotate. The cross court feed is returned with a boast.',
    task:'Player reads three possible feeds. Drive response to short and deep feeds. Boast response to cross court feed. Recover to T after every shot.',
    focusPoints:[
      {label:'Three-Option Reading',detail:'Coach can feed short, deep or cross court. Player must stay in a balanced ready position that allows movement in any direction.'},
      {label:'Boast on Cross Court',detail:'Cross court feed is returned with a boast — not driven cross court back. This develops diagonal court awareness.'},
      {label:'Racquet Ready Throughout',detail:'Racquet head above wrist between every shot — particularly important when covering three different feed directions.'},
      {label:'T-Zone Recovery',detail:'Three-option exercises are the hardest for T recovery. Recovery must happen before reading the next feed direction.'},
    ],
    coachNote:'Introduce the cross court feed gradually. Run several sets of P3 first to establish the front-back movement pattern, then add the cross court option. Do not mix all three until the player is handling P3 cleanly.',
    constraint:'Boast must reach the front wall via the side wall. Missed boasts that hit the side wall only lose the rally.',
    rld:4,duration:'3 min per set — swap roles',
  },
  {
    id:'p122-5',code:'P5',
    title:'Counter Drop with Drive',
    subtitle:'Drop quality and drive quality — 2-player rotation',
    setup:'Coach drops or boasts from the back court (start with boast to give more time). P1 drops short. P2 counter drops. P1 drives deep. Cycle repeats continuously. 2 minutes then players switch roles.',
    sequence:[
      {label:'Coach',action:'Boast or drop from back court — start with boast'},
      {label:'P1',action:'Drops short to front wall'},
      {label:'P2',action:'Counter drops — tight to the front wall'},
      {label:'P1',action:'Drives deep — full follow through required'},
    ],
    task:'Maintain the drop-counter drop-drive cycle cleanly. P1 is the drop and drive player. P2 is the counter drop player. The coaching focus is the quality of P1 drive after the counter drop exchange.',
    focusPoints:[
      {label:'Quality of the Drive',detail:'The counter drop pattern is the build-up. The coaching target is P1\'s drive after the counter drop. Deep? Tight? Full follow through?'},
      {label:'Stay in the Shot — Drive',detail:'P1 must follow through fully before recovering. Short follow throughs produce half-length drives that give P2 an easy reply.'},
      {label:'Counter Drop Tightness',detail:'P2\'s counter drop must stay tight to the front wall. A loose counter drop gives P1 a mid-court ball that removes the drive challenge.'},
      {label:'T-Zone Recovery After Drive',detail:'P1 drives and must recover to T immediately. Do not watch the drive — the next coach feed follows quickly.'},
    ],
    coachNote:'Start with boast from back so P1 has enough time to organise a quality drop. Progress to drop feed when the pattern is clean. Key observation: P1\'s drive after the counter drop — look for full follow through and back corner landing.',
    constraint:'P1\'s drive must land in the back quarter. Drives landing short lose the point for that cycle.',
    rld:4,duration:'2 min — switch roles — repeat',
  },
  {
    id:'p122-6',code:'P6',
    title:'Counter Drop with Volley Drive',
    subtitle:'Full pressure cycle — volley drive under movement pressure',
    setup:'Same pattern as P5 with one addition: after P1 drives, P2 must volley the drive rather than letting it bounce. The volley drive must go deep. This adds timing and interception pressure to the full cycle.',
    sequence:[
      {label:'Coach',action:'Boast or drop from back court'},
      {label:'P1',action:'Drops short to front wall'},
      {label:'P2',action:'Counter drops — tight to front wall'},
      {label:'P1',action:'Drives deep — full follow through'},
      {label:'P2',action:'Volleys the drive deep — intercept before the bounce'},
    ],
    task:'Maintain the full five-stage cycle. P2 must commit to the volley drive and take the ball before it bounces. The volley drive must land deep. If the ball genuinely cannot be safely volleyed, P2 may drive off the back wall but this scores fewer points.',
    focusPoints:[
      {label:'Volley Drive Commitment',detail:'P2 must commit to the volley before the ball reaches the back wall. Waiting and deciding late means the opportunity is gone. Read P1\'s drive early and move.'},
      {label:'Quiet Eye on Volley',detail:'Volley drives are the highest-pressure contact point in this exercise. Fix gaze on the ball early. Brief visual hold before contact. Do not swing at a general area.'},
      {label:'Racquet Head Above Wrist — Volley',detail:'Racquet must be above wrist before the ball arrives for the volley. Late racquet preparation is the most common cause of poor volley drives.'},
      {label:'Stay in the Shot — All Players',detail:'Every contact in this cycle requires a complete follow through: P1\'s drop, P2\'s counter drop, P1\'s drive, P2\'s volley drive.'},
      {label:'T-Zone Recovery Throughout',detail:'Both players must recover to T after every shot. The cycle breaks down if either player stays watching their own shot.'},
    ],
    coachNote:'Only introduce P6 when P5 is clean. Watch for P2 guessing the volley direction rather than reading P1\'s drive. The volley drive should be a response to information — not anticipation of a habit pattern.',
    constraint:'P2\'s volley drive must land in the back quarter. Volley drives landing short lose the cycle. Successful volley drives from below the service line earn a bonus point.',
    rld:4,duration:'2 min — switch roles — repeat',
  },
];


// ─── TACTICAL PRESSURE MODULE ────────────────────────────────────────────────

const TP_GAMES=[
  {
    id:'tp1',code:'PP1',
    title:'Single Pressure Point',
    purpose:'Recognise',
    purposeFull:'Learn to recognise when a shot has created genuine pressure.',
    rld:4,
    task:'Force your opponent to contact the ball from outside the central corridor once. A Pressure Point is awarded when your shot causes the opponent to contact outside the corridor.',
    scoring:'Win Rally +1 · Pressure Point +1',
    coachMessage:'One Pressure Point shows the player can create pressure. The coaching question is: did you know you had created it, or did it happen by accident?',
    coachQuestions:[
      'What shot moved the opponent outside the corridor?',
      'Did you know you had created pressure before they played the ball?',
      'What position did the pressure point put you in?',
    ],
    characteristics:['Consequences matter','Player must track opponent position','Scoring rewards corridor awareness'],
    rationale:'The simplest form of the game. The player must first learn to recognise when pressure exists before they can learn to sustain or convert it. Many players win rallies without ever creating genuine pressure — this game makes pressure visible and scoreable.',
  },
  {
    id:'tp2',code:'PP2',
    title:'Double Pressure Point',
    purpose:'Sustain',
    purposeFull:'Learn that one good shot is not enough — pressure must be sustained.',
    rld:4,
    task:'Force your opponent outside the corridor on two consecutive contacts. Both contacts must be outside the corridor. If the opponent returns to the corridor between contacts, the sequence resets.',
    scoring:'Win Rally +1 · Double Pressure Point +2',
    coachMessage:'One good shot is not pressure. Pressure is created over consecutive shots. The second shot is harder than the first because the opponent is now aware and trying to recover.',
    coachQuestions:[
      'What did you do after the first pressure point to prevent recovery?',
      'Did you attack too early — before the second pressure point?',
      'How did the opponent try to return to central control?',
    ],
    characteristics:['Requires consecutive pressure','Rewards patience','Punishes premature attack'],
    rationale:'Teaches the critical lesson that most beginners and intermediate players never learn: pressure must be sustained before it becomes opportunity. A single forced shot often produces a difficult but recoverable ball — the second forced shot produces the opening.',
  },
  {
    id:'tp3',code:'PP3',
    title:'Triple Pressure Point',
    purpose:'Build',
    purposeFull:'Understand that pressure accumulates — three consecutive forced contacts creates maximum opportunity.',
    rld:5,
    task:'Force your opponent outside the corridor on three consecutive contacts. The sequence must be unbroken. Each broken sequence resets to zero.',
    scoring:'Win Rally +1 · Triple Pressure Point +3',
    coachMessage:'Pressure often accumulates over several shots. By the third consecutive forced contact the opponent is typically out of position, low on recovery time, and under maximum tactical stress.',
    coachQuestions:[
      'Which of the three shots was the most important — 1st, 2nd or 3rd?',
      'At what point did you know three was achievable?',
      'Where was the space after three consecutive pressure points?',
    ],
    characteristics:['Rewards sustained pressure building','Highest pure pressure score','Develops multi-shot tactical thinking'],
    rationale:'The triple pressure point teaches the full pressure cycle. Most tactical opportunities in squash are created over three or more shots, not one. Players who understand this play longer, more patient rallies and attack from stronger positions.',
  },
  {
    id:'tp4',code:'PP4',
    title:'Pressure Then Finish',
    purpose:'Patient Attack',
    purposeFull:'Prevent premature attacking — pressure must exist before finishing bonuses are available.',
    rld:5,
    task:'Winner bonuses are only unlocked after a Double or Triple Pressure Point has been achieved in that rally. Attack without pressure and the winner scores normally with no bonus.',
    scoring:'Win Rally +1 · Double Pressure Point +2 · Triple Pressure Point +3 · Clean Winner After Pressure +2',
    coachMessage:'Build pressure before finishing. The most common error in competitive squash is attacking from a position of equal or poor pressure. This game makes early attacking tactically expensive.',
    coachQuestions:[
      'Did you attack before pressure existed?',
      'When the pressure point arrived — did you recognise it immediately?',
      'What changed in the rally after the pressure point was established?',
    ],
    characteristics:['Locks winner bonuses behind pressure','Rewards patience and timing','Bridges pressure and attack'],
    rationale:'The game that most directly changes attacking behaviour. Players who consistently attack too early are forced to slow down and create pressure first. The bonus structure makes patient pressure more valuable than rushed winners.',
  },
  {
    id:'tp5',code:'PP5',
    title:'Pressure Conversion',
    purpose:'Convert',
    purposeFull:'Recognise when pressure has become opportunity — and convert it.',
    rld:5,
    task:'Build pressure, recognise the moment it becomes opportunity, and convert. The full scoring system rewards every stage of the pressure cycle.',
    scoring:'Win Rally +1 · Double Pressure Point +2 · Triple Pressure Point +3 · Pressure + Rally Win +3 · Clean Winner After Pressure +2',
    coachMessage:'Pressure without conversion is wasted. Conversion without pressure is lucky. The goal is to build pressure, recognise the moment, and finish with conviction.',
    coachQuestions:[
      'When did pressure become opportunity in that rally?',
      'Did you recognise the opportunity early enough to attack with intent?',
      'How often did you create pressure but fail to convert?',
      'What space opened after the pressure point?',
    ],
    characteristics:['Full pressure-to-win scoring','Rewards the complete tactical cycle','Highest complexity before competition'],
    rationale:'The complete game. Every stage of the tactical pressure cycle is scoreable: creating, sustaining, building and converting. Players who play this game consistently develop a coherent tactical framework that transfers directly to competition.',
  },
  {
    id:'tp6',code:'PP6',
    title:'Match Ball Pressure',
    purpose:'Compete',
    purposeFull:'Transfer the pressure framework into competition. No artificial scoring — coach tracks and analyses.',
    rld:6,
    task:'Play a normal competitive match. No artificial scoring system. The coach tracks pressure creation, pressure conversion, premature attacks and failed conversions. Post-match review uses the data to identify tactical patterns.',
    scoring:'Normal competitive scoring. Coach tracks: Pressure Created · Pressure Converted · Premature Attacks · Failed Conversions',
    coachMessage:'How many rallies were won after pressure? How often did you attack before pressure existed? How often was pressure created but not converted? The answers reveal the tactical pattern.',
    coachQuestions:[
      'How many rallies were won after pressure?',
      'How often did you attack before pressure existed?',
      'How often was pressure created but not converted?',
      'What patterns emerged across the match?',
      'At what score or moment did premature attacks most often occur?',
    ],
    characteristics:['Maximum representativeness','Coach analysis mode','Pressure framework applied to competition'],
    rationale:'The double dot game. Nothing is more representative than competition itself. The coach uses the pressure framework as an analysis lens — the same variable used in match analysis is now used to evaluate training transfer.',
  },
];

const TP_CORRIDOR_ZONES=[
  {id:'T',label:'T Position',inCorridor:true,desc:'Central control. Maximum options.'},
  {id:'mid-front',label:'Mid Front',inCorridor:true,desc:'Slight pressure. Recovery possible.'},
  {id:'mid-back',label:'Mid Back',inCorridor:true,desc:'Slight pressure. Recovery possible.'},
  {id:'front-corner',label:'Front Corner',inCorridor:false,desc:'Outside corridor. Pressure point.'},
  {id:'back-corner',label:'Back Corner',inCorridor:false,desc:'Outside corridor. Pressure point.'},
  {id:'side-wall',label:'Side Wall',inCorridor:false,desc:'Outside corridor. Pressure point.'},
];

function TacticalPressureModule({onAddToSession}){
  const [activeSection,setActiveSection]=useState('games');
  const [activeGame,setActiveGame]=useState(null);
  const [showProjection,setShowProjection]=useState(false);
  const [ppScore,setPpScore]=useState({a:0,b:0,ppA:0,ppB:0});

  const game=TP_GAMES.find(g=>g.id===activeGame);

  const purposeColors={
    'Recognise':'#f97316',
    'Sustain':'#eab308',
    'Build':'#86efac',
    'Patient Attack':'#4ade80',
    'Convert':'#22d3ee',
    'Compete':'#15803d',
  };

  return <div className="tpModule">
    <div className="tpHeader">
      <div className="tpHeaderLeft">
        <div className="categoryTag" style={{background:'#0e7490',marginBottom:'8px',display:'inline-block'}}>Tactical Pressure</div>
        <h2>Pressure Point</h2>
        <p>Central control removed. Pressure created. Opportunity recognised. Converted.</p>
      </div>
    </div>

    <div className="tpDistinction">
      <div className="tpDistCard tpDistPhysical">
        <strong>Pressure Module</strong>
        <p>Physical load under control. Conditioning, fatigue and maintaining quality under high tempo.</p>
      </div>
      <div className="tpDistSeparator">vs</div>
      <div className="tpDistCard tpDistTactical">
        <strong>Tactical Pressure</strong>
        <p>Removing the opponent from central control. Creating, sustaining and converting pressure.</p>
      </div>
    </div>

    <div className="tpNavBar">
      {[{id:'games',label:'Games',emoji:'🎮'},{id:'corridor',label:'The Corridor',emoji:'📐'},{id:'analysis',label:'Match Analysis Link',emoji:'🔍'},{id:'cpf',label:'Challenge Point',emoji:'🎯'}].map(s=>
        <div key={s.id} role="button" tabIndex={0}
          className={activeSection===s.id?'tpNavActive':'tpNavBtn'}
          onClick={()=>{setActiveSection(s.id);setActiveGame(null);}}
          onKeyDown={e=>e.key==='Enter'&&(setActiveSection(s.id),setActiveGame(null))}>
          <span>{s.emoji}</span>{s.label}
        </div>)}
    </div>

    {/* ── GAMES ── */}
    {activeSection==='games'&&<div>
      {!activeGame
        ?<div className="tpGameGrid">
          {TP_GAMES.map(g=><div key={g.id} role="button" tabIndex={0} className="tpGameTile" onClick={()=>setActiveGame(g.id)} onKeyDown={e=>e.key==='Enter'&&setActiveGame(g.id)}>
            <div className="tpGameTileTop">
              <span className="tpGameCode" style={{background:purposeColors[g.purpose]||'#1f5dd0',color:g.rld>=5?'#000':'#fff'}}>{g.code}</span>
              <RLDBadge level={g.rld}/>
            </div>
            <div className="tpPurposePill" style={{background:purposeColors[g.purpose]+'22',borderColor:purposeColors[g.purpose],color:purposeColors[g.purpose]}}>
              {g.purpose}
            </div>
            <strong>{g.title}</strong>
            <span>{g.purposeFull}</span>
          </div>)}
        </div>
        :<div className="tpGameDetail">
          <button type="button" className="secondaryBtn tpBackBtn" onClick={()=>setActiveGame(null)}>{'← All Games'}</button>

          <div className="tpGameDetailHeader">
            <span className="tpGameCodeLg" style={{background:purposeColors[game.purpose]||'#1f5dd0',color:game.rld>=5?'#000':'#fff'}}>{game.code}</span>
            <div>
              <div className="tpPurposePill" style={{background:purposeColors[game.purpose]+'22',borderColor:purposeColors[game.purpose],color:purposeColors[game.purpose],display:'inline-flex',marginBottom:'6px'}}>{game.purpose}</div>
              <h2>{game.title}</h2>
              <RLDBadge level={game.rld} size="lg"/>
            </div>
          </div>

          <div className="tpDetailGrid">
            <div className="tpDetailCard tpDetailTask">
              <strong>Task</strong><p>{game.task}</p>
            </div>
            <div className="tpDetailCard tpDetailScoring">
              <strong>Scoring</strong><p>{game.scoring}</p>
            </div>
            <div className="tpDetailCard tpDetailRationale">
              <strong>Why This Game</strong><p>{game.rationale}</p>
            </div>
            <div className="tpDetailCard tpDetailCharacteristics">
              <strong>Characteristics</strong>
              <ul>{game.characteristics.map(c=><li key={c}>{c}</li>)}</ul>
            </div>
          </div>

          <div className="tpCoachMessage">
            <strong>Key Coaching Message</strong>
            <blockquote>"{game.coachMessage}"</blockquote>
          </div>

          <div className="tpCoachQuestions">
            <strong>Coach Questions</strong>
            <div className="tpQuestionList">
              {game.coachQuestions.map((q,i)=><div key={i} className="tpQuestion">
                <span className="tpQNum">{i+1}</span>
                <p>{q}</p>
              </div>)}
            </div>
          </div>

          <button type="button" className="primaryBtn tpAddBtn"
            onClick={()=>onAddToSession({
              title:game.title,category:'Tactical Pressure',
              task:game.task,scoring:game.scoring,
              rationale:game.rationale,coach:game.coachMessage,
              rld:game.rld,duration:15,
            })}>
            Add to Session
          </button>
        </div>
      }
    </div>}

    {/* ── THE CORRIDOR ── */}
    {activeSection==='corridor'&&<div className="tpCorridorSection">
      <div className="tpCorridorIntro">
        <h2>The Central Corridor</h2>
        <p>The corridor represents central control. It is a measurement tool — not a target zone. The objective is to force the opponent to contact the ball from <strong>outside</strong> the corridor.</p>
        <div className="tpCorridorPrinciple">
          Contacts inside the corridor = opponent retains options.<br/>
          Contacts outside the corridor = Pressure Point.
        </div>
      </div>

      <div className="tpCourtMap">
        <div className="tpCourtLabel">Front Wall</div>
        <div className="tpCourtFloor">
          <div className="tpCourtLeft tpOutsideCorridor">
            <span>Outside</span>
            <small>Pressure Point</small>
          </div>
          <div className="tpCourtCorridor">
            <div className="tpCorridorTop tpOutsideCorridor"><span>Outside</span></div>
            <div className="tpCorridorMid tpInsideCorridor">
              <span>Central Corridor</span>
              <small>T and mid-court</small>
              <div className="tpTMarker">T</div>
            </div>
            <div className="tpCorridorBot tpOutsideCorridor"><span>Outside</span></div>
          </div>
          <div className="tpCourtRight tpOutsideCorridor">
            <span>Outside</span>
            <small>Pressure Point</small>
          </div>
        </div>
        <div className="tpCourtLabel">Back Wall</div>
      </div>

      <div className="tpCorridorNotes">
        <div className="tpCorridorNoteCard tpNoteInside">
          <strong>Inside Corridor — No Pressure Point</strong>
          <ul>
            <li>Opponent retains central control</li>
            <li>Multiple shot options available</li>
            <li>Recovery to T possible</li>
            <li>Attacking opportunities remain open</li>
          </ul>
        </div>
        <div className="tpCorridorNoteCard tpNoteOutside">
          <strong>Outside Corridor — Pressure Point Awarded</strong>
          <ul>
            <li>Central control disrupted</li>
            <li>Shot options reduced</li>
            <li>Recovery to T difficult</li>
            <li>Opponent under tactical stress</li>
          </ul>
        </div>
      </div>
    </div>}

    {/* ── MATCH ANALYSIS LINK ── */}
    {activeSection==='analysis'&&<div className="tpAnalysisSection">
      <div className="tpAnalysisHero">
        <h2>From Match Analysis to Practice Design</h2>
        <p>Pressure Point is a direct bridge between the Checkerboard Match Analysis System and practice design. The same variable used to analyse performance is now used to train it.</p>
        <div className="tpAnalysisPrinciple">
          "The player learns to recognise, create and sustain pressure before attempting to finish the rally."
        </div>
      </div>

      <div className="tpAnalysisGrid">
        <div className="tpAnalysisCard tpAnalysisAnalysis">
          <strong>In Match Analysis</strong>
          <p>The central corridor is used to assess central control during a match. Contacts made from inside the corridor are assessed negatively — the opponent retains options. Contacts made from outside the corridor are assessed positively — central control has been disrupted.</p>
        </div>
        <div className="tpAnalysisCard tpAnalysisPractice">
          <strong>In Practice Design</strong>
          <p>The same corridor variable becomes a scoring mechanism. Players learn to recognise when they have created genuine pressure — not just when they have played a good shot. The Pressure Point reward system makes the corridor tactically significant in every rally.</p>
        </div>
        <div className="tpAnalysisCard tpAnalysisCore">
          <strong>Core Coaching Message</strong>
          <p>Build pressure before finishing. The most common tactical error in competitive squash is attacking from a position of equal or poor pressure. Players who understand the corridor learn to wait for genuine opportunity rather than forcing winners from neutral positions.</p>
        </div>
      </div>

      <div className="tpProgressionFlow">
        <strong>The Pressure Cycle</strong>
        <div className="tpFlowSteps">
          {[
            {label:'Create',desc:'Force opponent outside corridor',color:'#f97316'},
            {label:'Sustain',desc:'Prevent recovery — keep opponent outside',color:'#eab308'},
            {label:'Build',desc:'Three consecutive forced contacts',color:'#86efac'},
            {label:'Recognise',desc:'Identify when pressure has become opportunity',color:'#4ade80'},
            {label:'Convert',desc:'Attack with conviction from a position of pressure',color:'#22d3ee'},
          ].map((s,i)=><div key={s.label} className="tpFlowStep" style={{borderColor:s.color}}>
            <span className="tpFlowNum" style={{background:s.color,color:s.label==='Build'||s.label==='Recognise'?'#000':'#fff'}}>{i+1}</span>
            <div>
              <strong style={{color:s.color}}>{s.label}</strong>
              <p>{s.desc}</p>
            </div>
          </div>)}
        </div>
      </div>
    </div>}

    {/* ── CHALLENGE POINT ── */}
    {activeSection==='cpf'&&<div className="tpCPFSection">
      <div className="tpAnalysisHero">
        <h2>Challenge Point Guide</h2>
        <p>Use the Checkerboard 70% Rule to judge when to progress through the Pressure Point game ladder.</p>
      </div>
      <div className="tpCPFGrid">
        <div className="tpCPFCard tpCPFHard">
          <div className="tpCPFIcon">🔴</div>
          <strong>Below 50% — Reduce Challenge</strong>
          <p>Move back to a simpler Pressure Point game. Reduce to Single Pressure Point only. Check the player understands the corridor concept — visit The Corridor tab.</p>
        </div>
        <div className="tpCPFCard tpCPFOptimal">
          <div className="tpCPFIcon">🟡</div>
          <strong>Around 70% — Stay Here</strong>
          <p>This is the optimal learning zone. The player is creating pressure regularly but not consistently. Adaptation is occurring. Stay at this game level.</p>
        </div>
        <div className="tpCPFCard tpCPFEasy">
          <div className="tpCPFIcon">🟢</div>
          <strong>Above 90% — Increase Challenge</strong>
          <p>Progress to the next Pressure Point game. Add the sustain requirement, then the build requirement, then unlock the finishing bonus. Move toward Match Ball Pressure.</p>
        </div>
      </div>
      <div className="tpCPFPrinciple">
        <strong>Checkerboard Coaching Principle</strong>
        <p>Do not ask: "What is the hardest task?" Ask: "What is the hardest Pressure Point game this player can successfully adapt to?" That is where learning is maximised.</p>
      </div>
    </div>}
  </div>;
}


function PressureModule({setScreen}){
  const [activeTab,setActiveTab]=useState('122');
  const [activeExercise,setActiveExercise]=useState(null);
  const [activeFocus,setActiveFocus]=useState(null);

  const tabs=[
    {id:'122',label:'1-2-2',sub:'Coach + 2 Players'},
    {id:'121',label:'1-2-1',sub:'Coach + 1 Player'},
    {id:'2p',label:'2 Players',sub:'No Coach'},
    {id:'3p',label:'3 Players',sub:'No Coach'},
    {id:'4p',label:'4 Players',sub:'No Coach'},
  ];

  const exercise=PRESSURE_122_EXERCISES.find(e=>e.id===activeExercise);

  return <div className="page pressurePage">
    <div className="pageTop">
      <div><h1>Pressure</h1><p className="mutedText">Session coaching module · Progressive overload through feed frequency and decision complexity</p></div>
      <button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button>
    </div>

    <div className="pressureFocusStrip">
      <span className="pressureFocusLabel">Session Focus Principles</span>
      <div className="pressureFocusBtns">
        {PRESSURE_FOCUS_PRINCIPLES.map(f=><div key={f.id} role="button" tabIndex={0}
          className={activeFocus===f.id?'pressureFocusActive':'pressureFocusBtn'}
          onClick={()=>setActiveFocus(activeFocus===f.id?null:f.id)}
          onKeyDown={e=>e.key==='Enter'&&setActiveFocus(activeFocus===f.id?null:f.id)}>
          {f.label}
        </div>)}
      </div>
      {activeFocus&&(()=>{const f=PRESSURE_FOCUS_PRINCIPLES.find(x=>x.id===activeFocus);return <div className="pressureFocusExpanded">
        <p>{f.desc}</p>
        <div className="pressureFocusCue"><strong>Coach Cue</strong><blockquote>"{f.cue}"</blockquote></div>
      </div>;})()}
    </div>

    <div className="pressureTabBar">
      {tabs.map(t=><div key={t.id} role="button" tabIndex={0}
        className={activeTab===t.id?'pressureTabActive':'pressureTabBtn'}
        onClick={()=>{setActiveTab(t.id);setActiveExercise(null);}}
        onKeyDown={e=>e.key==='Enter'&&(setActiveTab(t.id),setActiveExercise(null))}>
        <strong>{t.label}</strong>
        <span>{t.sub}</span>
      </div>)}
    </div>

    {activeTab==='122'&&<div className="pressureTabContent">
      {!activeExercise
        ?<div>
          <div className="pressureTabIntro">
            <h2>1-2-2 — Coach and Two Players</h2>
            <p>The coach feeds continuously from the service box. Two players rotate through the exercise pattern. The coach controls feed tempo, direction and type. The players focus entirely on movement quality, shot execution and the session focus principles.</p>
            <div className="pressureTabSetup">
              <div className="pressureSetupItem"><strong>Coach position</strong><span>Service box — volley feeds throughout</span></div>
              <div className="pressureSetupItem"><strong>Player rotation</strong><span>P1 plays the shot and recovers to back. P2 steps in, plays the shot, recovers to back.</span></div>
              <div className="pressureSetupItem"><strong>Progression</strong><span>P1 through P6 in order. Only progress when the current exercise is running cleanly.</span></div>
            </div>
          </div>
          <div className="pressureExerciseGrid">
            {PRESSURE_122_EXERCISES.map(ex=><div key={ex.id} role="button" tabIndex={0}
              className="pressureExerciseTile" onClick={()=>setActiveExercise(ex.id)}
              onKeyDown={e=>e.key==='Enter'&&setActiveExercise(ex.id)}>
              <div className="pressureExerciseTileTop">
                <span className="pressureExerciseCode">{ex.code}</span>
                <RLDBadge level={ex.rld}/>
              </div>
              <strong>{ex.title}</strong>
              <span>{ex.subtitle}</span>
              <p className="pressureExerciseDuration">{ex.duration}</p>
            </div>)}
          </div>
        </div>
        :<div className="pressureExerciseDetail">
          <button type="button" className="secondaryBtn pressureBackBtn" onClick={()=>setActiveExercise(null)}>{'← All Exercises'}</button>
          <div className="pressureExerciseHeader">
            <div className="pressureExerciseCodeLg">{exercise.code}</div>
            <div className="pressureExerciseHeaderText">
              <h2>{exercise.title}</h2>
              <p className="pressureExerciseSub">{exercise.subtitle}</p>
              <RLDBadge level={exercise.rld} size="lg"/>
            </div>
          </div>
          <div className="pressureDetailGrid">
            <div className="pressureDetailCard pressureSetupCard">
              <strong>Setup</strong><p>{exercise.setup}</p>
            </div>
            <div className="pressureDetailCard pressureTaskCard">
              <strong>Task</strong><p>{exercise.task}</p>
            </div>
          </div>
          {exercise.sequence&&<div className="pressureSequence">
            <strong>Exercise Sequence</strong>
            <div className="pressureSequenceSteps">
              {exercise.sequence.map((s,i)=><div key={i} className="pressureSequenceStep">
                <span className="pressureSeqLabel">{s.label}</span>
                <span className="pressureSeqArrow">{'→'}</span>
                <p>{s.action}</p>
              </div>)}
            </div>
          </div>}
          <div className="pressureFocusSection">
            <strong>Focus Points</strong>
            <div className="pressureFocusCards">
              {exercise.focusPoints.map(fp=><div key={fp.label} className="pressureFocusCard">
                <strong>{fp.label}</strong><p>{fp.detail}</p>
              </div>)}
            </div>
          </div>
          <div className="pressureCoachNote">
            <strong>Coach Note</strong><p>{exercise.coachNote}</p>
          </div>
          <div className="pressureConstraint">
            <strong>Constraint and Scoring Rule</strong><p>{exercise.constraint}</p>
          </div>
          <div className="pressureDuration">
            <strong>Duration</strong><span>{exercise.duration}</span>
          </div>
        </div>
      }
    </div>}

    {['121','2p','3p','4p'].includes(activeTab)&&<div className="pressureComingSoon">
      <div className="pressureComingSoonCard">
        <span className="categoryTag" style={{background:'#1f5dd0',marginBottom:'10px',display:'inline-block'}}>
          {tabs.find(t=>t.id===activeTab)?.label} — {tabs.find(t=>t.id===activeTab)?.sub}
        </span>
        <h2>{tabs.find(t=>t.id===activeTab)?.label} Exercises</h2>
        <p>This module is in development. Establish the 1-2-2 exercises in your coaching practice first — they form the foundation for all other pressure formats. The {tabs.find(t=>t.id===activeTab)?.label} exercises will be added here in the next build.</p>
      </div>
    </div>}
  </div>;
}


function ToolsArchitecture({setScreen}){
  const [activeSection,setActiveSection]=useState('quickfix');
  const [qfCategory,setQfCategory]=useState(null);
  const [qfProblem,setQfProblem]=useState(null);
  const [toolDetail,setToolDetail]=useState(null);

  const sections=[
    {id:'quickfix',label:'⚡ Quick Fix',emoji:'⚡'},
    {id:'coordination',label:'Coordination',emoji:'🤝'},
    {id:'balance',label:'Balance',emoji:'⚖'},
    {id:'visual',label:'Visual',emoji:'👁'},
    {id:'rhythm',label:'Rhythm',emoji:'🎵'},
    {id:'constraint',label:'Constraint',emoji:'🔧'},
    {id:'scaling',label:'Scaling',emoji:'📏'},
    {id:'analogy',label:'Analogy',emoji:'💡'},
    {id:'principles',label:'Principles',emoji:'📋'},
  ];

  // ── QUICK FIX DATA ──────────────────────────────────────────────
  const qfCategories=[
    {id:'preparation',label:'Preparation',emoji:'⏱',problems:['Late Preparation','Racquet Not Ready','Watching Ball Too Late','No Split Step']},
    {id:'spacing',label:'Spacing',emoji:'📐',problems:['Poor Contact Distance','Too Close to Ball','Too Far from Ball','No Lunge']},
    {id:'balance',label:'Balance & Recovery',emoji:'⚖',problems:['Falling Away After Strike','Poor Recovery to T','Non-Playing Arm Crossing','Rotational Instability']},
    {id:'swing',label:'Swing & Contact',emoji:'🎾',problems:['Wrist Breakdown','Excessive Backswing','Flat-Footed Striking','Over-Hitting','Wristy Contact']},
    {id:'movement',label:'Movement',emoji:'🏃',problems:['Flat Footed','Not Reaching Ball','Slow First Move','Poor Court Coverage']},
    {id:'tension',label:'Tension & Rhythm',emoji:'😤',problems:['Tight Grip','Tense Shoulders','Rushing','Loss of Flow']},
    {id:'visual',label:'Visual & Tracking',emoji:'👁',problems:['Visual Tracking Issues','Misjudged Bounce','Poor Anticipation','Late Information Pickup']},
    {id:'tactical',label:'Tactical',emoji:'🧠',problems:['Hitting to Opponent','No Length','No Variation','Poor Court Awareness']},
  ];

  const qfInterventions={
    'Late Preparation':{cause:'Information pickup delay — player is watching the ball too late or from a poor position.',constraint:'Two Coloured Racquet. Player must call the colour as the ball leaves the opponent racquet.',tool:'Visual Tracking Task — TAU-4 or TAU-5 feed source activity.',activity:'Coach feeds to alternate sides. Player must call the feed side before moving. No move without a call.',progression:'Reduce call to a hand signal. Then fade the call. Add rally pressure.',levels:'All levels'},
    'Racquet Not Ready':{cause:'Sequential movement pattern — player organises movement before racquet preparation.',constraint:'Racquet must be at backswing height when the player arrives. Check position on arrival, not at contact.',tool:'Arrival constraint: place a target cone at the ideal arrival position. Racquet must be ready when foot hits the cone.',activity:'Coach feeds. Player must tap cone with foot AND have racquet ready simultaneously.',progression:'Remove cone. Add movement recovery. Add rally context.',levels:'Level 1–4'},
    'Watching Ball Too Late':{cause:'Attention on body movement rather than information sources.',constraint:'Two Coloured Racquet — player calls colour of hitting face before player strikes.',tool:'Quiet Eye Task. Player tracks ball from opponent racquet through the flight path.',activity:'Stand-and-watch drill. Player does not move or strike — only tracks and calls each ball.',progression:'Add a strike. Add movement. Add rally.',levels:'All levels'},
    'No Split Step':{cause:'Pre-programmed movement — player decides direction before reading opponent.',constraint:'Stop-and-start constraint: player must pause at T between every shot.',tool:'Rhythm cue: coach claps or calls "T" each time player should split step.',activity:'Feed and recover. Coach feeds. Player strikes, recovers to T, pauses visibly, then moves to next feed.',progression:'Reduce pause. Use rhythm cue only. Fade to natural movement.',levels:'Level 1–3'},
    'Poor Contact Distance':{cause:'Player has not learned functional spacing through movement experience.',constraint:'Arrive and Strike (0G). Player must lunge to the ball — contact made on lunge arrival.',tool:'Lunge Gate: place a cone at ideal contact distance. Player must arrive with lunge reaching the cone.',activity:'Coach feeds. Player moves and lunges to each ball. Coach observes contact position.',progression:'Remove cone. Add directional variation. Add live rally entry.',levels:'Level 0–2'},
    'Too Close to Ball':{cause:'Player stops movement too early or positions body too close to expected contact point.',constraint:'Extend the feed. Coach feeds slightly wider and deeper to force a longer movement arc.',tool:'Ball size reduction: smaller ball creates a smaller contact zone and requires more precise arrival.',activity:'Feed to extended positions. Player must fully extend lunge to reach the ball.',progression:'Vary feed distance. Add backhand. Add live feeds.',levels:'Level 0–3'},
    'Too Far from Ball':{cause:'Player overshoots or positions body outside functional contact distance.',constraint:'Reduce feed distance. Coach feeds to tighter positions to reduce movement arc required.',tool:'Target marker: place a small cone at ideal contact distance. Player aims to arrive with lunge at the marker.',activity:'Short feed drill. Player must make clean contact without overextending.',progression:'Vary positions. Add movement. Add live rally.',levels:'Level 0–3'},
    'No Lunge':{cause:'Movement pattern does not include a final arrival step.',constraint:'Arrive and Strike (0G): feed requires a lunge to reach. Cannot be reached without lunging.',tool:'Coach cue: "Find the ball with your lunge." Avoid "Move away from the ball."',activity:'Wide feeds to both sides. Player must lunge to reach every ball.',progression:'Add alternating sides. Increase feed distance. Live rally entry.',levels:'Level 0–2'},
    'Falling Away After Strike':{cause:'Player unweighting from strike position — often linked to poor lunge mechanics.',constraint:'Side-Wall Ball Return Tool: player releases a ball from the non-playing hand after follow-through. Ball should roll straight back, not away from wall.',tool:'Second Racquet Counterbalance: player holds an object in non-playing hand to balance the swing.',activity:'Strike and hold: player must hold the strike position for one second after contact.',progression:'Reduce hold time. Add movement recovery. Live rally.',levels:'Level 0–3'},
    'Poor Recovery to T':{cause:'Player stays watching their shot rather than moving immediately.',constraint:'Recovery cone: place a cone at the T. Player must touch the cone after every shot.',tool:'Elastic Band analogy: player imagines an elastic band connecting them to the T that pulls them back immediately.',activity:'Feed and touch drill. Player strikes and must touch T cone before next feed arrives.',progression:'Remove cone. Add faster feeds. Live rally recovery.',levels:'Level 1–4'},
    'Non-Playing Arm Crossing':{cause:'Sequential movement pattern — non-playing arm pulled into body through swing.',constraint:'Second Racquet Counterbalance: object in non-playing hand prevents crossing.',tool:'Eagle Wings analogy: non-playing arm spreads outward like a wing at contact.',activity:'Static swing drill with second racquet. Feed ball with constraint active.',progression:'Fade second racquet. Use analogy cue only. Live rally.',levels:'Level 0–3'},
    'Rotational Instability':{cause:'Insufficient non-playing arm counterbalance and weak lunge base.',constraint:'Strike and hold: player holds balanced position after each strike for one count.',tool:'Eagle Wings analogy. Second Racquet Counterbalance.',activity:'Wide lunge feeds. Player must arrive, strike, and hold balanced position.',progression:'Add movement. Reduce hold. Live rally constraint.',levels:'Level 0–3'},
    'Wrist Breakdown':{cause:'Grip weakness or sequential wrist action at contact.',constraint:'Happy Smiley Face: draw a face on the palm. Player must maintain face visibility at follow-through.',tool:'Hand to Forearm Tape: immediate haptic feedback when wrist collapses.',activity:'Wall chipping with smiley face visible. Check face position at follow-through.',progression:'Remove visual cue. Use tape only. Fade tape. Live rally.',levels:'Level 0–2'},
    'Excessive Backswing':{cause:'Over-preparation habit or timing compensation for late preparation.',constraint:'Wall Swing Constraint: player stands close to side wall. Excessive backswing contacts the wall.',tool:'Compact swing cue: "Racquet to cheek height — no higher."',activity:'Side-wall proximity drill. Feed ball with wall close behind player.',progression:'Increase feed pace. Move away from wall gradually. Live rally.',levels:'Level 0–4'},
    'Flat-Footed Striking':{cause:'Weight not transferring through the strike. Static base at contact.',constraint:'Forward weight transfer constraint: player must step through the shot. Foot must land before contact.',tool:'Skimming Stones analogy: throwing action requires forward weight transfer.',activity:'Step-and-strike drill. Coach feeds. Player must step forward onto lunge foot before contact.',progression:'Add movement. Increase feed pace. Live rally.',levels:'Level 1–4'},
    'Over-Hitting':{cause:'Force regulation issue — player using maximum force regardless of court position or tactical need.',constraint:'Scoring constraint: points only count for shots landing in target zone. Hitting hard loses the point.',tool:'Scaling down: reduce court size or introduce a low target zone on the front wall.',activity:'Target zone game. All shots must land in a defined zone. Hard shots that miss lose a point.',progression:'Increase zone difficulty. Add opponent. Live competitive game.',levels:'Level 1–5'},
    'Wristy Contact':{cause:'Wrist leading the swing rather than elbow-led preparation.',constraint:'Hand to Forearm Tape: immediate feedback when wrist breaks through impact zone.',tool:'Happy Smiley Face on palm. Whip analogy: handle leads, tip follows.',activity:'Wall chipping with tape and smiley face. Focus on elbow-led preparation.',progression:'Remove tape. Add feeds. Live rally.',levels:'Level 0–3'},
    'Flat Footed':{cause:'No reactive movement base — player waiting in static position.',constraint:'Split Step cue: coach calls or claps to trigger reactive step before each feed.',tool:'Rhythm tool: waltz tempo encourages continuous weight shifting.',activity:'Anticipation drill: player on toes throughout. Coach varies feed direction unpredictably.',progression:'Remove external cue. Add rally pace. Live competitive play.',levels:'Level 1–4'},
    'Not Reaching Ball':{cause:'Movement initiation delayed or movement direction wrong.',constraint:'Feed source constraint: coach feeds from different positions to force varied movement solutions.',tool:'Two Coloured Racquet: player must read feed side before moving.',activity:'Early call drill: player calls side before moving. No call = no move.',progression:'Reduce call requirement. Add movement recovery. Live rally.',levels:'Level 1–3'},
    'Slow First Move':{cause:'Reaction delay — player not reading information early enough.',constraint:'TAU-4 or TAU-5 feed tracking activity. Player must move before ball reaches halfway.',tool:'Visual constraint: Two Coloured Racquet colour call before movement.',activity:'Early move drill. Feed varies. Player must initiate movement before ball crosses service line.',progression:'Add direction variation. Reduce latency threshold. Live rally.',levels:'Level 1–4'},
    'Poor Court Coverage':{cause:'Pattern-based movement — player moving to habitual positions rather than reading opponent.',constraint:'Random feed drill: no two consecutive feeds to same position.',tool:'Recovery cone: player must touch T between every shot.',activity:'Five-position drill. Coach feeds to five different positions in random order. Player recovers to T between each.',progression:'Increase feed pace. Add opponent. Live competitive game.',levels:'Level 2–5'},
    'Tight Grip':{cause:'Anxiety or over-effort response.',constraint:'Grip looseness cue: "Hold a baby bird — firm enough to hold it, gentle enough not to hurt it."',tool:'Waltz Rhythm Tool: slow waltz tempo reduces tension throughout movement.',activity:'Chip and talk: player maintains conversation while chipping. Talking prevents breath-holding and tension.',progression:'Add movement. Increase pace. Live rally with rhythm constraint.',levels:'All levels'},
    'Tense Shoulders':{cause:'Over-effort or anxiety. Often linked to grip tension.',constraint:'Blue Danube Waltz constraint: music shapes relaxed movement rhythm without instruction.',tool:'Drop-shoulder cue before every feed. "Shake hands — drop shoulders — play."',activity:'Rhythm warm-up: Blue Danube playing, players move and rally with no coaching input.',progression:'Fade music. Player learns to self-regulate. Live rally.',levels:'All levels'},
    'Rushing':{cause:'Temporal pressure response — player perceiving insufficient time.',constraint:'Blue Danube Tempo constraint: slow waltz rhythm forces reduction in movement pace.',tool:'Scaling: reduce feed pace or use larger ball to increase available time.',activity:'Slow-motion rally: all shots hit at 50% pace. Only gentle, deliberate contacts count.',progression:'Gradually increase pace. Add normal ball. Live rally.',levels:'Level 0–3'},
    'Loss of Flow':{cause:'Disrupted perception-action coupling — often after error or pressure.',constraint:'Waltz Rhythm Tool: re-establish movement rhythm through music constraint.',tool:'Reset routine: one breath, one bounce of ball, return to movement.',activity:'Rhythm reset drill: three cooperative rallies at walking pace to re-establish coupling.',progression:'Return to competitive pace. Monitor for loss of flow under pressure.',levels:'All levels'},
    'Visual Tracking Issues':{cause:'Information pickup from incorrect source or insufficient time to track.',constraint:'TAU-1 Large Ball Tracking: player tracks large ball with no striking requirement.',tool:'Feed source constraint: begin with self-drop, progress to coach feed, wall rebound.',activity:'Watch-and-point drill: player points at ball throughout flight without striking. Coach observes gaze.',progression:'Add strike. Reduce ball size. Add movement. Live rally.',levels:'Level 0–2'},
    'Misjudged Bounce':{cause:'Incomplete perceptual attunement to ball flight and wall rebound.',constraint:'TAU-5 Front Wall Tracking: player practices wall rebound prediction before adding movement.',tool:'Variable ball constraint: mix ball sizes to prevent fixed bounce timing solution.',activity:'Bounce prediction drill: player calls "now" when they expect ball to bounce. Coach compares to actual bounce.',progression:'Add movement. Reduce ball size. Live rally.',levels:'Level 0–2'},
    'Poor Anticipation':{cause:'Player reading ball rather than opponent information sources.',constraint:'Two Coloured Racquet: player must read feed side from opponent body, not ball.',tool:'Quiet Eye Task: coach guides attention to shoulder and trunk cues.',activity:'Screen drill: ball hidden briefly at start of feed. Player must move based on body cues only.',progression:'Increase screen time. Add deception. Live competitive rally.',levels:'Level 2–5'},
    'Late Information Pickup':{cause:'Attention fixated on ball arrival rather than earlier body cues.',constraint:'Two Coloured Racquet: call colour before ball leaves opponent racquet.',tool:'Information & Anticipation module: opponent cue source activities.',activity:'Shoulder-first drill: player reads opponent shoulder turn as the primary movement cue.',progression:'Add trunk and hip cues. Live competitive rally.',levels:'Level 2–5'},
    'Hitting to Opponent':{cause:'Habitual cross-court hitting or lack of court awareness.',constraint:'Scoring constraint: points only for shots that move opponent. Hitting to opponent scores zero.',tool:'Court awareness task: player must verbalise opponent position before striking.',activity:'Call-and-hit drill: player calls "opponent left" or "opponent right" before every shot.',progression:'Add scoring. Make tactical decision implicit. Live competitive game.',levels:'Level 2–5'},
    'No Length':{cause:'Force regulation issue or tactical habit of early attack.',constraint:'Length Before Attack constraint: all shots must pass the service box before an attack is valid.',tool:'Target zone: mark short-line area. Points only for shots landing past the line.',activity:'Length game: points awarded only for shots landing in back quarter of court.',progression:'Add opponent pressure. Live conditioned game. Remove constraint.',levels:'Level 2–4'},
    'No Variation':{cause:'Predictable pattern formation — player locked into a single tactical solution.',constraint:'Route Breaker constraint: no two consecutive shots to the same position.',tool:'Checkerboard challenge: player must complete a pair challenge before each attack.',activity:'Checkerboard Pair Challenge game. Player earns right to attack only after completing the pair.',progression:'Add Triple Challenge. Increase pace. Live competitive game.',levels:'Level 2–5'},
    'Poor Court Awareness':{cause:'Attention focused on ball and own action — insufficient opponent and court awareness.',constraint:'Call-and-move: player must call opponent position before every shot.',tool:'Checkerboard system: spatial awareness built into task design.',activity:'Two-touch awareness drill: after each shot player looks to opponent T position before next ball.',progression:'Add movement. Reduce call requirement. Live competitive game.',levels:'Level 2–5'},
  };

  // ── TOOL LIBRARY DATA ───────────────────────────────────────────
  const toolLibrary={
    coordination:[
      {name:'Happy Smiley Face',does:'Draw a smiley face on the player palm. The face must remain visible at follow-through.',why:'Creates an external focus on wrist position without body instruction. The face is the reference, not the wrist.',apply:'Marker pen on palm. Player chips or strikes with face visible. Coach calls if face disappears.',remove:'When wrist position is consistent without the visual cue.',problems:['Wrist Breakdown','Wristy Contact'],levels:'Level 0–2'},
      {name:'Hand to Forearm Tape',does:'Tape a short strip from the back of the hand to the forearm. Tape pulls when wrist collapses.',why:'Immediate haptic feedback at the moment of breakdown — no verbal instruction needed.',apply:'Small strip of sports tape. Active in chipping and live feeds.',remove:'Fade by cutting tape thinner. Remove when self-regulation is established.',problems:['Wrist Breakdown','Wristy Contact'],levels:'Level 0–3'},
      {name:'Dog Buzzer',does:'A small vibrating device attached to the body that activates when a target behaviour occurs.',why:'Provides immediate non-verbal feedback without disrupting the movement flow.',apply:'Attach to wrist or forearm. Set threshold for target movement.',remove:'Fade frequency. Remove when player self-regulates.',problems:['Wrist Breakdown','Flat-Footed Striking'],levels:'Level 1–5'},
      {name:'Two Hand Starts',does:'Player starts each rally with both hands on the racquet. Releases non-playing hand before striking.',why:'Forces non-playing arm to play an active role in preparation before the release.',apply:'Both hands on grip at T position. Release non-playing hand on movement initiation.',remove:'When non-playing arm becomes naturally active.',problems:['Non-Playing Arm Crossing','Rotational Instability'],levels:'Level 0–2'},
      {name:'Split Step Rhythm',does:'Coach claps or calls at the moment player should split step. Player responds to the cue.',why:'External rhythm cue builds reactive movement timing before it becomes self-generated.',apply:'Coach observes and claps at opponent contact moment. Player reacts.',remove:'Fade clap to hand signal to silence.',problems:['No Split Step','Flat Footed'],levels:'Level 1–3'},
    ],
    balance:[
      {name:'Side-Wall Ball Return',does:'Player holds a second ball in the non-playing hand. Releases it at follow-through — it should hit the side wall and return straight back.',why:'The return path reveals whether the player has moved away from or into the shot. Objective feedback.',apply:'Player holds spare ball in non-playing hand. Release at end of follow-through.',remove:'When follow-through consistently produces a straight return.',problems:['Falling Away After Strike','Non-Playing Arm Crossing'],levels:'Level 0–3'},
      {name:'Second Racquet Counterbalance',does:'Player holds a second racquet or object in the non-playing hand throughout the shot.',why:'Forces non-playing arm outward, preventing crossing. Creates natural counterbalance.',apply:'Use a spare racquet, foam roller section, or similar object.',remove:'Fade to holding nothing. Monitor for regression.',problems:['Non-Playing Arm Crossing','Rotational Instability','Falling Away After Strike'],levels:'Level 0–3'},
      {name:'Reach and Recover',does:'Player must reach a target cone with each lunge and return to a recovery cone immediately after.',why:'Creates a movement constraint that forces both the lunge extension and the recovery without instruction.',apply:'Two cones. Strike cone and recovery cone. Player must touch both.',remove:'Remove cones. Use mental image only.',problems:['Falling Away After Strike','Poor Recovery to T'],levels:'Level 1–3'},
      {name:'Lunge Hold',does:'Player holds the lunge position for one count after contact before recovering.',why:'Addresses premature weight transfer and falling away by building a stable contact base.',apply:'Coach counts "one" after each contact. Player holds until the count.',remove:'Reduce count. Fade to natural recovery.',problems:['Falling Away After Strike','Flat-Footed Striking'],levels:'Level 0–2'},
    ],
    visual:[
      {name:'Two Coloured Racquet',does:'Two colours on the hitting face. Player calls the colour as opponent strikes.',why:'Forces attention to the information source before the ball leaves the opponent racquet.',apply:'Tape two colours to racquet face halves. Player calls colour on every opponent shot.',remove:'Fade call frequency. Use randomly. Remove when preparation timing improves.',problems:['Late Preparation','Watching Ball Too Late','Poor Anticipation','Late Information Pickup'],levels:'Level 0–4'},
      {name:'Ball Tracking Tasks',does:'Player tracks ball flight without striking. Focus only on watching the ball.',why:'Isolates the perceptual task from the motor task. Allows coach to observe tracking quality.',apply:'TAU-1 to TAU-7 progression. Start with large ball, build to yellow ball with movement.',remove:'When tracking is consistent, integrate with striking.',problems:['Visual Tracking Issues','Misjudged Bounce'],levels:'Level 0–2'},
      {name:'Quiet Eye Task',does:'Player holds gaze on the contact point before and through the strike.',why:'Extends the quiet eye period — the final gaze fixation associated with skilled striking.',apply:'Player consciously holds gaze at contact point for one count after striking.',remove:'Fade the conscious hold. Monitor for maintained fixation in live play.',problems:['Watching Ball Too Late','Poor Contact','Late Preparation'],levels:'Level 1–4'},
      {name:'Occlusion Activities',does:'Ball is briefly hidden at key moment — player must move based on body cues rather than ball flight.',why:'Forces use of earlier information sources: opponent body, racquet preparation, shoulder turn.',apply:'Coach or screen briefly hides ball at opponent contact. Player commits before seeing ball.',remove:'Reduce occlusion duration. Move to full rally.',problems:['Poor Anticipation','Late Information Pickup'],levels:'Level 2–5'},
      {name:'Feed Source Manipulation',does:'Coach systematically varies feed source — self-drop, hand feed, wall feed, racquet feed.',why:'Prevents over-adaptation to one perceptual condition. Builds adaptable timing.',apply:'TAU-4 to TAU-7 protocol. Vary source within each session.',remove:'When timing is adaptable across all sources.',problems:['Visual Tracking Issues','Misjudged Bounce','Late Preparation'],levels:'Level 0–3'},
    ],
    rhythm:[
      {name:'Blue Danube Constraint',does:'Play Blue Danube Waltz during the activity. No instruction about rhythm.',why:'3/4 waltz timing creates an attractor state for movement rhythm. Players synchronise without instruction.',apply:'Play from Level 0 Blue Danube module. Start before activity. Do not mention rhythm.',remove:'Fade volume. Play intermittently. Remove when rhythm is self-sustaining.',problems:['Rushing','Tight Grip','Tense Shoulders','Loss of Flow'],levels:'Level 0–5'},
      {name:'Waltz Rhythm Count',does:'Coach counts 1-2-3 at waltz tempo throughout the activity.',why:'External tempo reference organises movement rhythm without body instruction.',apply:'Coach counts aloud. Player moves in time. Adjust tempo to player need.',remove:'Fade count to hand gesture to silence.',problems:['Rushing','Loss of Flow','Tension'],levels:'Level 0–3'},
      {name:'Movement Tempo Tasks',does:'Player is instructed to move at a specific tempo — slower, normal, or faster.',why:'Adjusting movement tempo reveals whether timing breakdown is from rushing or from slowness.',apply:'Slow: 50% pace. Normal: standard. Fast: increase pace incrementally.',remove:'Return to normal tempo. Monitor for retention.',problems:['Rushing','Flat Footed','Slow First Move'],levels:'All levels'},
    ],
    constraint:[
      {name:'Wall Swing Constraint',does:'Player stands very close to the side wall. Excessive backswing touches the wall.',why:'The wall provides immediate environmental feedback — no verbal instruction needed.',apply:'Player stands 20-30cm from side wall. Feed ball. Player swings without touching wall.',remove:'Increase distance from wall gradually. Live rally.',problems:['Excessive Backswing'],levels:'Level 0–5'},
      {name:'Foam Roller Constraint',does:'Foam roller placed at the target backswing position. Player must not knock it over.',why:'External spatial reference for backswing limit. Object focus rather than body instruction.',apply:'Place foam roller at appropriate position. Feed ball.',remove:'Remove roller. Use mental image.',problems:['Excessive Backswing'],levels:'Level 0–3'},
      {name:'Contact Gates',does:'Two cones placed to mark ideal contact zone. Player must strike between the cones.',why:'Defines the contact window spatially without body instruction.',apply:'Place cones at either side of ideal contact zone. Feed ball.',remove:'Remove cones when contact zone is consistent.',problems:['Poor Contact Distance','Flat-Footed Striking'],levels:'Level 0–3'},
      {name:'Target Gates',does:'Target zone on wall or floor. Shots must pass through or land in the zone.',why:'Defines the required outcome. Player self-organises to achieve it.',apply:'Mark target with tape. Add scoring — points only in zone.',remove:'Reduce zone size. Remove marking. Live rally.',problems:['No Length','No Variation','Over-Hitting'],levels:'Level 1–5'},
      {name:'Recovery Gates',does:'Cone or marker at T position. Player must touch it after every shot.',why:'Creates a movement constraint that forces recovery without verbal instruction.',apply:'Place cone at T. Player must physically touch it after each shot.',remove:'Remove cone. Use verbal reminder. Fade reminder.',problems:['Poor Recovery to T','Poor Court Coverage'],levels:'Level 1–4'},
    ],
    scaling:[
      {name:'Ball Size Scaling',does:'Adjust ball size to change the perceptual and timing challenge.',why:'Larger balls provide more information and more time. Smaller balls increase challenge.',apply:'Foam → Red → Orange → Green → Yellow. Move up or down based on success rate.',remove:'When player achieves >80% success at current level.',problems:['Visual Tracking Issues','Poor Contact Distance','Misjudged Bounce'],levels:'Level 0–3'},
      {name:'Feed Speed Scaling',does:'Adjust feed pace to change available time.',why:'Slower feeds give more time for perception and movement organisation.',apply:'Start at 50% pace. Increase in 10% increments on success.',remove:'When player succeeds at full match pace.',problems:['Late Preparation','Rushing','Slow First Move'],levels:'All levels'},
      {name:'Court Size Scaling',does:'Use tape to reduce the court size. Players rally in a smaller space.',why:'Shorter distances reduce movement demand and increase rally sustainability.',apply:'Tape lines for reduced court. Rally within the taped area.',remove:'Expand court incrementally back to full size.',problems:['Poor Court Coverage','Not Reaching Ball'],levels:'Level 0–2'},
      {name:'Distance Scaling',does:'Adjust the distance between player and ball source.',why:'Shorter distances give more time and reduce movement demand.',apply:'Start close. Move back in small steps after success.',remove:'Full court distance achieved.',problems:['Late Preparation','Not Reaching Ball','No Lunge'],levels:'Level 0–3'},
    ],
    analogy:[
      {name:'Whip',does:'The racquet is the tip of a whip. The handle starts, the tip follows.',why:'Encourages sequential elbow-wrist-racquet movement rather than simultaneous body turning.',apply:'Demonstrate a whipping motion. Ask player to replicate with racquet.',use:'Wrist breakdown, wristy contact, over-rotation.',problems:['Wrist Breakdown','Wristy Contact'],levels:'Level 1–4'},
      {name:'Bow and Arrow',does:'Non-playing arm stretches away like pulling a bow. Racquet arm is the arrow.',why:'Creates external focus on non-playing arm extension and body tension before release.',apply:'Ask player to feel the stretch before each shot.',use:'Non-playing arm crossing, rotational instability.',problems:['Non-Playing Arm Crossing','Rotational Instability'],levels:'Level 1–3'},
      {name:'Skimming Stones',does:'Throwing action for a forehand — elbow leads, wrist snaps, weight transfers forward.',why:'External movement analogy for elbow-led forehand. No body instruction.',apply:'Player performs throwing motion first. Then apply to forehand.',use:'Flat-footed striking, excessive rotation, wrist collapse.',problems:['Flat-Footed Striking','Wrist Breakdown'],levels:'Level 0–3'},
      {name:'Eagle Wings',does:'Non-playing arm spreads wide like an eagle wing at contact.',why:'Creates external focus for non-playing arm position. Prevents crossing.',apply:'"Spread your wings as you strike." No arm position instruction.',use:'Non-playing arm crossing, falling away, rotational instability.',problems:['Non-Playing Arm Crossing','Falling Away After Strike'],levels:'Level 0–2'},
      {name:'Paintbrush',does:'Racquet paints the wall target. The shot is the brushstroke.',why:'External focus on the target rather than the swing. Accuracy and touch.',apply:'Ask player to paint the target zone. Where does the brush go?',use:'Over-hitting, poor length, lack of touch.',problems:['Over-Hitting','No Length'],levels:'Level 1–4'},
      {name:'Throwing a Frisbee',does:'Forehand swing shape matches the frisbee release action — flat, extended, forward.',why:'Natural movement analogy. Most players can throw a frisbee correctly.',apply:'Player demonstrates frisbee throw. Coach connects to forehand shape.',use:'Excessive backswing, wrist breakdown, flat-footed striking.',problems:['Excessive Backswing','Flat-Footed Striking'],levels:'Level 0–3'},
    ],
  };

  const allProblems=qfCategories.flatMap(c=>c.problems);
  const currentIntervention=qfProblem?qfInterventions[qfProblem]:null;

  function ToolCard({tool}){
    const [open,setOpen]=useState(false);
    return <div className={'toolCard'+(open?' toolCardOpen':'')}>
      <button type="button" className="toolCardHeader" onClick={()=>setOpen(!open)}>
        <strong>{tool.name}</strong>
        <span className="toolCardLevels">{tool.levels}</span>
        <span className="toolCardChevron">{open?'▲':'▼'}</span>
      </button>
      {open&&<div className="toolCardBody">
        <div className="toolCardSection tcDoes"><strong>What It Does</strong><p>{tool.does}</p></div>
        <div className="toolCardSection tcWhy"><strong>Why It Works</strong><p>{tool.why}</p></div>
        <div className="toolCardSection"><strong>How to Apply</strong><p>{tool.apply}</p></div>
        <div className="toolCardSection tcRemove"><strong>When to Remove</strong><p>{tool.remove}</p></div>
        {tool.problems&&<div className="toolCardSection"><strong>Problems Addressed</strong><div className="toolProblemTags">{tool.problems.map(p=><button key={p} type="button" className="toolProblemTag" onClick={()=>{setQfProblem(p);setActiveSection('quickfix');}}>{p}</button>)}</div></div>}
      </div>}
    </div>;
  }

  return <div className="page toolsPage">
    <div className="pageTop">
      <div><h1>Tools</h1><p className="mutedText">Quick Fix Intervention System · Constraint before correction</p></div>
      <button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button>
    </div>

    <div className="toolsSectionNav">
      {sections.map(s=><button key={s.id} type="button"
        className={activeSection===s.id?'toolsSectionActive':'toolsSectionBtn'}
        onClick={()=>setActiveSection(s.id)}>
        <span>{s.emoji}</span>{s.label}
      </button>)}
    </div>

    {/* ── QUICK FIX SELECTOR ── */}
    {activeSection==='quickfix'&&<div className="qfSection">
      {!qfProblem&&<div className="qfIntro">
        <div className="qfHero">
          <h2>Quick Fix Selector</h2>
          <span className="qfHeroSub">Instant courtside interventions</span>
          <p>Tap a category to see specific problems. Tap a problem for the instant 5-step intervention card — cause, constraint, tool, activity and progression.</p>
        </div>
        {!qfCategory
          ?<div className="qfCategoryGrid">
            {qfCategories.map(cat=><button key={cat.id} type="button" className={'qfCategoryBtn qfCat-'+cat.id} onClick={()=>setQfCategory(cat.id)}>
              <span>{cat.emoji}</span>
              <strong>{cat.label}</strong>
              <span className="qfCatCount">{cat.problems.length} problems</span>
            </button>)}
          </div>
          :<div className="qfProblemList">
            <div className="qfProblemListHeader">
              <button type="button" className="secondaryBtn" onClick={()=>setQfCategory(null)}>← Back</button>
              <strong>{qfCategories.find(c=>c.id===qfCategory)?.emoji} {qfCategories.find(c=>c.id===qfCategory)?.label}</strong>
            </div>
            <div className="qfProblemGrid">
              {qfCategories.find(c=>c.id===qfCategory)?.problems.map(prob=><button key={prob} type="button" className="qfProblemBtn" onClick={()=>setQfProblem(prob)}>
                {prob}
              </button>)}
            </div>
          </div>
        }
      </div>}

      {qfProblem&&currentIntervention&&<div className="qfInterventionCard">
        <div className="qfInterventionHeader">
          <button type="button" className="secondaryBtn" onClick={()=>setQfProblem(null)}>← Back</button>
          <h2>{qfProblem}</h2>
          <span className="qfLevelTag">{currentIntervention.levels}</span>
        </div>
        <div className="qfInterventionGrid">
          <div className="qfBlock qfCause"><strong>1 — Likely Cause</strong><p>{currentIntervention.cause}</p></div>
          <div className="qfBlock qfConstraint"><strong>2 — Best Constraint</strong><p>{currentIntervention.constraint}</p></div>
          <div className="qfBlock qfTool"><strong>3 — Best Tool</strong><p>{currentIntervention.tool}</p></div>
          <div className="qfBlock qfActivity"><strong>4 — Recommended Activity</strong><p>{currentIntervention.activity}</p></div>
          <div className="qfBlock qfProgression"><strong>5 — Progression</strong><p>{currentIntervention.progression}</p></div>
        </div>
      </div>}

      {qfProblem&&!currentIntervention&&<div className="qfNoResult">
        <p>No intervention card found for "{qfProblem}". Check back soon.</p>
        <button type="button" className="secondaryBtn" onClick={()=>setQfProblem(null)}>← Back</button>
      </div>}
    </div>}

    {/* ── TOOL LIBRARY SECTIONS ── */}
    {['coordination','balance','visual','rhythm','constraint','scaling'].includes(activeSection)&&<div className="toolLibrarySection">
      <div className="toolLibraryIntro">
        {{
          coordination:<><h2>🤝 Coordination Tools</h2><p>Improve movement organisation without technical correction.</p></>,
          balance:<><h2>⚖ Balance Tools</h2><p>Improve dynamic stability and recovery.</p></>,
          visual:<><h2>👁 Visual Tools</h2><p>Improve information pickup and tracking.</p></>,
          rhythm:<><h2>🎵 Rhythm Tools</h2><p>Improve tempo and movement rhythm. Reduce tension. Promote fluid movement.</p></>,
          constraint:<><h2>🔧 Constraint Tools</h2><p>Use the environment to shape behaviour without verbal instruction.</p></>,
          scaling:<><h2>📏 Scaling Tools</h2><p>Adjust challenge level. Change the task before changing the player.</p></>,
        }[activeSection]}
      </div>
      <div className="toolCardStack">
        {(toolLibrary[activeSection]||[]).map(tool=><ToolCard key={tool.name} tool={tool}/>)}
      </div>
    </div>}

    {/* ── ANALOGY TOOLS ── */}
    {activeSection==='analogy'&&<div className="toolLibrarySection">
      <div className="toolLibraryIntro">
        <h2>💡 Analogy Tools</h2>
        <p>External focus coaching. Analogies shape movement without body instruction.</p>
      </div>
      <div className="toolCardStack">
        {(toolLibrary.analogy||[]).map(tool=><div key={tool.name} className="toolCard toolCardOpen">
          <div className="toolCardHeader" style={{cursor:'default'}}>
            <strong>{tool.name}</strong>
            <span className="toolCardLevels">{tool.levels}</span>
          </div>
          <div className="toolCardBody">
            <div className="toolCardSection tcDoes"><strong>What It Does</strong><p>{tool.does}</p></div>
            <div className="toolCardSection tcWhy"><strong>Why It Works</strong><p>{tool.why}</p></div>
            <div className="toolCardSection"><strong>When to Use</strong><p>{tool.use}</p></div>
            <div className="toolCardSection"><strong>How to Apply</strong><p>{tool.apply}</p></div>
            {tool.problems&&<div className="toolCardSection"><strong>Problems Addressed</strong><div className="toolProblemTags">{tool.problems.map(p=><button key={p} type="button" className="toolProblemTag" onClick={()=>{setQfProblem(p);setActiveSection('quickfix');}}>{p}</button>)}</div></div>}
          </div>
        </div>)}
      </div>
    </div>}

    {/* ── PRINCIPLES ── */}
    {activeSection==='principles'&&<div className="toolLibrarySection">
      <div className="toolLibraryIntro">
        <h2>📋 Checkerboard Tools Principles</h2>
        <p>The goal is not to fix movement. The goal is to change the environment so better movement emerges.</p>
      </div>
      <div className="toolPrinciplesGrid">
        {[
          {p:'Constraint before correction',d:'Change the environment before changing the player. A well-designed constraint produces better movement without verbal instruction.'},
          {p:'External focus before body instruction',d:'Direct attention to the ball, the target, or the environment — not to body parts. External focus produces superior movement outcomes.'},
          {p:'Environment before explanation',d:'Set up the constraint first. Let the player experience the problem and find the solution before offering any explanation.'},
          {p:'Discovery before demonstration',d:'Give the player the opportunity to solve the movement problem through exploration. Demonstration reduces the discovery process.'},
          {p:'Variability before repetition',d:'Variable practice builds adaptable skills. Perfect repetition builds fragile skills that fail under novel conditions.'},
        ].map(item=><div key={item.p} className="toolPrincipleCard">
          <strong>{item.p}</strong>
          <p>{item.d}</p>
        </div>)}
      </div>
    </div>}

  </div>;
}




function InvasionGamesBuilder({onAddToSession}){
  const [format,setFormat]=useState('lives');
  const [layers,setLayers]=useState([]);
  const [cbCode,setCbCode]=useState('None');

  const overlayOptions=['Clean Winner','Opponent Off T','Volley Finish','Weak Side','4-Shot Window','2-Shot Window','Double Bounce','DB Handicap','Quality Length Before Attack'];
  const cbOptions=['None','[5-4] + [5-1]','[6-3] + [6-2]','[5-4] + [8-1]','[6-3] + [7-2]','Custom'];

  function toggleLayer(layer){
    setLayers(prev=>prev.includes(layer)?prev.filter(item=>item!==layer):[...prev,layer]);
  }

  const games=[
    {
      id:'lives',
      title:'Invasion Game — Lives Format',
      tactical:'Survival · discipline · pressure management',
      task:'Defenders always serve. Players track lives. Same penalty applies to invader and defenders. Double-bounce handicaps are assigned in Competition: choose each player and set None, 1 DB, 2 DBs, 3 DBs or Unlimited DBs.',
      rationale:'Lives format creates a consequence ecology: players protect lives, manage pressure and make disciplined decisions. Defenders serve to prevent gaming the system.',
      scoring:'If invader hits out of the court area then -1 life penalty against invader. If invader hits out of court area and into the balcony then -3 lives penalty against invader. Once one invader loses all lives play is stopped and invaders rotate courts. Unused lives are carried forward to next court and when invader finishes all court rotations and unused lives are carried forward to next invader',
      playerFocus:'Stay disciplined. Protect your lives. Attack only when the opportunity is clear.'
    },
    {
      id:'timed',
      title:'Invasion Game — Points Format',
      tactical:'Initiative · aggression · opportunity recognition',
      task:'Invader always serves. Play points-format rotations and total team points at the end of all rotations.',
      rationale:'Points format creates an opportunity ecology: players can be more aggressive because points can be won back across rotations. Invader serves to keep attacking initiative with the invader.',
      scoring:'If a defender hits the ball out of the court area then + 1 to invader. If a defender hits the ball out of court area and into balcony then + 3 points to invader.',
      playerFocus:'Take initiative. Look for high-value opportunities and build team momentum.'
    }
  ];

  const selected=games.find(game=>game.id===format)||games[0];

  function addToSession(){
    const card={
      id:Date.now()+Math.random(),
      title:selected.title,
      category:'Invasion',
      family:'Competition / Invasion',
      level:'Level 1–5',
      task:selected.task,
      rationale:selected.rationale,
      coachFocus:selected.tactical,
      playerFocus:selected.playerFocus,
      scoring:selected.scoring,
      antiGaming:'Apply the same agreed penalty consistently. Do not allow players to avoid conditions by stopping the rally deliberately.',
      layers,
      cbCode
    };
    onAddToSession(card);
  }

  return <div className="gameCard">
    <div className="categoryTag">Invasion</div>
    <h2>Invasion Games Library</h2>
    <p className="engineIntro">Choose the invasion format first. Lives and Points formats create different tactical behaviours.</p>

    <div className="gameTypeResetWarning"><strong>Game Type Note</strong><p>When changing game family, rebuild the base rule first, then apply overlays. v99h77 keeps overlays modular so ATL rules are not intended to define Checkerboard games.</p></div><div className="gameClassGrid">
      {games.map(game=><button key={game.id} type="button" className={format===game.id?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setFormat(game.id)}>
        {game.id==='lives'?'Lives Format':'Points Format'}
      </button>)}
    </div>

    <div className="diagnosticPrinciple"><strong>Tactical Behaviour Focus</strong><p>{selected.tactical}</p></div>
    <div className="infoBox"><strong>Task / Rules</strong><p>{selected.task}</p></div>
    <div className="infoBox"><strong>Rationale</strong><p>{selected.rationale}</p></div>
    <div className="infoBox"><strong>Scoring</strong><p>{selected.scoring}</p></div>
    <div className="infoBox"><strong>Player Focus</strong><p>{selected.playerFocus}</p></div>

    <div className="technicalScoringBox alwaysVisibleScoring">
      <strong>Universal Overlays</strong>
      <p className="overlayExplain">No overlays are selected by default. Coach chooses what applies.</p>
      <OverlayFamilyTabs selectedOverlays={layers} onToggle={toggleLayer} context="Invasion Game" />
      <label>Checkerboard Code / Sequence
        <select value={cbCode} onChange={e=>setCbCode(e.target.value)}>
          {cbOptions.map(option=><option key={option}>{option}</option>)}
        </select>
      </label>
    </div>

    <button className="primaryBtn" onClick={addToSession}>Add Invasion Game To Session</button>
  </div>;
}

function CustomGameBuilder({onAddToSession}){
  const [baseGame,setBaseGame]=useState('Normal');
  const [title,setTitle]=useState('Custom Conditioned Game');
  const [assignment,setAssignment]=useState('Both Players');
  const [namedPlayers,setNamedPlayers]=useState([]);
  const [conditionText,setConditionText]=useState('');
  const [coachNote,setCoachNote]=useState('');
  const [straightOnly,setStraightOnly]=useState('None');
  const [crosscourtLimit,setCrosscourtLimit]=useState('None');
  const [doubleBounce,setDoubleBounce]=useState('None');
  const [cbCode,setCbCode]=useState('None');
  const [scoring,setScoring]=useState('Win rally = 1. Bonus scoring set by coach.');
  const [playerFocus,setPlayerFocus]=useState('Read the constraint, play the rally, and adapt.');
  const [layers,setLayers]=useState([]);
  const [randomMode,setRandomMode]=useState('Open');
  const [randomResult,setRandomResult]=useState('');

  // Pull current session attendance — players marked present
  const presentPlayers=useMemo(()=>{
    try{return (JSON.parse(localStorage.getItem(PLAYER_KEY))||[]).filter(p=>p&&p.present&&p.name).map(p=>p.name);}
    catch{return[];}
  },[assignment]);

  const overlayOptions=['Clean Winner','Opponent Off T','T Challenge','Volley Finish','Weak Side','4-Shot Window','2-Shot Window','Zone Finish','Quality Length Before Attack'];
  // All 8 Checkerboard zones individually selectable + pair combinations
  const cbOptions=['None',
    '[1]','[2]','[3]','[4]','[5]','[6]','[7]','[8]',
    '[1-2]','[1-3]','[1-4]','[2-3]','[2-4]','[3-4]',
    '[5-6]','[5-7]','[5-8]','[6-7]','[6-8]','[7-8]',
    '[5-4] + [8-1]','[6-3] + [7-2]','[6-4] + [8-1]','[5-3] + [7-1]',
    'Custom'
  ];
  const randomBank=['Must play straight','Can only score in zone [1]','Can only score in zone [2]','Has 1 crosscourt per rally','Has 2 crosscourts per rally','Has 1 DB','Has 2 DB','Has 3 DB','Has 4 DB','Has 5 DB','Must win with a volley','Must complete a checkerboard pair before scoring','No condition'];

  function toggleLayer(layer){setLayers(prev=>prev.includes(layer)?prev.filter(item=>item!==layer):[...prev,layer]);}
  function togglePlayer(name){setNamedPlayers(prev=>prev.includes(name)?prev.filter(n=>n!==name):[...prev,name]);}

  // Auto-fill constraint text from customisation fields
  useEffect(()=>{
    const bits=[];
    if(straightOnly!=='None') bits.push(straightOnly);
    if(crosscourtLimit!=='None') bits.push(crosscourtLimit);
    if(cbCode!=='None') bits.push('Checkerboard / Zone: '+cbCode);
    if(layers.length) bits.push('Overlays: '+layers.join(', '));
    if(bits.length) setConditionText(bits.join(' · '));
  },[straightOnly,crosscourtLimit,cbCode,layers]);

  function resetCustom(){
    setTitle('Custom Conditioned Game');setAssignment('Both Players');setNamedPlayers([]);setConditionText('');setCoachNote('');
    setStraightOnly('None');setCrosscourtLimit('None');setDoubleBounce('None');setCbCode('None');
    setScoring('Win rally = 1. Bonus scoring set by coach.');setPlayerFocus('Read the constraint, play the rally, and adapt.');
    setLayers([]);setRandomMode('Open');setRandomResult('');
  }
  function generateRandom(){
    const a=randomBank[Math.floor(Math.random()*randomBank.length)];
    const b=randomBank[Math.floor(Math.random()*randomBank.length)];
    setRandomResult(randomMode==='Blind'?'Blind random conditions generated. Coach reveals conditions when appropriate.':'Player A: '+a+' · Player B: '+b);
  }

  const assignedTo=assignment==='Named Player'
    ?(namedPlayers.length?namedPlayers.join(', '):'Named Player(s)')
    :assignment;
  const structured=[conditionText||null,doubleBounce!=='None'?'DB: '+doubleBounce:null].filter(Boolean);
  const activeCondition=structured.length?assignedTo+': '+structured.join(' · '):assignedTo+': No condition set';

  function addGame(){
    onAddToSession({
      id:Date.now()+Math.random(),title,duration:8,format:'Custom',category:'Custom',family:'Custom Conditioned Game',
      level:'Coach Designed',task:activeCondition,
      rationale:'Coach-designed conditioned game using selected constraints, overlays, checkerboard zones and player-specific constraints.',
      coach:coachNote||'Observe whether the constraint changes perception, decision-making and tactical behaviour.',
      coachFocus:coachNote||'Observe whether the constraint changes perception, decision-making and tactical behaviour.',
      coachNote,
      baseGame,namedPlayers,assignment,
      player:playerFocus,playerFocus,scoring,layers,cbCode,crosscourtLimit,doubleBounce
    });
  }

  return <div className="gameCard customGameBuilder">
    <div className="categoryTag">Custom</div>
    <h2>Custom Game Builder</h2>
    <p className="engineIntro">Select a base game, then open the layers you need.</p>

    {/* BASE GAME — always visible */}
    <div className="baseGamePanel">
      <div className="baseGamePanelHeader"><span className="baseGamePanelNum">Base</span><strong>Base Game</strong><span className="baseGamePanelSub">What players do</span></div>
      <div className="customBaseGameGrid">
        {['Normal','3/4 Court','Egyptian 3/4','3/4 25'].map(bg=><button key={bg} type="button"
          className={baseGame===bg?'customBaseActive':'customBaseBtn'}
          onClick={()=>setBaseGame(bg)}>{bg}</button>)}
      </div>
      <div className="customBaseDesc">
        {{
          'Normal':'Full court, standard rules. Both players score normally.',
          '3/4 Court':'Court reduced to 3/4 length. Develops early attack and length awareness.',
          'Egyptian 3/4':'3/4 court. Only the server can score. Receiver must win a rally to become server.',
          '3/4 25':'3/4 court scoring to 25. Extended game for endurance and pattern development.',
        }[baseGame]}
      </div>
      <label style={{marginTop:'10px'}}>Game Title<input value={title} onChange={e=>setTitle(e.target.value)}/></label>
      <div className="constraintAssignSection" style={{marginTop:'10px'}}>
        <strong>Constraint Applies To</strong>
        <div className="constraintAssignGrid">
          {['Both Players','Server Only','Receiver Only','Named Player'].map(opt=><button key={opt} type="button"
            className={assignment===opt?'constraintAssignActive':'constraintAssignBtn'}
            onClick={()=>setAssignment(opt)}>{opt}</button>)}
        </div>
        {assignment==='Named Player'&&<div className="namedPlayerSection">
          <strong className="namedPlayerLabel">Select players present in this session</strong>
          {presentPlayers.length===0
            ?<p className="namedPlayerEmpty">No players marked as present in the current session. Mark players present from the Players screen first.</p>
            :<div className="namedPlayerChips">
              {presentPlayers.map(name=><div key={name}
                className={namedPlayers.includes(name)?'namedPlayerChipActive':'namedPlayerChip'}
                onClick={()=>togglePlayer(name)} role="button" tabIndex={0}>
                {namedPlayers.includes(name)?'✓ ':''}{name}
              </div>)}
            </div>}
          {namedPlayers.length>0&&<div className="namedPlayerSummary">Constraint applies to: <strong>{namedPlayers.join(', ')}</strong></div>}
        </div>}
      </div>
    </div>

    {/* GAME LOGIC */}
    <CollapsibleLayer num="1" title="Game Logic" subtitle="What counts — eligibility and validity" color="green">
      <div className="atlOptionsGrid">
        <label>Straight Only<select value={straightOnly} onChange={e=>setStraightOnly(e.target.value)}><option>None</option><option>Straight Only</option></select></label>
        <label>Crosscourt Allowance<select value={crosscourtLimit} onChange={e=>setCrosscourtLimit(e.target.value)}><option>None</option><option>0 crosscourts</option><option>1 crosscourt per rally</option><option>2 crosscourts per rally</option><option>3 crosscourts per rally</option><option>Unlimited</option></select></label>
        <label>Checkerboard Zone<select value={cbCode} onChange={e=>setCbCode(e.target.value)}>{cbOptions.map(option=><option key={option}>{option}</option>)}</select></label>
      </div>
      <div className="quickLayers" style={{marginTop:'10px'}}>{COMPLETION_CONSTRAINTS.map(item=><button key={item} className={layers.includes(item)?'activeLayer':''} onClick={()=>toggleLayer(item)}>{layers.includes(item)?'✓ ':'+ '}{item}</button>)}</div>
    </CollapsibleLayer>

    {/* SCORING LOGIC */}
    <CollapsibleLayer num="2" title="Scoring Logic" subtitle="How points are awarded" color="gold">
      <label>Scoring<textarea value={scoring} onChange={e=>setScoring(e.target.value)}/></label>
      <OverlayFamilyTabs selectedOverlays={layers} onToggle={toggleLayer} context="Custom Game"/>
    </CollapsibleLayer>

    {/* CONSTRAINTS */}
    <CollapsibleLayer num="3" title="Constraints" subtitle="Shape behaviour without changing rules" color="blue">
      <label>Constraint Text<textarea value={conditionText} onChange={e=>setConditionText(e.target.value)} placeholder="Auto-filled from your selections above. Edit if needed."/></label>
      <label style={{marginTop:'8px'}}>Coach's Note<textarea value={coachNote} onChange={e=>setCoachNote(e.target.value)} placeholder="Private notes — what to look for, what to feedback, when to progress"/></label>
      <label style={{marginTop:'8px'}}>Player Focus<textarea value={playerFocus} onChange={e=>setPlayerFocus(e.target.value)}/></label>
      <div style={{marginTop:'10px'}}>
        <strong className="mutedText" style={{fontSize:'13px'}}>Random Constraint Generator</strong>
        <div className="buttonRow" style={{marginTop:'6px'}}>
          <label style={{minWidth:'120px'}}>Mode<select value={randomMode} onChange={e=>setRandomMode(e.target.value)}><option>Open</option><option>Blind</option></select></label>
          <button className="secondaryBtn" type="button" onClick={generateRandom}>Generate Random</button>
        </div>
        {randomResult&&<div className="infoBox" style={{marginTop:'8px'}}><strong>Random Result</strong><p>{randomResult}</p></div>}
      </div>
    </CollapsibleLayer>

    {/* DB HANDICAP */}
    <CollapsibleLayer num="4" title="DB Handicap" subtitle="Double bounce allowance — assign selectively" color="purple">
      <InlineDBSelector dbAssign={assignment} setDbAssign={setAssignment} dbPlayer={namedPlayers.join(', ')} setDbPlayer={()=>{}} dbAmount={doubleBounce==='None'?'No DB':doubleBounce} setDbAmount={v=>setDoubleBounce(v==='No DB'?'None':v)}/>
    </CollapsibleLayer>

    <div className="infoBox"><strong>Active Custom Game</strong><p>{activeCondition}</p><p><strong>Scoring:</strong> {scoring}</p></div>
    <div className="buttonRow"><button className="primaryBtn" onClick={addGame}>Add Custom Game To Session</button><button className="secondaryBtn" type="button" onClick={resetCustom}>Reset</button></div>
  </div>;
}



function InlineGameLogicBuilder({baseGame,onAddBase,onAddLogic,onCancel}){
  const triggerOptions=[
    {id:'oppNotSetT',name:'Opponent not set in T',player:'opponent is not set in the T'},
    {id:'oppOffT',name:'Opponent off T',player:'opponent is off the T'},
    {id:'oppStillMoving',name:'Opponent still moving',player:'opponent is still moving'},
    {id:'oppOffBalance',name:'Opponent off balance',player:'opponent is off balance or stretched'},
    {id:'reduceOptions',name:'Reduce options first',player:'you have reduced opponent options first'},
    {id:'widthAchieved',name:'Width achieved',player:'you have created width first'},
    {id:'completePair',name:'Complete Checkerboard pair',player:'you have completed the Checkerboard pair'},
    {id:'completeTriple',name:'Complete Checkerboard triple',player:'you have completed the Checkerboard triple'},
    {id:'volleyOpportunity',name:'Volley opportunity appears',player:'a volley opportunity appears'},
    {id:'attackableBall',name:'Attackable ball appears',player:'the ball is attackable'}
  ];
  const actions=[
    {id:'none',name:'No required action',player:'Choose the best solution.'},
    {id:'btl',name:'BTL attack',player:'Attack below the line.'},
    {id:'atl',name:'ATL attack',player:'Attack above the line.'},
    {id:'volley',name:'Volley next opportunity',player:'Volley the next available ball.'},
    {id:'oppositeSide',name:'Attack opposite side',player:'Attack the opposite side.'},
    {id:'straightDrive',name:'Straight drive',player:'Play straight.'},
    {id:'boast',name:'Boast / angle',player:'Use the boast/angle.'},
    {id:'finish2',name:'Finish within 2 shots',player:'Win within 2 shots.'},
    {id:'finish3',name:'Finish within 3 shots',player:'Win within 3 shots.'},
    {id:'finish4',name:'Finish within 4 shots',player:'Win within 4 shots.'}
  ];
  const consequences=[
    {id:'plus1',name:'+1',text:'Award +1 if achieved.',player:'Earn +1 if successful.'},
    {id:'plus2',name:'+2',text:'Award +2 if achieved.',player:'Earn +2 if successful.'},
    {id:'plus3',name:'+3',text:'Award +3 if achieved.',player:'Earn +3 if successful.'},
    {id:'plus4',name:'+4',text:'Award +4 if achieved.',player:'Earn +4 if successful.'},
    {id:'rallyLost',name:'Rally lost',text:'Rally is lost if broken.',player:'If you break the constraint, you lose the rally.'},
    {id:'reset',name:'Challenge resets',text:'Challenge resets if not completed.',player:'If you miss the constraint, the challenge resets.'},
    {id:'bonusLost',name:'Bonus lost',text:'The bonus is lost if not completed.',player:'If you miss the constraint, the bonus is gone.'},
    {id:'coachConfirms',name:'Coach confirms',text:'Coach confirms whether the condition is satisfied.',player:'Coach confirms whether it counts.'}
  ];
  const qualityOptions=[
    {id:'cleanWinner',name:'Clean winner +2',player:'Clean winner earns +2 extra.'},
    {id:'recoverBeforeContact',name:'Recover before opponent contact +1',player:'Recover before the next shot for +1 extra.'},
    {id:'volleyWinner',name:'Volley winner +2',player:'Volley winner earns +2 extra.'},
    {id:'balancedFinish',name:'Balanced finish +1',player:'Balanced finish earns +1 extra.'},
    {id:'correctTarget',name:'Correct target +1',player:'Correct target earns +1 extra.'}
  ];
  const [triggers,setTriggers]=useState(['oppNotSetT']);
  const [newTrigger,setNewTrigger]=useState('reduceOptions');
  const [requiredAction,setRequiredAction]=useState('none');
  const [consequence,setConsequence]=useState('plus2');
  const [qualities,setQualities]=useState([]);
  const find=(arr,id)=>arr.find(x=>x.id===id)||arr[0];
  const activeTriggers=triggers.map(id=>find(triggerOptions,id));
  const selectedAction=find(actions,requiredAction);
  const selectedConsequence=find(consequences,consequence);
  const activeQualities=qualities.map(id=>find(qualityOptions,id));
  function addTrigger(){if(triggers.length<5&&!triggers.includes(newTrigger))setTriggers([...triggers,newTrigger]);}
  function toggleQuality(id){setQualities(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);}
  const triggerText=activeTriggers.length?activeTriggers.map(t=>t.name).join(' AND '):'No additional trigger';
  const playerRules=[
    baseGame?.task||baseGame?.description||'Play the base game as set.',
    activeTriggers.length?`Extra condition applies when ${activeTriggers.map(t=>t.player).join(' AND ')}.`:'',
    selectedAction.player,
    selectedConsequence.player,
    ...activeQualities.map(q=>q.player)
  ].filter(Boolean);
  const coachLogic=`Triggers: ${triggerText}. Required Action: ${selectedAction.name}. Consequence: ${selectedConsequence.text}${activeQualities.length?' Quality: '+activeQualities.map(q=>q.name).join(' · '):''}`;
  function buildGame(){
    return {
      ...baseGame,
      id:Date.now()+Math.random(),
      title:`${baseGame.title||'Game'} + Game Logic`,
      task:`${baseGame.task||baseGame.description||'Play the base game.'} Added Game Logic: ${coachLogic}`,
      scoring:`${baseGame.scoring||'Base scoring applies.'} Added Game Logic: ${selectedConsequence.text}${activeQualities.length?' Quality bonuses: '+activeQualities.map(q=>q.name).join(' · '):''}`,
      coach:`${baseGame.coach||''} Game Logic: ${coachLogic}`,
      playerView:playerRules.join(' '),
      layers:[...(baseGame.layers||[]),'Game Logic',...activeTriggers.map(t=>t.name),...(requiredAction!=='none'?[selectedAction.name]:[]),selectedConsequence.name,...activeQualities.map(q=>q.name)]
    };
  }
  return <div className="inlineLogicPanel gameCard">
    <div className="categoryTag">Add Game Logic To This Card</div>
    <h3>{baseGame.title}</h3>
    <div className="logicBasePreview"><strong>Base Game Protected</strong><p>{baseGame.task||baseGame.description||'Base game rules remain unchanged.'}</p>{baseGame.scoring&&<p><b>Scoring:</b> {baseGame.scoring}</p>}</div>
    <h4>Trigger Stack</h4>
    <div className="triggerAddRow"><select value={newTrigger} onChange={e=>setNewTrigger(e.target.value)}>{triggerOptions.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><button className="secondaryBtn" onClick={addTrigger}>+ Add Trigger</button></div>
    <div className="triggerStackList">{activeTriggers.map(t=><div className="triggerStackItem" key={t.id}><strong>{t.name}</strong><button className="secondaryBtn" onClick={()=>setTriggers(triggers.filter(x=>x!==t.id))}>Remove</button></div>)}</div>
    <label>Required Action<select value={requiredAction} onChange={e=>setRequiredAction(e.target.value)}>{actions.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
    <label>Consequence<select value={consequence} onChange={e=>setConsequence(e.target.value)}>{consequences.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <h4>Quality Modifiers</h4>
    <div className="qualityGrid">{qualityOptions.map(q=><button type="button" key={q.id} className={qualities.includes(q.id)?'activeQualityBtn':''} onClick={()=>toggleQuality(q.id)}>{qualities.includes(q.id)?'✓ ':'+ '}{q.name}</button>)}</div>
    <div className="dualViewGrid"><div className="overlayCoachOutput"><strong>Coach View</strong><p>{coachLogic}</p></div><div className="overlayCoachOutput playerViewCard"><strong>Player View</strong><ol>{playerRules.map((r,i)=><li key={i}>{r}</li>)}</ol></div></div>
    <div className="buttonRow"><button className="primaryBtn" onClick={()=>onAddLogic(buildGame())}>Add Game + Logic To Session</button><button className="secondaryBtn" onClick={()=>onAddBase(baseGame)}>Add Base Game Only To Session</button><button className="secondaryBtn" onClick={onCancel}>Cancel</button></div>
  </div>;
}


function InformationAnticipationBuilder({onAddToSession}){
  const cueOptions=['Ball','Racquet','Arm','Shoulder','Trunk','Hips'];
  const earlyMovementOptions=['Hips','Trunk','Shoulder','Arm','Racquet'];
  const cueValues={Ball:1,Racquet:2,Arm:3,Shoulder:4,Trunk:5,Hips:6};
  const directionOptions=['Straight','Crosscourt'];
  const freezeOptions=['Straight','Crosscourt','Drop','Boast'];
  const activities=[
    {
      id:'cueDiscovery',
      title:'Cue Discovery',
      level:'Level 0A',
      type:'cueOnly',
      objective:'Discover where useful opponent information exists.',
      task:'Players observe rallies or simple feeds and identify where they were looking: ball, racquet, arm, shoulder, trunk or hips. No prediction required.',
      scoring:'No formal score. Coach records cue source selections and observations.',
      coach:'Ask: Where were you looking? What information did you use? What gave the shot away?',
      player:'Look for useful opponent information. After the rally, identify what gave the shot away.'
    },
    {
      id:'cueAwareness',
      title:'Cue Awareness',
      level:'Level 0B',
      type:'movementFirst',
      objective:'Identify what moved first.',
      task:'Coach asks “what moved first?” after each action. Player identifies hips, trunk, shoulder, arm or racquet.',
      scoring:'No formal score. Earlier movement sources indicate progress.',
      coach:'Use ATL, BTL or double bounce to slow the exchange and make information easier to perceive.',
      player:'Watch the opponent and identify what moved first.'
    },
    {
      id:'directionRead',
      title:'Direction Read',
      level:'Level 1',
      type:'prediction',
      objective:'Predict straight or crosscourt before opponent contact.',
      task:'In a live or semi-live rally, player calls Straight or Crosscourt before contact.',
      scoring:'Prediction Accuracy % = correct predictions ÷ total attempts.',
      coach:'Keep the task representative. Do not turn it into eyesight training.',
      player:'Call Straight or Crosscourt before opponent contact.',
      options:directionOptions
    },
    {
      id:'freezeRead',
      title:'Freeze Read',
      level:'Level 1',
      type:'prediction',
      objective:'Predict likely shot from opponent preparation.',
      task:'Coach freezes before opponent contact. Player predicts Straight, Crosscourt, Drop or Boast.',
      scoring:'Prediction Accuracy % = correct predictions ÷ total attempts.',
      coach:'Ask what gave the shot away: hips, trunk, shoulder, arm, racquet or ball.',
      player:'On the freeze, predict the likely shot and identify the cue.',
      options:freezeOptions
    }
  ];

  const [selectedActivity,setSelectedActivity]=useState('cueDiscovery');
  const [selectedCue,setSelectedCue]=useState('Racquet');
  const [movementFirst,setMovementFirst]=useState('Hips');
  const [prediction,setPrediction]=useState('Straight');
  const [actual,setActual]=useState('Straight');
  const [playerName,setPlayerName]=useState('');
  const [note,setNote]=useState('');
  const [records,setRecords]=useState(()=>{
    try{const saved=localStorage.getItem(INFO_ANTICIPATION_KEY);return saved?JSON.parse(saved):[];}catch{return[];}
  });

  useEffect(()=>{localStorage.setItem(INFO_ANTICIPATION_KEY,JSON.stringify(records));},[records]);

  const activity=activities.find(a=>a.id===selectedActivity)||activities[0];
  const predictionOptions=activity.options||directionOptions;
  const predictionRecords=records.filter(r=>r.activityType==='prediction');
  const totalPredictions=predictionRecords.length;
  const correctPredictions=predictionRecords.filter(r=>r.correct).length;
  const predictionAccuracy=totalPredictions?Math.round((correctPredictions/totalPredictions)*100):0;
  const cueCounts=cueOptions.reduce((acc,cue)=>{acc[cue]=records.filter(r=>r.cue===cue).length;return acc;},{});
  const cueScoreTotal=records.reduce((sum,r)=>sum+(cueValues[r.cue]||0),0);
  const cueAverage=records.length?Number((cueScoreTotal/records.length).toFixed(1)):0;
  const dominantCue=records.length?cueOptions.reduce((best,cue)=>cueCounts[cue]>cueCounts[best]?cue:best,'Ball'):'—';
  const classification=records.length===0?'No Data':cueAverage>=4.8?'Advanced':cueAverage>=3.2?'Intermediate':'Beginner';
  const classificationText=classification==='Advanced'
    ?'Attention is moving towards earlier body information: shoulder, trunk and hips.'
    :classification==='Intermediate'
      ?'Attention is moving beyond ball/racquet towards arm and shoulder information.'
      :classification==='Beginner'
        ?'Attention is still dominated by later information: ball and racquet.'
        :'Record observations to build a profile.';

  function recordObservation(){
    const isPrediction=activity.type==='prediction';
    const cue=activity.type==='movementFirst'?movementFirst:selectedCue;
    const correct=isPrediction?prediction===actual:null;
    setRecords(prev=>[{
      id:Date.now()+Math.random(),
      at:new Date().toISOString(),
      player:playerName.trim(),
      activityId:activity.id,
      activityTitle:activity.title,
      activityType:activity.type,
      cue,
      cueValue:cueValues[cue]||0,
      prediction:isPrediction?prediction:'',
      actual:isPrediction?actual:'',
      correct,
      note:note.trim()
    },...prev].slice(0,250));
    setNote('');
  }

  function clearRecords(){
    if(confirm('Clear Information & Anticipation records?')) setRecords([]);
  }

  function addActivityToSession(){
    const game={
      id:Date.now()+Math.random(),
      title:`Information & Anticipation: ${activity.title}`,
      category:'Information & Anticipation',
      duration:12,
      task:activity.player,
      scoring:activity.scoring,
      rationale:activity.objective,
      coach:activity.coach,
      layers:['Information & Anticipation','Opponent Information','Quiet Eye','Early Cue Search'],
      playerView:activity.player
    };
    onAddToSession(game);
  }

  function recorderFields(){
    if(activity.type==='cueOnly'){
      return <>
        <label>What gave it away?<select value={selectedCue} onChange={e=>setSelectedCue(e.target.value)}>{cueOptions.map(cue=><option key={cue}>{cue}</option>)}</select></label>
      </>;
    }
    if(activity.type==='movementFirst'){
      return <>
        <label>What moved first?<select value={movementFirst} onChange={e=>setMovementFirst(e.target.value)}>{earlyMovementOptions.map(cue=><option key={cue}>{cue}</option>)}</select></label>
      </>;
    }
    return <>
      <label>Prediction<select value={prediction} onChange={e=>setPrediction(e.target.value)}>{predictionOptions.map(o=><option key={o}>{o}</option>)}</select></label>
      <label>Actual<select value={actual} onChange={e=>setActual(e.target.value)}>{predictionOptions.map(o=><option key={o}>{o}</option>)}</select></label>
      <label>What gave it away?<select value={selectedCue} onChange={e=>setSelectedCue(e.target.value)}>{cueOptions.map(cue=><option key={cue}>{cue}</option>)}</select></label>
    </>;
  }

  return <div className="infoAnticipationBuilder gameCard">
    <div className="categoryTag">Information & Anticipation</div>
    <h2>Opponent Information, Anticipation & Quiet Eye</h2>
    <div className="infoVisionPrinciple"><strong>Read → Predict → Commit → Resist Deception</strong><p>This is not eyesight training. It develops opponent information pickup, anticipation and perception-action coupling in representative squash environments.</p></div>

    <div className="infoActivityGrid">
      {activities.map(item=><button type="button" key={item.id} className={selectedActivity===item.id?'activeInfoActivity':''} onClick={()=>{setSelectedActivity(item.id); if(item.options){setPrediction(item.options[0]);setActual(item.options[0]);}}}>
        <span>{item.level}</span><strong>{item.title}</strong><small>{item.objective}</small>
      </button>)}
    </div>

    <div className="infoPanel">
      <h3>{activity.level}: {activity.title}</h3>
      <p><strong>Objective:</strong> {activity.objective}</p>
      <p><strong>Task:</strong> {activity.task}</p>
      <p><strong>Scoring:</strong> {activity.scoring}</p>
      <p><strong>Coach:</strong> {activity.coach}</p>
      <div className="playerInstructionBox"><strong>Player View</strong><p>{activity.player}</p></div>
      <div className="buttonRow"><button className="primaryBtn" onClick={addActivityToSession}>Add Activity To Session</button></div>
    </div>

    <div className="infoRecorder">
      <h3>Record Cue Source / Prediction</h3>
      <div className="infoRecorderGrid">
        <label>Player / Group<input value={playerName} onChange={e=>setPlayerName(e.target.value)} placeholder="Optional"/></label>
        {recorderFields()}
      </div>
      <label>Coach Observation<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="What moved first? What information did the player use?"/></label>
      <div className="buttonRow"><button className="primaryBtn" onClick={recordObservation}>Record Observation</button><button className="secondaryBtn" onClick={clearRecords}>Clear Records</button></div>
    </div>

    <div className="cueDashboard">
      <h3>Cue Source Profile</h3>
      <div className="cueStatsGrid">
        <div><strong>Prediction Accuracy</strong><span>{predictionAccuracy}%</span><small>{correctPredictions}/{totalPredictions}</small></div>
        <div><strong>Average Cue Value</strong><span>{cueAverage||'—'}</span><small>Ball 1 → Hips 6</small></div>
        <div><strong>Dominant Cue</strong><span>{dominantCue}</span><small>{records.length} records</small></div>
        <div><strong>Classification</strong><span>{classification}</span><small>{classificationText}</small></div>
      </div>
      <div className="cueBars">{cueOptions.map(cue=>{
        const max=Math.max(1,...cueOptions.map(c=>cueCounts[c]));
        const width=Math.round((cueCounts[cue]/max)*100);
        return <div className="cueBarRow" key={cue}><strong>{cue}</strong><div><span style={{width:`${width}%`}}></span></div><em>{cueCounts[cue]}</em></div>;
      })}</div>
      <div className="cueProfileNote">
        <p><strong>Beginner profile:</strong> Ball / Racquet dominant.</p>
        <p><strong>Intermediate profile:</strong> Arm / Shoulder dominant.</p>
        <p><strong>Advanced profile:</strong> Shoulder / Trunk / Hips dominant.</p>
      </div>
    </div>
  </div>;
}

function InlineDBSelector({dbAssign,setDbAssign,dbPlayer,setDbPlayer,dbAmount,setDbAmount}){
  return <div className="inlineDBSelector">
    <div className="inlineDBHeader">
      <strong>DB Handicap</strong>
      <span>Double bounce allowance — assign selectively</span>
    </div>
    <div className="inlineDBRow">
      <div className="inlineDBGroup">
        <span className="inlineDBLabel">Assign to</span>
        <div className="inlineDBBtns">
          {['Both Players','Server Only','Receiver Only','Named Player'].map(opt=><button key={opt} type="button"
            className={dbAssign===opt?'inlineDBActive':'inlineDBBtn'}
            onClick={()=>setDbAssign(opt)}>{opt}</button>)}
        </div>
        {dbAssign==='Named Player'&&<input className="inlineDBNameInput" value={dbPlayer} onChange={e=>setDbPlayer(e.target.value)} placeholder="Player name"/>}
      </div>
      <div className="inlineDBGroup">
        <span className="inlineDBLabel">Allowance</span>
        <div className="inlineDBBtns">
          {UNIVERSAL_DB_OPTIONS.map(o=><button key={o} type="button"
            className={dbAmount===o?'inlineDBActive':'inlineDBBtn'}
            onClick={()=>setDbAmount(o)}>{o}</button>)}
        </div>
      </div>
    </div>
    {dbAmount!=='No DB'&&<div className="inlineDBSummary">
      {dbAssign==='Named Player'?dbPlayer||'Named player':dbAssign}: {dbAmount}
    </div>}
  </div>;
}

function UniversalDBHandicapPanel({onAddToSession}){
  const dbOptions=UNIVERSAL_DB_OPTIONS;
  const [enabled,setEnabled]=useState(()=>{try{return JSON.parse(localStorage.getItem(DB_HANDICAP_KEY)||'{}').enabled||false;}catch{return false;}});
  const [allocations,setAllocations]=useState(()=>{try{return JSON.parse(localStorage.getItem(DB_HANDICAP_KEY)||'{}').allocations||{};}catch{return {};}});
  const presentPlayers=useMemo(()=>{try{return (JSON.parse(localStorage.getItem(PLAYER_KEY))||[]).filter(player=>player&&player.present&&player.name).map(player=>player.name);}catch{return[];}},[enabled]);

  useEffect(()=>{
    const valid=new Set(presentPlayers);
    const cleaned=Object.fromEntries(Object.entries(allocations).filter(([name])=>valid.has(name)));
    localStorage.setItem(DB_HANDICAP_KEY,JSON.stringify({enabled,playersText:'',allocations:cleaned,source:'presentPlayers'}));
  },[enabled,allocations,presentPlayers]);

  function setDb(name,value){setAllocations(prev=>({...prev,[name]:value}));}
  function clearDb(){setEnabled(false);setAllocations({});}
  function activeSummary(){return presentPlayers.length?presentPlayers.map(name=>`${name}: ${allocations[name]||'No DB'}`).join(' · '):'No present players selected';}
  function addDbCard(){
    if(!onAddToSession)return;
    onAddToSession({
      id:Date.now()+Math.random(),
      title:'DB Handicap Allocation',
      category:'Universal Overlay',
      duration:0,
      task:'Apply present-player double-bounce handicaps to the selected game.',
      scoring:'Base game scoring remains unchanged. DB handicap only changes each player’s allowed bounce allocation.',
      rationale:'Levels mixed-standard groups while keeping the rally live and representative.',
      coach:'Apply these DB allocations across the current game or rotation: '+activeSummary(),
      layers:['DB Handicap','Double Bounce'],
      playerView:'DB handicap allocations: '+activeSummary()
    });
  }

  return <div className="universalDbPanel">
    <div className="universalDbHeader">
      <div><strong>DB Handicap · All Games</strong><p>Uses players marked Present today. Design the game first, then allocate double-bounce allowances to the players who are actually on court.</p></div>
      <button className={enabled?'primaryBtn':'secondaryBtn'} onClick={()=>setEnabled(!enabled)}>{enabled?'DB Handicap On':'Enable DB Handicap'}</button>
    </div>
    {enabled&&<>
      <div className="statusBox"><strong>Present Players</strong><p>{presentPlayers.length?`${presentPlayers.length} present player${presentPlayers.length===1?'':'s'} loaded from Players / Attendance.`:'No present players found. Mark players Present in Players before assigning DB handicaps.'}</p></div>
      <div className="dbAllocationGrid">
        {presentPlayers.map(name=><div className="dbAllocationRow" key={name}><span>{name}</span><select value={allocations[name]||'No DB'} onChange={e=>setDb(name,e.target.value)}>{dbOptions.map(opt=><option key={opt}>{opt}</option>)}</select></div>)}
      </div>
      <div className="dbSummaryBox"><strong>Active DB Rules</strong><p>{activeSummary()}</p></div>
      <div className="buttonRow"><button className="primaryBtn" onClick={addDbCard} disabled={!presentPlayers.length}>Add DB Handicap To Session</button><button className="secondaryBtn" onClick={clearDb}>Clear DB Handicap</button></div>
    </>}
  </div>;
}

// ─── POWER PLAY™ BUILDER ─────────────────────────────────────────────────────

const PP_OVERLAYS=[
  {id:'cb-single',label:'Single Challenge',category:'Checkerboard'},
  {id:'cb-pair',label:'Pair Challenge',category:'Checkerboard'},
  {id:'cb-triple',label:'Triple Challenge',category:'Checkerboard'},
  {id:'clean-winner',label:'Clean Winner',category:'Finishing'},
  {id:'volley-finish',label:'Volley Finish',category:'Finishing'},
  {id:'blind-finish',label:'Blind Finish',category:'Finishing'},
  {id:'t-zone',label:'T-Zone Prevention',category:'Tactical'},
  {id:'pressure',label:'Pressure',category:'Tactical'},
  {id:'length-attack',label:'Length Before Attack',category:'Tactical'},
  {id:'double-bounce',label:'Double Bounce',category:'Tactical'},
];

const PP_PRESETS=[
  {
    id:'pressure-pp',
    title:'Pressure Power Play',
    level:'Level 3+',
    engine:'open',
    format:'two-player',
    tokens:3,
    tokenRefresh:'never',
    durationType:'rally',
    durationValue:3,
    breakCondition:'disabled',
    scoringMode:'exclusive',
    overlays:['pressure'],
    tokenVisibility:'both',
    rallyScoringRules:[1,1,1],
    completionBonus:6,
    rationale:'Win 3 consecutive rallies for 9 points. Each rally scored 1+1+1 with a 6-point completion bonus. Develops pressure tolerance, commitment, and momentum management. The player must decide when to commit and then hold their nerve across three consecutive rallies.',
    coach:'Watch for players who activate early when they are winning, or hold too long and miss the moment. The timing of the declaration is the coaching point.',
    player:'Declare Power Play. Win 3 rallies in a row. Rally 1 = 1pt, Rally 2 = 1pt, Rally 3 = 1pt + 6 bonus = 9 total.',
    scoring:'Rally 1: +1 · Rally 2: +1 · Rally 3: +1 + 6 bonus = 9 points total.'
  },
  {
    id:'the-gambit',
    title:'The Gambit',
    level:'Level 4+',
    engine:'blind',
    format:'two-player',
    tokens:3,
    tokenRefresh:'never',
    durationType:'rally',
    durationValue:1,
    breakCondition:'disabled',
    scoringMode:'exclusive',
    overlays:[],
    tokenVisibility:'hidden',
    rallyScoringRules:[3],
    completionBonus:0,
    rationale:'Blind Power Play, single rally. Both players hold 3 tokens. Neither player knows when the other has activated. Pure timing and nerve — the player who reads the moment best wins. First to use all tokens scores a bonus.',
    coach:'This is your highest-level tactical game. The skill is not the shot — it is the decision of when to commit under uncertainty. Debrief every activation.',
    player:'Secretly activate your Power Play token before a rally. If you win that rally your PP is active and you score. Your opponent does not know when you have activated.',
    scoring:'Win the rally when PP is active: +3. First to use all tokens: +5 bonus.'
  },
  {
    id:'hot-streak',
    title:'Hot Streak',
    level:'Level 3+',
    engine:'open',
    format:'two-player',
    tokens:2,
    tokenRefresh:'every-rotation',
    durationType:'rally',
    durationValue:5,
    breakCondition:'2-consecutive',
    scoringMode:'exclusive',
    overlays:[],
    tokenVisibility:'both',
    rallyScoringRules:[1,1,2,2,3],
    completionBonus:4,
    rationale:'Open Power Play lasting 5 rallies with escalating scores. Opponent can break it with 2 consecutive wins. High risk/reward momentum game — the longer the streak holds, the more valuable each rally becomes. Develops pressure management, momentum riding, and break resistance.',
    coach:'Watch the opponent\'s break attempts. The coach point is whether the PP player manages their energy and focus across 5 rallies or fades under the pressure of knowing the opponent is hunting a break.',
    player:'Declare Power Play. Rallies score 1, 1, 2, 2, 3 in sequence. Complete all 5 for +4 bonus. Opponent can break it with 2 wins in a row.',
    scoring:'Rally 1: +1 · Rally 2: +1 · Rally 3: +2 · Rally 4: +2 · Rally 5: +3 · Completion bonus: +4. Break = PP ends.'
  },
  {
    id:'token-war',
    title:'Token War',
    level:'Level 3+',
    engine:'open',
    format:'two-player',
    tokens:2,
    tokenRefresh:'every-rotation',
    durationType:'rally',
    durationValue:3,
    breakCondition:'disabled',
    scoringMode:'bonus',
    overlays:[],
    tokenVisibility:'both',
    rallyScoringRules:[1,1,1],
    completionBonus:2,
    rationale:'Both players get 2 tokens per rotation. Normal scoring continues with Power Play bonuses added. Whoever uses their tokens most effectively wins the rotation. Develops timing, opportunity recognition, and strategic commitment across a session.',
    coach:'The key question: did each player choose the right moment? A token used from a defensive position tells you something. A token used when already in control tells you something else.',
    player:'Both players hold 2 tokens per rotation. Normal scoring applies. Activating Power Play adds bonus points. Use your tokens wisely — they refresh each rotation.',
    scoring:'Normal rally scoring continues. PP rally wins add bonus points. Completion bonus: +2 per completed Power Play.'
  },
  {
    id:'last-chance',
    title:'Last Chance',
    level:'Level 4+',
    engine:'open',
    format:'two-player',
    tokens:1,
    tokenRefresh:'never',
    durationType:'rally',
    durationValue:1,
    breakCondition:'disabled',
    scoringMode:'exclusive',
    overlays:['clean-winner'],
    tokenVisibility:'both',
    rallyScoringRules:[5],
    completionBonus:0,
    rationale:'Each player gets exactly one token per match. One shot — pick your moment. Clean Winner overlay active. The decision of when to use it is the entire game. Develops patience, opportunity recognition, and commitment under maximum consequence.',
    coach:'The player who uses their token at 0-5 down has made a different decision to the player who uses theirs at 4-5 down. Both can be right or wrong. The quality of the decision-making is your coaching point.',
    player:'You have one Power Play token for the entire match. Choose your moment carefully. Clean Winner overlay active — the shot must be a clean winner for maximum points.',
    scoring:'Win the rally with a clean winner during PP: +5 points. Normal scoring otherwise.'
  },
  {
    id:'checkerboard-pp',
    title:'Checkerboard Power Play',
    level:'Level 2+',
    engine:'open',
    format:'two-player',
    tokens:3,
    tokenRefresh:'every-rotation',
    durationType:'time',
    durationValue:60,
    breakCondition:'3-consecutive',
    scoringMode:'exclusive',
    overlays:['cb-triple'],
    tokenVisibility:'both',
    rallyScoringRules:[1,1,1,2,2,3],
    completionBonus:3,
    rationale:'Triple Challenge overlay active. Open Power Play for 60 seconds. Only the PP player scores during PP. Natural fit with Checkerboard levels — the player must solve the Triple Challenge under the added pressure of a time-limited Power Play window.',
    coach:'This is the application game for Triple Challenge. The checkerboard constraint remains the primary focus. Power Play adds the consequence layer — they must execute the challenge while managing the pressure of the clock.',
    player:'Declare Power Play. Triple Challenge overlay is active. You have 60 seconds. Only you can score during your Power Play. Solve the challenge and score as many points as possible.',
    scoring:'Win rally with Triple Challenge: +3. Win rally during PP: scores accumulate. Completion bonus: +3.'
  }
];

const PP_TOKEN_OPTIONS=[1,2,3,5,'Unlimited','Custom'];
const PP_REFRESH_OPTIONS=['Never','Every Round','Every Rotation','Every Time Block','Custom'];
const PP_TIME_OPTIONS=[30,60,90,120,180,'Custom'];
const PP_RALLY_OPTIONS=[3,5,10,'Custom'];
const PP_BREAK_OPTIONS=['2 consecutive','3 consecutive','4 consecutive','Disabled'];
const PP_FORMAT_OPTIONS=['Two Player','King of Court','Invasion','Team Format'];

function PowerPlayBuilder({onAddToSession}){
  const [ppTab,setPpTab]=useState('presets');
  const [selectedPreset,setSelectedPreset]=useState(null);
  const [ppStatus,setPpStatus]=useState('');

  // Custom builder state
  const [engine,setEngine]=useState('open');
  const [format,setFormat]=useState('Two Player');
  const [tokens,setTokens]=useState(3);
  const [tokenRefresh,setTokenRefresh]=useState('Never');
  const [tokenVisibility,setTokenVisibility]=useState('coach');
  const [durationType,setDurationType]=useState('rally');
  const [durationValue,setDurationValue]=useState(5);
  const [breakCondition,setBreakCondition]=useState('Disabled');
  const [scoringMode,setScoringMode]=useState('exclusive');
  const [selectedOverlays,setSelectedOverlays]=useState([]);
  const [customTitle,setCustomTitle]=useState('');

  // PP Scoring builder state
  const [ppRallies,setPpRallies]=useState(5);
  const [ppRallyPoints,setPpRallyPoints]=useState([1,1,2,2,3]);
  const [ppCompletionBonus,setPpCompletionBonus]=useState(5);
  const [ppDisruptorWins,setPpDisruptorWins]=useState(3);
  const [ppDisruptorBonus,setPpDisruptorBonus]=useState(3);
  const [ppPartialScore,setPpPartialScore]=useState(true);

  function updateRallyPoints(idx,val){
    setPpRallyPoints(prev=>{const next=[...prev];next[idx]=Number(val)||0;return next;});
  }
  function updatePpRallies(n){
    const num=Number(n);setPpRallies(num);
    setPpRallyPoints(prev=>{
      const next=[...prev];
      while(next.length<num) next.push(1);
      return next.slice(0,num);
    });
  }
  const ppTotalIfWinAll=ppRallyPoints.reduce((a,b)=>a+b,0)+ppCompletionBonus;

  // PP History log
  const [ppHistory,setPpHistory]=useState(()=>{
    try{const s=localStorage.getItem('checkerboard_pp_history');return s?JSON.parse(s):[];}catch{return[];}
  });

  useEffect(()=>{
    try{localStorage.setItem('checkerboard_pp_history',JSON.stringify(ppHistory));}catch{}
  },[ppHistory]);

  function toggleOverlay(id){
    setSelectedOverlays(prev=>prev.includes(id)?prev.filter(o=>o!==id):[...prev,id]);
  }

  function buildGameCard(config,isPreset){
    const overlayLabels=(config.overlays||[]).map(id=>{
      const found=PP_OVERLAYS.find(o=>o.id===id);
      return found?found.label:id;
    });
    const title=isPreset?config.title:(customTitle.trim()||`Power Play™ ${engine==='open'?'Open':'Blind'}`);
    const durationLabel=config.durationType==='time'
      ?`${config.durationValue}s`
      :`${config.durationValue} ${config.durationValue===1?'rally':'rallies'}`;
    const task=`${engine==='blind'?'BLIND ':''}Power Play™ · ${config.format||format} · ${config.tokens} token${config.tokens!==1?'s':''} · ${durationLabel}${overlayLabels.length?' · Overlays: '+overlayLabels.join(', '):''}`;
    const scoring=config.scoring||`${scoringMode==='exclusive'?'Exclusive scoring — only PP player scores during Power Play.':scoringMode==='bonus'?'Bonus scoring — both players score, PP player gets bonuses.':'Custom scoring.'} Break: ${config.breakCondition||breakCondition}.`;
    return {
      id:Date.now()+Math.random(),
      category:'Power Play',
      title,
      task,
      scoring,
      rationale:config.rationale||'',
      coach:config.coach||'',
      player:config.player||'',
      duration:15,
      layers:['Power Play™',...overlayLabels],
      ppConfig:{...config,overlays:config.overlays||selectedOverlays,engine:config.engine||engine,format:config.format||format,tokenVisibility:config.tokenVisibility||tokenVisibility},
      level:config.level||'All levels'
    };
  }

  function addPreset(preset){
    const card=buildGameCard(preset,true);
    onAddToSession(card);
    setPpHistory(prev=>[{id:Date.now(),title:card.title,activatedAt:new Date().toLocaleTimeString(),type:'Added to session'},
      ...prev.slice(0,19)]);
    setPpStatus(`${preset.title} added to session.`);
  }

  function addCustom(){
    const config={engine,format,tokens,tokenRefresh,tokenVisibility,durationType,durationValue,breakCondition,scoringMode,overlays:selectedOverlays};
    const card=buildGameCard(config,false);
    onAddToSession(card);
    setPpHistory(prev=>[{id:Date.now(),title:card.title,activatedAt:new Date().toLocaleTimeString(),type:'Custom — added to session'},
      ...prev.slice(0,19)]);
    setPpStatus('Custom Power Play added to session.');
  }

  const overlaysByCategory=PP_OVERLAYS.reduce((acc,o)=>{
    if(!acc[o.category]) acc[o.category]=[];
    acc[o.category].push(o);
    return acc;
  },{});

  return <div className="ppBuilderWrap">
    <div className="ppBuilderHeader">
      <div className="categoryTag">Power Play™</div>
      <h2>Power Play™ Builder</h2>
      <p className="mutedText">A tactical scoring modifier that creates high-value windows requiring timing, risk, and commitment decisions. Works with all Checkerboard game systems.</p>
    </div>

    <div className="ppTabBar">
      {['presets','builder','scoring','history'].map(t=><button key={t} type="button"
        className={ppTab===t?'ppTabActive':'ppTabInactive'}
        onClick={()=>setPpTab(t)}>
        {t==='presets'?'Plug & Play':t==='builder'?'Custom Builder':t==='scoring'?'Scoring Builder':'History Log'}
      </button>)}
    </div>

    {/* ── PLUG & PLAY PRESETS ── */}
    {ppTab==='presets'&&<div className="ppPresetGrid">
      {PP_PRESETS.map(preset=><div key={preset.id} className={`ppPresetCard${selectedPreset===preset.id?' ppPresetSelected':''}`}>
        <div className="ppPresetTopRow">
          <span className="ppEngineTag">{preset.engine==='open'?'⚡ Open PP':'🔒 Blind PP'}</span>
          <span className="ppLevelTag">{preset.level}</span>
        </div>
        <h3>{preset.title}</h3>
        <p className="ppPresetRationale">{preset.rationale}</p>

        <div className="ppPresetMeta">
          <span>Format: {preset.format==='two-player'?'Two Player':preset.format}</span>
          <span>Tokens: {preset.tokens}</span>
          <span>Duration: {preset.durationType==='time'?`${preset.durationValue}s`:`${preset.durationValue} rallies`}</span>
          {preset.overlays.length>0&&<span>Overlays: {preset.overlays.map(id=>PP_OVERLAYS.find(o=>o.id===id)?.label||id).join(', ')}</span>}
          <span>Break: {preset.breakCondition==='disabled'?'No break':preset.breakCondition}</span>
        </div>

        <div className="ppPresetCoachNote">
          <strong>Coach Note</strong>
          <p>{preset.coach}</p>
        </div>
        <div className="ppPresetPlayerNote">
          <strong>Player Instructions</strong>
          <p>{preset.player}</p>
        </div>
        <div className="ppPresetScoring">
          <strong>Scoring</strong>
          <p>{preset.scoring}</p>
        </div>

        <div className="ppPresetActions">
          <button type="button" className="primaryBtn" onClick={()=>addPreset(preset)}>Add to Session</button>
          <button type="button" className="secondaryBtn" onClick={()=>setSelectedPreset(selectedPreset===preset.id?null:preset.id)}>
            {selectedPreset===preset.id?'Less':'More'}
          </button>
        </div>
      </div>)}
    </div>}

    {/* ── CUSTOM BUILDER ── */}
    {ppTab==='builder'&&<div className="ppCustomBuilder">
      <div className="ppSection">
        <h3>Step 1 — Engine</h3>
        <div className="ppOptionRow">
          <button type="button" className={engine==='open'?'ppOptionActive':'ppOptionBtn'} onClick={()=>setEngine('open')}>
            ⚡ Open Power Play<span>All players know PP is active</span>
          </button>
          <button type="button" className={engine==='blind'?'ppOptionActive':'ppOptionBtn'} onClick={()=>setEngine('blind')}>
            🔒 Blind Power Play<span>PP activation is secret</span>
          </button>
        </div>
      </div>

      <div className="ppSection">
        <h3>Step 2 — Format</h3>
        <div className="ppChipRow">
          {PP_FORMAT_OPTIONS.map(f=><button key={f} type="button"
            className={format===f?'ppChipActive':'ppChip'}
            onClick={()=>setFormat(f)}>{f}</button>)}
        </div>
      </div>

      <div className="ppSection">
        <h3>Step 3 — Tokens</h3>
        <div className="ppSubSection">
          <strong>Power Plays Per Rotation</strong>
          <div className="ppChipRow">
            {PP_TOKEN_OPTIONS.map(t=><button key={t} type="button"
              className={tokens===t?'ppChipActive':'ppChip'}
              onClick={()=>setTokens(t)}>{t}</button>)}
          </div>
        </div>
        <div className="ppSubSection">
          <strong>Token Refresh</strong>
          <div className="ppChipRow">
            {PP_REFRESH_OPTIONS.map(r=><button key={r} type="button"
              className={tokenRefresh===r?'ppChipActive':'ppChip'}
              onClick={()=>setTokenRefresh(r)}>{r}</button>)}
          </div>
        </div>
        <div className="ppSubSection">
          <strong>Token Visibility</strong>
          <div className="ppChipRow">
            <button type="button" className={tokenVisibility==='coach'?'ppChipActive':'ppChip'} onClick={()=>setTokenVisibility('coach')}>Coach Only</button>
            <button type="button" className={tokenVisibility==='both'?'ppChipActive':'ppChip'} onClick={()=>setTokenVisibility('both')}>Visible to All</button>
            <button type="button" className={tokenVisibility==='hidden'?'ppChipActive':'ppChip'} onClick={()=>setTokenVisibility('hidden')}>Hidden (Blind)</button>
          </div>
        </div>
      </div>

      <div className="ppSection">
        <h3>Step 4 — Duration</h3>
        <div className="ppSubSection">
          <strong>Type</strong>
          <div className="ppChipRow">
            <button type="button" className={durationType==='time'?'ppChipActive':'ppChip'} onClick={()=>setDurationType('time')}>Time Based</button>
            <button type="button" className={durationType==='rally'?'ppChipActive':'ppChip'} onClick={()=>setDurationType('rally')}>Rally Based</button>
          </div>
        </div>
        <div className="ppSubSection">
          <strong>Duration</strong>
          <div className="ppChipRow">
            {(durationType==='time'?PP_TIME_OPTIONS:PP_RALLY_OPTIONS).map(v=><button key={v} type="button"
              className={durationValue===v?'ppChipActive':'ppChip'}
              onClick={()=>setDurationValue(v)}>{durationType==='time'?`${v}s`:v==='Custom'?v:`${v} rallies`}</button>)}
          </div>
        </div>
      </div>

      {engine==='open'&&<div className="ppSection">
        <h3>Step 5 — Break Condition</h3>
        <p className="mutedText">Opponent may terminate an Open Power Play early by winning consecutive rallies.</p>
        <div className="ppChipRow">
          {PP_BREAK_OPTIONS.map(b=><button key={b} type="button"
            className={breakCondition===b?'ppChipActive':'ppChip'}
            onClick={()=>setBreakCondition(b)}>{b}</button>)}
        </div>
      </div>}

      <div className="ppSection">
        <h3>Step 6 — Scoring</h3>
        <div className="ppOptionRow">
          <button type="button" className={scoringMode==='exclusive'?'ppOptionActive':'ppOptionBtn'} onClick={()=>setScoringMode('exclusive')}>
            Exclusive Scoring<span>Only PP player scores during Power Play</span>
          </button>
          <button type="button" className={scoringMode==='bonus'?'ppOptionActive':'ppOptionBtn'} onClick={()=>setScoringMode('bonus')}>
            Bonus Scoring<span>Both players score — PP player gets bonuses</span>
          </button>
          <button type="button" className={scoringMode==='custom'?'ppOptionActive':'ppOptionBtn'} onClick={()=>setScoringMode('custom')}>
            Custom<span>Coach configures scoring</span>
          </button>
        </div>
      </div>

      <div className="ppSection">
        <h3>Step 7 — Overlays</h3>
        <p className="mutedText">Select any overlays to layer on top of the Power Play engine.</p>
        {Object.entries(overlaysByCategory).map(([cat,overlays])=><div key={cat} className="ppOverlayCat">
          <strong>{cat}</strong>
          <div className="ppChipRow">
            {overlays.map(o=><button key={o.id} type="button"
              className={selectedOverlays.includes(o.id)?'ppChipActive':'ppChip'}
              onClick={()=>toggleOverlay(o.id)}>{o.label}</button>)}
          </div>
        </div>)}
      </div>

      <div className="ppSection">
        <strong>Game Title (optional)</strong>
        <input className="ppTitleInput" value={customTitle} onChange={e=>setCustomTitle(e.target.value)} placeholder="Custom Power Play title..." />
      </div>

      <button type="button" className="primaryBtn ppAddBtn" onClick={addCustom}>Add Custom Power Play to Session</button>
    </div>}

    {/* ── SCORING BUILDER ── */}
    {ppTab==='scoring'&&<div className="ppScoringBuilder">
      <div className="ppScoringHero">
        <h3>Power Play Scoring Builder</h3>
        <p>Set exact scoring parameters for a custom Power Play window. All values are coach-configurable.</p>
      </div>

      <div className="ppScoringSection">
        <strong>Number of Rallies in PP Window</strong>
        <div className="ppChipRow">
          {[1,2,3,4,5,6,7,8,10].map(n=><button key={n} type="button"
            className={ppRallies===n?'ppChipActive':'ppChip'}
            onClick={()=>updatePpRallies(n)}>{n}</button>)}
        </div>
      </div>

      <div className="ppScoringSection">
        <strong>Points Per Rally Win</strong>
        <p className="ppScoringHint">Set points for each rally in sequence. Rally 1 is always first.</p>
        <div className="ppRallyPointsGrid">
          {Array.from({length:ppRallies},(_,i)=><div key={i} className="ppRallyPointRow">
            <span>Rally {i+1}</span>
            <div className="ppRallyPointBtns">
              {[1,2,3,4,5].map(pts=><button key={pts} type="button"
                className={ppRallyPoints[i]===pts?'ppChipActive':'ppChip'}
                onClick={()=>updateRallyPoints(i,pts)}>{pts}</button>)}
            </div>
            <span className="ppRallyPtsBadge">+{ppRallyPoints[i]||1}</span>
          </div>)}
        </div>
      </div>

      <div className="ppScoringSection">
        <strong>Completion Bonus (win all {ppRallies} rallies)</strong>
        <div className="ppChipRow">
          {[0,1,2,3,5,8,10].map(n=><button key={n} type="button"
            className={ppCompletionBonus===n?'ppChipActive':'ppChip'}
            onClick={()=>setPpCompletionBonus(n)}>{n===0?'None':'+'+n}</button>)}
        </div>
      </div>

      <div className="ppScoringSection">
        <strong>Disruptor — Successive Wins Required for Bonus</strong>
        <div className="ppChipRow">
          {[2,3,4,5].map(n=><button key={n} type="button"
            className={ppDisruptorWins===n?'ppChipActive':'ppChip'}
            onClick={()=>setPpDisruptorWins(n)}>{n} in a row</button>)}
        </div>
      </div>

      <div className="ppScoringSection">
        <strong>Disruptor Bonus Points</strong>
        <div className="ppChipRow">
          {[1,2,3,4,5].map(n=><button key={n} type="button"
            className={ppDisruptorBonus===n?'ppChipActive':'ppChip'}
            onClick={()=>setPpDisruptorBonus(n)}>{'+'+n}</button>)}
        </div>
      </div>

      <div className="ppScoringSection">
        <strong>PP Player Partial Score if Disrupted</strong>
        <div className="ppChipRow">
          <button type="button" className={ppPartialScore?'ppChipActive':'ppChip'} onClick={()=>setPpPartialScore(true)}>Keep rally points won</button>
          <button type="button" className={!ppPartialScore?'ppChipActive':'ppChip'} onClick={()=>setPpPartialScore(false)}>Lose all points if disrupted</button>
        </div>
      </div>

      <div className="ppScoringSummary">
        <strong>Scoring Summary</strong>
        <div className="ppScoringSummaryGrid">
          <div className="ppSummaryRow ppSummaryWin">
            <span>PP wins all {ppRallies} rallies</span>
            <strong>{ppRallyPoints.reduce((a,b)=>a+b,0)} + {ppCompletionBonus} bonus = {ppTotalIfWinAll} points</strong>
          </div>
          <div className="ppSummaryRow">
            <span>Per rally (sequence)</span>
            <strong>{ppRallyPoints.map((p,i)=>'R'+(i+1)+': +'+ p).join(' · ')}</strong>
          </div>
          <div className="ppSummaryRow ppSummaryDisrupt">
            <span>Disruptor wins {ppDisruptorWins} in a row</span>
            <strong>Disruptor: +{ppDisruptorBonus} · PP player: {ppPartialScore?'keeps rally points':'loses all points'}</strong>
          </div>
        </div>
        <button type="button" className="primaryBtn" style={{marginTop:'14px',width:'100%'}} onClick={()=>{
          const rallyStr=ppRallyPoints.map((p,i)=>'R'+(i+1)+'+'+p).join('/');
          const scoring='PP Window: '+ppRallies+' rallies. Points: '+rallyStr+'. Completion bonus: +'+ppCompletionBonus+'. Total if all won: '+ppTotalIfWinAll+'. Disruptor: '+ppDisruptorWins+' successive wins = +'+ppDisruptorBonus+'. PP partial: '+(ppPartialScore?'yes':'no')+'.';
          onAddToSession({title:'Custom PP Scoring',category:'Power Play',task:scoring,scoring,duration:15});
          setPpStatus('Custom scoring added to session.');
        }}>Add This Scoring to Session</button>
      </div>
    </div>}

    {/* ── HISTORY LOG ── */}
    {ppTab==='history'&&<div className="ppHistoryLog">
      <h3>Power Play History</h3>
      {ppHistory.length===0&&<p className="mutedText">No Power Play activity recorded yet. Add a preset or custom Power Play to session to start logging.</p>}
      {ppHistory.map(entry=><div key={entry.id} className="ppHistoryEntry">
        <strong>{entry.title}</strong>
        <span>{entry.activatedAt}</span>
        <span className="ppHistoryType">{entry.type}</span>
      </div>)}
      {ppHistory.length>0&&<button type="button" className="secondaryBtn" onClick={()=>setPpHistory([])}>Clear History</button>}
    </div>}

    {ppStatus&&<div className="statusBox">{ppStatus}</div>}
  </div>;
}

// ─────────────────────────────────────────────────────────────────────────────


// ─── AROUND THE BOARD BUILDER ────────────────────────────────────────────────

const ATB_OVERLAYS=[
  'Clean Winner','Opponent Off T','T Challenge','Blind Finish',
  'Weak Side','Double Bounce','Quality Length Before Attack',
  'Volley Finish','4 Shot Conversion','2 Shot Conversion'
];

const ATB_FLOOR_ZONES={
  1:{label:'Zone 1',desc:'Front right',color:'#1d4ed8',short:'FR'},
  2:{label:'Zone 2',desc:'Front left',color:'#059669',short:'FL'},
  3:{label:'Zone 3',desc:'Back right',color:'#b45309',short:'BR'},
  4:{label:'Zone 4',desc:'Back left',color:'#7c3aed',short:'BL'},
};

const ATB_WALL_ZONES={
  5:{label:'Zone 5',desc:'Front wall top left',color:'#dc2626',short:'FW-TL'},
  6:{label:'Zone 6',desc:'Front wall top right',color:'#0891b2',short:'FW-TR'},
  7:{label:'Zone 7',desc:'Front wall bottom right',color:'#65a30d',short:'FW-BR'},
  8:{label:'Zone 8',desc:'Front wall bottom left',color:'#c026d3',short:'FW-BL'},
};

const ATB_GAME_FAMILIES=[
  {
    id:'sequential',
    title:'Sequential Around The Board',
    subtitle:'1 → 2 → 3 → 4 in order',
    emoji:'🔢',
    purpose:'Develop awareness of all four floor quadrants in a structured sequence.',
    rationale:'Sequential targeting builds systematic court awareness. The leader sets the pace and chooses the route to each zone — the follower must find their own solution to occupy the same space.',
    task:'Leader completes zones 1 → 2 → 3 → 4 in order. Follower completes the same sequence. After completion the sequence restarts. Route to each zone is unrestricted.',
    scoring:'Checkerboard: Win Rally +1, Zone Completion +1, Full Circuit +2.',
    levels:['A — Coach calls zone','B — Leader calls zone aloud','C — Leader chooses silently','D — Four zones then open rally'],
    coach:'Watch for players who hit the same shot every time to reach the zone. The constraint is occupancy, not trajectory. If a player finds only one solution, reduce the zone size or add a Checkerboard overlay.',
    player:'Reach each zone in order. How you get there is your choice.',
    develops:['Systematic court awareness','Zone recognition','Movement planning','Sequential memory'],
  },
  {
    id:'circuit',
    title:'Complete The Circuit',
    subtitle:'All 4 zones — any order',
    emoji:'🔄',
    purpose:'Develop planning, memory and full-court awareness.',
    rationale:'Removing the sequence requirement forces the player to track which zones have been completed. This adds a memory and planning dimension while preserving the spatial challenge.',
    task:'Leader chooses zones freely but must complete all four (1, 2, 3, 4) before restarting. The order is their choice. Follower completes the same circuit.',
    scoring:'Single Circuit +1, Double Circuit +2, Triple Circuit +3.',
    levels:['Standard — all 4 zones in any order','Advanced — timed circuit under pressure','Elite — circuit against live opponent'],
    coach:'Note whether players complete the circuit efficiently or revisit zones. Revisiting tells you about working memory and spatial planning under pressure.',
    player:'Complete all four zones in any order. Track what you have used.',
    develops:['Court planning','Working memory','Spatial awareness','Decision making'],
  },
  {
    id:'free',
    title:'Free Around The Board',
    subtitle:'Leader chooses — follower matches',
    emoji:'🆓',
    purpose:'Reactive adaptation, recognition and decision making.',
    rationale:'The leader has full spatial freedom. The follower must read, react and find a different route to the same destination. This is the most representative form — it mirrors tactical decision making in competition.',
    task:'Leader chooses any zone freely. Follower uses the same zone. No sequence requirement. The game is won by completing the most zones.',
    scoring:'Win Rally +1, Zone Completion +1.',
    levels:['Basic — floor zones only','Intermediate — introduce wall zones','Advanced — hybrid wall-floor combinations'],
    coach:'The follower should not copy the leader shot. Watch for copying — it means the player is in imitation mode rather than problem-solving mode. Change the overlay or add a route restriction.',
    player:'Match the zone. Find your own route.',
    develops:['Reactive adaptation','Opponent reading','Spatial recognition','Independence'],
  },
  {
    id:'prescribed',
    title:'Prescribed Routes',
    subtitle:'Coach sets the sequence',
    emoji:'📋',
    purpose:'Specific spatial challenges targeting known weaknesses.',
    rationale:'Prescribed routes allow the coach to target specific spatial combinations. A player who avoids the back corners can be given a route that requires repeated back-corner occupation.',
    task:'Coach selects a route — for example 1-4-2-3. Leader follows the route. Follower follows the same route. After completion: open play.',
    examples:['1-4-2-3','2-3-1-4','4-1-3-2','1-3-4-2','2-4-1-3','3-1-4-2'],
    scoring:'Win Rally +1, Route Completion +2.',
    levels:['Guided — coach sets route each circuit','Remembered — player memorises route','Pressure — route completed under match pressure'],
    coach:'Choose routes that expose the spatial pattern you want to change. A player who always plays short can be given routes that require repeated length.',
    player:'Follow the route. After the final zone — open play.',
    develops:['Spatial flexibility','Route memory','Targeted awareness','Adaptability'],
  },
  {
    id:'opposite',
    title:'Opposite Zone',
    subtitle:'Leader plays — follower plays opposite',
    emoji:'↔',
    purpose:'Directional adaptation, recognition and movement variation.',
    rationale:'Playing the opposite zone forces the follower to solve a spatial problem in real time. It is an ecological constraint that promotes spatial thinking without instruction.',
    task:'Leader plays any zone. Follower must play the linear or diagonal opposite.',
    linear:['1 ↔ 2 (front right ↔ front left)','3 ↔ 4 (back right ↔ back left)'],
    diagonal:['1 ↔ 3 (front right ↔ back left)','2 ↔ 4 (front left ↔ back right) — wait, 1↔4, 2↔3'],
    scoring:'Win Rally +1, Correct Opposite Zone +2.',
    levels:['Linear opposite only','Diagonal opposite only','Leader calls linear or diagonal','Free choice'],
    coach:'Errors in the opposite zone reveal whether the player has a mental model of the court. Spatial errors without movement errors suggest a cognitive mapping problem.',
    player:'Leader plays a zone. You play the opposite — linear or diagonal.',
    develops:['Spatial reasoning','Directional flexibility','Court mapping','Reactive decision making'],
  },
  {
    id:'wall',
    title:'Wall Around The Board',
    subtitle:'Zones 5 · 6 · 7 · 8',
    emoji:'🧱',
    purpose:'Wall awareness, shot variety and wall targeting.',
    rationale:'Wall zones require different ball trajectories and shot selections. The follower only needs to use the same wall zone — not duplicate the shot. This opens up tactical variety and develops wall awareness at all levels.',
    task:'Leader uses front wall zones 5-8. Follower uses the same front wall zone. Shot trajectory is completely unrestricted. Only zone occupancy matters.',
    scoring:'Win Rally +1, Wall Zone Completion +1.',
    levels:['Zones 5-6 (top) only','Introduce zones 7-8 (bottom)','All four front wall zones','Wall zones combined with floor zones'],
    coach:'Top zones (5-6) typically require more height and pace. Bottom zones (7-8) reward tight, low shots. Note which zones players avoid — this reveals their shot repertoire gaps.',
    player:'Use the same wall zone as the leader. Any trajectory is valid.',
    develops:['Wall awareness','Shot variety','Spatial targeting','Tactical range'],
  },
  {
    id:'hybrid',
    title:'Hybrid Wall-Floor',
    subtitle:'Wall + Floor combinations',
    emoji:'🔀',
    purpose:'Integrate front wall and floor awareness.',
    rationale:'Hybrid combinations create the richest spatial challenge. Players must solve both the wall contact zone and the floor landing zone simultaneously. This is representative of high-level squash decision making.',
    task:'Leader occupies a wall-floor combination — for example [5-1] means front wall right, landing zone 1. Follower occupies the same combination. Route is unrestricted.',
    combinations:['[5-1] Front wall right → Front right floor','[6-2] Front wall left → Front left floor','[7-3] Side wall right → Back right floor','[8-4] Side wall left → Back left floor','[5-3] Front wall right → Back right floor','[6-4] Front wall left → Back left floor'],
    scoring:'Win Rally +1, Combination Completion +2.',
    levels:['Two combinations only','Four standard combinations','All six combinations','Free hybrid selection'],
    coach:'This is the most advanced form. Introduce only when players are fluent in wall zones and floor zones independently.',
    player:'Match the wall zone and the floor landing zone. Any route.',
    develops:['Full court integration','Advanced spatial awareness','Tactical shot range','Planning and execution'],
  },
  {
    id:'completecourt',
    title:'Complete The Court',
    subtitle:'All 8 zones — full court',
    emoji:'⬛',
    purpose:'Full-court awareness and advanced planning.',
    rationale:'Completing all eight zones requires systematic coverage of the entire court. This is the highest-level Around The Board challenge — it develops comprehensive spatial awareness across both wall and floor zones.',
    task:'Player must complete all eight zones (1-2-3-4 floor, 5-6-7-8 wall) before restarting. Any order. Both leader and follower complete the full circuit.',
    scoring:'Full Circuit Completion +4.',
    levels:['Floor zones only (1-4) as foundation','Add two wall zones','Full eight-zone circuit'],
    coach:'Very few players will complete the full eight-zone circuit under pressure. Use this as an advanced development challenge rather than a standard session activity.',
    player:'Complete all eight zones. Any order. Full court.',
    develops:['Comprehensive court awareness','Advanced planning','Shot range','Elite spatial intelligence'],
  },
];

const ATB_RLD_LEVELS=[
  {level:1,label:'Coach Called',desc:'Coach calls each zone target',color:'#ef4444',dot:'●'},
  {level:2,label:'Leader Called',desc:'Leader calls zone aloud before playing',color:'#f97316',dot:'●'},
  {level:3,label:'Leader Selected',desc:'Leader chooses silently — no announcement',color:'#eab308',dot:'●'},
  {level:4,label:'Under Pressure',desc:'Leader selects targets during live competitive play',color:'#86efac',dot:'●'},
  {level:5,label:'Open Play',desc:'Zones emerge naturally from game play — no calling',color:'#4ade80',dot:'⦿'},
];

const ATB_SCORING_OPTIONS=[
  {id:'standard',label:'Standard Rally',desc:'Win Rally = +1. Simple scoring.'},
  {id:'checkerboard',label:'Checkerboard Scoring',desc:'Win Rally +1 · Zone Completion +1 · Full Circuit +2'},
  {id:'challenge',label:'Challenge Scoring',desc:'Single Circuit +1 · Double Circuit +2 · Triple Circuit +3'},
];

function AroundTheBoardBuilder({onAddToSession}){
  const [activeFamily,setActiveFamily]=useState(null);
  const [activeTab,setActiveTab]=useState('families');
  const [selectedLevel,setSelectedLevel]=useState(null);
  const [scoringOption,setScoringOption]=useState('checkerboard');
  const [rldLevel,setRldLevel]=useState(3);
  const [selectedOverlays,setSelectedOverlays]=useState([]);
  const [customRoute,setCustomRoute]=useState('');
  const [selectedGameLogic,setSelectedGameLogic]=useState([]);
  const [selectedScoringLogic,setSelectedScoringLogic]=useState([]);
  const [selectedConstraints,setSelectedConstraints]=useState([]);
  const [dbHandicap,setDbHandicap]=useState('No DB');

  const ATB_GAME_LOGIC_OPTIONS=[
    'T-Zone Prevention','4-Shot Conversion','2-Shot Conversion',
    'Length Before Attack','Challenge Completion Required','Double Bounce Allowed',
  ];
  const ATB_SCORING_LOGIC_OPTIONS=[
    'Win Rally +1','Zone Completion +1','Circuit Completion +2',
    'Clean Winner +2','Volley Finish +2','Challenge Bonus +1',
  ];
  const ATB_CONSTRAINT_OPTIONS=[
    'Blue Danube Waltz','Foam Ball','Red Dot Ball','Orange Dot Ball',
    'Recovery Cone','Volley Only','External Focus Cue','No Coaching',
  ];

  function toggleItem(setter,item){setter(prev=>prev.includes(item)?prev.filter(x=>x!==item):[...prev,item]);}
  function toggleOverlay(o){setSelectedOverlays(prev=>prev.includes(o)?prev.filter(x=>x!==o):[...prev,o]);}

  function buildAndAdd(family){
    const scoring=ATB_SCORING_OPTIONS.find(s=>s.id===scoringOption);
    const rld=ATB_RLD_LEVELS.find(r=>r.level===rldLevel);
    const lvl=selectedLevel||family.levels[0];
    const allLayers=['Around The Board',...selectedOverlays,...selectedGameLogic,...selectedScoringLogic,...selectedConstraints];
    const gameLogicStr=selectedGameLogic.length?` · Game Logic: ${selectedGameLogic.join(', ')}`:'';
    const scoringLogicStr=selectedScoringLogic.length?` · Scoring: ${selectedScoringLogic.join(', ')}`:` · Scoring: ${scoring.desc}`;
    const constraintStr=selectedConstraints.length?` · Constraints: ${selectedConstraints.join(', ')}`:'';
    const dbStr=dbHandicap!=='No DB'?` · DB: ${dbHandicap}`:'';
    onAddToSession({
      id:Date.now()+Math.random(),
      title:family.title,
      category:'Around The Board',
      task:`${family.task}${family.id==='prescribed'&&customRoute?` Route: ${customRoute}`:''} · Level: ${lvl}`,
      rationale:family.rationale,
      coach:family.coach,
      playerFocus:family.player,
      scoring:scoring.desc+gameLogicStr+scoringLogicStr+constraintStr+dbStr,
      layers:allLayers,
      rld:rld.label,
      duration:15,
    });
  }

  const family=ATB_GAME_FAMILIES.find(f=>f.id===activeFamily);

  return <div className="atbBuilder">

    {/* Header */}
    <div className="atbHeader">
      <div className="categoryTag" style={{background:'#0e7490',marginBottom:'10px',display:'inline-block'}}>Around The Board</div>
      <h2>Around The Board</h2>
      <p className="atbSubtitle">Occupy Space. Create Solutions.</p>
      <p className="mutedText">Players learn to recognise and use different areas of the court while remaining in representative squash. The game rewards occupancy of affordance spaces — not technical execution.</p>
    </div>

    {/* Tab bar */}
    <div className="atbTabBar">
      {[{id:'families',label:'🎮 Game Families'},{id:'settings',label:'⚙ Settings'},{id:'court',label:'🗺 Court Map'},{id:'principles',label:'📋 Principles'}].map(t=>
        <button key={t.id} type="button" className={activeTab===t.id?'atbTabActive':'atbTabBtn'} onClick={()=>setActiveTab(t.id)}>{t.label}</button>
      )}
    </div>

    {/* ── GAME FAMILIES ── */}
    {activeTab==='families'&&<div className="atbFamilySection">
      {!activeFamily
        ?<div className="atbFamilyGrid">
          {ATB_GAME_FAMILIES.map(f=><div key={f.id} className="atbFamilyCard" onClick={()=>setActiveFamily(f.id)} role="button" tabIndex={0}>
            <div className="atbFamilyEmoji">{f.emoji}</div>
            <strong>{f.title}</strong>
            <span>{f.tagline}</span>
            <p>{f.rationale}</p>
          </div>)}
        </div>
        :<div className="atbFamilyDetail">
          <button type="button" className="secondaryBtn atbBackBtn" onClick={()=>setActiveFamily(null)}>← All Families</button>
          <div className="atbDetailHeader">
            <span className="atbDetailEmoji">{family.emoji}</span>
            <div>
              <h2>{family.title}</h2>
              <span className="atbDetailSub">{family.subtitle}</span>
            </div>
          </div>

          <div className="atbDetailGrid">
            <div className="atbDetailCard atbPurpose">
              <strong>Purpose</strong><p>{family.purpose}</p>
            </div>
            <div className="atbDetailCard atbRationale">
              <strong>Rationale</strong><p>{family.rationale}</p>
            </div>
            <div className="atbDetailCard atbTask">
              <strong>Task</strong><p>{family.task}</p>
              {family.id==='prescribed'&&<div style={{marginTop:'10px'}}>
                <strong style={{display:'block',marginBottom:'6px',color:'#9bc1ff',fontSize:'12px'}}>Example Routes</strong>
                <div className="atbRouteChips">{(family.examples||[]).map(r=><button key={r} type="button" className={customRoute===r?'atbRouteActive':'atbRouteChip'} onClick={()=>setCustomRoute(r)}>{r}</button>)}</div>
                <input className="atbRouteInput" value={customRoute} onChange={e=>setCustomRoute(e.target.value)} placeholder="Or type custom route e.g. 1-3-2-4"/>
              </div>}
              {family.combinations&&<div style={{marginTop:'10px'}}>
                <strong style={{display:'block',marginBottom:'6px',color:'#9bc1ff',fontSize:'12px'}}>Standard Combinations</strong>
                <div className="atbRouteChips">{family.combinations.map(c=><span key={c} className="atbComboTag">{c}</span>)}</div>
              </div>}
              {family.linear&&<div style={{marginTop:'10px'}}>
                <div className="atbOppositeGrid">
                  <div><strong style={{color:'#4ade80',fontSize:'12px'}}>Linear</strong>{family.linear.map(l=><p key={l} style={{color:'#c4c9d9',fontSize:'13px',margin:'4px 0'}}>{l}</p>)}</div>
                </div>
              </div>}
            </div>
            <div className="atbDetailCard atbCoach">
              <strong>Coach Note</strong><p>{family.coach}</p>
            </div>
            <div className="atbDetailCard atbPlayer">
              <strong>Player Instruction</strong><p>{family.player}</p>
            </div>
            <div className="atbDetailCard atbDevelops">
              <strong>Develops</strong>
              <div className="atbDevelopsPills">{family.develops.map(d=><span key={d}>{d}</span>)}</div>
            </div>
          </div>

          <div className="atbLevelsSection">
            <strong>Level Variations</strong>
            <div className="atbLevelBtns">
              {family.levels.map(l=><button key={l} type="button"
                className={selectedLevel===l?'atbLevelActive':'atbLevelBtn'}
                onClick={()=>setSelectedLevel(l)}>{l}</button>)}
            </div>
          </div>

          <div className="atbRLDSection">
            <strong>Representative Learning Demand</strong>
            <div className="atbRLDRow">
              {ATB_RLD_LEVELS.map(r=><button key={r.level} type="button"
                className={'atbRLDBtn'+(rldLevel===r.level?' atbRLDActive':'')}
                style={rldLevel===r.level?{borderColor:r.color,background:r.color+'22'}:{}}
                onClick={()=>setRldLevel(r.level)}>
                <span style={{color:r.color,fontSize:'18px'}}>{r.dot}</span>
                <strong>{r.label}</strong>
                <span>{r.desc}</span>
              </button>)}
            </div>
          </div>

          <div className="atbScoringSection">
            <strong>Scoring</strong>
            <div className="atbScoringBtns">
              {ATB_SCORING_OPTIONS.map(s=><button key={s.id} type="button"
                className={scoringOption===s.id?'atbScoringActive':'atbScoringBtn'}
                onClick={()=>setScoringOption(s.id)}>
                <strong>{s.label}</strong>
                <span>{s.desc}</span>
              </button>)}
            </div>
          </div>

          <CollapsibleLayer num="1" title="Game Logic" subtitle="What counts — eligibility and validity" color="green">
            <div className="atbOverlayChips">
              {ATB_GAME_LOGIC_OPTIONS.map(o=><button key={o} type="button"
                className={selectedGameLogic.includes(o)?'atbOverlayActive':'atbOverlayChip'}
                onClick={()=>toggleItem(setSelectedGameLogic,o)}>{o}</button>)}
            </div>
          </CollapsibleLayer>

          <CollapsibleLayer num="2" title="Scoring Logic" subtitle="How points are awarded" color="gold">
            <div className="atbOverlayChips">
              {ATB_SCORING_LOGIC_OPTIONS.map(o=><button key={o} type="button"
                className={selectedScoringLogic.includes(o)?'atbOverlayActive':'atbOverlayChip'}
                onClick={()=>toggleItem(setSelectedScoringLogic,o)}>{o}</button>)}
            </div>
          </CollapsibleLayer>

          <CollapsibleLayer num="3" title="Constraints" subtitle="Shape behaviour without changing rules" color="blue">
            <div className="atbOverlayChips">
              {ATB_CONSTRAINT_OPTIONS.map(o=><button key={o} type="button"
                className={selectedConstraints.includes(o)?'atbOverlayActive':'atbOverlayChip'}
                onClick={()=>toggleItem(setSelectedConstraints,o)}>{o}</button>)}
            </div>
          </CollapsibleLayer>

          <CollapsibleLayer num="4" title="DB Handicap" subtitle="Double bounce allowance — assign selectively" color="purple">
            <div className="atbOverlayChips">
              {UNIVERSAL_DB_OPTIONS.map(o=><button key={o} type="button"
                className={dbHandicap===o?'atbOverlayActive':'atbOverlayChip'}
                onClick={()=>setDbHandicap(o)}>{o}</button>)}
            </div>
          </CollapsibleLayer>

          <CollapsibleLayer num="+" title="Checkerboard Overlays" subtitle="Optional tactical overlays" color="teal">
            <div className="atbOverlayChips">
              {ATB_OVERLAYS.map(o=><button key={o} type="button"
                className={selectedOverlays.includes(o)?'atbOverlayActive':'atbOverlayChip'}
                onClick={()=>toggleOverlay(o)}>{o}</button>)}
            </div>
          </CollapsibleLayer>

          <button type="button" className="primaryBtn atbAddBtn" onClick={()=>buildAndAdd(family)}>
            Add {family.title} to Session
          </button>
        </div>
      }
    </div>}

    {/* ── SETTINGS ── */}
    {activeTab==='settings'&&<div className="atbSettingsPanel">
      <h3>Global Settings</h3>
      <div className="atbSettingSection">
        <strong>Default Scoring Mode</strong>
        <div className="atbScoringBtns">
          {ATB_SCORING_OPTIONS.map(s=><button key={s.id} type="button"
            className={scoringOption===s.id?'atbScoringActive':'atbScoringBtn'}
            onClick={()=>setScoringOption(s.id)}>
            <strong>{s.label}</strong>
            <span>{s.desc}</span>
          </button>)}
        </div>
      </div>
      <div className="atbSettingSection">
        <strong>Default RLD Level</strong>
        <div className="atbRLDRow">
          {ATB_RLD_LEVELS.map(r=><button key={r.level} type="button"
            className={'atbRLDBtn'+(rldLevel===r.level?' atbRLDActive':'')}
            style={rldLevel===r.level?{borderColor:r.color,background:r.color+'22'}:{}}
            onClick={()=>setRldLevel(r.level)}>
            <span style={{color:r.color,fontSize:'18px'}}>{r.dot}</span>
            <strong>{r.label}</strong>
            <span>{r.desc}</span>
          </button>)}
        </div>
      </div>
    </div>}

    {/* ── COURT MAP ── */}
    {activeTab==='court'&&<div className="atbCourtPanel">
      <h3>Court Zone Map</h3>
      <p className="mutedText">Visual reference for all 8 zones. Floor zones 1-4 in blue tones. Wall zones 5-8 in warm tones.</p>
      <div className="atbCourtDiagram">
        <div className="atbCourtFrontWall">
          <div className="atbWallLabel">Front Wall — Zones 5 to 8</div>
          <div className="atbFrontWallGrid">
            <div className="atbWallZone" style={{background:'#dc262622',borderColor:'#dc2626'}}><span>5</span><small>Top Left</small></div>
            <div className="atbWallZone" style={{background:'#0891b222',borderColor:'#0891b2'}}><span>6</span><small>Top Right</small></div>
            <div className="atbWallZone" style={{background:'#c026d322',borderColor:'#c026d3'}}><span>8</span><small>Bottom Left</small></div>
            <div className="atbWallZone" style={{background:'#65a30d22',borderColor:'#65a30d'}}><span>7</span><small>Bottom Right</small></div>
          </div>
        </div>
      </div>
      <div className="atbZoneKey">
        <strong>Floor Zones</strong>
        <div className="atbZoneKeyGrid">
          {Object.entries(ATB_FLOOR_ZONES).map(([k,v])=><div key={k} className="atbZoneKeyItem" style={{borderColor:v.color}}>
            <span style={{color:v.color,fontWeight:900}}>{k}</span><strong>{v.desc}</strong>
          </div>)}
        </div>
        <strong style={{marginTop:'12px',display:'block'}}>Wall Zones</strong>
        <div className="atbZoneKeyGrid">
          {Object.entries(ATB_WALL_ZONES).map(([k,v])=><div key={k} className="atbZoneKeyItem" style={{borderColor:v.color}}>
            <span style={{color:v.color,fontWeight:900}}>{k}</span><strong>{v.desc}</strong>
          </div>)}
        </div>
      </div>
    </div>}

    {/* ── PRINCIPLES ── */}
    {activeTab==='principles'&&<div className="atbPrinciplesPanel">
      <h3>Around The Board Principles</h3>
      <div className="atbPrinciplesGrid">
        {[
          {p:'Occupancy before technique',d:'The goal is to occupy the target zone. How the player gets there is their own solution.'},
          {p:'Space before stroke',d:'The spatial problem comes first. The stroke emerges from the movement solution.'},
          {p:'Perception before correction',d:'If a player cannot occupy a zone consistently, check their reading of available space before correcting technique.'},
          {p:'Variability before repetition',d:'The value of Around The Board is in the variety of solutions required. Do not reduce variability by prescribing routes unnecessarily.'},
          {p:'Adaptation before perfection',d:'Players do not need to reproduce identical shots. They only need to achieve the same target outcome.'},
          {p:'Discovery before instruction',d:'Let players find solutions to spatial problems through exploration. Only intervene when the player is not solving the problem at all.'},
        ].map(item=><div key={item.p} className="atbPrincipleCard">
          <strong>{item.p}</strong>
          <p>{item.d}</p>
        </div>)}
      </div>
      <div className="atbCoreLogic">
        <h3>Core Game Logic — Leader-Follower Model</h3>
        <div className="atbLogicGrid">
          <div className="atbLogicCard"><strong>Leader</strong><p>Selects the target zone. Chooses any route, shot or trajectory to occupy it.</p></div>
          <div className="atbLogicCard"><strong>Follower</strong><p>Must also occupy the same zone. Route is completely unrestricted. No copying required.</p></div>
          <div className="atbLogicCard atbLogicKey"><strong>Key Rule</strong><p>Players are never required to copy trajectories or swing patterns. Only target completion matters. This preserves representative play.</p></div>
        </div>
      </div>
    </div>}

  </div>;
}


function Games({setSession,setScreen}){
  const [activeClassId,setActiveClassId]=useState(()=>localStorage.getItem(GAME_LIBRARY_CLASS_KEY)||null);
  const [message,setMessage]=useState('');
  const [savedCards,setSavedCards]=useState(()=>{
    try{
      const saved=localStorage.getItem(GAME_LIBRARY_KEY);
      return saved?JSON.parse(saved).map(normaliseGameCard):[];
    }catch{return[];}
  });
  const [editingCard,setEditingCard]=useState(null);
  const [logicCard,setLogicCard]=useState(()=>{try{const saved=localStorage.getItem(GAME_LIBRARY_DRAFT_KEY);return saved?JSON.parse(saved):null;}catch{return null;}});

  useEffect(()=>{
    localStorage.setItem(GAME_LIBRARY_KEY,JSON.stringify(savedCards));
  },[savedCards]);
  useEffect(()=>{
    if(activeClassId)localStorage.setItem(GAME_LIBRARY_CLASS_KEY,activeClassId);
    else localStorage.removeItem(GAME_LIBRARY_CLASS_KEY);
  },[activeClassId]);
  useEffect(()=>{
    if(logicCard)localStorage.setItem(GAME_LIBRARY_DRAFT_KEY,JSON.stringify(logicCard));
    else localStorage.removeItem(GAME_LIBRARY_DRAFT_KEY);
  },[logicCard]);

  const gameClasses=[
    {id:'atl',label:'ATL / BTL',category:'ATL / BTL'},
    {id:'checkerboard',label:'Checkerboard',category:'Checkerboard'},
    {id:'atb',label:'Around The Board',category:'Around The Board'},
    {id:'powerplay',label:'Power Play™',category:'Power Play'},
    {id:'pressure',label:'Pressure',category:'Pressure'},
    {id:'tacticalpressure',label:'Tactical Pressure',category:'Tactical Pressure'},
    {id:'classic',label:'Classic Games',category:'Classic Conditioned'},
    {id:'technical',label:'Technical',category:'Technical'},
    {id:'volley',label:'Volley & Intercept',category:'Volley & Intercept'},
    {id:'information',label:'Information & Anticipation',category:'Information & Anticipation'},
    {id:'doubleBounce',label:'Double Bounce',category:'Double Bounce'},
    {id:'rotations',label:'Rotations',category:'Rotations'},
    {id:'custom',label:'Custom',category:'Custom'},
    {id:'saved',label:'Saved Cards',category:'Saved Cards'}
  ];

  const activeClass=gameClasses.find(item=>item.id===activeClassId);
  const activeCategory=activeClass?.category||null;
  const visibleCards=activeClassId==='saved'?savedCards:savedCards.filter(card=>card.category===activeCategory);

  function addAndGo(game){
    const safeGame={...game,id:game.id||Date.now()+Math.random()};
    let finalGame=safeGame;
    try{ finalGame={...normaliseGameCard(safeGame),...safeGame}; }catch{ finalGame=safeGame; }
    setLogicCard(finalGame);
    setMessage('Base game built and held on this page. Add Game Logic below, or add the base game only.');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function addStay(game){
    const safeGame={...game,id:game.id||Date.now()+Math.random()};
    let finalGame=safeGame;
    try{ finalGame={...normaliseGameCard(safeGame),...safeGame}; }catch{ finalGame=safeGame; }
    setSession(prev=>[...prev,finalGame]);
    setMessage(`${game.title||'Game'} added to current session.`);
  }

  function saveCard(card){
    const clean=normaliseGameCard(card);
    setSavedCards(prev=>{
      const exists=prev.some(item=>item.id===clean.id);
      return exists?prev.map(item=>item.id===clean.id?clean:item):[...prev,clean];
    });
    setEditingCard(null);
    setMessage('Game card saved.');
  }

  function duplicateCard(card){
    const copy={...normaliseGameCard(card),id:Date.now()+Math.random(),title:`${card.title} variant`};
    setSavedCards(prev=>[...prev,copy]);
    setEditingCard(copy);
    setMessage('Variant created. Edit and save it.');
  }

  function deleteCard(id){
    setSavedCards(prev=>prev.filter(card=>card.id!==id));
    setMessage('Game card deleted.');
  }

  function startGameCardProjection(card){
    const clean=normaliseGameCard(card);
    startCoachProjectionSession([clean],0);
    setMessage(`${clean.title||'Game'} sent to projector.`);
  }

  function stopGameCardProjection(){
    stopCoachProjectionSession();
    setMessage('Projector stopped.');
  }

  function selectClass(id){
    setActiveClassId(id);
    setEditingCard(null);
    setMessage('');
    setLogicCard(null);
  }

  return <div className="page">
    <div className="pageTop">
      <h1>Games Library</h1>
      <button className="primaryBtn" onClick={()=>setEditingCard(emptyUniversalGame(activeCategory||'Custom Coach Game'))}>+ New Game Card</button>
    </div>
    <div className="gameClassGrid">
      {gameClasses.map(gameClass=>
        <button type="button" key={gameClass.id} className={activeClassId===gameClass.id?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>selectClass(gameClass.id)}>
          {gameClass.label}
        </button>
      )}
    </div>

    {!activeClassId&&<div className="placeholder">Tap a game class above.</div>}

    {logicCard&&!['checkerboard','atl','atb','powerplay','pressure','tacticalpressure','custom'].includes(activeClassId)&&<div className="logicDraftSection"><div className="statusBox"><strong>Built Base Game Held:</strong> {logicCard.title||'Game'} · Add Game Logic or add base game only below.</div><InlineGameLogicBuilder baseGame={logicCard} onAddBase={(game)=>{addStay(game);setLogicCard(null);}} onAddLogic={(game)=>{addStay(game);setLogicCard(null);}} onCancel={()=>setLogicCard(null)}/></div>}

    {editingCard&&<UniversalGameEditor key="editor" game={editingCard} onSave={saveCard} onCancel={()=>setEditingCard(null)}/>}

    {activeClassId==='checkerboard'&&<CheckerboardEngine key="checkerboard-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='atl'&&<ATLBTLDirectBuilder key="atl-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='atb'&&<AroundTheBoardBuilder key="atb-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='powerplay'&&<PowerPlayBuilder key="powerplay-engine" onAddToSession={addStay}/>}
    {activeClassId==='pressure'&&<PressureModule setScreen={setScreen}/>}
    {activeClassId==='tacticalpressure'&&<TacticalPressureModule onAddToSession={addAndGo}/>}
    {activeClassId==='classic'&&<ClassicConditionedBuilder key="classic-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='technical'&&<TechnicalFocusBuilder key="technical-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='custom'&&<CustomGameBuilder key="custom-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='information'&&<InformationAnticipationBuilder onAddToSession={addAndGo}/>}
    {activeClassId==='doubleBounce'&&<div className="gameCard"><div className="categoryTag">Double Bounce</div><h2>Double Bounce</h2><p className="mutedText">Double Bounce is now a normal Games Library class. Use this protocol here, then add it to the session when ready.</p><DoubleBounceTool setScreen={setScreen}/></div>}
    {activeClassId==='rotations'&&<div className="gameCard"><div className="categoryTag">Rotations</div><h2>Rotational Affordance Games</h2><p className="mutedText">Rotations have moved from the Home screen into the Games Library, alongside the other game classes.</p><RotationalAffordanceGames setScreen={setScreen}/></div>}

    {activeClassId&&!['powerplay','atb','saved'].includes(activeClassId)&&null}

    {activeClassId&&!['checkerboard','atl','atb','powerplay','pressure','tacticalpressure','classic','technical','custom','doubleBounce','rotations','saved'].includes(activeClassId)&&
      <div className="placeholder">{activeClass?.label} games will be restored as the next functional class. Use + New Game Card to create coach cards now.</div>
    }

    {message&&<div className="statusBox">{message}</div>}

    {activeClassId&&visibleCards.length>0&&<div>
      <h2>Saved Game Cards</h2>
      <div className="libraryGrid">
        {visibleCards.map(card=><div className="universalGameCard gameCard" key={card.id}>
          <div className="categoryTag">{card.category||'Game'}</div>
          <h3>{card.title}</h3>
          <p><strong>Task: </strong>{card.task||card.description||'Run the game.'}</p>
          {card.scoring&&<p><strong>Scoring: </strong>{card.scoring}</p>}
          <div className="actionRow">
            <button className="primaryBtn" onClick={()=>startGameCardProjection(card)}>START PROJECTOR</button>
            <button className="secondaryBtn dangerBtn" onClick={stopGameCardProjection}>STOP PROJECTOR</button>
            <button onClick={()=>setLogicCard(card)}>Add Logic</button><button onClick={()=>addStay(card)}>Add To Session</button>
            <button onClick={()=>setEditingCard(card)}>Edit</button>
            <button onClick={()=>duplicateCard(card)}>Duplicate</button>
            <button className="secondaryBtn" onClick={()=>deleteCard(card.id)}>Delete</button>
          </div>
        </div>)}
      </div>
    </div>}
  </div>;
}

function Players({players,setPlayers}){
const[history,setHistory]=useState([]);
const[showForm,setShowForm]=useState(false);
const[editing,setEditing]=useState(null);
const[form,setForm]=useState(EMPTY_PLAYER);
const[guestName,setGuestName]=useState('');
const[guestEstimate,setGuestEstimate]=useState('Level 3 guest');
const[guestRanking,setGuestRanking]=useState('');
function saveSnapshot(){setHistory([...history,players]);}
function undo(){if(history.length===0)return;setPlayers(history[history.length-1]);setHistory(history.slice(0,-1));}
function updateCategory(category){const found=LEVELS.find(level=>level.label===category);setForm({...form,category,level:found?found.level:1});}
function savePlayer(){if(!form.name.trim())return;saveSnapshot();if(editing!==null){const updated=[...players];updated[editing]={...form,name:form.name.trim()};setPlayers(updated);}else setPlayers([...players,{...form,name:form.name.trim()}]);setForm(EMPTY_PLAYER);setEditing(null);setShowForm(false);}
function editPlayer(player,index){const{originalIndex,...clean}=player;setForm({...EMPTY_PLAYER,...clean});setEditing(index);setShowForm(true);window.scrollTo(0,0);}
function deletePlayer(index){saveSnapshot();setPlayers(players.filter((_,i)=>i!==index));}
function togglePresent(index){const updated=[...players];updated[index]={...updated[index],present:!updated[index].present};setPlayers(updated);}
function addGuest(){if(!guestName.trim())return;const level=guestEstimate.includes('5')?5:guestEstimate.includes('4')?4:guestEstimate.includes('3')?3:guestEstimate.includes('2')?2:1;const guestRank=String(guestRanking||'').trim();saveSnapshot();setPlayers([...players,{...EMPTY_PLAYER,name:guestName.trim(),playerType:'Guest Player',category:'Guest',level,juniorRanking:guestRank,ranking:guestRank,guestEstimate,attendance:'Guest today',present:true}]);setGuestName('');setGuestEstimate('Level 3 guest');setGuestRanking('');}
function exportPlayers(){
  const backup={
    type:'checkerboard-players-backup',
    version:'v99h29',
    exportedAt:new Date().toISOString(),
    players
  };
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`checkerboard-players-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function importPlayersFile(event){
  const file=event.target.files&&event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(String(reader.result||'{}'));
      const incoming=Array.isArray(parsed)?parsed:(Array.isArray(parsed.players)?parsed.players:[]);
      if(!incoming.length){
        alert('No players found in this file.');
        return;
      }
      const cleaned=incoming.map(player=>({
        ...EMPTY_PLAYER,
        ...player,
        name:String(player.name||player.fullName||player.playerName||'').trim()
      })).filter(player=>player.name);
      if(!cleaned.length){
        alert('No valid player names found.');
        return;
      }
      const existingNames=new Set(players.map(player=>String(player.name||'').trim().toLowerCase()));
      const merged=[...players];
      cleaned.forEach(player=>{
        const key=player.name.toLowerCase();
        const idx=merged.findIndex(existing=>String(existing.name||'').trim().toLowerCase()===key);
        if(idx>=0){
          merged[idx]={...merged[idx],...player};
        }else{
          merged.push(player);
        }
      });
      saveSnapshot();
      setPlayers(merged);
      alert(`Imported ${cleaned.length} players. Existing matching names were updated.`);
    }catch(error){
      alert('Import failed. Please use a Checkerboard JSON player backup file.');
    }finally{
      event.target.value='';
    }
  };
  reader.readAsText(file);
}

const sorted=sortPlayers(players);
return <div className="page">
<div className="pageTop"><h1>Players</h1><div className="buttonRow playerBackupControls">
<button className="secondaryBtn" onClick={undo} disabled={history.length===0}>Undo</button>
<button className="secondaryBtn" onClick={exportPlayers}>Export Players</button>
<label className="secondaryBtn importPlayersLabel">Import Players<input type="file" accept=".json,application/json" onChange={importPlayersFile}/></label>
<button className="primaryBtn" onClick={()=>{setEditing(null);setForm(EMPTY_PLAYER);setShowForm(!showForm);}}>+ Add Player</button>
</div></div>
{showForm&&<div className="formCard"><h3>{editing!==null?'Edit Player':'Add Player'}</h3>
<input placeholder="Player name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
<select value={form.playerType} onChange={e=>setForm({...form,playerType:e.target.value})}><option>Programme Player</option><option>Guest Player</option><option>Coach Player</option></select>
<select value={form.category} onChange={e=>updateCategory(e.target.value)}>{LEVELS.map(level=><option key={level.label}>{level.label}</option>)}<option>Guest</option></select>
{form.playerType==='Programme Player'?<input type="number" placeholder="Junior Programme Ranking" value={form.juniorRanking||''} onChange={e=>setForm({...form,juniorRanking:e.target.value})}/>:<input placeholder="Guest estimate" value={form.guestEstimate||''} onChange={e=>setForm({...form,guestEstimate:e.target.value})}/>}
<textarea placeholder="Current coaching focus" value={form.focus||''} onChange={e=>setForm({...form,focus:e.target.value})}/>
<div className="buttonRow"><button className="primaryBtn" onClick={savePlayer}>{editing!==null?'Update Player':'Save Player'}</button><button className="secondaryBtn" onClick={()=>{setShowForm(false);setEditing(null);setForm(EMPTY_PLAYER);}}>Cancel</button></div>
</div>}
<div className="attendanceSummary"><strong>Present today:</strong> {players.filter(player=>player.present).length}<span>Competition auto-uses marked-present players.</span></div>
<div className="quickGuestBox"><strong>Add Guest To Today’s Attendance</strong><div className="quickGuestRow">
<input placeholder="Guest name" value={guestName} onChange={e=>setGuestName(e.target.value)}/>
<select value={guestEstimate} onChange={e=>setGuestEstimate(e.target.value)}><option>Level 1 guest</option><option>Level 2 guest</option><option>Level 3 guest</option><option>Level 4 guest</option><option>Level 5 guest</option><option>Adult challenge player</option><option>Coach playing</option></select>
<input className="guestRankInput" placeholder="Guest ranking / seed e.g. 7" value={guestRanking} onChange={e=>setGuestRanking(e.target.value)}/>
<button className="primaryBtn" onClick={addGuest}>Add Present Guest</button></div><p className="smallHelpText">Guest ranking lets temporary players seed correctly in snake teams and competitions. Lower number = stronger seed.</p></div>
{players.length===0&&<div className="placeholder">No players added yet. Add players or guests above.</div>}
<div className="playerGrid">{sorted.map(player=><div className="playerCard" key={`${player.name}-${player.originalIndex}`}><h3>{player.name}</h3>
<div className="badgeRow"><span className="badge">{player.playerType}</span><span className="badge">{player.category}</span><span className="badge">Level {player.level}</span><span className="badge">{player.playerType==='Programme Player'?`JPR #${player.juniorRanking||'not set'}`:(player.juniorRanking?`Guest seed #${player.juniorRanking}`:'Guest')}</span></div>
<div className="infoBox"><strong>Focus</strong><p>{player.focus||'No focus added.'}</p></div>
<div className="actionRow"><button className={player.present?'activePresent':''} onClick={()=>togglePresent(player.originalIndex)}>{player.present?'Present ✓':'Mark Present'}</button><button onClick={()=>editPlayer(player,player.originalIndex)}>Edit</button><button onClick={()=>deletePlayer(player.originalIndex)}>Delete</button></div>
</div>)}</div>
</div>;
}




function Competition({players=[],initialInvasionFormat='lives',onInvasionFormatChange=()=>{}}){
  const competitionRestoredRef=useRef(false);
  function getSavedCompetitionState(){try{return JSON.parse(localStorage.getItem(COMPETITION_STATE_KEY)||'{}')}catch{return {}}}
  // v100h43: restore competition / box / NSSL state when returning to the page.
  const [mode,setMode]=useState(()=>getSavedCompetitionState().mode||'invasion');
  const [invasionFormat,setInvasionFormat]=useState(()=>{
    try{
      // v100h21: first use the App-level remembered format. This survives page changes.
      if(initialInvasionFormat==='points'||initialInvasionFormat==='lives') return initialInvasionFormat;
      const direct=localStorage.getItem('checkerboardInvasionFormat');
      if(direct==='points'||direct==='lives') return direct;
      const saved=JSON.parse(localStorage.getItem('checkerboardCompetitionProjection')||'{}');
      if(saved.invasionFormat==='points'||saved.invasionFormat==='lives') return saved.invasionFormat;
      const ui=JSON.parse(localStorage.getItem(INVASION_UI_STATE_KEY)||'{}');
      if(ui.invasionFormat==='points'||ui.invasionFormat==='lives') return ui.invasionFormat;
      return 'lives';
    }catch{
      return 'lives';
    }
  });
  function chooseInvasionFormat(format){
    const next=format==='points'?'points':'lives';
    setInvasionFormat(next);
    onInvasionFormatChange(next);
    try{
      localStorage.setItem('checkerboardInvasionFormat',next);
      localStorage.setItem(INVASION_UI_STATE_KEY,JSON.stringify({invasionFormat:next,updatedAt:new Date().toISOString()}));
      const saved=localStorage.getItem('checkerboardCompetitionProjection');
      const current=saved?JSON.parse(saved):{};
      localStorage.setItem('checkerboardCompetitionProjection',JSON.stringify({...current,mode:'invasion',invasionFormat:next}));
    }catch{}
  }
  const [invasionCourts,setInvasionCourts]=useState(3);
  const [invasionStartingLives,setInvasionStartingLives]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('checkerboardCompetitionProjection'))?.invasionStartingLives||5}catch{return 5}
  });
  useEffect(()=>{
    // v100h21: restore from App-level state first, then the stable direct key.
    try{
      const direct=localStorage.getItem('checkerboardInvasionFormat');
      const saved=JSON.parse(localStorage.getItem('checkerboardCompetitionProjection')||'{}');
      const ui=JSON.parse(localStorage.getItem(INVASION_UI_STATE_KEY)||'{}');
      const restored=(initialInvasionFormat==='points'||initialInvasionFormat==='lives')
        ?initialInvasionFormat
        :(direct==='points'||direct==='lives')
          ?direct
          :(saved.invasionFormat==='points'||saved.invasionFormat==='lives')
            ?saved.invasionFormat
            :ui.invasionFormat;
      if((restored==='points'||restored==='lives')&&restored!==invasionFormat){
        setInvasionFormat(restored);
        onInvasionFormatChange(restored);
      }
    }catch{}
  },[]);
  const [invasionRotation,setInvasionRotation]=useState('Rotate courts when one invader loses all lives.');
  const [invasionChallenge,setInvasionChallenge]=useState('Invader tries to win points / survive pressure while defenders control risk.');
  const [invasionTeams,setInvasionTeams]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('checkerboardCompetitionProjection'))?.invasionTeams||[]}catch{return[]}
  });
  const [invasionTeamPoints,setInvasionTeamPoints]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('checkerboardCompetitionProjection'))?.invasionTeamPoints||{}}catch{return{}}
  });
  const [invasionPlayerPoints,setInvasionPlayerPoints]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('checkerboardCompetitionProjection'))?.invasionPlayerPoints||{}}catch{return{}}
  });
  const [invasionTeamLives,setInvasionTeamLives]=useState({});
  const [invasionCarryLives,setInvasionCarryLives]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('checkerboardCompetitionProjection'))?.invasionCarryLives||{}}catch{return{}}
  });
  const [invasionFinishLives,setInvasionFinishLives]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('checkerboardCompetitionProjection'))?.invasionFinishLives||{}}catch{return{}}
  });
  const [invasionPlayerRound,setInvasionPlayerRound]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('checkerboardCompetitionProjection'))?.invasionPlayerRound||0}catch{return 0}
  });
  const [invasionCourtRound,setInvasionCourtRound]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('checkerboardCompetitionProjection'))?.invasionCourtRound||0}catch{return 0}
  });
  const [invasionGameStarted,setInvasionGameStarted]=useState(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem('checkerboardCompetitionProjection')||'{}');
      return localStorage.getItem('checkerboardInvasionGameStarted')==='true'||saved.invasionGameStarted===true;
    }catch{
      return false;
    }
  });
  const [showInvasionDashboard,setShowInvasionDashboard]=useState(false);
  const [activeInvasionCourt,setActiveInvasionCourt]=useState(1);
  const [invasionRotationStep,setInvasionRotationStep]=useState(0);
  const [invasionEliminated,setInvasionEliminated]=useState('');
  const [invasionCourtAssignmentMode,setInvasionCourtAssignmentMode]=useState('fixed');
  const [invasionCourtAssignments,setInvasionCourtAssignments]=useState([]);
  const [competitionUndo,setCompetitionUndo]=useState(null);
  function captureCompetitionUndo(label='Competition change'){
    setCompetitionUndo({label,invasionTeams:clone(invasionTeams),invasionTeamPoints:clone(invasionTeamPoints),invasionPlayerPoints:clone(invasionPlayerPoints),invasionTeamLives:clone(invasionTeamLives),invasionCarryLives:clone(invasionCarryLives),invasionFinishLives:clone(invasionFinishLives),invasionInvaderOverrides:clone(invasionInvaderOverrides),invasionCourtAssignments:clone(invasionCourtAssignments),invasionPlayerRound,invasionCourtRound});
  }
  function undoCompetitionChange(){
    if(!competitionUndo) return;
    setInvasionTeams(competitionUndo.invasionTeams||[]);
    setInvasionTeamPoints(competitionUndo.invasionTeamPoints||{});
    setInvasionPlayerPoints(competitionUndo.invasionPlayerPoints||{});
    setInvasionTeamLives(competitionUndo.invasionTeamLives||{});
    setInvasionCarryLives(competitionUndo.invasionCarryLives||{});
    setInvasionFinishLives(competitionUndo.invasionFinishLives||{});
    setInvasionInvaderOverrides(competitionUndo.invasionInvaderOverrides||{});
    setInvasionCourtAssignments(competitionUndo.invasionCourtAssignments||[]);
    setInvasionPlayerRound(competitionUndo.invasionPlayerRound||0);
    setInvasionCourtRound(competitionUndo.invasionCourtRound||0);
    setCompetitionUndo(null);
  }
  const [competitionLayers,setCompetitionLayers]=useState(()=>getSavedCompetitionState().competitionLayers||[]);
  const [competitionCbCode,setCompetitionCbCode]=useState(()=>getSavedCompetitionState().competitionCbCode||'None');
  const [playerBounces,setPlayerBounces]=useState(()=>getSavedCompetitionState().playerBounces||{});
  const [manualPlayers,setManualPlayers]=useState(()=>getSavedCompetitionState().manualPlayers||'');
  const [matchScore,setMatchScore]=useState(()=>getSavedCompetitionState().matchScore||{a:0,b:0});
  const [matchplayMatchFormat,setMatchplayMatchFormat]=useState(()=>getSavedCompetitionState().matchplayMatchFormat||'Best of 1');
  const [scoringMode,setScoringMode]=useState(()=>getSavedCompetitionState().scoringMode||'normal');
  const [competitionMatchScores,setCompetitionMatchScores]=useState(()=>getSavedCompetitionState().competitionMatchScores||{});
  const [matchPlayers,setMatchPlayers]=useState(()=>getSavedCompetitionState().matchPlayers||{a:'Player A',b:'Player B'});
  const [matchScoring,setMatchScoring]=useState(()=>getSavedCompetitionState().matchScoring||'PAR 11');
  const [rrFixtures,setRrFixtures]=useState(()=>getSavedCompetitionState().rrFixtures||[]);
  const [rrResults,setRrResults]=useState(()=>getSavedCompetitionState().rrResults||{});
  const [rrMatchFormat,setRrMatchFormat]=useState(()=>getSavedCompetitionState().rrMatchFormat||'Best of 1');
  const [rrBoxCount,setRrBoxCount]=useState(()=>getSavedCompetitionState().rrBoxCount||1);
  const [rrBoxes,setRrBoxes]=useState(()=>getSavedCompetitionState().rrBoxes||[]);
  const [rrBoxFixtures,setRrBoxFixtures]=useState(()=>getSavedCompetitionState().rrBoxFixtures||[]);
  const [rrBoxResults,setRrBoxResults]=useState(()=>getSavedCompetitionState().rrBoxResults||{});
  const [rrFinalBoxes,setRrFinalBoxes]=useState(()=>getSavedCompetitionState().rrFinalBoxes||[]);
  const [rrFinalFixtures,setRrFinalFixtures]=useState(()=>getSavedCompetitionState().rrFinalFixtures||[]);
  const [rrFinalResults,setRrFinalResults]=useState(()=>getSavedCompetitionState().rrFinalResults||{});
  const [monradRounds,setMonradRounds]=useState(()=>getSavedCompetitionState().monradRounds||[]);
  const [monradResults,setMonradResults]=useState(()=>getSavedCompetitionState().monradResults||{});
  const [monradPlacingRounds,setMonradPlacingRounds]=useState(()=>getSavedCompetitionState().monradPlacingRounds||[]);
  const [monradPlacingResults,setMonradPlacingResults]=useState(()=>getSavedCompetitionState().monradPlacingResults||{});
  const [monradFinalPlaces,setMonradFinalPlaces]=useState(()=>getSavedCompetitionState().monradFinalPlaces||{});
  const [monradMatchFormat,setMonradMatchFormat]=useState(()=>getSavedCompetitionState().monradMatchFormat||'Best of 1');
  const [nslOrgTab,setNslOrgTab]=useState(()=>getSavedCompetitionState().nslOrgTab||'config');
  const [nslTeams,setNslTeams]=useState(()=>getSavedCompetitionState().nslTeams||4);
  const [nslPlayersPerTeam,setNslPlayersPerTeam]=useState(()=>getSavedCompetitionState().nslPlayersPerTeam||3);
  const [nslPeriod1,setNslPeriod1]=useState(()=>getSavedCompetitionState().nslPeriod1||20);
  const [nslPeriod2,setNslPeriod2]=useState(()=>getSavedCompetitionState().nslPeriod2||20);
  const [nslPeriod3,setNslPeriod3]=useState(()=>getSavedCompetitionState().nslPeriod3||30);
  const [nslOvertime,setNslOvertime]=useState(()=>getSavedCompetitionState().nslOvertime||5);
  const [nslScores,setNslScores]=useState(()=>getSavedCompetitionState().nslScores||{});
  const [nslActivePeriod,setNslActivePeriod]=useState(()=>getSavedCompetitionState().nslActivePeriod||1);
  const [nslRoundSeconds,setNslRoundSeconds]=useState(()=>getSavedCompetitionState().nslRoundSeconds ?? 20*60);
  const [nslTimerRunning,setNslTimerRunning]=useState(false);
  const [nslPowerPlayTeam,setNslPowerPlayTeam]=useState(()=>getSavedCompetitionState().nslPowerPlayTeam||'');
  const [nslPowerPlaySeconds,setNslPowerPlaySeconds]=useState(()=>getSavedCompetitionState().nslPowerPlaySeconds||60);
  const [nslPowerPlayActive,setNslPowerPlayActive]=useState(()=>getSavedCompetitionState().nslPowerPlayActive||false);
  const [showCompetitionProjection,setShowCompetitionProjection]=useState(false);
  const [invasionInvaderOverrides,setInvasionInvaderOverrides]=useState({});

  const present=Array.isArray(players)?players.filter(player=>player.present):[];
  const automaticNames=present.length?present.map(player=>player.name):[];
  const manualNames=manualPlayers.split('\n').map(name=>name.trim()).filter(Boolean);
  const playerNames=automaticNames.length?automaticNames:manualNames;

  function rankForTeamName(name){
    const player=players.find(p=>p.name===name || p.fullName===name || p.playerName===name);
    if(player) return playerSeedValue(player);
    return invasionRankForName(name);
  }
  function teamNameFromPlayers(teamPlayers=[],fallbackIndex=0){
    const names=(teamPlayers||[]).map(invasionName).filter(Boolean);
    if(!names.length) return `Team ${fallbackIndex+1}`;
    const sorted=[...names].sort((a,b)=>rankForTeamName(a)-rankForTeamName(b)||String(a).localeCompare(String(b)));
    const top=sorted[0];
    const first=playerFirstName(top);
    const duplicateFirst=playerNames.filter(name=>playerFirstName(name).toLowerCase()===first.toLowerCase()).length>1;
    if(duplicateFirst){
      const parts=String(top).trim().split(/\s+/);
      const initial=parts.length>1?` ${parts[1][0].toUpperCase()}`:'';
      return `${first}${initial}'s Team`;
    }
    return possessiveTeamName(first);
  }
  function displayTeamName(team,index=0){
    return teamNameFromPlayers(team?.players||[],index);
  }

  function invasionDbLabel(name){
    const status=playerBounces?.[invasionName(name)]||'No DB';
    return status==='No DB'?'No DB':status;
  }

  function invasionPlayerWithDb(name){
    const playerName=invasionName(name);
    const status=invasionDbLabel(playerName);
    return `${playerName} (${status})`;
  }

  function invasionName(player){
    if(!player) return '';
    if(typeof player==='string') return player;
    return player.name||player.fullName||player.playerName||'Player';
  }

  function findInvasionTeamForPlayer(playerName,sourceTeams=invasionTeams){
    const name=invasionName(playerName);
    return (sourceTeams||[]).find(team=>(team.players||[]).some(p=>invasionName(p)===name));
  }

  function calculateTeamPointsFromPlayers(team,playerPoints=invasionPlayerPoints,manualTeamPoints=invasionTeamPoints){
    const playerTotal=(team?.players||[]).reduce((total,p)=>total+(Number(playerPoints[invasionName(p)]||0)),0);
    const manual=Number(manualTeamPoints?.[team?.id]||0);
    return playerTotal+manual;
  }

  function invasionRankForName(name){
    const p=(players||[]).find(player=>player.name===name || player.fullName===name || player.playerName===name);
    if(!p) return 9999;
    const ranking=Number(p.juniorRanking ?? p.ranking ?? p.rank);
    if(!Number.isNaN(ranking)&&ranking>0) return ranking;
    const level=Number(p.level ?? p.rating ?? 0);
    return 9000-level;
  }

  function sortInvasionPlayersLowestFirst(list){
    return [...(list||[])].sort((a,b)=>invasionRankForName(b)-invasionRankForName(a));
  }



  const overlayOptions=['Clean Winner','Opponent Off T','T Challenge','Blind Finish','Volley Finish','Weak Side','4-Shot Window','2-Shot Window','Double Bounce','DB Handicap','Quality Length Before Attack'];
  const cbOptions=['None','[5-4] + [5-1]','[6-3] + [6-2]','[5-4] + [8-1]','[6-3] + [7-2]','Custom'];

  function toggleLayer(layer){
    setCompetitionLayers(prev=>prev.includes(layer)?prev.filter(item=>item!==layer):[...prev,layer]);
  }

  function setBounceFor(name,value){
    setPlayerBounces(prev=>({...prev,[name]:value}));
  }

  function resetMatch(){
    setMatchScore({a:0,b:0});
  }


  function scoreKey(prefix,roundIndex,matchIndex,extra=''){
    return `${prefix}-${roundIndex}-${matchIndex}-${extra}`;
  }
  function getCompetitionScore(key){
    return competitionMatchScores[key]||{a:'',b:''};
  }
  function setCompetitionScore(key,side,value){
    setCompetitionMatchScores(prev=>({
      ...prev,
      [key]:{...(prev[key]||{a:'',b:''}),[side]:value}
    }));
  }
  function scoreWinner(match,score){
    const a=Number(score?.a);
    const b=Number(score?.b);
    if(Number.isNaN(a)||Number.isNaN(b)||a===b) return '';
    return a>b?match.a:match.b;
  }
  function normalWinningScore(loserScore){
    const n=Number(loserScore);
    if(Number.isNaN(n)||loserScore===''||n<0) return '';
    return n<10 ? 11 : n+2;
  }
  function ScoreEntry({scoreId,match,onWinner,matchFormat}){
    const gamesNeeded=matchFormat==='Best of 5'?5:matchFormat==='Best of 3'?3:1;
    const saved=getCompetitionScore(scoreId);
    const initGames=()=>{
      if(saved.games&&saved.games.length) return saved.games;
      return Array.from({length:gamesNeeded},()=>({a:'',b:'',loserSide:''}));
    };
    const [games,setGames]=useState(initGames);

    const displayGames=Array.from({length:gamesNeeded},(_,i)=>games[i]||{a:'',b:'',loserSide:''});

    function changeGame(gameIdx,side,value){
      const cleaned=value.replace(/[^0-9]/g,'');
      setGames(prev=>{
        const next=[...prev];
        while(next.length<=gameIdx) next.push({a:'',b:'',loserSide:''});
        if(scoringMode==='normal'){
          // whichever box the coach types in is the LOSER score
          // winner score auto-fills to the other box
          const winnerScore=normalWinningScore(cleaned);
          if(side==='a'){
            // typed in Player A box = Player A is the loser, Player B wins
            next[gameIdx]={a:cleaned,b:winnerScore,loserSide:'a'};
          } else {
            // typed in Player B box = Player B is the loser, Player A wins
            next[gameIdx]={a:winnerScore,b:cleaned,loserSide:'b'};
          }
        } else {
          next[gameIdx]={...next[gameIdx],[side]:cleaned,loserSide:''};
        }
        return next;
      });
    }

    function calcGameWinner(g){
      if(!g||g.a===''||g.b==='') return null;
      if(scoringMode==='normal'){
        // loserSide tells us who lost
        if(g.loserSide==='a') return 'b'; // A typed = A is loser, B wins
        if(g.loserSide==='b') return 'a'; // B typed = B is loser, A wins
        // fallback: higher score wins
        const a=Number(g.a);const b=Number(g.b);
        if(a===b) return null;
        return a>b?'a':'b';
      }
      const a=Number(g.a);const b=Number(g.b);
      if(a===b) return null;
      return a>b?'a':'b';
    }

    function calcMatchWinner(){
      const needed=Math.ceil(gamesNeeded/2);
      let winsA=0;let winsB=0;
      for(const g of displayGames){
        const gw=calcGameWinner(g);
        if(gw==='a') winsA++;
        if(gw==='b') winsB++;
      }
      if(winsA>=needed) return match.a;
      if(winsB>=needed) return match.b;
      return '';
    }

    function saveResult(){
      const winner=calcMatchWinner();
      setCompetitionMatchScores(prev=>({...prev,[scoreId]:{games:displayGames,mode:scoringMode}}));
      if(winner) onWinner(winner);
    }

    function clearEntry(){
      setGames(Array.from({length:gamesNeeded},()=>({a:'',b:'',loserSide:''})));
      setCompetitionMatchScores(prev=>{const next={...prev};delete next[scoreId];return next;});
      onWinner('');
    }

    const matchWinner=calcMatchWinner();
    const needed=Math.ceil(gamesNeeded/2);
    let winsA=0;let winsB=0;
    displayGames.forEach(g=>{const gw=calcGameWinner(g);if(gw==='a')winsA++;if(gw==='b')winsB++;});
    const matchOver=winsA>=needed||winsB>=needed;

    return <div className="cleanScoreEntry">
      <div className="cleanScoreNames">
        <strong>{match.a}</strong>
        <span>vs</span>
        <strong>{match.b}</strong>
      </div>
      {gamesNeeded>1&&<div className="matchScoreSummary">
        <span className={winsA>=needed?'matchWinnerSpan':''}>{match.a}: {winsA}g</span>
        <span className={winsB>=needed?'matchWinnerSpan':''}>{match.b}: {winsB}g</span>
      </div>}
      {scoringMode==='normal'&&<div className="scoreEntryHint">Type the <strong>loser</strong> score in their box — winner score fills automatically.</div>}
      {displayGames.map((g,idx)=>{
        const gw=calcGameWinner(g);
        if(matchOver&&gw===null&&idx>0) return null;
        return <div key={idx} className={`gameScoreRow${gw?' gameScoreDecided':''}`}>
          {gw&&<div className="gameWinnerBanner">{gw==='a'?match.a:match.b} wins Game {idx+1} ✓</div>}
          <div className="gameScoreRowInner">
            {gamesNeeded>1&&<span className="gameLabel">G{idx+1}</span>}
            <div className="gameScoreInputs">
              <div className="scorePlayerBox">
                <span className="scorePlayerName">{match.a}</span>
                <input inputMode="numeric" pattern="[0-9]*" value={g.a} placeholder="0"
                  className={gw==='b'?'loserInput':gw==='a'?'winnerInput':''}
                  onChange={e=>changeGame(idx,'a',e.target.value)} />
              </div>
              <span className="scoreVs">—</span>
              <div className="scorePlayerBox">
                <span className="scorePlayerName">{match.b}</span>
                <input inputMode="numeric" pattern="[0-9]*" value={g.b} placeholder="0"
                  className={gw==='a'?'loserInput':gw==='b'?'winnerInput':''}
                  onChange={e=>changeGame(idx,'b',e.target.value)} />
              </div>
            </div>
          </div>
        </div>;
      })}
      <div className="scoreEntryActions">
        <button type="button" className="primaryBtn saveResultBtn" disabled={!matchWinner} onClick={saveResult}>
          {matchWinner?`Save — ${matchWinner} wins`:'Save Result'}
        </button>
        <button type="button" className="secondaryBtn" onClick={clearEntry}>Clear</button>
      </div>
    </div>;
  }

  function invasionGcd(a,b){
    return b===0?Math.abs(a):invasionGcd(b,a%b);
  }

  function invasionLcm(a,b){
    if(!a||!b) return 0;
    return Math.abs(a*b)/invasionGcd(a,b);
  }

  function getInvasionFairRows(sourceTeams=invasionTeams){
    const list=(sourceTeams||[]).filter(t=>(t.players||[]).length>0);
    const selected=Number(invasionStartingLives)||5;
    if(!list.length) return {baseCapacity:selected,rows:[]};
    const maxPlayers=Math.max(...list.map(t=>(t.players||[]).length||1));
    const baseCapacity=maxPlayers*selected;
    return {
      baseCapacity,
      rows:list.map((team,index)=>{
        const players=(team.players||[]).length||1;
        const livesPerPlayer=Math.ceil(baseCapacity/players);
        return {
          team:team.name||`Team ${index+1}`,
          teamId:team.id,
          players,
          livesPerPlayer,
          totalCapacity:livesPerPlayer*players
        };
      })
    };
  }

  function getInvasionFairBaseTotal(){
    const fair=getInvasionFairRows(invasionTeams);
    return fair.rows.length?fair.baseCapacity:(Number(invasionStartingLives)||5);
  }

  function getInvasionBaseLives(team){
    const teams=(invasionTeams||[]).filter(t=>(t.players||[]).length>0);
    const fair=getInvasionFairRows(teams);
    const row=fair.rows.find(r=>r.team===(team&&team.name));
    if(row) return row.livesPerPlayer;
    return Number(invasionStartingLives)||5;
  }

  function getInvasionCarry(teamId){
    return invasionCarryLives[teamId]||0;
  }

  function getInvasionStartLives(team){
    const base=getInvasionBaseLives(team);
    const carry=Number(invasionCarryLives[(team&&team.id)||'']||invasionCarryLives[(team&&team.name)||'']||0);
    return base+carry;
  }

  function getInvasionFairLivesMap(sourceTeams=invasionTeams){
    const fair=getInvasionFairRows(sourceTeams);
    const map={};
    sourceTeams.forEach(team=>{
      const row=fair.rows.find(r=>r.team===team.name);
      const value=row?row.livesPerPlayer:(Number(invasionStartingLives)||5);
      map[team.id]=value;
      map[team.name]=value;
    });
    return map;
  }

  function getInvasionStartLivesFromMap(team,map){
    if(!team) return Number(invasionStartingLives)||5;
    const base=Number(map?.[team.id] ?? map?.[team.name] ?? getInvasionBaseLives(team));
    const carry=Number(invasionCarryLives[(team&&team.id)||'']||invasionCarryLives[(team&&team.name)||'']||0);
    return base+carry;
  }

  function setInvasionFinish(teamId,value){
    const v=Math.max(0,Number(value)||0);
    setInvasionFinishLives(prev=>({...prev,[teamId]:v}));
  }

  function postInvasionRotationLives(){
    const nextCarry={};
    invasionTeams.forEach(team=>{
      const finish=invasionFinishLives[team.id];
      nextCarry[team.id]=Math.max(0,Number(finish)||0);
    });
    setInvasionCarryLives(nextCarry);
    setInvasionTeamLives(nextCarry);
    setInvasionFinishLives({});
  }

  function getFinalInvader(team){
    const players=sortInvasionPlayersLowestFirst((team&&team.players)||[]);
    if(!players.length) return 'Waiting';
    return invasionInvaderOverrides[team.id]||invasionInvaderOverrides[team.name]||players[invasionPlayerRound % players.length];
  }

  function getFinalStartLives(team){
    return getInvasionBaseLives(team)+getInvasionCarry(team.id);
  }

  function getFinalDefendingTeamForCourt(courtIndex){
    if(!invasionTeams.length) return null;
    return invasionTeams[courtIndex % invasionTeams.length];
  }

  function getFinalInvadingTeamForCourt(courtIndex){
    if(!invasionTeams.length) return null;
    const n=invasionTeams.length;
    return invasionTeams[(courtIndex - 1 + invasionCourtRound + n) % n];
  }

  function postFinalCourtResults(){
    postInvasionRotationLives();
  }

  function rotateFinalCourts(){
    postInvasionRotationLives();
    setInvasionCourtRound(prev=>prev+1);
    setInvasionRotationStep(prev=>prev+1);
  }

  function nextFinalInvaders(){
    postInvasionRotationLives();
    setInvasionPlayerRound(prev=>prev+1);
    setInvasionCourtRound(0);
    setInvasionRotationStep(prev=>prev+1);
  }

  function resetFinalInvasionEngine(){
    setInvasionPlayerRound(0);
    setInvasionCourtRound(0);
    setInvasionCarryLives({});
    setInvasionFinishLives({});
    setInvasionGameStarted(false);
    try{localStorage.setItem('checkerboardInvasionGameStarted','false');}catch{}
  }

  function startInvasionGame(){
    const activeTeams=invasionTeams.length?invasionTeams:generateInvasionTeams();
    buildSimultaneousInvasionCourts(invasionRotationStep,false,activeTeams);
    setInvasionGameStarted(true);
    try{localStorage.setItem('checkerboardInvasionGameStarted','true');}catch{}
    setShowInvasionDashboard(true);
    setTimeout(()=>{
      try{
        const saved=localStorage.getItem('checkerboardCompetitionProjection');
        const current=saved?JSON.parse(saved):{};
        const fair=getInvasionFairRows(activeTeams);
        localStorage.setItem('checkerboardCompetitionProjection',JSON.stringify({
          ...current,
          mode:'invasion',
          invasionFormat,
          invasionTeams:activeTeams,
          playerNames,
          playerBounces,
          invasionRankMap:Object.fromEntries(playerNames.map(name=>[name,invasionRankForName(name)])),
          invasionTeamPoints,
          invasionPlayerPoints,
          invasionInvaderOverrides,
          invasionCarryLives,
          invasionFinishLives,
          invasionFairBaseTotal:fair.rows.length?fair.baseCapacity:getInvasionFairBaseTotal(),
          invasionFairLivesByTeam:getInvasionFairLivesMap(activeTeams),
          invasionStartingLives,
          invasionPlayerRound,
          invasionCourtRound,
          invasionGameStarted:true,
          invasionCourtAssignmentMode,
          showInvasionDashboard:true
        }));
      }catch{}
    },50);
  }

  function startInvasionProjector(){
    const activeTeams=invasionTeams.length?invasionTeams:generateInvasionTeams();
    buildSimultaneousInvasionCourts(invasionRotationStep,false,activeTeams);
    setInvasionGameStarted(true);
    setShowInvasionDashboard(true);
    setShowProjection(false);
    try{
      localStorage.setItem('checkerboardInvasionGameStarted','true');
      localStorage.setItem('checkerboardInvasionLive','true');
      localStorage.setItem('checkerboardProjectionTab','competition');
      localStorage.setItem('checkerboardInvasionFormat',invasionFormat);
      localStorage.setItem(INVASION_UI_STATE_KEY,JSON.stringify({invasionFormat,updatedAt:new Date().toISOString()}));
      const saved=localStorage.getItem('checkerboardCompetitionProjection');
      const current=saved?JSON.parse(saved):{};
      const fair=getInvasionFairRows(activeTeams);
      localStorage.setItem('checkerboardCompetitionProjection',JSON.stringify({
        ...current,
        mode:'invasion',
        invasionFormat,
        invasionStartingLives,
        invasionTeams:activeTeams,
        playerNames,
        playerBounces,
        invasionRankMap:Object.fromEntries(playerNames.map(name=>[name,invasionRankForName(name)])),
        invasionTeamPoints,
        invasionPlayerPoints,
        invasionInvaderOverrides,
        invasionCarryLives,
        invasionFinishLives,
        invasionFairBaseTotal:fair.rows.length?fair.baseCapacity:getInvasionFairBaseTotal(),
        invasionFairLivesByTeam:getInvasionFairLivesMap(activeTeams),
        invasionPlayerRound,
        invasionCourtRound,
        invasionGameStarted:true,
        invasionCourtAssignmentMode,
        showInvasionDashboard:true
      }));
    }catch{}
  }

  function stopInvasionProjector(){
    setInvasionGameStarted(false);
    setShowInvasionDashboard(false);
    setShowProjection(false);
    try{
      localStorage.setItem('checkerboardInvasionGameStarted','false');
      localStorage.setItem('checkerboardInvasionLive','false');
      localStorage.setItem('checkerboardInvasionFormat',invasionFormat);
      localStorage.setItem(INVASION_UI_STATE_KEY,JSON.stringify({invasionFormat,updatedAt:new Date().toISOString()}));
      const saved=localStorage.getItem('checkerboardCompetitionProjection');
      const current=saved?JSON.parse(saved):{};
      localStorage.setItem('checkerboardCompetitionProjection',JSON.stringify({
        ...current,
        mode:'session',
        invasionGameStarted:false,
        showInvasionDashboard:false
      }));
    }catch{}
  }

  function writeInvasionProjection(overrides={}){
    try{
      const saved=localStorage.getItem('checkerboardCompetitionProjection');
      const current=saved?JSON.parse(saved):{};
      localStorage.setItem('checkerboardInvasionGameStarted','true');
      localStorage.setItem('checkerboardInvasionLive','true');
      localStorage.setItem('checkerboardProjectionTab','competition');
      localStorage.setItem('checkerboardInvasionFormat',invasionFormat);
      localStorage.setItem(INVASION_UI_STATE_KEY,JSON.stringify({invasionFormat,updatedAt:new Date().toISOString()}));
      localStorage.setItem('checkerboardCompetitionProjection',JSON.stringify({
        ...current,
        mode:'invasion',
        invasionFormat,
        invasionStartingLives,
        invasionTeams,
        playerNames,
        playerBounces,
        invasionRankMap:Object.fromEntries(playerNames.map(name=>[name,invasionRankForName(name)])),
        invasionTeamPoints,
        invasionPlayerPoints,
        invasionInvaderOverrides,
        invasionCarryLives,
        invasionFinishLives,
        invasionFairBaseTotal:getInvasionFairBaseTotal(),
        invasionFairLivesByTeam:getInvasionFairLivesMap(invasionTeams),
        invasionPlayerRound,
        invasionCourtRound,
        invasionGameStarted:true,
        invasionCourtAssignmentMode,
        showInvasionDashboard:invasionFormat==='lives'&&showInvasionDashboard,
        ...overrides
      }));
    }catch{}
  }

  function updateInvasionPlayerView(){
    writeInvasionProjection({invasionGameStarted:true});
    setInvasionGameStarted(true);
  }

  function startNextInvasionRound(){
    captureCompetitionUndo('Start Next Round');
    const nextRound=invasionPlayerRound+1;
    setInvasionPlayerRound(nextRound);
    setInvasionGameStarted(true);
    writeInvasionProjection({invasionPlayerRound:nextRound,invasionGameStarted:true});
  }

  useEffect(()=>{
    try{
      localStorage.setItem('checkerboardInvasionFormat',invasionFormat);
      localStorage.setItem(INVASION_UI_STATE_KEY,JSON.stringify({invasionFormat,updatedAt:new Date().toISOString()}));
      const saved=localStorage.getItem('checkerboardCompetitionProjection');
      const current=saved?JSON.parse(saved):{};
      localStorage.setItem('checkerboardCompetitionProjection',JSON.stringify({
        ...current,
        mode:'invasion',
        invasionFormat,
        invasionStartingLives,
        invasionTeams,
        playerNames,
        playerBounces,
        invasionRankMap:Object.fromEntries(playerNames.map(name=>[name,invasionRankForName(name)])),
        invasionTeamPoints,
        invasionPlayerPoints,
        invasionInvaderOverrides,
        invasionCarryLives,
        invasionFinishLives,
        invasionFairBaseTotal:getInvasionFairBaseTotal(),
        invasionFairLivesByTeam:getInvasionFairLivesMap(invasionTeams),
        invasionPlayerRound,
        invasionCourtRound,
        invasionGameStarted,
        invasionCourtAssignmentMode,
        showInvasionDashboard
      }));
    }catch{}
  },[invasionGameStarted,invasionFormat,invasionStartingLives,invasionTeams,invasionCarryLives,invasionFinishLives,invasionTeamPoints,invasionPlayerPoints,invasionInvaderOverrides,invasionPlayerRound,invasionCourtRound,invasionCourtAssignmentMode,showInvasionDashboard]);

  function generateInvasionTeams(){
    captureCompetitionUndo('Generate Teams From Attendance');
    const present=playerNames.map(name=>players.find(p=>p.name===name)||name);
    const source=present.length?present:[...playerNames];
    const count=Math.max(1,Number(invasionCourts)||2);
    const seeded=snakeSeedPlayers(source,count);
    const baseTeams=seeded.map((teamPlayers,index)=>({
      id:`team-${index+1}`,
      name:teamNameFromPlayers(teamPlayers,index),
      seedOrder:index+1,
      players:teamPlayers.map(playerDisplayName)
    }));
    const courtOrder=shuffleInvasionArray(baseTeams.map(team=>team.id));
    const nextTeams=baseTeams.map(team=>({
      ...team,
      court:`Court ${courtOrder.indexOf(team.id)+1}`
    })).sort((a,b)=>Number(String(a.court).replace(/\D/g,''))-Number(String(b.court).replace(/\D/g,'')));
    setInvasionTeams(nextTeams);
    setInvasionTeamPoints({});
    const fair=getInvasionFairRows(nextTeams);
    const lifeBanks={};
    nextTeams.forEach(team=>{
      const row=fair.rows.find(r=>r.team===team.name);
      lifeBanks[team.id]=row?row.livesPerPlayer:(Number(invasionStartingLives)||5);
    });
    setInvasionTeamLives(lifeBanks);
    setInvasionCarryLives({});
    setInvasionFinishLives({});
    setInvasionPlayerRound(0);
    setInvasionCourtRound(0);
    setInvasionRotationStep(0);
    setInvasionInvaderOverrides({});
    buildSimultaneousInvasionCourts(0,false,nextTeams);
    return nextTeams;
  }

  function addInvasionTeamPoints(teamId,amount){
    setInvasionTeamPoints(prev=>({...prev,[teamId]:(prev[teamId]||0)+amount}));
  }

  function addInvasionPlayerPoints(playerName,amount){
    const name=invasionName(playerName);
    setInvasionPlayerPoints(prev=>({...prev,[name]:(prev[name]||0)+amount}));
  }

  function adjustInvasionTeamLives(teamId,amount){
    setInvasionTeamLives(prev=>{
      const current=prev[teamId] ?? invasionStartingLives;
      return {...prev,[teamId]:Math.max(0,current+amount)};
    });
  }

  function setInvasionTeamBank(teamId,value){
    setInvasionTeamLives(prev=>({...prev,[teamId]:Math.max(0,Number(value)||0)}));
  }

  function resetInvasionLifeBanks(){
    const fair=getInvasionFairRows(invasionTeams);
    const next={};
    invasionTeams.forEach(team=>{
      const row=fair.rows.find(r=>r.team===team.name);
      next[team.id]=row?row.livesPerPlayer:(Number(invasionStartingLives)||5);
    });
    setInvasionTeamLives(next);
  }

  function resetInvasionPoints(){
    setInvasionTeamPoints({});
    setInvasionPlayerPoints({});
  }

  function rotateInvasionCourts(){
    if(!invasionTeams.length) return;
    const nextStep=invasionRotationStep+1;
    setInvasionRotationStep(nextStep);
    setInvasionEliminated('');
    buildSimultaneousInvasionCourts(nextStep,invasionCourtAssignmentMode==='random');
  }

  function resetInvasionRotation(){
    setInvasionRotationStep(0);
    setActiveInvasionCourt(1);
    setInvasionEliminated('');
    buildSimultaneousInvasionCourts(0,false);
  }

  function shuffleInvasionArray(items){
    const array=[...items];
    for(let i=array.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [array[i],array[j]]=[array[j],array[i]];
    }
    return array;
  }

  function buildSimultaneousInvasionCourts(step=invasionRotationStep,useRandom=invasionCourtAssignmentMode==='random',sourceTeams=invasionTeams){
    if(!sourceTeams.length){
      setInvasionCourtAssignments([]);
      return;
    }
    const teams=useRandom?shuffleInvasionArray(sourceTeams):[...sourceTeams];
    const n=teams.length;
    const assignments=teams.map((defendingTeam,idx)=>{
      const invadingTeam=teams[(idx-1+n)%n];
      const invaderList=sortInvasionPlayersLowestFirst(invadingTeam.players||[]);
      const override=invasionInvaderOverrides[invadingTeam.id]||invasionInvaderOverrides[invadingTeam.name];
      const invader=override || (invaderList.length?invaderList[step%invaderList.length]:'Waiting for invader');
      return {
        court:idx+1,
        defendingTeamId:defendingTeam.id,
        defendingTeamName:defendingTeam.name,
        defenders:defendingTeam.players||[],
        invadingTeamId:invadingTeam.id,
        invadingTeamName:invadingTeam.name,
        invader
      };
    });
    setInvasionCourtAssignments(assignments);
  }

  function buildRoundRobinRounds(names){
    const clean=[...(names||[])].filter(Boolean);
    if(clean.length<2) return [];
    const list=clean.length%2===1?[...clean,'BYE']:[...clean];
    const rounds=[];
    const n=list.length;
    let rotating=[...list];
    for(let r=0;r<n-1;r++){
      const matches=[];
      for(let i=0;i<n/2;i++){
        const a=rotating[i];
        const b=rotating[n-1-i];
        if(a!=='BYE'&&b!=='BYE') matches.push({a,b});
      }
      rounds.push(matches);
      rotating=[rotating[0],rotating[n-1],...rotating.slice(1,n-1)];
    }
    return rounds;
  }

  function generateRoundRobin(){
    const names=[...playerNames];
    const rounds=buildRoundRobinRounds(names);
    setRrFixtures(rounds);
    setRrResults({});
  }

  function rrKey(roundIndex,matchIndex){
    return `${roundIndex}-${matchIndex}`;
  }

  function setRoundRobinWinner(roundIndex,matchIndex,winner){
    if(!winner){
      setRrResults(prev=>{const next={...prev};delete next[rrKey(roundIndex,matchIndex)];return next;});
    } else {
      setRrResults(prev=>({...prev,[rrKey(roundIndex,matchIndex)]:winner}));
    }
  }

  function getRoundRobinStandings(){
    const table={};
    playerNames.forEach(name=>{table[name]={name,played:0,wins:0,losses:0,pf:0,pa:0};});
    rrFixtures.forEach((round,ridx)=>round.forEach((match,midx)=>{
      const result=competitionMatchScores[rrKey(ridx,midx)];
      const winner=rrResults[rrKey(ridx,midx)];
      if(!winner) return;
      const loser=winner===match.a?match.b:match.a;
      [match.a,match.b].forEach(name=>{if(!table[name]) table[name]={name,played:0,wins:0,losses:0,pf:0,pa:0}; table[name].played+=1;});
      table[winner].wins+=1;
      table[loser].losses+=1;
      if(result&&result.a!==''&&result.b!==''){
        const sa=Number(result.a)||0;const sb=Number(result.b)||0;
        if(table[match.a]){table[match.a].pf+=sa;table[match.a].pa+=sb;}
        if(table[match.b]){table[match.b].pf+=sb;table[match.b].pa+=sa;}
      }
    }));
    return Object.values(table).sort((a,b)=>{
      const wDiff=b.wins-a.wins; if(wDiff!==0) return wDiff;
      const lDiff=a.losses-b.losses; if(lDiff!==0) return lDiff;
      const pdA=a.pf-a.pa; const pdB=b.pf-b.pa;
      const pdDiff=pdB-pdA; if(pdDiff!==0) return pdDiff;
      return b.pf-a.pf;
    });
  }

  function distributeRoundRobinBoxes(){
    const names=[...playerNames];
    const count=Math.max(1,Math.min(Number(rrBoxCount)||1,Math.max(1,names.length)));
    const boxes=Array.from({length:count},(_,idx)=>({name:`Box ${String.fromCharCode(65+idx)}`,players:[]}));
    names.forEach((name,idx)=>boxes[idx%count].players.push(name));
    setRrBoxes(boxes);
    setRrBoxFixtures(boxes.map(box=>buildRoundRobinRounds(box.players)));
    setRrBoxResults({});
    setRrFinalBoxes([]);
    setRrFinalFixtures([]);
    setRrFinalResults({});
  }

  function rrBoxKey(boxIndex,roundIndex,matchIndex,stage='group'){
    return `${stage}-${boxIndex}-${roundIndex}-${matchIndex}`;
  }

  function setRrBoxWinner(boxIndex,roundIndex,matchIndex,winner,stage='group'){
    const setter=stage==='final'?setRrFinalResults:setRrBoxResults;
    if(!winner){
      setter(prev=>{const next={...prev};delete next[rrBoxKey(boxIndex,roundIndex,matchIndex,stage)];return next;});
    } else {
      setter(prev=>({...prev,[rrBoxKey(boxIndex,roundIndex,matchIndex,stage)]:winner}));
    }
  }

  function getBoxStandings(box,fixtures,results,boxIndex,stage='group'){
    const table={};
    (box.players||[]).forEach(name=>{table[name]={name,played:0,wins:0,losses:0,pf:0,pa:0,points:0};});
    (fixtures||[]).forEach((round,ridx)=>round.forEach((match,midx)=>{
      const winner=results[rrBoxKey(boxIndex,ridx,midx,stage)];
      if(!winner) return;
      const loser=winner===match.a?match.b:match.a;
      [match.a,match.b].forEach(name=>{if(!table[name]) table[name]={name,played:0,wins:0,losses:0,pf:0,pa:0,points:0}; table[name].played+=1;});
      if(table[winner]){table[winner].wins+=1;table[winner].points+=3;}
      if(table[loser]) table[loser].losses+=1;
      const scoreKey2=rrBoxKey(boxIndex,ridx,midx,stage);
      const result=competitionMatchScores[`rr-${stage==='group'?'group':'final'}-${ridx}-${midx}-${boxIndex}`];
      if(result&&result.a!==''&&result.b!==''){
        const sa=Number(result.a)||0;const sb=Number(result.b)||0;
        if(table[match.a]){table[match.a].pf+=sa;table[match.a].pa+=sb;}
        if(table[match.b]){table[match.b].pf+=sb;table[match.b].pa+=sa;}
      }
    }));
    return Object.values(table).sort((a,b)=>{
      const wDiff=b.wins-a.wins; if(wDiff!==0) return wDiff;
      const lDiff=a.losses-b.losses; if(lDiff!==0) return lDiff;
      const pdA=a.pf-a.pa; const pdB=b.pf-b.pa;
      const pdDiff=pdB-pdA; if(pdDiff!==0) return pdDiff;
      return b.pf-a.pf;
    });
  }

  function generateRrFinalBoxes(){
    if(!rrBoxes.length) return;
    const groupStandings=rrBoxes.map((box,idx)=>getBoxStandings(box,rrBoxFixtures[idx]||[],rrBoxResults,idx,'group'));
    const maxPlaces=Math.max(...groupStandings.map(rows=>rows.length));
    const finalBoxes=[];
    for(let placeIndex=0;placeIndex<maxPlaces;placeIndex++){
      const players=groupStandings.map(rows=>rows[placeIndex]?.name).filter(Boolean);
      if(players.length){
        const start=placeIndex*rrBoxes.length+1;
        const end=start+players.length-1;
        finalBoxes.push({name:`Final Box ${placeIndex+1}`,range:`Places ${start}-${end}`,players});
      }
    }
    setRrFinalBoxes(finalBoxes);
    setRrFinalFixtures(finalBoxes.map(box=>buildRoundRobinRounds(box.players)));
    setRrFinalResults({});
  }

  function monradResultKey(roundIndex,matchIndex){
    return `m-${roundIndex}-${matchIndex}`;
  }

  function nextPowerOfTwo(n){
    let p=1; while(p<n) p*=2; return p;
  }

  function seedToPowerOfTwo(names){
    const size=nextPowerOfTwo(Math.max(2,names.length));
    return [...names,...Array.from({length:size-names.length},(_,idx)=>`BYE ${idx+1}`)];
  }

  function isByeName(name){return !name||String(name).startsWith('BYE');}

  function makeSeededMatches(list){
    const clean=[...(list||[])];
    const half=Math.ceil(clean.length/2);
    const matches=[];
    for(let i=0;i<half;i++){
      const a=clean[i];
      const b=clean[clean.length-1-i];
      if(a&&b&&a!==b) matches.push({a,b});
    }
    return matches;
  }

  function generateMonradFirstRound(){
    const seeded=seedToPowerOfTwo([...playerNames]);
    const matches=makeSeededMatches(seeded);
    setMonradRounds([matches]);
    setMonradResults({});
    generateMonradPlacingDraw();
  }

  function setMonradWinner(roundIndex,matchIndex,winner){
    if(!winner){
      setMonradResults(prev=>{const next={...prev};delete next[monradResultKey(roundIndex,matchIndex)];return next;});
    } else {
      setMonradResults(prev=>({...prev,[monradResultKey(roundIndex,matchIndex)]:winner}));
    }
  }

  function monradPlayerScores(){
    const scores={};
    playerNames.forEach(name=>{scores[name]={name,wins:0,played:0};});
    monradRounds.forEach((round,ridx)=>round.forEach((match,midx)=>{
      const winner=monradResults[monradResultKey(ridx,midx)];
      if(match.a&&scores[match.a]) scores[match.a].played+=winner?1:0;
      if(match.b&&scores[match.b]) scores[match.b].played+=winner?1:0;
      if(winner&&scores[winner]) scores[winner].wins+=1;
    }));
    return scores;
  }

  function monradHavePlayed(a,b){
    return monradRounds.some(round=>round.some(match=>(match.a===a&&match.b===b)||(match.a===b&&match.b===a)));
  }

  function generateNextMonradRound(){
    generateNextMonradPlacingRound();
  }

  function generateMonradPlacingDraw(){
    const names=seedToPowerOfTwo([...playerNames]);
    if(names.length<2){
      setMonradPlacingRounds([]);
      setMonradPlacingResults({});
      setMonradFinalPlaces({});
      return;
    }
    const round=[{id:'1',range:`1-${names.length}`,players:names,matches:makeSeededMatches(names)}];
    setMonradPlacingRounds([round]);
    setMonradPlacingResults({});
    setMonradFinalPlaces({});
  }

  function monradPlaceKey(roundIndex,groupId,matchIndex){
    return `place-${roundIndex}-${groupId}-${matchIndex}`;
  }

  function setMonradPlaceWinner(roundIndex,groupId,matchIndex,winner){
    if(!winner){
      setMonradPlacingResults(prev=>{const next={...prev};delete next[monradPlaceKey(roundIndex,groupId,matchIndex)];return next;});
    } else {
      setMonradPlacingResults(prev=>({...prev,[monradPlaceKey(roundIndex,groupId,matchIndex)]:winner}));
    }
  }

  function parseRange(range){
    const [start,end]=String(range).split('-').map(n=>Number(n));
    return {start:start||1,end:end||start||1};
  }

  function generateNextMonradPlacingRound(){
    if(!monradPlacingRounds.length){generateMonradPlacingDraw();return;}
    const ridx=monradPlacingRounds.length-1;
    const current=monradPlacingRounds[ridx];
    const nextGroups=[];
    const finalPlaces={...monradFinalPlaces};
    let blocked=false;
    current.forEach(group=>{
      const {start,end}=parseRange(group.range);
      if((group.players||[]).length<=1){
        const p=(group.players||[]).find(name=>!isByeName(name));
        if(p) finalPlaces[p]=start;
        return;
      }
      if((group.players||[]).length===2){
        const match=group.matches[0];
        const auto=isByeName(match.a)?match.b:isByeName(match.b)?match.a:null;
        const winner=auto||monradPlacingResults[monradPlaceKey(ridx,group.id,0)];
        if(!winner){blocked=true;return;}
        const loser=winner===match.a?match.b:match.a;
        if(!isByeName(winner)) finalPlaces[winner]=start;
        if(!isByeName(loser)) finalPlaces[loser]=end;
        return;
      }
      const complete=group.matches.every((match,midx)=>isByeName(match.a)||isByeName(match.b)||monradPlacingResults[monradPlaceKey(ridx,group.id,midx)]);
      if(!complete){blocked=true;return;}
      const winners=[];
      const losers=[];
      group.matches.forEach((match,midx)=>{
        const winner=isByeName(match.a)?match.b:isByeName(match.b)?match.a:monradPlacingResults[monradPlaceKey(ridx,group.id,midx)];
        const loser=winner===match.a?match.b:match.a;
        if(!isByeName(winner)) winners.push(winner);
        if(!isByeName(loser)) losers.push(loser);
      });
      const mid=start+winners.length-1;
      if(winners.length) nextGroups.push({id:`${group.id}W`,range:`${start}-${mid}`,players:winners,matches:makeSeededMatches(winners)});
      if(losers.length) nextGroups.push({id:`${group.id}L`,range:`${mid+1}-${end}`,players:losers,matches:makeSeededMatches(losers)});
    });
    if(blocked) return;
    setMonradFinalPlaces(finalPlaces);
    if(nextGroups.length) setMonradPlacingRounds(prev=>[...prev,nextGroups]);
  }

  function getMonradFinalTable(){
    // Compute live placings from all placing rounds + results without needing generateNextRound
    const livePlaces={...monradFinalPlaces};
    monradPlacingRounds.forEach((round,ridx)=>{
      round.forEach(group=>{
        const {start,end}=parseRange(group.range);
        if((group.players||[]).length<=1){
          const p=(group.players||[]).find(name=>!isByeName(name));
          if(p) livePlaces[p]=start;
          return;
        }
        if((group.players||[]).length===2){
          const match=(group.matches||[])[0];
          if(!match) return;
          const auto=isByeName(match.a)?match.b:isByeName(match.b)?match.a:null;
          const winner=auto||monradPlacingResults[monradPlaceKey(ridx,group.id,0)];
          if(!winner) return;
          const loser=winner===match.a?match.b:match.a;
          if(!isByeName(winner)) livePlaces[winner]=start;
          if(!isByeName(loser)) livePlaces[loser]=end;
          return;
        }
        // For larger groups, assign placings for any decided matches
        let winnersCount=0;let losersCount=0;
        (group.matches||[]).forEach((match,midx)=>{
          const auto=isByeName(match.a)?match.b:isByeName(match.b)?match.a:null;
          const winner=auto||monradPlacingResults[monradPlaceKey(ridx,group.id,midx)];
          if(winner) winnersCount++;
          else losersCount++;
        });
        const mid=start+winnersCount-1;
        (group.matches||[]).forEach((match,midx)=>{
          const auto=isByeName(match.a)?match.b:isByeName(match.b)?match.a:null;
          const winner=auto||monradPlacingResults[monradPlaceKey(ridx,group.id,midx)];
          if(!winner) return;
          const loser=winner===match.a?match.b:match.a;
          if(!isByeName(winner)&&!livePlaces[winner]) livePlaces[winner]=start+midx;
          if(!isByeName(loser)&&!livePlaces[loser]) livePlaces[loser]=mid+1+midx;
        });
      });
    });
    const rows=[...playerNames].map(name=>({name,place:livePlaces[name]||'—'}));
    return rows.sort((a,b)=>(Number(a.place)||999)-(Number(b.place)||999)||a.name.localeCompare(b.name));
  }

  function getNslGeneratedTeams(){
    const names=[...playerNames];
    const count=Math.max(2,Number(nslTeams)||2);
    const teams=Array.from({length:count},(_,idx)=>({name:`Team ${idx+1}`,players:[]}));
    names.forEach((name,idx)=>{
      const block=Math.floor(idx/count);
      const position=idx%count;
      const teamIndex=block%2===0?position:count-1-position;
      teams[teamIndex].players.push(name);
    });
    return teams.map((team,idx)=>({...team,name:teamNameFromPlayers(team.players,idx)}));
  }

  function getNslFixtures(){
    const teams=getNslGeneratedTeams();
    const fixtures=[];
    for(let i=0;i<teams.length;i+=2){
      fixtures.push({a:teams[i]?.name||'Team',b:teams[i+1]?.name||'BYE'});
    }
    return fixtures;
  }


  function nslTeamKey(name){return String(name||'Team').replace(/\s+/g,'_');}
  function nslFixtureKey(idx){return `fixture-${idx}`;}
  function adjustNslScore(teamName,amount,fixtureIndex=0){
    if(nslPowerPlayActive && nslPowerPlayTeam && nslPowerPlayTeam!==teamName && amount>0) return;
    const key=`${nslFixtureKey(fixtureIndex)}:${nslTeamKey(teamName)}`;
    setNslScores(prev=>({...prev,[key]:Math.max(0,Number(prev[key]||0)+amount)}));
  }
  function getNslScore(teamName,fixtureIndex=0){return nslScores[`${nslFixtureKey(fixtureIndex)}:${nslTeamKey(teamName)}`]||0;}
  function nslFormatTime(seconds){const s=Math.max(0,Number(seconds)||0);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
  function setNslPeriod(period){
    const p=Number(period)||1;
    setNslActivePeriod(p);
    const minutes=p===1?nslPeriod1:p===2?nslPeriod2:p===3?nslPeriod3:nslOvertime;
    setNslRoundSeconds(Math.max(0,Number(minutes)||0)*60);
    setNslTimerRunning(false);
  }
  function startNslPowerPlay(teamName){setNslPowerPlayTeam(teamName);setNslPowerPlaySeconds(60);setNslPowerPlayActive(true);}
  function stopNslPowerPlay(){setNslPowerPlayActive(false);}
  function resetNslScores(){setNslScores({});}


  useEffect(()=>{
    if(!nslTimerRunning) return;
    const id=setInterval(()=>setNslRoundSeconds(prev=>Math.max(0,Number(prev)-1)),1000);
    return ()=>clearInterval(id);
  },[nslTimerRunning]);
  useEffect(()=>{
    if(!nslPowerPlayActive) return;
    const id=setInterval(()=>setNslPowerPlaySeconds(prev=>Math.max(0,Number(prev)-1)),1000);
    return ()=>clearInterval(id);
  },[nslPowerPlayActive]);
  useEffect(()=>{if(nslPowerPlayActive&&nslPowerPlaySeconds<=0)setNslPowerPlayActive(false);},[nslPowerPlayActive,nslPowerPlaySeconds]);
  // v100h43 NSSL round timer and competition persistence

  const modeInfo={
    invasion:{
      title:'Invasion Game',
      tactical:invasionFormat==='lives'
        ?'Survival · discipline · pressure management · defensive control'
        :'Initiative · attacking pressure · opportunity recognition · defender discipline',
      purpose:invasionFormat==='lives'
        ?'Lives Format. Defenders always serve. Invaders protect lives while rotating courts.'
        :'Points Format. Invader always serves. Invader scores from defender errors and balcony penalties.',
      rules:invasionFormat==='lives'?[
        'Lives Format: defenders always serve.',
        `Lives are calculated fairly by team size and carry over after each court rotation.`,
        'If invader hits out of the court area then -1 life event against that team bank.',
        'If invader hits out of court area and into the balcony then -3 lives event against that team bank.',
        'If a penalty would take the team bank below 0, the event still counts but the displayed bank clamps at 0.',
        'Unused lives are carried forward to the next court and when invader finishes all court rotations unused lives are carried forward to next invader.',
        'Winner is the team with the highest team life bank at the end of play.'
      ]:[
        'Points Format: invader always serves. Track team points only.',
        'If a defender hits the ball out of the court area then +1 to invader.',
        'If a defender hits the ball out of the court area and into balcony then +3 points to invader.',
        'Double-bounce handicaps may apply to selected weaker players.',
        'Winner is the team with the most points at the end of play.'
      ]
    },
    matchplay:{
      title:'Matchplay',
      tactical:'Opponent adaptation · score pressure · tactical clarity',
      purpose:'Use matchplay when the goal is tactical adaptation under normal scoring pressure or conditioned match scoring.',
      rules:[
        'Select players or enter names manually.',
        'Use normal scoring or conditioned match scoring.',
        'Shared overlays, checkerboard codes and double-bounce handicaps may be added.',
        'This is the competition area for tactical match constraints, not a Games Library card.'
      ]
    },
    roundRobin:{
      title:'Round Robin',
      tactical:'Consistency across multiple opponents',
      purpose:'Every player/team competes against all others.',
      rules:[
        'Generate fixtures automatically from players marked present in Attendance.',
        'Use this section for round-robin competition setup.',
        'Shared overlays and double-bounce handicaps apply.'
      ]
    },
    monrad:{
      title:'Monrad',
      tactical:'Adaptation across progressive rounds',
      purpose:'Players face opponents with similar records after each round.',
      rules:[
        'Winner/loser progressive pairing engine planned.',
        'Use this section for Monrad competition setup.',
        'Shared overlays and double-bounce handicaps apply.'
      ]
    },
    nsl:{
      title:'NSSL',
      tactical:'Team ladder pressure · rotation discipline · repeated competitive exposure',
      purpose:'NSSL is a team / ladder / rotation competition format. It does not use Lives Format.',
      rules:[
        'Use NSSL for ladder, team or court-rotation competition formats.',
        'No Lives Format is used in NSL.',
        'No Invasion Points Format is used in NSL.',
        'Shared overlays, checkerboard codes and double-bounce handicaps may be added.',
        'NSSL draw graphics, team boxes and period lanes are now available in the Sheet tab.'
      ]
    }
  };

  const current=modeInfo[mode];


  useEffect(()=>{competitionRestoredRef.current=true;},[]);
  useEffect(()=>{
    if(!competitionRestoredRef.current) return;
    try{
      localStorage.setItem(COMPETITION_STATE_KEY,JSON.stringify({
        mode,scoringMode,competitionLayers,competitionCbCode,playerBounces,manualPlayers,matchScore,matchplayMatchFormat,matchPlayers,matchScoring,competitionMatchScores,
        rrFixtures,rrResults,rrMatchFormat,rrBoxCount,rrBoxes,rrBoxFixtures,rrBoxResults,rrFinalBoxes,rrFinalFixtures,rrFinalResults,
        monradRounds,monradResults,monradPlacingRounds,monradPlacingResults,monradFinalPlaces,monradMatchFormat,
        nslOrgTab,nslTeams,nslPlayersPerTeam,nslPeriod1,nslPeriod2,nslPeriod3,nslOvertime,nslScores,nslActivePeriod,nslRoundSeconds,nslPowerPlayTeam,nslPowerPlaySeconds,
        updatedAt:new Date().toISOString()
      }));
    }catch{}
  },[mode,scoringMode,competitionLayers,competitionCbCode,playerBounces,manualPlayers,matchScore,matchplayMatchFormat,matchPlayers,matchScoring,competitionMatchScores,rrFixtures,rrResults,rrMatchFormat,rrBoxCount,rrBoxes,rrBoxFixtures,rrBoxResults,rrFinalBoxes,rrFinalFixtures,rrFinalResults,monradRounds,monradResults,monradPlacingRounds,monradPlacingResults,monradFinalPlaces,monradMatchFormat,nslOrgTab,nslTeams,nslPlayersPerTeam,nslPeriod1,nslPeriod2,nslPeriod3,nslOvertime,nslScores,nslActivePeriod,nslRoundSeconds,nslPowerPlayTeam,nslPowerPlaySeconds,nslPowerPlayActive]);

  useEffect(()=>{
    const projectionState={
      mode,
      title:current.title,
      tactical:current.tactical,
      purpose:current.purpose,
      rules:current.rules,
      invasionFormat,
      competitionLayers,
      competitionCbCode,
      playerBounces,
      playerNames,
      matchScore,
      matchPlayers,
      matchScoring,
      rrFixtures,
      nslTeams,
      nslPlayersPerTeam,
      nslPeriod1,
      nslPeriod2,
      nslPeriod3,
      nslOvertime,
      nslScores,
      nslActivePeriod,
      nslRoundSeconds,
      nslPowerPlayTeam,
      nslPowerPlaySeconds,
      nslPowerPlayActive,
      updatedAt:new Date().toISOString()
    };
    try{
      localStorage.setItem('checkerboardCompetitionProjection',JSON.stringify(projectionState));
    }catch{}
  },[mode,invasionFormat,competitionLayers,competitionCbCode,playerBounces,manualPlayers,matchScore,matchPlayers,matchScoring,competitionMatchScores,rrFixtures,nslTeams,nslPlayersPerTeam,nslPeriod1,nslPeriod2,nslPeriod3,nslOvertime,nslScores,nslActivePeriod,nslRoundSeconds,nslPowerPlayTeam,nslPowerPlaySeconds,nslPowerPlayActive,current.title,current.tactical,current.purpose]);


  return (
    <div className="page">
      <div className="pageTop">
        <h1>Competition</h1>
      </div>
      <div className="gameClassGrid">
        <button type="button" className={mode==='invasion'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('invasion')}>Invasion Game</button>
        <button type="button" className={mode==='matchplay'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('matchplay')}>Matchplay</button>
        <button type="button" className={mode==='roundRobin'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('roundRobin')}>Round Robin</button>
        <button type="button" className={mode==='monrad'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('monrad')}>Monrad</button>
        <button type="button" className={mode==='nsl'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('nsl')}>NSSL</button>
      </div>

      {(mode==='matchplay'||mode==='roundRobin'||mode==='monrad')&&(
      <div className="competitionScoringModeBar">
        <strong>Competition Scoring</strong>
        <div className="scoringModeToggle">
          <button type="button" className={scoringMode==='normal'?'activeScoringMode':''} onClick={()=>setScoringMode('normal')}>Normal Scoring</button>
          <button type="button" className={scoringMode==='custom'?'activeScoringMode':''} onClick={()=>setScoringMode('custom')}>Custom / Timed</button>
        </div>
        <p className="scoringModeHint">{scoringMode==='normal'?'Enter loser score only — winner score auto-fills. Win by 2 after 10-all.':'Enter both scores manually for timed or conditioned matches.'}</p>
      </div>
      )}

      <div className="competitionProjectionToggle">
        <button type="button" className={showCompetitionProjection?'primaryBtn':'secondaryBtn'} onClick={()=>setShowCompetitionProjection(!showCompetitionProjection)}>
          {showCompetitionProjection?'Hide Player Projection':'Show Player Projection'}
        </button>
      </div>

      {showCompetitionProjection&&(
        <div className="competitionProjectionView">
          <div className="projectionHeaderBar">
            <span>PLAYER PROJECTION</span>
            <h1>{current.title}</h1>
            <p>{mode==='matchplay'
              ?`${matchPlayers.a||'Player A'} ${matchScore.a} - ${matchScore.b} ${matchPlayers.b||'Player B'}`
              :mode==='invasion'
                ?`Invasion · ${invasionFormat==='lives'?'Lives Format':'Points Format'}`
                :mode==='roundRobin'
                  ?'Round Robin · Fixtures / next opponent'
                  :mode==='nsl'
                    ?`NSSL · P${nslActivePeriod} · ${nslFormatTime(nslRoundSeconds)} remaining`
                    :'Competition information'}
            </p>
          </div>

          <div className="projectionInfoGrid">
            <div className="projectionInfoCard">
              <strong>Current Focus</strong>
              <p>{current.tactical}</p>
            </div>
            <div className="projectionInfoCard">
              <strong>Rules</strong>
              <p>{current.rules?.[0]||'Follow the competition format.'}</p>
            </div>
            <div className="projectionInfoCard">
              <strong>Checkerboard</strong>
              <p>{competitionCbCode}</p>
            </div>
            <div className="projectionInfoCard">
              <strong>Active Overlays</strong>
              <p>{competitionLayers.length?competitionLayers.join(' · '):'None selected'}</p>
            </div>
          </div>

          <div className="projectionInfoCard wideProjectionCard">
            <strong>Players / DB Handicaps</strong>
            {playerNames.length>0
              ?<div className="projectionPlayerList">{playerNames.map(name=><span key={name}>{name}: {playerBounces[name]||'No DB'}</span>)}</div>
              :<p>No players selected yet.</p>}
          </div>

          {mode==='roundRobin'&&rrFixtures&&rrFixtures.length>0&&(
            <div className="projectionInfoCard wideProjectionCard">
              <strong>Round Robin Fixtures</strong>
              {rrFixtures.slice(0,3).map((round,idx)=><p key={idx}>Round {idx+1}: {round.map(match=>`${match.a} v ${match.b}`).join(' · ')}</p>)}
            </div>
          )}

          {mode==='monrad'&&(
          <div className="projectionMonradBoard">
            {monradRounds.length===0&&<div className="projectionInfoCard wideProjectionCard"><p>Competition not started yet.</p></div>}
            {monradRounds.length>0&&(
              <div className="projectionMonradColumns">
                <div className="projectionMonradLeft">
                  {monradRounds.map((round,ridx)=>(
                    <div key={ridx} className="projectionRoundBlock">
                      <div className="projectionRoundTitle">Round {ridx+1}</div>
                      {round.map((match,midx)=>{
                        const winner=match.b==='BYE'?match.a:monradResults[monradResultKey(ridx,midx)];
                        const saved=competitionMatchScores[scoreKey('monrad',ridx,midx)];
                        const games=saved?.games||[];
                        return <div key={midx} className={`projectionMatchRow${winner?' projectionMatchDone':''}`}>
                          <span className={winner===match.a?'projWinner':winner&&winner!==match.a?'projLoser':''}>{match.a}</span>
                          <span className="projScores">
                            {games.length>0
                              ?games.filter(g=>g.a!==''||g.b!=='').map((g,gi)=><span key={gi} className="projGameScore">{g.a}–{g.b}</span>)
                              :winner?<span className="projGameScore">✓</span>:<span className="projVs">v</span>
                            }
                          </span>
                          <span className={winner===match.b?'projWinner':winner&&winner!==match.b?'projLoser':''}>{match.b==='BYE'?'BYE':match.b}</span>
                        </div>;
                      })}
                    </div>
                  ))}
                  {monradPlacingRounds.length>0&&monradPlacingRounds.map((round,ridx)=>(
                    <div key={`place-${ridx}`} className="projectionRoundBlock projectionPlacingRound">
                      <div className="projectionRoundTitle">Placing Round {ridx+1}</div>
                      {round.map(group=>(
                        <div key={group.id} className="projectionGroupBlock">
                          <div className="projectionGroupLabel">Places {group.range}</div>
                          {(group.matches||[]).map((match,midx)=>{
                            const auto=isByeName(match.a)?match.b:isByeName(match.b)?match.a:null;
                            const winner=auto||monradPlacingResults[monradPlaceKey(ridx,group.id,midx)];
                            const saved=competitionMatchScores[scoreKey(`monrad-place-${group.id}`,ridx,midx)];
                            const games=saved?.games||[];
                            return <div key={midx} className={`projectionMatchRow${winner?' projectionMatchDone':''}`}>
                              <span className={winner===match.a?'projWinner':winner&&winner!==match.a?'projLoser':''}>{match.a}</span>
                              <span className="projScores">
                                {games.length>0
                                  ?games.filter(g=>g.a!==''||g.b!=='').map((g,gi)=><span key={gi} className="projGameScore">{g.a}–{g.b}</span>)
                                  :winner?<span className="projGameScore">✓</span>:<span className="projVs">v</span>
                                }
                              </span>
                              <span className={winner===match.b?'projWinner':winner&&winner!==match.b?'projLoser':''}>{isByeName(match.b)?'BYE':match.b}</span>
                            </div>;
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="projectionMonradRight">
                  <div className="projectionTableBlock">
                    <div className="projectionTableTitle">Player Status</div>
                    {(()=>{
                      const scores=monradPlayerScores();
                      const placingTable=getMonradFinalTable();
                      // Find each player's next opponent from the latest round
                      const latestRound=monradPlacingRounds.length>0
                        ?monradPlacingRounds[monradPlacingRounds.length-1]
                        :null;
                      return placingTable.map(row=>{
                        const record=scores[row.name];
                        let nextOpponent='—';
                        if(latestRound){
                          latestRound.forEach(group=>{
                            (group.matches||[]).forEach((match,midx)=>{
                              const ridx=monradPlacingRounds.length-1;
                              const alreadyDone=isByeName(match.a)?true:isByeName(match.b)?true:!!monradPlacingResults[monradPlaceKey(ridx,group.id,midx)];
                              if(!alreadyDone){
                                if(match.a===row.name) nextOpponent=match.b;
                                if(match.b===row.name) nextOpponent=match.a;
                              }
                            });
                          });
                        }
                        return <div key={row.name} className={`projPlayerStatusCard${row.place!=='—'?' projPlayerSettled':''}`}>
                          <div className="projPlayerName">{row.name}</div>
                          <div className="projPlayerMeta">
                            <span className="projPlayerPlace">{row.place!=='—'?`Place: ${row.place}`:'In Progress'}</span>
                            <span>{record?.wins||0}W · {record?.played||0}P</span>
                            {nextOpponent!=='—'&&<span className="projNextOpp">Next: {nextOpponent}</span>}
                          </div>
                        </div>;
                      });
                    })()}
                  </div>
                  <div className="projectionTableBlock">
                    <div className="projectionTableTitle">Live Placings</div>
                    <div className="projectionStandingsTable">
                      <div className="projStandingsHeader"><span>#</span><span>Player</span></div>
                      {getMonradFinalTable().map(row=>(
                        <div key={row.name} className={`projStandingsRow${row.place!=='—'?' projPlacingSettled':''}`}>
                          <span className="projPlaceNum">{row.place}</span><span>{row.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {mode==='nsl'&&(
            <div className="projectionInfoCard wideProjectionCard">
              <strong>NSSL Sheet</strong>
              <p>Period 1: {nslPeriod1} min · Period 2: {nslPeriod2} min · Period 3: {nslPeriod3} min · Overtime: {nslOvertime} min</p>
              <p>Teams: {nslTeams} · Players per team: {nslPlayersPerTeam}</p><p>Timer: Period {nslActivePeriod} · {nslFormatTime(nslRoundSeconds)} remaining</p><p>Power Play: {nslPowerPlayActive?`${nslPowerPlayTeam} only · ${nslFormatTime(nslPowerPlaySeconds)}`:'Inactive'}</p><p>{getNslFixtures().map((fixture,idx)=>`${fixture.a} ${getNslScore(fixture.a,idx)} - ${getNslScore(fixture.b,idx)} ${fixture.b}`).join(' · ')}</p>
            </div>
          )}

          {mode==='invasion'&&(
            <div className="projectionInfoCard wideProjectionCard">
              <strong>Invasion Format</strong>
              <p>{invasionFormat==='lives'
                ?'Defenders serve. Track lives. Winner is the team with the most lives at the end of play.'
                :'Invader serves. Add player points to the team total. No lives are used in Points Format.'}</p>
            </div>
          )}
        </div>
      )}


      <div className="gameCard">
        <div className="categoryTag">Competition Mode</div>
        <h2>{current.title}</h2>

        {mode==='invasion'&&(
          <div className="invasionRebuildPanel">
            <div className="invasionFormatToggle">
              <button type="button" className={invasionFormat==='lives'?'activeInvasionFormat':''} onClick={()=>chooseInvasionFormat('lives')}>Lives Format</button>
              <button type="button" className={invasionFormat==='points'?'activeInvasionFormat':''} onClick={()=>chooseInvasionFormat('points')}>Points Format</button>
            </div>

            <div className="invasionRuleHero">
              <strong>{invasionFormat==='lives'?'Defenders always serve':'Invader always serves'}</strong>
              <p>{invasionFormat==='lives'
                ?'Best when you want survival pressure, discipline and risk control.'
                :'Best when you want attacking initiative, pressure creation and defender consequence.'}</p>
            </div>

            <div className="invasionConfigGrid">
              <label>Courts
                <select value={invasionCourts} onChange={e=>setInvasionCourts(Number(e.target.value))}>
                  <option value={1}>1 court</option>
                  <option value={2}>2 courts</option>
                  <option value={3}>3 courts</option>
                  <option value={4}>4 courts</option>
                  <option value={5}>5 courts</option>
                  <option value={6}>6 courts</option>
                </select>
              </label>

              {invasionFormat==='lives'&&<label>Starting Lives
                <select value={invasionStartingLives} onChange={e=>setInvasionStartingLives(Number(e.target.value))}>
                  <option value={3}>3 lives</option>
                  <option value={4}>4 lives</option>
                  <option value={5}>5 lives</option>
                  <option value={6}>6 lives</option>
                  <option value={8}>8 lives</option>
                  <option value={10}>10 lives</option>
                </select>
              </label>}
            </div>

            <label className="invasionTextLabel">Rotation / Organisation Notes
              <textarea value={invasionRotation} onChange={e=>setInvasionRotation(e.target.value)} />
            </label>

            <label className="invasionTextLabel">Challenge / Tactical Focus
              <textarea value={invasionChallenge} onChange={e=>setInvasionChallenge(e.target.value)} />
            </label>

            <div className="invasionStartPanel">
              <div>
                <strong>{invasionGameStarted?'Game live':'Ready to start'}</strong>
                <p>{invasionFormat==='lives'
                  ?'Starts the live carry-over lives competition and updates the projector.'
                  :'Starts the live points competition and updates the projector.'}</p>
              </div>
              <div className="invasionStartButtons">
                <button type="button" className="primaryBtn" onClick={startInvasionProjector}>START GAME / PROJECTOR</button>
                <button type="button" className="secondaryBtn dangerBtn" onClick={stopInvasionProjector}>STOP / END GAME</button>
              </div>
            </div>

            <div className="invasionSetupBox">
              <strong>Teams / Courts Setup</strong>
              <p>Players are pulled from Attendance. Choose number of courts above, then generate teams.</p>
              <div className="buttonRow"><button type="button" className="primaryBtn" onClick={generateInvasionTeams}>Generate Teams From Attendance</button>{competitionUndo&&<button type="button" className="secondaryBtn undoBtn" onClick={undoCompetitionChange}>Undo {competitionUndo.label}</button>}</div>

              {invasionTeams.length>0&&(
                <div className="invasionTeamGrid">
                  {invasionTeams.map((team,index)=>(
                    <div className="invasionTeamCard" key={team.id}>
                      <h3>{displayTeamName(team,index)}</h3>
                      <p><strong>Court:</strong> {team.court}</p>
                      <p><strong>Players:</strong> {team.players.length?team.players.join(' · '):'Waiting for players'}</p>

                      {invasionFormat==='lives'&&(
                        <div className="invasionLifeBankControls">
                          <strong>Carry-Over Lives: {invasionTeamLives[team.id] ?? invasionStartingLives}</strong>
                          <p>This carry-over is added to the next invader's fair base lives.</p>
                          <div className="buttonRow">
                            <button type="button" className="secondaryBtn" onClick={()=>adjustInvasionTeamLives(team.id,1)}>+1</button>
                            <button type="button" className="secondaryBtn" onClick={()=>adjustInvasionTeamLives(team.id,-1)}>-1</button>
                            <button type="button" className="secondaryBtn" onClick={()=>adjustInvasionTeamLives(team.id,-3)}>-3 Balcony</button>
                          </div>
                          <label>Set Bank
                            <input type="number" min="0" value={invasionTeamLives[team.id] ?? invasionStartingLives} onChange={e=>setInvasionTeamBank(team.id,e.target.value)} />
                          </label>
                          {(invasionTeamLives[team.id] ?? invasionStartingLives)===0&&<em>Rotation stopped — team bank is 0.</em>}
                        </div>
                      )}

                      {invasionFormat==='points'&&(
                        <div className="invasionPointControls">
                          <strong>Team Points: {calculateTeamPointsFromPlayers(team)}</strong>
                          <div className="buttonRow">
                            <button type="button" className="secondaryBtn" onClick={()=>addInvasionTeamPoints(team.id,1)}>+1</button>
                            <button type="button" className="secondaryBtn" onClick={()=>addInvasionTeamPoints(team.id,3)}>+3</button>
                            <button type="button" className="secondaryBtn" onClick={()=>addInvasionTeamPoints(team.id,-1)}>-1</button>
                          </div>
                        </div>
                      )}

                      {invasionFormat==='points'&&team.players.length>0&&(
                        <div className="invasionPlayerPointList">
                          {team.players.map(player=>(
                            <div key={player}>
                              <span>{invasionName(player)}: {invasionPlayerPoints[invasionName(player)]||0}</span>
                              <button type="button" onClick={()=>addInvasionPlayerPoints(invasionName(player),1)}>+1</button>
                              <button type="button" onClick={()=>addInvasionPlayerPoints(invasionName(player),3)}>+3</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {invasionFormat==='points'&&invasionTeams.length>0&&(
                <div className="buttonRow invasionRoundControls">
                  <button type="button" className="primaryBtn" onClick={updateInvasionPlayerView}>Update Player View</button>
                  <button type="button" className="primaryBtn" onClick={startNextInvasionRound}>Start Next Round</button>
                  <button type="button" className="secondaryBtn" onClick={()=>{captureCompetitionUndo('Reset Invasion Points');resetInvasionPoints();}}>Reset Invasion Points</button>
                </div>
              )}

              {invasionFormat==='lives'&&invasionTeams.length>0&&(
                <button type="button" className="secondaryBtn" onClick={()=>{captureCompetitionUndo('Reset Team Life Banks');resetInvasionLifeBanks();}}>Reset Team Life Banks</button>
              )}

              {invasionTeams.length>0&&(
                <div className="coachInvaderSelector">
                  <h2>Coach Invader Selection</h2>
                  <p>Default order is lowest-ranked player first. Override here if a team chooses a tactical invader.</p>
                  <div className="coachInvaderGrid">
                    {invasionTeams.map((team,index)=>{
                      const ordered=sortInvasionPlayersLowestFirst(team.players||[]);
                      const current=invasionInvaderOverrides[team.id]||ordered[invasionPlayerRound%Math.max(1,ordered.length)]||'';
                      return <div className="coachInvaderCard" key={team.id}>
                        <h3>{displayTeamName(team,index)}</h3>
                        <label>Current invader
                          <select value={current} onChange={e=>setInvasionInvaderOverrides(prev=>({...prev,[team.id]:e.target.value}))}>
                            {ordered.map(player=><option key={player} value={player}>{player}</option>)}
                          </select>
                        </label>
                        <p>Default order: {ordered.join(' → ')}</p>
                      </div>;
                    })}
                  </div>
                </div>
              )}
            </div>

            {invasionTeams.length>0&&(
              <div className="invasionRotationEngine">
                <div className="rotationEngineTop">
                  <strong>Rotation Engine</strong>
                  <span>Rotation {invasionRotationStep}</span>
                </div>

                <div className="invasionConfigGrid">
                  <label>Eliminated / Trigger Player
                    <select value={invasionEliminated} onChange={e=>setInvasionEliminated(e.target.value)}>
                      <option value="">None selected</option>
                      {playerNames.map(name=><option key={name}>{name}</option>)}
                    </select>
                  </label>

                  <label>Court Assignment
                    <select value={invasionCourtAssignmentMode} onChange={e=>setInvasionCourtAssignmentMode(e.target.value)}>
                      <option value="fixed">Fixed rotation</option>
                      <option value="random">Random each round</option>
                    </select>
                  </label>
                </div>

                <div className="rotationButtonRow">
                  <button type="button" className="primaryBtn" onClick={rotateInvasionCourts}>Rotate Courts</button>
                  <button type="button" className="secondaryBtn" onClick={resetInvasionRotation}>Reset Rotation</button>
                </div>

                <div className="rotationNoteBox">
                  {invasionFormat==='lives'
                    ?'All courts are active. Rotate all invaders together. Court assignment can stay fixed or be randomised each round.'
                    :'All courts are active. Rotate all invaders together at timed intervals or agreed score checkpoints.'}
                </div>
              </div>
            )}

            {invasionTeams.length>0&&(
              <div className="invasionDashboardBlock">
                <div className="invasionDashboardTop">
                  <strong>Live Court Dashboard</strong>
                  <button type="button" className={showInvasionDashboard?'primaryBtn':'secondaryBtn'} onClick={()=>setShowInvasionDashboard(!showInvasionDashboard)}>
                    {showInvasionDashboard?'Hide Dashboard':'Show Dashboard'}
                  </button>
                </div>

                {invasionFormat==='lives'&&showInvasionDashboard&&(
                  <div className="invasionCourtDashboard">
                    {(invasionCourtAssignments.length?invasionCourtAssignments:invasionTeams.map((team,idx)=>({court:idx+1,defendingTeamId:team.id,defendingTeamName:displayTeamName(team,idx),defenders:team.players||[],invadingTeamId:'',invadingTeamName:'Waiting',invader:'Generate / rotate courts'}))).map(assign=>(
                      <div className="invasionCourtCard activeCourtCard" key={`${assign.court}-${assign.defendingTeamId}-${assign.invader}`}>
                        <div className="courtCardHeader">
                          <span>Court {assign.court}</span>
                          <strong>{assign.defendingTeamName} defending</strong>
                        </div>

                        <div className="courtCardPlayers">
                          <p><b>Invader:</b> {assign.invader} <em>{assign.invadingTeamName}</em></p>
                          <p><b>Defenders:</b> {assign.defenders&&assign.defenders.length?assign.defenders.join(' · '):'Waiting for defenders'}</p>
                        </div>

                        <div className="courtCardScore">
                          {invasionFormat==='points'
                            ?<strong>{invasionTeamPoints[assign.invadingTeamId]||0} team pts</strong>
                            :<strong>{(() => {
                              const invTeam=invasionTeams.find(team=>team.id===assign.invadingTeamId);
                              return invTeam?getInvasionStartLivesFromMap(invTeam,getInvasionFairLivesMap(invasionTeams)):(Number(invasionStartingLives)||5);
                            })()} lives</strong>}
                        </div>

                        <div className="courtCardChallenge">
                          {invasionFormat==='lives'
                            ?'All courts active. Visiting invader plays against the defending team on this court.'
                            :'All courts active. Visiting invader accumulates points for their team.'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {invasionFormat==='lives'&&invasionTeams.length>0&&(
              <div className="fairLivesEngineBox">
                <div className="fairLivesHeader">
                  <strong>Fair Lives Carry-Over Engine</strong>
                  <span>Equal team capacity: {getInvasionFairBaseTotal()}</span>
                </div>
                <p>Fair lives: Starting Lives applies to the largest/equal-sized team. Smaller teams receive extra lives per player so team capacity stays fair. Carry-over then adds to the next invasion.</p>

                <div className="fairLivesGrid">
                  {invasionTeams.map((team,index)=>(
                    <div className="fairLivesTeamCard" key={team.id}>
                      <h3>{displayTeamName(team,index)}</h3>
                      <p><strong>Players:</strong> {team.players.length}</p>
                      <p><strong>Base lives:</strong> {getInvasionBaseLives(team)}</p>
                      <p><strong>Carry-over:</strong> {getInvasionCarry(team.id)}</p>
                      <p><strong>Lives this invasion:</strong> {getInvasionStartLives(team)}</p>
                      <label>Finish lives after this court rotation
                        <input type="number" min="0" value={invasionFinishLives[team.id] ?? ''} onChange={e=>setInvasionFinish(team.id,e.target.value)} placeholder="0" />
                      </label>
                    </div>
                  ))}
                </div>

                <button type="button" className="primaryBtn" onClick={()=>{captureCompetitionUndo('Post Lives');postInvasionRotationLives();}}>Post Lives Score After Court Rotation</button>
              </div>
            )}

            {invasionFormat==='lives'&&invasionTeams.length>0&&(
              <div className="finalInvasionEngine">
                <div className="finalEngineHeader">
                  <strong>Final Invasion Engine</strong>
                  <span>Player rotation {invasionPlayerRound+1} · Court rotation {invasionCourtRound+1}</span>
                </div>

                <div className="finalRulesStrip">
                  <span>All courts active</span>
                  <span>Base lives + carry-over</span>
                  <span>Post remaining lives after each court rotation</span>
                  <span>Next player inherits carry-over</span>
                </div>

                <div className="finalTeamStateGrid">
                  {invasionTeams.map((team,index)=>(
                    <div className="finalTeamStateCard" key={team.id}>
                      <h3>{displayTeamName(team,index)}</h3>
                      <p><b>Current invader:</b> {getFinalInvader(team)}</p>
                      <p><b>Base lives:</b> {getInvasionBaseLives(team)}</p>
                      <p><b>Carry-over:</b> {getInvasionCarry(team.id)}</p>
                      <p><b>Starts now:</b> {getFinalStartLives(team)}</p>
                      <label>Remaining lives after this court
                        <input type="number" min="0" value={invasionFinishLives[team.id] ?? ''} onChange={e=>setInvasionFinish(team.id,e.target.value)} placeholder="0" />
                      </label>
                    </div>
                  ))}
                </div>

                <div className="finalCourtStateGrid">
                  {Array.from({length:invasionTeams.length}).map((_,idx)=>{
                    const defending=getFinalDefendingTeamForCourt(idx);
                    const invading=getFinalInvadingTeamForCourt(idx);
                    return <div className="finalCourtStateCard" key={`final-court-${idx}`}>
                      <h3>Court {idx+1}</h3>
                      <p><b>Defending team:</b> {defending?displayTeamName(defending,idx):'Waiting'}</p>
                      <p><b>Invader:</b> {invading?getFinalInvader(invading):'Waiting'} · {invading?displayTeamName(invading,idx):''}</p>
                      <p><b>Start lives:</b> {invading?getFinalStartLives(invading):'—'}</p>
                    </div>;
                  })}
                </div>

                <div className="finalActionRow">
                  <button type="button" className="secondaryBtn" onClick={()=>{captureCompetitionUndo('Post Remaining Lives');postFinalCourtResults();}}>Post Remaining Lives</button>
                  <button type="button" className="primaryBtn" onClick={()=>{captureCompetitionUndo('End Court Rotation');rotateFinalCourts();}}>End Court Rotation</button>
                  <button type="button" className="primaryBtn" onClick={()=>{captureCompetitionUndo('Next Invaders');nextFinalInvaders();}}>Next Invaders</button>
                  <button type="button" className="secondaryBtn" onClick={()=>{captureCompetitionUndo('Reset Invasion Engine');resetFinalInvasionEngine();}}>Reset Invasion Engine</button>
                </div>
              </div>
            )}

            <div className="invasionRulesGrid">
              <div className="invasionRuleCard">
                <strong>Out of Court</strong>
                <p>{invasionFormat==='lives'
                  ?'Invader out = -1 life.'
                  :'Defender out = +1 point to invader.'}</p>
              </div>
              <div className="invasionRuleCard danger">
                <strong>Balcony</strong>
                <p>{invasionFormat==='lives'
                  ?'Invader into balcony = -3 lives.'
                  :'Defender into balcony = +3 points to invader.'}</p>
              </div>
              <div className="invasionRuleCard">
                <strong>Rotation</strong>
                <p>{invasionFormat==='lives'
                  ?'Stop when one invader loses all lives. Rotate courts. Carry unused lives forward.'
                  :'Timed rotations. Team total is built from player scores.'}</p>
              </div>
            </div>
          </div>
        )}

        {mode==='matchplay'&&(
          <div className="matchplayPanel">
            <div className="monradMatchFormatRow">
              <strong>Match Format</strong>
              <div className="monradFormatBtns">
                {['Best of 1','Best of 3','Best of 5'].map(fmt=><button type="button" key={fmt} className={matchplayMatchFormat===fmt?'activeMonradFormat':'secondaryBtn'} onClick={()=>setMatchplayMatchFormat(fmt)}>{fmt}</button>)}
              </div>
            </div>
            <div className="atlOptionsGrid">
              <label>Player A
                <select value={matchPlayers.a} onChange={e=>setMatchPlayers(prev=>({...prev,a:e.target.value}))}>
                  <option value="">Select from attendance</option>
                  {playerNames.map(name=><option key={name} value={name}>{name}</option>)}
                  {matchPlayers.a&&!playerNames.includes(matchPlayers.a)&&<option value={matchPlayers.a}>{matchPlayers.a}</option>}
                </select>
              </label>
              <label>Player B
                <select value={matchPlayers.b} onChange={e=>setMatchPlayers(prev=>({...prev,b:e.target.value}))}>
                  <option value="">Select from attendance</option>
                  {playerNames.map(name=><option key={name} value={name}>{name}</option>)}
                  {matchPlayers.b&&!playerNames.includes(matchPlayers.b)&&<option value={matchPlayers.b}>{matchPlayers.b}</option>}
                </select>
              </label>
              <label>Scoring Format
                <select value={matchScoring} onChange={e=>setMatchScoring(e.target.value)}>
                  <option>PAR 11</option>
                  <option>PAR 15</option>
                  <option>Conditioned Match</option>
                  <option>Timed Match</option>
                </select>
              </label>
            </div>
            {matchPlayers.a&&matchPlayers.b&&<ScoreEntry
              scoreId="matchplay-main"
              match={{a:matchPlayers.a,b:matchPlayers.b}}
              matchFormat={matchplayMatchFormat}
              onWinner={winner=>{}}
            />}
            {(!matchPlayers.a||!matchPlayers.b)&&<div className="placeholder">Select both players above to enter scores.</div>}
            <button className="secondaryBtn" style={{marginTop:'10px'}} onClick={resetMatch}>Reset Match Score</button>
          </div>
        )}

        {mode==='roundRobin'&&(
          <div className="competitionEnginePanel competitionDrawPanel">
            <div className="drawHeaderCard">
              <h2>Round Robin Box Engine</h2>
              <p>Choose one or more boxes. First stage boxes feed final placing boxes: box winners play for top places, second-placed players play for the next places, and so on.</p>
              <div className="monradMatchFormatRow">
                <strong>Match Format</strong>
                <div className="monradFormatBtns">
                  {['Best of 1','Best of 3','Best of 5'].map(fmt=><button type="button" key={fmt} className={rrMatchFormat===fmt?'activeMonradFormat':'secondaryBtn'} onClick={()=>setRrMatchFormat(fmt)}>{fmt}</button>)}
                </div>
              </div>
              <div className="atlOptionsGrid">
                <label>Number of boxes
                  <select value={rrBoxCount} onChange={e=>setRrBoxCount(Number(e.target.value))}>
                    {Array.from({length:Math.max(1,Math.min(6,playerNames.length||6))},(_,idx)=><option key={idx+1} value={idx+1}>{idx+1} box{idx?'es':''}</option>)}
                  </select>
                </label>
                <label>Players available
                  <input value={`${playerNames.length} players`} readOnly />
                </label>
              </div>
              <div className="buttonRow">
                <button className="primaryBtn" onClick={distributeRoundRobinBoxes}>Generate Box Stage</button>
                <button className="secondaryBtn" onClick={generateRrFinalBoxes}>Generate Final Placing Boxes</button>
                <button className="secondaryBtn" onClick={generateRoundRobin}>Generate Single Box Only</button>
              </div>
            </div>

            {rrBoxes.length===0&&rrFixtures.length===0&&<p className="overlayExplain">Uses players marked present in Attendance. Enter manual players in the Double-Bounce section if none are present.</p>}

            {rrBoxes.length>0&&(
              <div className="rrBoxStagePanel">
                <h3>Stage 1: Group Boxes</h3>
                <div className="rrBoxGrid">
                  {rrBoxes.map((box,bidx)=>(
                    <div className="rrBoxCard" key={box.name}>
                      <div className="drawRoundTitle">{box.name}</div>
                      <p><b>Players:</b> {box.players.join(' · ')}</p>
                      {(rrBoxFixtures[bidx]||[]).map((round,ridx)=>(
                        <div className="drawRoundBox miniDrawRound" key={`${box.name}-${ridx}`}>
                          <div className="drawRoundTitle">Round {ridx+1}</div>
                          {round.map((match,midx)=>{
                            const winner=rrBoxResults[rrBoxKey(bidx,ridx,midx,'group')];
                            return <div className="drawMatchBox" key={midx}>
                              <div className={winner===match.a?'drawPlayerLine winnerLine':'drawPlayerLine'}><span>{match.a}</span><button type="button" onClick={()=>setRrBoxWinner(bidx,ridx,midx,match.a,'group')}>Win</button></div>
                              <div className={winner===match.b?'drawPlayerLine winnerLine':'drawPlayerLine'}><span>{match.b}</span><button type="button" onClick={()=>setRrBoxWinner(bidx,ridx,midx,match.b,'group')}>Win</button></div>
                              <ScoreEntry scoreId={scoreKey('rr-group',ridx,midx,bidx)} match={match} matchFormat={rrMatchFormat} onWinner={winner=>setRrBoxWinner(bidx,ridx,midx,winner,'group')} />
                            </div>;
                          })}
                        </div>
                      ))}
                      <div className="standingsBox compactStandingsBox">
                        <h3>{box.name} Standings</h3>
                        <div className="standingsTable">
                          <div><b>Player</b><b>P</b><b>W</b><b>Pts</b></div>
                          {getBoxStandings(box,rrBoxFixtures[bidx]||[],rrBoxResults,bidx,'group').map(row=><div key={row.name}><span>{row.name}</span><span>{row.played}</span><span>{row.wins}</span><span>{row.points}</span></div>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rrFinalBoxes.length>0&&(
              <div className="rrFinalStagePanel">
                <h3>Stage 2: Final Placing Boxes</h3>
                <p>Each placing box is populated from the same finishing position in the group boxes.</p>
                <div className="rrBoxGrid">
                  {rrFinalBoxes.map((box,bidx)=>(
                    <div className="rrBoxCard finalBoxCard" key={box.name}>
                      <div className="drawRoundTitle">{box.name} · {box.range}</div>
                      <p><b>Qualified players:</b> {box.players.join(' · ')}</p>
                      {(rrFinalFixtures[bidx]||[]).map((round,ridx)=>(
                        <div className="drawRoundBox miniDrawRound" key={`${box.name}-${ridx}`}>
                          <div className="drawRoundTitle">Round {ridx+1}</div>
                          {round.map((match,midx)=>{
                            const winner=rrFinalResults[rrBoxKey(bidx,ridx,midx,'final')];
                            return <div className="drawMatchBox" key={midx}>
                              <div className={winner===match.a?'drawPlayerLine winnerLine':'drawPlayerLine'}><span>{match.a}</span><button type="button" onClick={()=>setRrBoxWinner(bidx,ridx,midx,match.a,'final')}>Win</button></div>
                              <div className={winner===match.b?'drawPlayerLine winnerLine':'drawPlayerLine'}><span>{match.b}</span><button type="button" onClick={()=>setRrBoxWinner(bidx,ridx,midx,match.b,'final')}>Win</button></div>
                              <ScoreEntry scoreId={scoreKey('rr-final',ridx,midx,bidx)} match={match} matchFormat={rrMatchFormat} onWinner={winner=>setRrBoxWinner(bidx,ridx,midx,winner,'final')} />
                            </div>;
                          })}
                        </div>
                      ))}
                      <div className="standingsBox compactStandingsBox">
                        <h3>{box.range}</h3>
                        <div className="standingsTable">
                          <div><b>Player</b><b>P</b><b>W</b><b>Pts</b></div>
                          {getBoxStandings(box,rrFinalFixtures[bidx]||[],rrFinalResults,bidx,'final').map(row=><div key={row.name}><span>{row.name}</span><span>{row.played}</span><span>{row.wins}</span><span>{row.points}</span></div>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rrFixtures.length>0&&rrBoxes.length===0&&(
              <div className="drawTwoColumn">
                <div className="roundRobinDrawGrid">
                  {rrFixtures.map((round,idx)=>(
                    <div className="drawRoundBox" key={idx}>
                      <div className="drawRoundTitle">Round {idx+1}</div>
                      {round.map((match,midx)=>{
                        const winner=rrResults[rrKey(idx,midx)];
                        return <div className="drawMatchBox" key={midx}>
                          <div className={winner===match.a?'drawPlayerLine winnerLine':'drawPlayerLine'}><span>{match.a}</span><button type="button" onClick={()=>setRoundRobinWinner(idx,midx,match.a)}>Win</button></div>
                          <div className={winner===match.b?'drawPlayerLine winnerLine':'drawPlayerLine'}><span>{match.b}</span><button type="button" onClick={()=>setRoundRobinWinner(idx,midx,match.b)}>Win</button></div>
                        </div>;
                      })}
                    </div>
                  ))}
                </div>
                <div className="standingsBox">
                  <h3>Live Standings</h3>
                  <div className="standingsTable standingsTableFull">
                    <div><b>#</b><b>Player</b><b>W</b><b>L</b><b>PF</b><b>PA</b><b>Diff</b></div>
                    {getRoundRobinStandings().map((row,idx)=><div key={row.name}><span>{idx+1}</span><span>{row.name}</span><span>{row.wins}</span><span>{row.losses}</span><span>{row.pf}</span><span>{row.pa}</span><span>{row.pf-row.pa>0?'+':''}{row.pf-row.pa}</span></div>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {mode==='monrad'&&(
          <div className="competitionEnginePanel competitionDrawPanel">
            <div className="drawHeaderCard">
              <h2>Monrad Full Placing Draw</h2>
              <p>Every player keeps playing until final placings are settled. Winners move toward the higher placing pathway; losers move into the next placing pathway.</p>
              <div className="monradMatchFormatRow">
                <strong>Match Format</strong>
                <div className="monradFormatBtns">
                  {['Best of 1','Best of 3','Best of 5'].map(fmt=><button type="button" key={fmt} className={monradMatchFormat===fmt?'activeMonradFormat':'secondaryBtn'} onClick={()=>setMonradMatchFormat(fmt)}>{fmt}</button>)}
                </div>
              </div>
              <div className="buttonRow">
                <button className={monradPlacingRounds.length===0?'primaryBtn':'secondaryBtn'} onClick={generateMonradPlacingDraw}>Generate Placing Draw</button>
                <button className={monradPlacingRounds.length>0?'primaryBtn':'secondaryBtn'} onClick={generateNextMonradPlacingRound}>
                  {monradPlacingRounds.length>0?`Generate Next Round (Round ${monradPlacingRounds.length})`:'Generate Next Round'}
                </button>
                <button className="secondaryBtn dangerBtn" onClick={()=>{
                  setMonradRounds([]);
                  setMonradResults({});
                  setMonradPlacingRounds([]);
                  setMonradPlacingResults({});
                  setMonradFinalPlaces({});
                  setCompetitionMatchScores(prev=>{
                    const next={...prev};
                    Object.keys(next).forEach(k=>{if(k.startsWith('monrad')) delete next[k];});
                    return next;
                  });
                }}>Reset Monrad</button>
              </div>
            </div>
            {monradPlacingRounds.length>0&&false&&(
              <div className="monradPathwayDisplay">
                <strong>Live Pathway</strong>
                <div className="monradPathwayScroll">
                  {Array.from({length:playerNames.length},(_,i)=>i+1).map(place=>{
                    const player=Object.entries(monradFinalPlaces).find(([,p])=>p===place);
                    return <div key={place} className={`monradPathwaySlot${player?' monradPathwayFilled':''}`}>
                      <span>{place}</span>
                      {player&&<strong>{player[0]}</strong>}
                    </div>;
                  })}
                </div>
              </div>
            )}
            {monradPlacingRounds.length===0&&<p className="overlayExplain">Best with 4, 8 or 16 players. Other numbers are padded with byes so the placing pathways stay clear.</p>}
            {monradPlacingRounds.length>0&&(
              <div className="monradPlacingLayout">
                <div className="monradBracketScroll placingBracketScroll">
                  {monradPlacingRounds.map((round,ridx)=>(
                    <div className="monradRoundColumn placingRoundColumn" key={ridx}>
                      <div className="drawRoundTitle">Round {ridx+1}</div>
                      {round.map(group=>(
                        <div className="placingGroupBox" key={group.id}>
                          <h3>Pathway {group.range}</h3>
                          <p>{group.players.filter(name=>!isByeName(name)).join(' · ')}</p>
                          {group.matches.map((match,midx)=>{
                            const auto=isByeName(match.a)?match.b:isByeName(match.b)?match.a:null;
                            const winner=auto||monradPlacingResults[monradPlaceKey(ridx,group.id,midx)];
                            return <div className="monradMatchCard" key={midx}>
                              <div className={winner===match.a?'drawPlayerLine winnerLine':'drawPlayerLine'}><span>{isByeName(match.a)?'BYE':match.a}</span>{!auto&&!isByeName(match.a)&&<button type="button" onClick={()=>setMonradPlaceWinner(ridx,group.id,midx,match.a)}>Win</button>}</div>
                              <div className={winner===match.b?'drawPlayerLine winnerLine':'drawPlayerLine'}><span>{isByeName(match.b)?'BYE':match.b}</span>{!auto&&!isByeName(match.b)&&<button type="button" onClick={()=>setMonradPlaceWinner(ridx,group.id,midx,match.b)}>Win</button>}</div>
                              {!auto&&<ScoreEntry scoreId={scoreKey('monrad-place',ridx,midx,group.id)} match={match} matchFormat={monradMatchFormat} onWinner={winner=>setMonradPlaceWinner(ridx,group.id,midx,winner)} />}
                            </div>;
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="standingsBox monradStandingsBox">
                  <h3>Final Placing Table</h3>
                  <div className="standingsTable">
                    <div><b>Player</b><b>Place</b></div>
                    {getMonradFinalTable().map(row=><div key={row.name}><span>{row.name}</span><span>{row.place}</span></div>)}
                  </div>
                  <p className="overlayExplain">Generate the next placing round after all visible matches in the current round have winners.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {mode==='nsl'&&(
          <div className="nslOrganiser">
            <div className="nslHero">
              <span>NSSL ORGANISER</span>
              <h2>National Squash Super League</h2>
              <p>Configure periods · Add players · Auto-allocate teams by ranking</p>
            </div>
            <div className="nslTabs">
              {[['config','Config'],['players',`Players (${playerNames.length})`],['teams',`Teams (${nslTeams})`],['score','Score'],['sheet','Sheet']].map(tab=>
                <button type="button" key={tab[0]} className={nslOrgTab===tab[0]?'activeNslTab':''} onClick={()=>setNslOrgTab(tab[0])}>{tab[1]}</button>
              )}
            </div>
            {nslOrgTab==='config'&&(
              <div className="nslPanel">
                <h3>Teams & Roster</h3>
                <div className="nslConfigGrid">
                  <div className="nslStepper"><label>No. of Teams</label><div><button type="button" onClick={()=>setNslTeams(Math.max(2,nslTeams-1))}>−</button><strong>{nslTeams}</strong><button type="button" onClick={()=>setNslTeams(Math.min(12,nslTeams+1))}>+</button></div></div>
                  <div className="nslStepper"><label>Players / Team</label><div><button type="button" onClick={()=>setNslPlayersPerTeam(Math.max(1,nslPlayersPerTeam-1))}>−</button><strong>{nslPlayersPerTeam}</strong><button type="button" onClick={()=>setNslPlayersPerTeam(Math.min(8,nslPlayersPerTeam+1))}>+</button></div></div>
                </div>
                <h3>Period Durations</h3>
                <div className="nslConfigGrid">
                  <div className="nslStepper"><label>Period 1</label><div><button type="button" onClick={()=>setNslPeriod1(Math.max(5,nslPeriod1-5))}>−</button><strong>{nslPeriod1}<small> min</small></strong><button type="button" onClick={()=>setNslPeriod1(nslPeriod1+5)}>+</button></div></div>
                  <div className="nslStepper"><label>Period 2</label><div><button type="button" onClick={()=>setNslPeriod2(Math.max(5,nslPeriod2-5))}>−</button><strong>{nslPeriod2}<small> min</small></strong><button type="button" onClick={()=>setNslPeriod2(nslPeriod2+5)}>+</button></div></div>
                  <div className="nslStepper"><label>Period 3</label><div><button type="button" onClick={()=>setNslPeriod3(Math.max(5,nslPeriod3-5))}>−</button><strong>{nslPeriod3}<small> min</small></strong><button type="button" onClick={()=>setNslPeriod3(nslPeriod3+5)}>+</button></div></div>
                  <div className="nslStepper"><label>Overtime</label><div><button type="button" onClick={()=>setNslOvertime(Math.max(0,nslOvertime-1))}>−</button><strong>{nslOvertime}<small> min</small></strong><button type="button" onClick={()=>setNslOvertime(nslOvertime+1)}>+</button></div></div>
                </div>
                <h3>Match Scoring</h3>
                <div className="nslScoringList">
                  <div><span></span><strong>Period 1</strong><em>{nslPeriod1} min · PAR scoring</em><b>1 match pt</b></div>
                  <div><span></span><strong>Period 2</strong><em>{nslPeriod2} min · PAR scoring</em><b>1 match pt</b></div>
                  <div><span className="danger"></span><strong>Period 3</strong><em>{nslPeriod3} min · pressure period</em><b>2 match pts</b></div>
                </div>
              </div>
            )}
            {nslOrgTab==='players'&&(
              <div className="nslPanel">
                <h3>Players from Attendance</h3>
                {playerNames.length>0?<div className="nslPlayerGrid">{playerNames.map((name,idx)=><div key={name} className="nslPlayerCard"><strong>{idx+1}</strong><span>{name}</span><em>{playerBounces[name]||'No DB handicap'}</em></div>)}</div>:<p className="overlayExplain">Mark players present in Attendance or enter manual players above.</p>}
              </div>
            )}
            {nslOrgTab==='teams'&&(
              <div className="nslPanel">
                <h3>Auto Team Allocation Preview</h3>
                <div className="nslTeamGrid">{Array.from({length:nslTeams}).map((_,teamIdx)=><div className="nslTeamCard" key={teamIdx}><strong>Team {teamIdx+1}</strong>{playerNames.filter((_,idx)=>idx%nslTeams===teamIdx).map(name=><p key={name}>{name}</p>)}{!playerNames.filter((_,idx)=>idx%nslTeams===teamIdx).length&&<p>Waiting for players</p>}</div>)}</div>
              </div>
            )}

            {nslOrgTab==='score'&&(
              <div className="nslPanel nslScorePanel nslScorePanelV45">
                <h3>NSSL Score Input</h3>

                <div className="nslBigTimerBox">
                  <div className="nslTimerLabel">ACTIVE PERIOD</div>
                  <strong>{nslActivePeriod===4?'OT':`P${nslActivePeriod}`}</strong>
                  <span>{nslFormatTime(nslRoundSeconds)} remaining</span>
                </div>

                <div className="nslPeriodRow">
                  {[1,2,3,4].map(period=><button type="button" key={period} className={nslActivePeriod===period?'activeNslPeriodBtn':'secondaryBtn'} onClick={()=>setNslPeriod(period)}>{period===4?'OT':`P${period}`}</button>)}
                  <button type="button" className="primaryBtn" onClick={()=>setNslTimerRunning(!nslTimerRunning)}>{nslTimerRunning?'Pause':'Start'}</button>
                  <button type="button" className="secondaryBtn" onClick={()=>setNslPeriod(nslActivePeriod)}>Reset Period</button>
                </div>

                {nslPowerPlayActive&&<div className="nslPowerPlayLive nslPowerPlayLiveV45">
                  <strong>⚡ POWER PLAY ACTIVE</strong>
                  <span>{nslPowerPlayTeam} can score · opponents locked out · {nslFormatTime(nslPowerPlaySeconds)}</span>
                  <button type="button" className="secondaryBtn dangerBtn" onClick={stopNslPowerPlay}>End Power Play</button>
                </div>}

                <div className="nslScoreCourtGrid">
                  {getNslFixtures().map((fixture,idx)=><div className="nslCourtScoreCard" key={idx}>
                    <h4>Court {idx+1}</h4>
                    {[fixture.a,fixture.b].filter(name=>name&&name!=='BYE').map(team=><div className={nslPowerPlayActive&&nslPowerPlayTeam===team?'nslTeamScoreBox activePowerTeam':'nslTeamScoreBox'} key={team}>
                      <div>
                        <span>{team}</span>
                        <strong>{getNslScore(team,idx)}</strong>
                      </div>
                      <div className="nslScoreControls">
                        <button type="button" onClick={()=>adjustNslScore(team,-1,idx)}>-1</button>
                        <button type="button" className="primaryBtn" onClick={()=>adjustNslScore(team,1,idx)}>+1</button>
                        <button type="button" className={nslPowerPlayActive&&nslPowerPlayTeam===team?'activePowerPlayBtn':'secondaryBtn'} onClick={()=>startNslPowerPlay(team)}>⚡ Power Play</button>
                      </div>
                    </div>)}
                  </div>)}
                </div>
                <div className="buttonRow"><button type="button" className="secondaryBtn dangerBtn" onClick={resetNslScores}>Reset NSSL Scores</button></div>
              </div>
            )}

            {nslOrgTab==='sheet'&&(
              <div className="nslPanel nslDrawPanel">
                <h3>NSSL Sheet / Draw Graphic</h3>
                <p className="overlayExplain">National Squash Super League style event sheet: team boxes, period cards and fixture lanes.</p>
                <div className="nslDrawGrid">
                  {getNslGeneratedTeams().map(team=><div className="nslDrawTeamBox" key={team.name}>
                    <strong>{team.name}</strong>
                    {team.players.length?team.players.map(player=><span key={player}>{player}</span>):<span>Waiting for players</span>}
                  </div>)}
                </div>
                <div className="nslFixtureLane">
                  {getNslFixtures().map((fixture,idx)=><div className="nslFixtureCard" key={idx}>
                    <b>Court {idx+1}</b>
                    <strong>{fixture.a} {getNslScore(fixture.a,idx)} - {getNslScore(fixture.b,idx)} {fixture.b}</strong>
                    <span>Time remaining: {nslFormatTime(nslRoundSeconds)}</span>
                    <span>Period 1: {nslPeriod1} min</span>
                    <span>Period 2: {nslPeriod2} min</span>
                    <span>Pressure Period: {nslPeriod3} min</span>
                    <em>Overtime: {nslOvertime} min if required</em>
                  </div>)}
                </div>
                <div className="nslPeriodStrip">
                  <div><b>Period 1</b><span>{nslPeriod1} min · 1 match point</span></div>
                  <div><b>Period 2</b><span>{nslPeriod2} min · 1 match point</span></div>
                  <div><b>Period 3</b><span>{nslPeriod3} min · 2 match points</span></div>
                  <div><b>Overtime</b><span>{nslOvertime} min · if required</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="competitionStatusPanel">
          <div className="statusPanelHeader"><strong>Competition Status</strong></div>
          <div className="statusPanelGrid">
            <div className="statusPanelCard"><span>Format</span><strong>{current.title}</strong></div>
            {(mode==='matchplay'||mode==='roundRobin'||mode==='monrad')&&<div className="statusPanelCard"><span>Scoring Mode</span><strong>{scoringMode==='normal'?'Normal Scoring':'Custom / Timed'}</strong></div>}
            {mode==='roundRobin'&&rrFixtures.length>0&&(()=>{
              const standings=getRoundRobinStandings();
              const leader=standings[0];
              return <>
                <div className="statusPanelCard"><span>Current Leader</span><strong>{leader?.name||'—'}</strong></div>
                <div className="statusPanelCard"><span>Possible Finish</span><strong>1st – {standings.length}th</strong></div>
              </>;
            })()}
            {mode==='monrad'&&(()=>{
              const table=getMonradFinalTable();
              const settled=table.filter(r=>r.place!=='—');
              return <>
                <div className="statusPanelCard"><span>Placings Settled</span><strong>{settled.length} of {table.length}</strong></div>
                {settled.length>0&&<div className="statusPanelCard"><span>Current 1st</span><strong>{table[0]?.name||'—'}</strong></div>}
              </>;
            })()}
            {mode==='matchplay'&&<>
              <div className="statusPanelCard"><span>Match</span><strong>{matchPlayers.a||'A'} vs {matchPlayers.b||'B'}</strong></div>
              <div className="statusPanelCard"><span>Score</span><strong>{matchScore.a} – {matchScore.b}</strong></div>
            </>}
            {mode==='invasion'&&<>
              <div className="statusPanelCard"><span>Format</span><strong>{invasionFormat==='lives'?'Lives Format':'Points Format'}</strong></div>
              <div className="statusPanelCard"><span>Teams</span><strong>{invasionTeams.length} active</strong></div>
            </>}
            {mode==='nsl'&&<>
              <div className="statusPanelCard"><span>Period</span><strong>{nslActivePeriod===4?'OT':`P${nslActivePeriod}`}</strong></div>
              <div className="statusPanelCard"><span>Time Left</span><strong>{nslFormatTime(nslRoundSeconds)}</strong></div>
            </>}
          </div>
        </div>

        <div className="diagnosticPrinciple">
          <strong>Tactical Behaviour Focus</strong>
          <p>{current.tactical}</p>
        </div>

        <div className="infoBox">
          <strong>Purpose</strong>
          <p>{current.purpose}</p>
        </div>

        <div className="constraintSuggestionBox">
          <strong>Rules / Structure</strong>
          <ul>
            {current.rules.map(rule=><li key={rule}>{rule}</li>)}
          </ul>
        </div>

        <div className="technicalScoringBox alwaysVisibleScoring">
          <strong>Competition Overlays</strong>
          <OverlayFamilyTabs selectedOverlays={competitionLayers} onToggle={toggleLayer} context="Competition" />

          <label>Checkerboard Code / Sequence
            <select value={competitionCbCode} onChange={e=>setCompetitionCbCode(e.target.value)}>
              {cbOptions.map(option=><option key={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <div className="technicalScoringBox">
          <strong>Double-Bounce Handicaps</strong>
          <p className="overlayExplain">Assign double-bounce allowances to particular players. This applies in all competition modes.</p>

          {!automaticNames.length&&(
            <label>Manual Players
              <textarea value={manualPlayers} onChange={e=>setManualPlayers(e.target.value)} placeholder="One player per line"/>
            </label>
          )}

          {playerNames.length>0&&(
            <div className="playerBounceGrid">
              {playerNames.map(name=>(
                <label key={name}>{name}
                  <select value={playerBounces[name]||'No DB'} onChange={e=>setBounceFor(name,e.target.value)}>
                    {UNIVERSAL_DB_OPTIONS.map(opt=><option key={opt}>{opt}</option>)}
                  </select>
                </label>
              ))}
            </div>
          )}

          {!playerNames.length&&<div className="placeholder">Mark players present or enter manual players to assign double-bounce handicaps.</div>}
        </div>

        <div className="infoBox">
          <strong>Active Competition Setup</strong>
          <p><strong>Mode:</strong> {current.title}</p>
          {mode==='invasion'&&<p><strong>Invasion format:</strong> {invasionFormat==='lives'?'Lives Format':'Points Format'}</p>}
          {mode==='matchplay'&&<p><strong>Match:</strong> {matchPlayers.a} {matchScore.a} - {matchScore.b} {matchPlayers.b} · {matchScoring}</p>}
          <p><strong>Overlays:</strong> {competitionLayers.length?competitionLayers.join(' · '):'None selected'}</p>
          <p><strong>Checkerboard:</strong> {competitionCbCode}</p>
        </div>
      </div>
    </div>
  );
}

function Storage({players,setPlayers,session,setSession}){
  const [backupText,setBackupText]=useState('');
  const [restoreText,setRestoreText]=useState('');
  const [status,setStatus]=useState('');

  function buildBackup(){
    const data={
      app:'Checkerboard Coach',
      version:'v97',
      created:new Date().toISOString(),
      players,
      session
    };
    const text=JSON.stringify(data,null,2);
    setBackupText(text);
    setStatus('Backup created. Copy and save this text somewhere safe.');
  }

  function copyBackup(){
    if(!backupText){setStatus('Create backup first.');return;}
    navigator.clipboard?.writeText(backupText);
    setStatus('Backup copied to clipboard.');
  }

  function downloadBackup(){
    const data=backupText || JSON.stringify({app:'Checkerboard Coach',version:'v97',created:new Date().toISOString(),players,session},null,2);
    const blob=new Blob([data],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='checkerboard-backup-v97.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('Backup download started.');
  }

  function restoreBackup(){
    if(!restoreText.trim()){
      setStatus('Paste backup text first, then press Restore From Backup.');
      return;
    }
    try{
      const data=JSON.parse(restoreText);
      const hasPlayers=Array.isArray(data.players);
      const hasSession=Array.isArray(data.session);
      if(!hasPlayers&&!hasSession){
        setStatus('Restore failed: backup must contain players and/or session arrays.');
        return;
      }
      if(hasPlayers){
        setPlayers(data.players);
        localStorage.setItem(PLAYER_KEY,JSON.stringify(data.players));
      }
      if(hasSession){
        setSession(data.session);
        localStorage.setItem(SESSION_KEY,JSON.stringify(data.session));
      }
      setStatus(`Restore complete. ${hasPlayers?'Players restored. ':''}${hasSession?'Session restored.':''}`);
    }catch(error){
      setStatus('Restore failed: invalid backup text. Check that you pasted the full JSON backup.');
    }
  }

  function clearTodayAttendance(){
    const cleared=players.map(player=>({...player,present:false}));
    setPlayers(cleared);
    localStorage.setItem(PLAYER_KEY,JSON.stringify(cleared));
    setStatus('Attendance cleared. Player list remains saved.');
  }

  function clearSessionOnly(){
    setSession([]);
    localStorage.setItem(SESSION_KEY,JSON.stringify([]));
    setStatus('Session cleared. Player list remains saved.');
  }

  return <div className="page">
    <div className="pageTop"><h1>Storage & Retrieval</h1></div>

    <div className="storageGrid">
      <div className="storageCard">
        <h2>Backup</h2>
        <p>Save a copy of current players, attendance status and session rotations.</p>
        <div className="buttonRow">
          <button className="primaryBtn" onClick={buildBackup}>Create Backup Text</button>
          <button className="secondaryBtn" onClick={copyBackup}>Copy Backup</button>
          <button className="secondaryBtn" onClick={downloadBackup}>Download Backup File</button>
        </div>
        <textarea className="backupBox" value={backupText} onChange={e=>setBackupText(e.target.value)} placeholder="Backup text will appear here."/>
      </div>

      <div className="storageCard">
        <h2>Restore</h2>
        <p>Paste a previously saved backup here to restore the app data.</p>
        <textarea className="backupBox" value={restoreText} onChange={e=>setRestoreText(e.target.value)} placeholder="Paste backup text here."/>
        <button className="primaryBtn" onClick={restoreBackup}>Restore From Backup</button>
      </div>
    </div>

    <div className="storageCard">
      <h2>Safe Clear Options</h2>
      <p>These do not delete your saved player list unless you restore a different backup.</p>
      <div className="buttonRow">
        <button className="secondaryBtn" onClick={clearTodayAttendance}>Clear Today’s Attendance</button>
        <button className="secondaryBtn" onClick={clearSessionOnly}>Clear Session Only</button>
      </div>
    </div>

    {status && <div className="statusBox">{status}</div>}
  </div>;
}



function ProjectionPlayerDisplay({session=[],players=[]}){
  const [projectionTab,setProjectionTab]=useState('session');
  const [competitionProjection,setCompetitionProjection]=useState(null);
  const active=session&&session.length?session[session.length-1]:null;

  const presentPlayers=Array.isArray(players)
    ?players.filter(player=>player.present)
    :[];

  function projectorTeamBaseLives(team,competitionProjection){
    const selected=Number(competitionProjection?.invasionStartingLives||competitionProjection?.invasionLives);
    if(selected>0) return selected;
    const playerCount=(team.players||[]).length||1;
    const baseTotal=competitionProjection?.invasionFairBaseTotal||playerCount;
    return Math.max(1,Math.floor(baseTotal/playerCount));
  }
  function projectorTeamCarry(team,competitionProjection){
    return competitionProjection?.invasionCarryLives?.[team.id]||0;
  }
  function projectorTeamStartLives(team,competitionProjection){
    return projectorTeamBaseLives(team,competitionProjection)+projectorTeamCarry(team,competitionProjection);
  }

  function projectorCurrentInvader(team,competitionProjection){
    const players=(team&&team.players)||[];
    if(!players.length) return 'Waiting';
    const round=competitionProjection?.invasionPlayerRound||0;
    return players[round % players.length];
  }

  function projectorDefendingTeamForCourt(idx,competitionProjection){
    const teams=competitionProjection?.invasionTeams||[];
    if(!teams.length) return null;
    return teams[idx % teams.length];
  }

  function projectorInvadingTeamForCourt(idx,competitionProjection){
    const teams=competitionProjection?.invasionTeams||[];
    if(!teams.length) return null;
    const n=teams.length;
    const courtRound=competitionProjection?.invasionCourtRound||0;
    return teams[(idx - 1 + courtRound + n) % n];
  }

  useEffect(()=>{
    function loadCompetitionProjection(){
      try{
        const saved=localStorage.getItem('checkerboardCompetitionProjection');
        setCompetitionProjection(saved?JSON.parse(saved):null);
      }catch{
        setCompetitionProjection(null);
      }
    }
    loadCompetitionProjection();
    const timer=setInterval(loadCompetitionProjection,1500);
    return ()=>clearInterval(timer);
  },[]);

  return <div className="projectionPage">
    <div className="projectionPanel">
      <div className="projectionHeader">PLAYER DISPLAY / PROJECTION VIEW</div>

      <div className="projectionTabRow">
        <button className={projectionTab==='session'?'activeProjectionTab':''} onClick={()=>setProjectionTab('session')}>Session</button>
        <button className={projectionTab==='competition'?'activeProjectionTab':''} onClick={()=>setProjectionTab('competition')}>Competition</button>
      </div>

      {projectionTab==='session'&&<>
        {!active&&<div className="projectionEmpty">
          Add a game to Session Builder and project this screen for players.
        </div>}

        {active&&<>
          <div className="projectionTitle">
            {active.title||'Session Item'}
          </div>

          <div className="projectionSection">
            <div className="projectionLabel">WHAT TO DO</div>
            <div className="projectionText">
              {active.task||active.description||'Play the activity as instructed by the coach.'}
            </div>
          </div>

          {active.scoring&&<div className="projectionSection">
            <div className="projectionLabel">SCORING / RULES</div>
            <div className="projectionText">
              {active.scoring}
            </div>
          </div>}

          {active.playerFocus&&<div className="projectionSection">
            <div className="projectionLabel">PLAYER FOCUS</div>
            <div className="projectionText">
              {active.playerFocus}
            </div>
          </div>}

          {active.layers&&active.layers.length>0&&<div className="projectionSection">
            <div className="projectionLabel">ACTIVE OVERLAYS</div>
            <div className="projectionText">
              {active.layers.join(' · ')}
            </div>
          </div>}

          {active.cbCode&&active.cbCode!=='None'&&<div className="projectionSection">
            <div className="projectionLabel">CHECKERBOARD TARGET</div>
            <div className="projectionText cbProjection">
              {active.cbCode}
            </div>
          </div>}

          <div className="projectionSection">
            <div className="projectionLabel">DOUBLE-BOUNCE HANDICAPS</div>
            <div className="projectionText">
              {presentPlayers.length
                ?presentPlayers.map(player=>{
                    const db=player.doubleBounce||'None';
                    return `${player.name}: ${db}`;
                  }).join(' · ')
                :'Use Competition section to assign DB handicaps.'}
            </div>
          </div>
        </>}
      </>}

      {projectionTab==='competition'&&<>
        {!competitionProjection&&<div className="projectionEmpty">
          Open Competition, choose a format, then return here to project competition information.
        </div>}

        {competitionProjection&&<>
          {competitionProjection.mode==='invasion'&&(
            <div className="invasionProjectorBoard">
              <div className="invasionProjectorHeader">
                <span>LIVE COMPETITION BOARD</span>
                <h1>Invasion Game</h1>
                <p>{competitionProjection.invasionFormat==='lives'?'Lives Format':'Points Format'} · Rotation {competitionProjection.invasionRotationStep||0}</p>
              </div>

              <div className="finalProjectorSummary">
                <div><b>Player rotation</b><strong>{(competitionProjection.invasionPlayerRound||0)+1}</strong></div>
                <div><b>Court rotation</b><strong>{(competitionProjection.invasionCourtRound||0)+1}</strong></div>
                <div><b>Mode</b><strong>{competitionProjection.invasionCourtAssignmentMode==='random'?'Random courts':'Fixed courts'}</strong></div>
              </div>

              {competitionProjection.invasionFormat==='lives'&&competitionProjection.invasionTeams&&competitionProjection.invasionTeams.length>0&&(
                <div className="finalProjectorCourts">
                  {competitionProjection.invasionTeams.map((_,idx)=>{
                    const defending=projectorDefendingTeamForCourt(idx,competitionProjection);
                    const invading=projectorInvadingTeamForCourt(idx,competitionProjection);
                    const start=invading?projectorTeamStartLives(invading,competitionProjection):0;
                    const finish=invading?competitionProjection.invasionFinishLives?.[invading.id]:undefined;
                    return <div className="finalProjectorCourtCard" key={`proj-final-${idx}`}>
                      <h2>Court {idx+1}</h2>
                      <p><b>Invader:</b> {invading?projectorCurrentInvader(invading,competitionProjection):'Waiting'} · {invading?.name||''}</p>
                      <p><b>Defending team:</b> {defending?.name||'Waiting'}</p>
                      <div className="finalLifeNumbers">
                        <span>Starts with</span><strong>{start}</strong>
                        <span>Remaining</span><strong>{finish!==undefined?finish:'Live'}</strong>
                      </div>
                    </div>;
                  })}
                </div>
              )}

              {competitionProjection.invasionFormat==='lives'&&competitionProjection.invasionTeams&&competitionProjection.invasionTeams.length>0&&(
                <div className="finalProjectorNextStarts">
                  <b>Next lives</b>
                  {competitionProjection.invasionTeams.map(team=><span key={team.id}>{team.name}: {projectorTeamStartLives(team,competitionProjection)}</span>)}
                </div>
              )}

              <div className="invasionProjectorRules">
                <strong>Essential Rules</strong>
                <div className="rulePillGrid">
                  <span>{competitionProjection.invasionFormat==='lives'?'Defenders serve':'Invader serves'}</span>
                  <span>{competitionProjection.invasionFormat==='lives'?'Carry-over lives active':'Team points only'}</span>
                  <span>{competitionProjection.invasionCourtAssignmentMode==='random'?'Random court selection':'Fixed court rotation'}</span>
                  <span>Double-bounce handicaps shown below</span>
                </div>
                <div className="projectorBaseLivesGrid">
                  {competitionProjection.invasionTeams&&competitionProjection.invasionTeams.length?competitionProjection.invasionTeams.map(team=>(
                    <div key={team.id}>
                      <b>{team.name}</b>
                      <p>Base lives/player: {projectorTeamBaseLives(team,competitionProjection)}</p>
                      <p>Carry-over: {projectorTeamCarry(team,competitionProjection)}</p>
                      <p>Next start: {projectorTeamStartLives(team,competitionProjection)}</p>
                    </div>
                  )):<p>No teams generated yet.</p>}
                </div>
                <div className="projectorDbStrip">
                  <b>Double-bounce:</b>
                  {competitionProjection.playerNames&&competitionProjection.playerNames.length?competitionProjection.playerNames.map(name=><span key={name}>{name}: {competitionProjection.playerBounces?.[name]||'No DB'}</span>):<span>No players selected</span>}
                </div>
              </div>

              <div className="invasionProjectorCourts">
                <strong>Live Courts</strong>
                <div className="projectorCourtGrid">
                  {competitionProjection.invasionCourtAssignments&&competitionProjection.invasionCourtAssignments.length?competitionProjection.invasionCourtAssignments.map(assign=>{
                    const invadingTeam=(competitionProjection.invasionTeams||[]).find(team=>team.id===assign.invadingTeamId);
                    const startLives=invadingTeam?projectorTeamStartLives(invadingTeam,competitionProjection):competitionProjection.invasionStartingLives||0;
                    const posted=competitionProjection.invasionFinishLives?.[assign.invadingTeamId];
                    return <div className="projectorCourtLiveCard" key={`${assign.court}-${assign.invadingTeamId}`}>
                      <h3>Court {assign.court}</h3>
                      <p><b>Invader:</b> {assign.invader} · {assign.invadingTeamName}</p>
                      <p><b>Defending team:</b> {assign.defendingTeamName}</p>
                      <p><b>Defenders:</b> {assign.defenders&&assign.defenders.length?assign.defenders.join(' · '):'Waiting'}</p>
                      {competitionProjection.invasionFormat==='lives'
                        ?<div className="courtLivesLine"><span>Start</span><strong>{startLives}</strong><span>Remaining</span><strong>{posted!==undefined?posted:'—'}</strong></div>
                        :<div className="courtLivesLine"><span>Team points</span><strong>{competitionProjection.invasionTeamPoints?.[assign.invadingTeamId]||0}</strong></div>}
                    </div>;
                  }):<p>Generate teams and rotate courts to show live court assignments.</p>}
                </div>
              </div>

              {competitionProjection.invasionFormat==='lives'&&(
                <div className="nextInvasionStarts">
                  <strong>Next Invasion Start Lives</strong>
                  <div>
                    {competitionProjection.invasionTeams&&competitionProjection.invasionTeams.length?competitionProjection.invasionTeams.map(team=><span key={team.id}>{team.name}: {projectorTeamStartLives(team,competitionProjection)}</span>):<span>No teams yet</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="projectionTitle">
            {competitionProjection.title||'Competition'}
          </div>

          <div className="projectionSection">
            <div className="projectionLabel">CURRENT STATUS</div>
            <div className="projectionText">
              {competitionProjection.mode==='matchplay'
                ?`${competitionProjection.matchPlayers?.a||'Player A'} ${competitionProjection.matchScore?.a||0} - ${competitionProjection.matchScore?.b||0} ${competitionProjection.matchPlayers?.b||'Player B'} · ${competitionProjection.matchScoring||''}`
                :competitionProjection.mode==='invasion'
                  ?`Invasion · ${competitionProjection.invasionFormat==='lives'?'Lives Format':'Points Format'}`
                  :competitionProjection.mode==='roundRobin'
                    ?'Round Robin · Fixtures / next opponent'
                    :competitionProjection.mode==='nsl'
                      ?`NSSL · ${competitionProjection.nslTeams||'—'} teams · ${competitionProjection.nslPlayersPerTeam||'—'} players per team`
                      :'Competition active'}
            </div>
          </div>

          <div className="projectionSection">
            <div className="projectionLabel">TACTICAL FOCUS</div>
            <div className="projectionText">
              {competitionProjection.tactical||'Compete clearly and adapt.'}
            </div>
          </div>

          <div className="projectionSection">
            <div className="projectionLabel">RULES / STRUCTURE</div>
            <div className="projectionText">
              {competitionProjection.rules&&competitionProjection.rules.length
                ?competitionProjection.rules.slice(0,3).join(' · ')
                :'Follow the competition format.'}
            </div>
          </div>

          {competitionProjection.mode==='roundRobin'&&competitionProjection.rrFixtures&&competitionProjection.rrFixtures.length>0&&<div className="projectionSection">
            <div className="projectionLabel">ROUND ROBIN FIXTURES</div>
            <div className="projectionText">
              {competitionProjection.rrFixtures.slice(0,3).map((round,idx)=>`Round ${idx+1}: ${round.map(match=>`${match.a} v ${match.b}`).join(' / ')}`).join(' · ')}
            </div>
          </div>}

          {competitionProjection.mode==='nsl'&&<div className="projectionSection">
            <div className="projectionLabel">NSL SHEET</div>
            <div className="projectionText">
              Period 1: {competitionProjection.nslPeriod1} min · Period 2: {competitionProjection.nslPeriod2} min · Period 3: {competitionProjection.nslPeriod3} min · Overtime: {competitionProjection.nslOvertime} min
            </div>
          </div>}

          {competitionProjection.mode==='invasion'&&<div className="projectionSection">
            <div className="projectionLabel">ROTATION STATUS</div>
            <div className="projectionText">
              Rotation {competitionProjection.invasionRotationStep||0} · Active Court {competitionProjection.activeInvasionCourt||1}{competitionProjection.invasionEliminated?` · Trigger: ${competitionProjection.invasionEliminated}`:''}
            </div>
          </div>}

          {competitionProjection.mode==='invasion'&&competitionProjection.invasionTeams&&competitionProjection.invasionTeams.length>0&&<div className="projectionSection">
            <div className="projectionLabel">ACTIVE COURT DASHBOARD</div>
            <div className="projectionText">
              {competitionProjection.invasionTeams.map(team=>`Court ${team.court}${competitionProjection.activeInvasionCourt===team.court?' ★':''}: ${team.name} · ${team.players&&team.players.length?team.players.join(', '):'Waiting'} · ${competitionProjection.invasionFormat==='points'?'Points: '+(competitionProjection.invasionTeamPoints?.[team.id]||0):`Lives: ${competitionProjection.invasionTeamLives?.[team.id] ?? competitionProjection.invasionStartingLives ?? 0}`}`).join(' · ')}
            </div>
          </div>}

          {competitionProjection.mode==='invasion'&&competitionProjection.invasionTeams&&competitionProjection.invasionTeams.length>0&&<div className="projectionSection">
            <div className="projectionLabel">INVASION TEAMS / COURTS</div>
            <div className="projectionText">
              {competitionProjection.invasionTeams.map(team=>`Court ${team.court} · ${team.name}: ${team.players&&team.players.length?team.players.join(', '):'Waiting'} · Points: ${competitionProjection.invasionTeamPoints?.[team.id]||0}`).join(' · ')}
            </div>
          </div>}

          {competitionProjection.mode==='invasion'&&competitionProjection.invasionPlayerPoints&&Object.keys(competitionProjection.invasionPlayerPoints).length>0&&<div className="projectionSection">
            <div className="projectionLabel">PLAYER POINTS</div>
            <div className="projectionText">
              {Object.entries(competitionProjection.invasionPlayerPoints).map(([name,pts])=>`${name}: ${pts}`).join(' · ')}
            </div>
          </div>}

          {competitionProjection.mode==='invasion'&&<div className="projectionSection invasionCurrentStateProjection">
            <div className="projectionLabel">CURRENT GAME STATE</div>
            <div className="currentStateHero">
              <strong>{competitionProjection.invasionFormat==='lives'?'LIVES FORMAT':'POINTS FORMAT'}</strong>
              <span>Rotation {competitionProjection.invasionRotationStep||0} · All courts active · {competitionProjection.invasionCourtAssignmentMode==='random'?'Random courts':'Fixed courts'}</span>
            </div>

            {competitionProjection.invasionFormat==='lives'&&(
              <div className="projectorTeamGrid">
                {competitionProjection.invasionTeams&&competitionProjection.invasionTeams.length
                  ?competitionProjection.invasionTeams.map(team=>(
                    <div className="projectorTeamCard" key={team.id}>
                      <h3>{team.name} · Court {team.court}</h3>
                      <p>{team.players&&team.players.length?team.players.join(' · '):'Waiting for players'}</p>
                      <strong>{competitionProjection.invasionTeamLives?.[team.id] ?? competitionProjection.invasionStartingLives ?? 0} lives</strong>
                      <em>Next invader starts with this bank</em>
                    </div>
                  ))
                  :<p>No teams generated yet.</p>}
              </div>
            )}

            {competitionProjection.invasionFormat==='points'&&(
              <div className="projectorTeamGrid">
                {competitionProjection.invasionTeams&&competitionProjection.invasionTeams.length
                  ?competitionProjection.invasionTeams.map(team=>(
                    <div className="projectorTeamCard" key={team.id}>
                      <h3>{team.name} · Court {team.court}</h3>
                      <p>{team.players&&team.players.length?team.players.join(' · '):'Waiting for players'}</p>
                      <strong>{competitionProjection.invasionTeamPoints?.[team.id]||0} points</strong>
                      <em>Team points only</em>
                    </div>
                  ))
                  :<p>No teams generated yet.</p>}
              </div>
            )}

            {competitionProjection.invasionFormat==='points'&&competitionProjection.invasionPlayerPoints&&Object.keys(competitionProjection.invasionPlayerPoints).length>0&&(
              <div className="projectorPlayerScores">
                {Object.entries(competitionProjection.invasionPlayerPoints).map(([name,score])=><span key={name}>{name}: {score}</span>)}
              </div>
            )}

            {competitionProjection.invasionCourtAssignments&&competitionProjection.invasionCourtAssignments.length>0&&(
              <div className="projectorCourtAssignments">
                {competitionProjection.invasionCourtAssignments.map(assign=>(
                  <div className="projectorCourtCard" key={`${assign.court}-${assign.defendingTeamId}`}>
                    <h3>Court {assign.court}</h3>
                    <p><strong>Defending:</strong> {assign.defendingTeamName}</p>
                    <p><strong>Invader:</strong> {assign.invader} · {assign.invadingTeamName}</p>
                    <p><strong>Defenders:</strong> {assign.defenders&&assign.defenders.length?assign.defenders.join(' · '):'Waiting'}</p>
                  </div>
                ))}
              </div>
            )}

            {competitionProjection.invasionFormat==='lives'&&competitionProjection.invasionTeams&&competitionProjection.invasionTeams.length>0&&(
              <div className="projectorFairLivesTable">
                <strong>Fair Lives / Carry-Over</strong>
                {competitionProjection.invasionTeams.map(team=>{
                  const players=(team.players||[]).length||1;
                  const baseTotal=competitionProjection.invasionFairBaseTotal||players;
                  const base=Math.max(1,Math.floor(baseTotal/players));
                  const carry=competitionProjection.invasionCarryLives?.[team.id]||0;
                  const finish=competitionProjection.invasionFinishLives?.[team.id];
                  return <p key={team.id}>{team.name}: base {base} + carry {carry} = start {base+carry}{finish!==undefined?` · finish posted: ${finish}`:''}</p>;
                })}
              </div>
            )}

            <div className="nextActionStrip">
              {competitionProjection.invasionFormat==='lives'
                ?`Next action: update team life banks, then rotate all courts together. ${competitionProjection.invasionEliminated?`Trigger: ${competitionProjection.invasionEliminated}`:''}`
                :`Next action: add player score, then rotate all courts together at the agreed checkpoint.`}
            </div>
          </div>}

          <div className="projectionSection">
            <div className="projectionLabel">ACTIVE OVERLAYS</div>
            <div className="projectionText">
              {competitionProjection.competitionLayers&&competitionProjection.competitionLayers.length
                ?competitionProjection.competitionLayers.join(' · ')
                :'None selected'}
            </div>
          </div>

          <div className="projectionSection">
            <div className="projectionLabel">CHECKERBOARD</div>
            <div className="projectionText cbProjection">
              {competitionProjection.competitionCbCode||'None'}
            </div>
          </div>

          <div className="projectionSection">
            <div className="projectionLabel">PLAYERS / DB HANDICAPS</div>
            <div className="projectionText">
              {competitionProjection.playerNames&&competitionProjection.playerNames.length
                ?competitionProjection.playerNames.map(name=>`${name}: ${competitionProjection.playerBounces?.[name]||'No DB'}`).join(' · ')
                :'No players selected'}
            </div>
          </div>
        </>}
      </>}
    </div>
  </div>;
}


function RotationalAffordanceGames({setScreen}){
  const [playerGroup,setPlayerGroup]=useState('2 Player');
  const [levelFilter,setLevelFilter]=useState('All');

  const games=[
    {
      title:'Basic Boast Rotation',
      players:'2 Player',
      level:'Level 0',
      colour:'redRep',
      court:'Front half court · Big ball preferred',
      sequence:'P1 Drive → P2 Drive → P1 Boast → P2 Drive → repeat.',
      focus:'Orientation, movement flow and boast recognition.',
      purpose:'Turning traditional drills into CLA Representative Learning Design environments.',
      constraints:'No scoring · fixed/simple two-shot rotations.',
      progression:'Move to full court and standard ball.'
    },
    {
      title:'Alternating Boast',
      players:'2 Player',
      level:'Level 1',
      colour:'orangeRep',
      court:'Full court · Standard ball',
      sequence:'P1 Drive → P2 Boast → P1 Drive → P2 Drive → repeat.',
      focus:'Recovery awareness and early affordance perception.',
      purpose:'Simplified representative environment developing tactical emergence.',
      constraints:'Guided affordance recognition with increased movement demands.',
      progression:'Introduce live affordance release.'
    },
    {
      title:'Rotational Boast Chain',
      players:'3 Player',
      level:'Level 0',
      colour:'redRep',
      court:'Front half court · Big ball preferred',
      sequence:'P1 Boast → P2 Drive → P3 Drive → P1 Drive → repeat.',
      focus:'Orientation and recognition of rotational movement relationships.',
      purpose:'Turning traditional drills into CLA Representative Learning Design environments.',
      constraints:'No scoring · fixed rotational structure.',
      progression:'Move to full court with standard ball.'
    },
    {
      title:'Front Recovery Recognition',
      players:'3 Player',
      level:'Level 1',
      colour:'orangeRep',
      court:'Full court · Standard ball',
      sequence:'P1 Drive → P2 Drive → P3 Boast → P1 Drive → repeat.',
      focus:'Recognition of unstable recovery affordances.',
      purpose:'Developing tactical emergence from simplified rotational frameworks.',
      constraints:'Boast only if recovery is unstable.',
      progression:'Increase tactical freedom and release constraints.'
    },
    {
      title:'Continuous Rotational Drives',
      players:'4 Player',
      level:'Level 0',
      colour:'redRep',
      court:'Front half court preferred · Big ball preferred',
      sequence:'P1 Drive → P2 Drive → P3 Boast → P4 Drive → repeat.',
      focus:'Movement organisation and shot recognition.',
      purpose:'Turning traditional drills into CLA Representative Learning Design environments.',
      constraints:'No scoring · orientation dominant.',
      progression:'Increase movement and timing demands.'
    },
    {
      title:'Guided Boast Recognition',
      players:'4 Player',
      level:'Level 1',
      colour:'orangeRep',
      court:'Full court · Standard ball',
      sequence:'Rotational drives continue. Boast only if recovery is delayed or opponent is still moving.',
      focus:'Guided affordance recognition.',
      purpose:'Developing tactical emergence within representative movement-information environments.',
      constraints:'Guided affordance release rather than fixed execution.',
      progression:'Move toward open rotational recognition.'
    }
  ];

  const filtered=games.filter(game=>
    (playerGroup==='All'||game.players===playerGroup) &&
    (levelFilter==='All'||game.level===levelFilter)
  );

  return <div className="page rotationalPage">
    <div className="pageTop">
      <h1>Rotational Affordance Games</h1>
      <button className="secondaryBtn" onClick={()=>setScreen('home')}>← Home</button>
    </div>

    <div className="gameCard">
      <div className="categoryTag">Developing Tactical Emergence</div>
      <h2>Turning Traditional Drills into CLA Representative Learning Design</h2>
      <p>Rotational Recognition Frameworks are simplified movement-information environments. They expose players to repeated boast/drive relationships while developing movement organisation, shot recognition, recovery awareness and early affordance perception.</p>
      <p>These are not block drills; they are simplified representative environments that prepare players for tactical emergence.</p>
    </div>

    <div className="buttonRow">
      {['All','2 Player','3 Player','4 Player'].map(item=>
        <button key={item} className={playerGroup===item?'primaryBtn':'secondaryBtn'} onClick={()=>setPlayerGroup(item)}>
          {item}
        </button>
      )}
    </div>

    <div className="buttonRow">
      {['All','Level 0','Level 1'].map(item=>
        <button key={item} className={levelFilter===item?'primaryBtn':'secondaryBtn'} onClick={()=>setLevelFilter(item)}>
          {item}
        </button>
      )}
    </div>

    {filtered.map((game,index)=>
      <div className="rotationAffordanceCard" key={index}>
        <div className={`repCircle ${game.colour}`}></div>

        <div className="rotationCardContent">
          <div className="categoryTag">{game.level} · {game.players}</div>
          <h2>{game.title}</h2>

          <div className="infoBox">
            <strong>Court / Ball</strong>
            <p>{game.court}</p>
          </div>

          <div className="infoBox">
            <strong>Rotation Sequence</strong>
            <p>{game.sequence}</p>
          </div>

          <div className="infoBox">
            <strong>Recognition Focus</strong>
            <p>{game.focus}</p>
          </div>

          <div className="infoBox">
            <strong>Purpose</strong>
            <p>{game.purpose}</p>
          </div>

          <div className="infoBox">
            <strong>Constraints</strong>
            <p>{game.constraints}</p>
          </div>

          <div className="infoBox">
            <strong>Progression</strong>
            <p>{game.progression}</p>
          </div>
        </div>
      </div>
    )}
  </div>;
}

function DiagnosticTemplate({setScreen}){
  const [active,setActive]=useState('visual');
  const [quickFix,setQuickFix]=useState([]);
  const [activeTool,setActiveTool]=useState('');
  const [phase,setPhase]=useState('diagnose');

  const areas={
    visual:{
      clock:'12',
      title:'Visual / Information Pickup',
      colour:'blue',
      observe:'Player loses the ball early, looks at the front wall, or does not pick up useful opponent/ball cues.',
      tools:['2 Coloured Racquet Tool','Quiet Eye Cue','Ball Tracking Constraint'],
      playerCue:'See the ball and the information source earlier.',
      constraint:'Add a call-out or visual information task before contact.'
    },
    prep:{
      clock:'2',
      title:'Preparation Timing',
      colour:'green',
      observe:'Preparation starts late, player rushes, or there is no time to adapt.',
      tools:['Waltz Rhythm Tool','Early Prep Trigger','Time Pressure Feed'],
      playerCue:'Prepare from the ball flight, not after arriving.',
      constraint:'Change the time available or add a rhythm cue.'
    },
    swing:{
      clock:'4',
      title:'Swing / Contact Organisation',
      colour:'orange',
      observe:'Wrist collapses, swing is too large, contact is inconsistent, or racquet path breaks down.',
      tools:['Happy Face Wrist Tool','Hand-to-Forearm Tape Tool','Side-Wall Ball Return Tool','Second Racquet Counterbalance Tool','Wall Swing Constraint'],
      playerCue:'Find a swing that fits the time, space and shot.',
      constraint:'Use haptic, spatial or environmental feedback.'
    },
    movement:{
      clock:'6',
      title:'Movement / Recovery',
      colour:'purple',
      observe:'Slow recovery, poor movement rhythm, flat-footedness or poor return to T.',
      tools:['Elastic Band to T','Waltz Rhythm Tool','Recovery Gate','T Touch Constraint'],
      playerCue:'Move out, hit balanced, recover early.',
      constraint:'Add a recovery rule, rhythm constraint or target return point.'
    },
    balance:{
      clock:'8',
      title:'Balance / Spacing',
      colour:'teal',
      observe:'Player is too close/far from the ball, off balance, or has poor court position.',
      tools:['Court Zones Target Tool','Spacing Gate','Balance Beam Tool','Shoulder Alignment Tape'],
      playerCue:'Create the right distance to strike and recover.',
      constraint:'Change the space, target or body-orientation information.'
    },
    decision:{
      clock:'10',
      title:'Decision / Tactical Choice',
      colour:'red',
      observe:'Poor shot choice, predictable patterns, unclear plan or wrong risk/reward choice.',
      tools:['T Challenge Constraint','4-Shot Window','2-Shot Window','Checkerboard Pair / Triple Challenge','Opponent Off T Overlay'],
      playerCue:'Read the opponent before choosing the shot.',
      constraint:'Add a tactical condition or scoring consequence.'
    }
  };

  const current=areas[active];

  function addTool(tool){
    setQuickFix(prev=>{
      if(prev.includes(tool)){
        const updated=prev.filter(item=>item!==tool);
        if(activeTool===tool){
          setActiveTool(updated[0]||'');
        }
        return updated;
      }
      return [...prev,tool];
    });
    if(!quickFix.includes(tool)){
      setActiveTool(tool);
    }
    setPhase('apply');
  }

  return <div className="page diagnosticPage">
    <div className="pageTop">
      <h1>Diagnostic Template</h1>
      <button className="secondaryBtn" onClick={()=>setScreen('home')}>← Home</button>
    </div>

    <div className="diagnosticProcessStrip">
      {[
        ['observe','Observe'],
        ['diagnose','Diagnose'],
        ['select','Select Tool'],
        ['apply','Apply Constraint'],
        ['recheck','Recheck']
      ].map(item=>
        <button key={item[0]} className={phase===item[0]?'activeProcessStep':''} onClick={()=>setPhase(item[0])}>
          {item[1]}
        </button>
      )}
    </div>

    <div className="gameCard diagnosticWorkflowPanel">
      {phase==='observe'&&<>
        <div className="categoryTag">Observe</div>
        <h2>What do you see?</h2>
        <p>Watch carefully before choosing a fix. Identify the clearest repeatable behaviour, not a one-off mistake.</p>
        <ul>
          <li>Where does the issue appear?</li>
          <li>When does it appear?</li>
          <li>Is it visual, timing, movement, contact, balance or decision-based?</li>
        </ul>
      </>}

      {phase==='diagnose'&&<>
        <div className="categoryTag">Diagnose</div>
        <h2>Use the Diagnostic Clock</h2>
        <p>Tap the most likely diagnostic area below. The selected area will show linked tools.</p>
      </>}

      {phase==='select'&&<>
        <div className="categoryTag">Select Tool</div>
        <h2>Choose the simplest effective tool</h2>
        <p>Select one linked tool. Avoid stacking too many interventions at once.</p>
      </>}

      {phase==='apply'&&<>
        <div className="categoryTag">Apply Constraint</div>
        <h2>Apply one constraint</h2>
        <p>Use the selected tool in the live session. Change the task, space, time, equipment, rule or scoring constraint.</p>
        {quickFix.length>0&&<div className="quickLayers">{quickFix.map(tool=><button key={tool} className="activeLayer">✓ {tool}</button>)}</div>}
      </>}

      {phase==='recheck'&&<>
        <div className="categoryTag">Recheck</div>
        <h2>Has it improved?</h2>
        <ul>
          <li>Keep the constraint if behaviour improves.</li>
          <li>Adapt the constraint if improvement is partial.</li>
          <li>Choose another diagnostic area if the issue remains.</li>
        </ul>
      </>}
    </div>

    <div className="diagnosticLayout">
      <div className="diagnosticClockPanel">
        <div className="categoryTag">Diagnostic Clock</div>
        <h2>Where is the main issue?</h2>
        <div className="diagnosticClockGrid">
          {Object.entries(areas).map(([key,item])=>
            <button key={key} className={`clockSlice ${active===key?'activeClockSlice':''} ${item.colour}`} onClick={()=>setActive(key)}>
              <span className="clockNumber">{item.clock}</span>
              <strong>{item.title}</strong>
            </button>
          )}
        </div>
      </div>

      <div className="diagnosticDetailPanel">
        <div className="categoryTag">Selected Area</div>
        <h2>{current.title}</h2>

        <div className="infoBox">
          <strong>Observe</strong>
          <p>{current.observe}</p>
        </div>

        <div className="infoBox">
          <strong>Player Cue</strong>
          <p>{current.playerCue}</p>
        </div>

        <div className="infoBox">
          <strong>Constraint Direction</strong>
          <p>{current.constraint}</p>
        </div>

        <div className="diagnosticTools">
          <strong>Linked Tools</strong>
          {current.tools.map(tool=>
            <button key={tool} className="toolLinkBtn" onClick={()=>addTool(tool)}>
              + Add {tool} to Live Quick Fix
            </button>
          )}
        </div>
      </div>
    </div>

    <div className="gameCard">
      <div className="categoryTag">Live Quick Fix</div>
      <h2>Selected Tools</h2>
      {quickFix.length===0
        ?<p>No tools selected yet. Tap a diagnostic area and add a tool.</p>
        :<div className="quickLayers">{quickFix.map(tool=>
          <button 
            key={tool} 
            className={activeTool===tool?'activeLayer primaryTool':'activeLayer secondaryTool'}
            onClick={()=>addTool(tool)}
            onDoubleClick={()=>setActiveTool(tool)}
          >
            {activeTool===tool?'★':'✓'} {tool}
          </button>)}
          </div>}
      <p className="engineIntro">Tap a selected tool again to remove it. Double tap a tool to make it the primary active intervention. Recheck after applying one constraint.</p>
    </div>
  </div>;
}

function LiveSessionDelivery({session=[],setScreen}){
  const [activeIndex,setActiveIndex]=useState(0);
  const [timerSeconds,setTimerSeconds]=useState(0);
  const [isRunning,setIsRunning]=useState(false);
  const [quickLayer,setQuickLayer]=useState('');
  const [intervention,setIntervention]=useState('');

  useEffect(()=>{
    if(!isRunning)return;
    const id=setInterval(()=>setTimerSeconds(prev=>prev+1),1000);
    return ()=>clearInterval(id);
  },[isRunning]);

  const active=session&&session.length?session[Math.min(activeIndex,session.length-1)]:null;
  const minutes=String(Math.floor(timerSeconds/60)).padStart(2,'0');
  const seconds=String(timerSeconds%60).padStart(2,'0');
  const interventions=[
    ['Late Preparation','Look for when preparation starts.','Prepare earlier from the ball flight.'],
    ['Wrist Collapse','Use Happy Face / tape feedback.','Keep the racquet face stable through contact.'],
    ['Not Returning To T','Use Elastic Band to T analogy.','Let the shot finish pull you back to the T.'],
    ['Excessive Swing','Use wall or floor-line swing constraint.','Find a swing that fits the time and space.'],
    ['Visual Tracking','Use two-coloured racquet tool.','Pick up the contact information early.']
  ];
  const chosen=interventions.find(item=>item[0]===intervention);

  function nextItem(){setActiveIndex(prev=>Math.min(prev+1,(session?.length||1)-1));setTimerSeconds(0);}
  function prevItem(){setActiveIndex(prev=>Math.max(prev-1,0));setTimerSeconds(0);}

  return <div className="page liveSessionPage">
    <div className="pageTop">
      <h1>Live Session Delivery</h1>
      <button className="secondaryBtn" onClick={()=>setScreen('home')}>← Home</button>
    </div>
    <div className="gameCard"><div className="categoryTag">Live Courts</div><h2>Live Courts Challenge Display</h2><p className="engineIntro">Projection-led court challenge board. No live score input required.</p><div className="infoBox"><strong>Court Count</strong><p>Default = 3 courts. Selectable range = 1–6 courts.</p></div><div className="infoBox"><strong>Challenge Assignment</strong><p>Same challenge on all courts · Grouped courts · Different challenge per court.</p></div></div>

    {!active&&<div className="gameCard"><div className="categoryTag">Live Mode</div><h2>No session item selected</h2><p>Add games or activities to Session Builder, then return here to run the session live.</p></div>}

    {active&&<div className="gameCard liveActiveCard">
      <div className="categoryTag">Current Activity {activeIndex+1} / {session.length}</div>
      <h2>{active.title||'Session Activity'}</h2>
      <div className="liveTimer">{minutes}:{seconds}</div>
      <div className="liveButtonRow">
        <button className="secondaryBtn" onClick={prevItem}>Previous</button>
        <button className="primaryBtn" onClick={()=>setIsRunning(!isRunning)}>{isRunning?'Pause':'Start'}</button>
        <button className="secondaryBtn" onClick={()=>setTimerSeconds(0)}>Reset Timer</button>
        <button className="primaryBtn" onClick={nextItem}>Next</button>
        <button className="primaryBtn" onClick={()=>startCoachProjectionSession(session,activeIndex)}>START PROJECTOR</button>
        <button className="secondaryBtn dangerBtn" onClick={stopCoachProjectionSession}>STOP PROJECTOR</button>
      </div>
      <div className="infoBox"><strong>What To Run</strong><p>{active.task||active.description||'Run the selected activity.'}</p></div>
      {active.scoring&&<div className="infoBox"><strong>Scoring</strong><p>{active.scoring}</p></div>}
      {active.playerFocus&&<div className="infoBox"><strong>Player Focus</strong><p>{active.playerFocus}</p></div>}
      {active.cbCode&&active.cbCode!=='None'&&<div className="infoBox"><strong>Checkerboard Code</strong><p>{active.cbCode}</p></div>}
      {active.layers&&active.layers.length>0&&<div className="infoBox"><strong>Active Overlays</strong><p>{active.layers.join(' · ')}</p></div>}
    </div>}

    <div className="gameCard">
      <div className="categoryTag">Quick Layer</div><h2>Quick Constraint / Overlay</h2>
      <div className="quickLayers">
        {['Clean Winner','Opponent Off T','Volley Finish','Double Bounce','DB Handicap','4-Shot Window','2-Shot Window','Quality Length Before Attack'].map(layer=><button key={layer} className={quickLayer===layer?'activeLayer':''} onClick={()=>setQuickLayer(quickLayer===layer?'':layer)}>{quickLayer===layer?'✓ ':'+ '}{layer}</button>)}
      </div>
      {quickLayer&&<div className="infoBox"><strong>Temporary Layer</strong><p>{quickLayer}</p></div>}
    </div>

    <div className="gameCard">
      <div className="categoryTag">Quick Intervention</div><h2>Coach Quick Fix</h2>
      <div className="quickLayers">
        {interventions.map(item=><button key={item[0]} className={intervention===item[0]?'activeLayer':''} onClick={()=>setIntervention(intervention===item[0]?'':item[0])}>{item[0]}</button>)}
      </div>
      {chosen&&<div className="diagnosticTheoryGrid"><div className="infoBox"><strong>Coach Cue</strong><p>{chosen[1]}</p></div><div className="infoBox"><strong>Player Cue</strong><p>{chosen[2]}</p></div></div>}
    </div>
  </div>;
}


function PlayerHub({players,setPlayers,session,setSession}){
  const [tab,setTab]=useState('players');
  return <div className="page playerHubPage">
    <div className="playerHubTabs">
      <button className={tab==='players'?'activeTab':''} onClick={()=>setTab('players')}>Players</button>
      <button className={tab==='storage'?'activeTab':''} onClick={()=>setTab('storage')}>Storage & Backup</button>
    </div>
    {tab==='players'&&<Players players={players} setPlayers={setPlayers}/>}
    {tab==='storage'&&<Storage players={players} setPlayers={setPlayers} session={session} setSession={setSession}/>}
  </div>;
}





function DiagnosticIntervention({setScreen}){
  const [tab,setTab]=useState('foundations');
  const [activeCase,setActiveCase]=useState('Late To Ball');
  const [openInfo,setOpenInfo]=useState('');

  function toggleInfo(key){
    setOpenInfo(prev=>prev===key?'':key);
  }

  const moreInfo={
    perceiveMove:{
      title:'Perceive ↔ Move',
      researcher:'Gibson, Newell, Bernstein and Davids all support this non-linear view in different ways.',
      core:'Perception and movement constantly update each other. Movement is not simply the result of information; movement helps create new information.',
      squash:'A player edging forward may suddenly see a volley opportunity that was not visible from a static T position.',
      takeaway:'Do not coach players to stand, wait, decide and then move. Coach active searching, small adjustment movements and information pickup.'
    },
    gibson:{
      title:'James Gibson · Affordances',
      researcher:'James J. Gibson developed ecological psychology and the concept of affordances.',
      core:'Players perceive opportunities for action directly in the environment.',
      squash:'A loose ball may afford volley, kill, drop or deception depending on player ability, opponent position and available time.',
      takeaway:'Design games that help players perceive useful opportunities, not just repeat prescribed solutions.'
    },
    bernstein:{
      title:'Nikolai Bernstein · Repetition Without Repetition',
      researcher:'Nikolai Bernstein studied skilled movement, including expert blacksmiths.',
      core:'Skilled performers achieve stable outcomes through adaptable movement, not identical repetition.',
      squash:'Every drive, volley and lunge differs slightly because ball, opponent, time and body position are never identical.',
      takeaway:'Repeat the problem. Do not demand identical movement repetitions.'
    },
    newell:{
      title:'Karl Newell · Constraints Model',
      researcher:'Karl Newell proposed that movement emerges from interacting individual, task and environmental constraints.',
      core:'Coaches shape behaviour by manipulating constraints rather than directly programming movement.',
      squash:'Changing scoring, space, ball, target or opponent pressure can transform movement without a technical lecture.',
      takeaway:'Before prescribing technique, ask which constraint can guide the player toward a better solution.'
    },
    davids:{
      title:'Keith Davids · Ecological Dynamics',
      researcher:'Keith Davids and colleagues developed ecological dynamics and representative learning design in sport.',
      core:'Skill emerges through perception-action coupling in representative environments.',
      squash:'A rally-based recognition game preserves more transfer information than a decontextualised pattern drill.',
      takeaway:'Keep practice connected to the information sources players need in competition.'
    },
    elastic:{
      title:'Elastic Energy & Reactivity',
      researcher:'Biomechanics describes stretch-shortening actions; coaches often use this through plyometric and reactive movement tasks.',
      core:'When muscles and tendons lengthen before shortening, they can store and release elastic energy.',
      squash:'Split step, lunge recovery, torso rotation, shoulder loading and elbow extension all use loading and release.',
      takeaway:'Use reactive, representative tasks that reward loading, timing and release rather than static starts.'
    },
    hick:{
      title:'Hick-Hyman Law · Reduce Opponent Options',
      researcher:'William Hick and Ray Hyman showed that decision time increases as the number of choices increases.',
      core:'The more options available, the slower and harder the next decision becomes.',
      squash:'A loose shot gives many replies. A tight length or good width can reduce likely replies and make the next ball easier to read.',
      takeaway:'Coach players to reduce opponent options before attacking.'
    },
    vickers:{
      title:'Joan Vickers · Quiet Eye',
      researcher:'Joan Vickers identified the Quiet Eye as a final stable visual fixation linked to skilled performance.',
      core:'Experts often stabilise gaze on relevant information before and during action.',
      squash:'Before serve, attack or volley, the player stabilises attention on target, ball and useful information instead of rushing.',
      takeaway:'Ask “what did you see?” before saying “keep your head still.”'
    },

    origins:{
      title:'Origins of Non-Functional Habits',
      researcher:'This combines Newell’s constraints model, Bernstein’s coordination work and ecological dynamics.',
      core:'A behaviour stabilises because previous constraints made it useful, easy, rewarded or never challenged.',
      squash:'A large swing may work in feeds and at lower levels, then become non-functional when time pressure and opponent uncertainty increase.',
      takeaway:'Do not ask only “what is wrong?” Ask “where did this solution come from?”'
    },
    attractors:{
      title:'Mono-stable, Multi-stable and Meta-stable Attractors',
      researcher:'Attractor language comes from dynamical systems theory used in ecological dynamics.',
      core:'Mono-stable means one solution dominates. Multi-stable means several solutions exist. Meta-stable means the player can switch fluidly between solutions as information changes.',
      squash:'A hard hitter should not lose the hard drive; they need soft, dying, height and hold options with equal selectivity.',
      takeaway:'Sometimes the coach should expand the solution landscape rather than replace an existing behaviour.'
    },
    errors:{
      title:'Errors as Information',
      researcher:'This links to Bernstein, Newell, Davids, Bandura and Dweck.',
      core:'Errors are not all the same. Some are exploration errors, some are stable non-functional habits, and some are pressure or perception breakdowns.',
      squash:'A missed volley during earlier interception exploration may be useful. Repeatedly missing because the same late recognition habit dominates is different.',
      takeaway:'Classify the error origin before choosing the intervention.'
    }
,
    wulf:{
      title:'Gabriele Wulf · External Focus',
      researcher:'Gabriele Wulf showed that focusing on movement effects often improves learning compared with body-part focus.',
      core:'Attention directed to outcome, target or environment tends to support more automatic movement organisation.',
      squash:'“Drive the ball through the back corner” is usually more useful than “rotate your shoulder.”',
      takeaway:'Use target, ball flight, opponent and space cues before body-part mechanics.'
    }
  };

  function InfoButton({id,label='More Info'}){
    const info=moreInfo[id];
    if(!info) return null;
    return <div className="moreInfoWrap">
      <button type="button" className="moreInfoBtn" onClick={()=>toggleInfo(id)}>📚 {openInfo===id?'Hide Info':label}</button>
      {openInfo===id&&<div className="moreInfoPanel">
        <h3>{info.title}</h3>
        <p><strong>Research contributor:</strong> {info.researcher}</p>
        <p><strong>Core idea:</strong> {info.core}</p>
        <p><strong>Squash example:</strong> {info.squash}</p>
        <p><strong>Coach takeaway:</strong> {info.takeaway}</p>
      </div>}
    </div>;
  }

  const pda=[
    {title:'Anticipation',text:'What did the player expect before the ball arrived?',questions:['Did the player read the opponent early?','Did they predict the likely reply?','Were they surprised by the ball?']},
    {title:'Perception',text:'What information did the player actually pick up?',questions:['Did they see ball, opponent, space and time?','Did they track the ball early enough?','Did they recognise the affordance?']},
    {title:'Decision',text:'Was the chosen solution appropriate?',questions:['Was the tactical intention clear?','Did the shot solve the problem?','Was the player attacking, neutralising or surviving?']},
    {title:'Action',text:'Could the player execute the selected solution?',questions:['Was movement organised?','Was contact controlled?','Did balance, timing or force transfer break down?']}
  ];

  const lenses=[
    {title:'Biomechanical Lens',icon:'⚙️',text:'Movement organisation: balance, timing, sequencing, force production, force transfer, acceleration, deceleration and adaptability.'},
    {title:'Perceptual Lens',icon:'👁️',text:'Information pickup: tracking, Quiet Eye, opponent reading, anticipation, recognition and perception-action coupling.'},
    {title:'Tactical Lens',icon:'♟️',text:'Problem solving: positioning, recovery, width, pressure, volley use, shot selection and Checkerboard recognition.'},
    {title:'Mental Lens',icon:'🧠',text:'Attention and regulation: commitment, confidence, resilience, emotional recovery and agency.'}
  ];

  const movementPrinciples=[
    ['Balance','Control body position while moving, striking and recovering.','Balance lets the player adapt contact, decelerate and recover.'],
    ['Force Production','Generate force against the ground to create movement and racket speed.','Squash power starts from interaction with the floor, not simply from the arm.'],
    ['Force Transfer','Transfer force efficiently through the body from larger segments to smaller segments.','Ground force, leg drive, trunk rotation, shoulder, arm and racket organise toward the shot outcome.'],
    ['Proximal-to-Distal Sequencing','Larger body segments usually organise before smaller segments and racket speed emerges through the chain.','Legs and trunk help create racket speed before arm, hand and racket finish the action.'],
    ['Timing','Coordinate movement so force is produced and transferred at the useful moment.','Good timing means the action fits the ball, opponent pressure and tactical intention.'],
    ['Coordination','Organise body segments to achieve the task goal.','The goal is not a perfect shape; the goal is a useful movement solution.'],
    ['Stability & Mobility','Produce movement while maintaining enough control to adapt.','Players need control and freedom at the same time.'],
    ['Acceleration & Deceleration','Start quickly, stop efficiently and reorganise for the next action.','Deceleration is often what allows accurate striking and fast recovery.'],
    ['Elastic Energy & Reactivity','Use stretch-shortening actions of muscles and tendons to improve efficiency and power.','Examples include split step, lunge recovery, torso rotation, shoulder loading and elbow extension.'],
    ['Adaptability','Modify movement solutions in response to changing task, opponent and environmental demands.','Effective movement is adaptable rather than identical.']
  ];


  const habitOrigins=[
    {title:'Functional At Lower Level',type:'Origin',text:'The behaviour worked against slower pace, weaker pressure or simpler opponents. It becomes non-functional when the environment becomes more demanding.',coach:'Do not shame the habit. Explain that the game has outgrown it.',intervention:'Add new solutions and increase selectivity under pressure.'},
    {title:'Solo Practice / Repetition With Repetition',type:'Origin',text:'The behaviour stabilised in self-paced practice with no opponent, limited variability and known timing.',coach:'Look for collapse when opponent, time pressure or uncertainty returns.',intervention:'Reintroduce variability, opponent information and representative consequences.'},
    {title:'Traditional Feeding-Origin Habit',type:'Origin',text:'The solution was shaped by continuous feeds where shot shape, power or cosmetic technique was celebrated without rally consequences.',coach:'Ask whether the movement survives live time pressure, recovery and opponent feedback.',intervention:'Shift from shot coaching to outcome coaching under constraints.'},
    {title:'Missing Solution Development',type:'Origin',text:'The coordination or perceptual behaviour never developed. There is no reliable attractor yet.',coach:'This is not replacement work. It is construction work.',intervention:'Build a simple representative version, then scale pressure gradually.'},
    {title:'Compensation Attractor',type:'Origin',text:'A secondary behaviour stabilised because it helped solve another issue: balance, spacing, timing or fear.',coach:'Do not attack the compensation first.',intervention:'Find the primary problem the compensation is solving.'}
  ];

  const attractorTypes=[
    {title:'Type 1 — Missing Solution',text:'No useful attractor exists yet. Example: non-racquet hand has no functional role, no split step, no visual tracking habit.',action:'Add / build the missing behaviour through representative tasks.'},
    {title:'Type 2 — Dominant Non-Functional Habit',text:'A stable solution exists but dominates in the wrong context. Example: huge swing, late prep, wrist break, admire-shot recovery.',action:'Destabilise dominance and create better contextual selectivity.'},
    {title:'Add Rather Than Replace',text:'Some habits have limited functionality. They should remain available, but not dominate all situations.',action:'Develop more solutions with equal selectivity — this is the route toward meta-stability.'}
  ];

  const habitCards=[
    {title:'Non-Racquet Hand Neutral / Absent',origin:'Missing Solution Development',type:'Type 1 — Missing Solution',why:'The player may never have developed the non-playing hand as a balance, spacing and shoulder-organisation resource.',debate:'Traditional correction might say “put your hand here.” Constraint-led coaching asks what task makes the hand useful.',coach:'Build a functional role rather than a cosmetic position.',intervention:'Use reaching, spacing and recoverable-strike constraints where the non-racquet hand helps solve the task.'},
    {title:'Large Feeding-Grooved Swing',origin:'Traditional Feeding-Origin Habit',type:'Type 2 — Dominant Non-Functional Habit',why:'Continuous feeds can reward shape and power without opponent pressure, recovery demands or variability.',debate:'Traditional shot coaching may celebrate the swing. Outcome coaching asks whether it survives live time, space and opponent information.',coach:'Do not simply shorten the swing verbally. Change the time/space constraint.',intervention:'Use rally feeds, tempo compression, recovery bonuses and pressure windows.'},
    {title:'Solo-Practice Straight Drive Attractor',origin:'Solo Practice / Repetition With Repetition',type:'Type 2 — Mono-stable Solution',why:'The drive may be stable in one self-paced environment but unavailable or poorly selected in open rally contexts.',debate:'The issue is not that solo practice is useless. The issue is whether it transfers to changing information.',coach:'Preserve the drive but add adaptability.',intervention:'Vary height, depth, pressure, opponent position and decision triggers.'},
    {title:'Hard Hitter Only',origin:'Functional At Lower Level',type:'Add Rather Than Replace',why:'Power may have been highly functional at a lower level but becomes too predictable when opponents absorb pace.',debate:'Do not remove the penetrating drive. Add soft, dying, height, hold and change-of-tempo options.',coach:'The goal is not less power; it is better selectivity.',intervention:'Use variable pace games and score only when the player selects the appropriate ball shape for the affordance.'},
    {title:'Spin-Out Recovery',origin:'Compensation Attractor',type:'Type 2 — Compensation Habit',why:'Over-rotation may help generate power or escape poor spacing, but damages next-shot readiness.',debate:'Correcting the spin directly may miss the primary cause.',coach:'Ask what the spin is solving: power, balance, spacing, or contact timing?',intervention:'Use recoverable-finish constraints and strike-to-recover scoring.'},
    {title:'Visual Tracking Not Developed',origin:'Missing Solution Development',type:'Type 1 — Missing Perceptual Solution',why:'The player may never have learned what information to pick up from ball flight, opponent body, or racket head.',debate:'“Watch the ball” is too vague. The player needs specifying information.',coach:'Clarify what the player should see and when.',intervention:'Use Quiet Eye, call-before-contact, second-eye-to-opponent and early recognition games.'}
  ];

  const errorTypes=[
    ['Exploration Error','Temporary miss while searching for a more useful solution. Do not over-correct too early.'],
    ['Stable Non-Functional Habit','Same failure repeats because one attractor dominates. Change the constraints.'],
    ['Functional Miss','Good intention and information, but execution failed. Keep the behaviour and adjust the demand.'],
    ['Non-Functional Success','Player wins the point but reinforces a poor process. Coach the long-term pattern, not just outcome.'],
    ['Pressure Error','Behaviour is available in practice but collapses under score, opponent, fatigue or time pressure.'],
    ['Compensation Error','Visible behaviour is secondary. Find the primary problem it is compensating for.']
  ];


  const quickFixHabits=[
    {issue:'Late Preparation',visible:'Preparation begins after the ball has already solved the player.',origin:'Often repetition-induced by predictable feeding, or historically functional at a slower level.',type:'Type 2 — dominant non-functional habit',addReplace:'Usually expand first, then replace if it collapses under all pressure.',coachQuestion:'When did the player first know forehand / backhand / volley / bounce?',constraint:'Early Recognition Rally: player calls FOREHAND, BACKHAND, VOLLEY or BOUNCE as soon as they know, then play continues.',checkerboard:'[6-4] volley or [6-4]+[8-1] with early recognition requirement.',progression:'Increase feed variability, reduce time, then move to live rally with opponent cues.',regression:'Slow the ball and ask for earlier call only; no tactical finish required.',cue:'Recognise early. Prepare with the movement, not after it.'},
    {issue:'Hard Hitter Only',visible:'Player drives hard regardless of opponent, space, score or ball quality.',origin:'Functional at lower level; often rewarded by early success and dominance against weaker movers.',type:'Add rather than replace — power has limited functionality.',addReplace:'Do not remove power. Add soft, dying, height, hold and working pace options with equal selectivity.',coachQuestion:'What information told the player that hard was the best solution?',constraint:'Shape Change Game: player must win one rally with pace, one with height, one with soft dying ball before hard winners count again.',checkerboard:'[6-4]+[8-1], [6-4]+[5-4], and variable pace overlays.',progression:'Score only when the chosen shape matches opponent position.',regression:'Coach feeds three obvious affordances: drive, soft, height.',cue:'Power stays. Predictability goes.'},
    {issue:'No Non-Racquet Hand',visible:'Non-playing hand hangs neutral or crosses in front with no functional role.',origin:'Missing solution development; the coordination may never have been built.',type:'Type 1 — missing solution',addReplace:'Build from scratch; do not treat it as a cosmetic technical correction.',coachQuestion:'What function should the non-racquet hand serve here: balance, spacing, shoulder organisation or recovery?',constraint:'Balanced Finish Game: player scores only if they can hold a stable finish for two seconds after contact.',checkerboard:'[6-4] straight-line task, then [6-4]+[8-1] transition under balance demand.',progression:'Move from simple rally to continuous rally with no reset between shots.',regression:'Start with shadow-to-ball spacing task, then low-pressure rally.',cue:'The free hand solves balance and spacing.'},
    {issue:'Visual Tracking / Quiet Eye',visible:'Player watches front wall, opponent or outcome too early and loses ball-contact information.',origin:'Missing perceptual solution; sometimes caused by coaching emphasis on shot result rather than information pickup.',type:'Type 1 — missing informational solution',addReplace:'Add a visual information routine, then integrate with rally decision making.',coachQuestion:'What did the player actually see before and during contact?',constraint:'Call Before Contact: player calls ball height or opponent position before striking.',checkerboard:'[6-4]+[8-1] with call of opponent position before the finish.',progression:'Move from coach feed to live rally with second-eye-to-opponent overlay.',regression:'Start with slower rally and one visual call only.',cue:'See the ball. Read the opponent. Then act.'},
    {issue:'Spinning / Rotation',visible:'Player rotates out of the shot and cannot recover or control direction.',origin:'Compensation attractor for poor spacing, excessive backswing, balance failure or power search.',type:'Type 2 — compensation habit',addReplace:'Do not attack the spin first. Find what the spin is solving.',coachQuestion:'Is the spin solving power, spacing, balance or preparation?',constraint:'Recoverable Finish Game: point counts only if the player can strike and recover before the opponent contacts the next ball.',checkerboard:'[6-4] straight drive with recoverable finish; then [6-4]+[8-1].',progression:'Add opponent pressure and shorter recovery windows.',regression:'Use channel constraint and slower ball to stabilise line first.',cue:'Finish in a shape you can recover from.'},
    {issue:'Forced Attack',visible:'Player attacks before advantage exists.',origin:'May be functional at lower level, emotional/identity-driven, or reinforced by weak opponents.',type:'Type 2 — dominant decision habit',addReplace:'Expand tactical selectivity; attacking remains available but must be linked to affordance recognition.',coachQuestion:'What evidence showed the opponent was vulnerable?',constraint:'Attack After Advantage: attack only scores after opponent is off T, stretched, below ball, moving away or options reduced.',checkerboard:'Reduce options sequence: [6-4] pressure before [8-1] finish.',progression:'Coach removes prompts; player must call the advantage cue independently.',regression:'Coach identifies advantage cues aloud first.',cue:'Earn it. See it. Then take it.'},
    {issue:'Poor Recovery / Admiring Shot',visible:'Player watches own shot and reconnects late to opponent, ball and space.',origin:'Often functional at lower level where opponents cannot punish; sometimes traditional coaching overvalues shot shape.',type:'Type 2 — dominant non-functional habit',addReplace:'Add recovery and re-perception as part of the shot, not after the shot.',coachQuestion:'When did the player reconnect with opponent information?',constraint:'Shot Not Finished Until Recovered: challenge only counts if player recovers to a useful position before next opponent contact.',checkerboard:'Complete pair then recover before next opportunity unlocks: [6-4] → recover → [8-1].',progression:'Shorten recovery window and add live opponent exploitation.',regression:'Coach calls “recover” after contact, then removes prompt.',cue:'The shot ends when you are ready for the next ball.'},
    {issue:'Limited Swing / Shot Range',visible:'One swing shape or one ball shape used across many situations.',origin:'Solo-practice repetition, feed-grooved technique, or early success with one reliable attractor.',type:'Mono-stable solution landscape',addReplace:'Add solutions; do not destroy the reliable one unless it is universally harmful.',coachQuestion:'Which shot shapes are unavailable or not selected?',constraint:'Three Shapes Game: penetrating, working, soft/dying must each appear before normal scoring unlocks.',checkerboard:'[6-4]+[5-4], [6-4]+[8-1], variable height/pace overlays.',progression:'Add opponent position as the trigger for shape choice.',regression:'Coach calls required shape first, then player chooses.',cue:'Same preparation. Different solutions.'}
  ];

  const quickFixPrinciples=[
    ['Origin First','Was it functional at a lower level, repetition-induced, undeveloped, traditionally coached, or compensatory?'],
    ['Add vs Replace','Some habits must be rebuilt. Others should remain available while additional solutions are added.'],
    ['Meta-Stability','The target is not one perfect solution. The target is fluid switching between appropriate solutions.'],
    ['Representative Pressure','The solution must appear in open rally or game conditions, not only in a cooperative drill.']
  ];

  const [quickFixIssue,setQuickFixIssue]=useState('Late Preparation');
  const selectedQuickFix=quickFixHabits.find(item=>item.issue===quickFixIssue)||quickFixHabits[0];


  const overlayOptions=[
    {id:'none',name:'None',category:'None',description:'No additional overlay selected.',behaviour:'Base game only.',cue:'Play the base game.'},
    {id:'offT',name:'Opponent Off T',category:'Tactical State',description:'Bonus or permission only applies when opponent is not set in the T-zone.',behaviour:'Recognise when opponent cannot cover both sides.',cue:'Attack when they are not set.'},
    {id:'unsetT',name:'Opponent Not Set In T',category:'Tactical State',description:'Player may go below the line only if opponent is not balanced and set in the T-zone.',behaviour:'Attack below the line only when tactical permission exists.',cue:'Below line only when they are not set.'},
    {id:'stillMoving',name:'Opponent Still Moving',category:'Tactical State',description:'Action is valid only while opponent is still recovering or changing direction.',behaviour:'Exploit movement state rather than static court position.',cue:'Play before they settle.'},
    {id:'reduceOptions',name:'Reduce Options First',category:'Tactical',description:'Attack or bonus unlocks only after the previous shot has limited opponent replies.',behaviour:'Build pressure before attacking.',cue:'Limit replies, then attack.'},
    {id:'attackAdvantage',name:'Attack After Advantage',category:'Tactical',description:'Attack only counts after an advantage cue appears: off T, stretched, below ball, moving away, or reduced options.',behaviour:'Stop forced attacks and improve tactical selectivity.',cue:'Earn it. See it. Take it.'},
    {id:'recoverUnlock',name:'Recover Before Score Unlock',category:'Movement',description:'Challenge only counts if player reconnects to a useful recovery position before the next opponent contact.',behaviour:'Couple strike and recovery.',cue:'Shot ends when you are ready again.'},
    {id:'balancedFinish',name:'Balanced Finish',category:'Movement',description:'Bonus or permission only applies if player can finish in a recoverable balanced shape.',behaviour:'Prevent uncontrolled hitting and spinning out.',cue:'Finish where you can recover.'},
    {id:'earlyRecognition',name:'Early Recognition Call',category:'Perceptual',description:'Player must call forehand/backhand/volley/bounce or opponent state before action.',behaviour:'Train earlier information pickup.',cue:'Call it as soon as you know.'},
    {id:'likelyReply',name:'Call Likely Reply',category:'Perceptual',description:'Player predicts the opponent’s likely reply before attacking or before the next shot.',behaviour:'Develop anticipation and local probability reading.',cue:'What is most likely next?'},
    {id:'finishWindow',name:'Finish Window',category:'Temporal / Pressure',description:'After the overlay trigger is met, player must win within the selected shot window.',behaviour:'Convert advantage before it disappears.',cue:'Advantage has a clock.'},
    {id:'rebuild',name:'Rebuild Before Re-Attack',category:'Decision',description:'If attack fails, player must rebuild before attacking again.',behaviour:'Prevent repeated forcing from neutral or poor positions.',cue:'If it is gone, rebuild.'},
    {id:'liveOnly',name:'Live Rally Only',category:'Representative',description:'Overlay only applies in live rally play with opponent freedom.',behaviour:'Preserve perception-action coupling.',cue:'The opponent must be real.'},
    {id:'variability',name:'Variability Required',category:'Representative',description:'Coach or opponent must vary feed, pace, position or reply before bonus can count.',behaviour:'Avoid repetition-with-repetition.',cue:'Same problem, changing information.'}
  ];

  const consequenceOptions=[
    {id:'none',label:'No consequence',text:'No bonus or punishment attached.'},
    {id:'plus1',label:'+1 bonus',text:'Award +1 when this overlay is satisfied.'},
    {id:'plus2',label:'+2 bonus',text:'Award +2 when this overlay is satisfied.'},
    {id:'plus3',label:'+3 bonus',text:'Award +3 when this overlay is satisfied.'},
    {id:'plus4',label:'+4 bonus',text:'Award +4 when this overlay is satisfied.'},
    {id:'rallyLost',label:'Rally lost if broken',text:'If the player breaks this overlay, they lose the rally.'},
    {id:'reset',label:'Condition resets',text:'If missed or broken, the challenge resets and must be rebuilt.'},
    {id:'unlock',label:'Unlock scoring',text:'This overlay unlocks the next scoring opportunity.'},
    {id:'opponentBonus',label:'Opponent +1 if broken',text:'Opponent receives +1 if this overlay is broken.'},
    {id:'window2',label:'Finish within 2 shots',text:'Once satisfied, player must win within 2 shots.'},
    {id:'window3',label:'Finish within 3 shots',text:'Once satisfied, player must win within 3 shots.'},
    {id:'coachCall',label:'Coach call required',text:'Coach must confirm this overlay before consequence applies.'}
  ];

  const baseGameOptions=['ATL / Above The Line','BTL / Below The Line','Checkerboard Pair','Checkerboard Triple','Conditioned Game','Volley Game','T-Zone Game','Double Bounce Game','Coach Custom Game'];
  const [overlayBaseGame,setOverlayBaseGame]=useState('ATL / Above The Line');
  const [overlay1,setOverlay1]=useState('unsetT');
  const [overlay2,setOverlay2]=useState('finishWindow');
  const [overlay3,setOverlay3]=useState('recoverUnlock');
  const [consequence1,setConsequence1]=useState('unlock');
  const [consequence2,setConsequence2]=useState('window3');
  const [consequence3,setConsequence3]=useState('plus2');
  function findOverlay(id){return overlayOptions.find(o=>o.id===id)||overlayOptions[0];}
  function findConsequence(id){return consequenceOptions.find(c=>c.id===id)||consequenceOptions[0];}
  const selectedOverlays=[
    {level:1,overlay:findOverlay(overlay1),consequence:findConsequence(consequence1)},
    {level:2,overlay:findOverlay(overlay2),consequence:findConsequence(consequence2)},
    {level:3,overlay:findOverlay(overlay3),consequence:findConsequence(consequence3)}
  ];

  const cases={
    'Late To Ball':{
      pda:'Anticipation / Perception',
      lens:'Perceptual + Biomechanical',
      causes:['Recognised the cue late','Recovery position left too much distance','Poor first movement or deceleration','Hesitation before committing'],
      coachQuestion:'When did the player first recognise where the ball was going?',
      expected:'Player begins moving earlier because they pick up useful information earlier.',
      constraint:'Random hand-feed or live rally where player scores bonus for early movement or first interception step.',
      checkerboard:'Use front-court recognition challenge with [8-1] or [7-2] after opponent displacement.',
      conditioned:'Opponent Off T or moving-forward recognition game.',
      technical:'Early preparation / movement timing overlay.',
      mental:'Quiet Eye, Second Eye To Opponent, External Target Focus.',
      animal:'🐆 Cheetah + 🦅 Eagle',
      ppp:'Squash Activation with random hand feeds: move, strike, recover.'
    },
    'Slow Recovery':{
      pda:'Action / Decision',
      lens:'Tactical + Biomechanical + Mental',
      causes:['Player admires shot','Poor balance after contact','No clear recovery intention','Opponent information not reconnected after strike'],
      coachQuestion:'What happens immediately after contact: does the player reconnect with opponent and space?',
      expected:'Player recovers with information, not just movement to a fixed spot.',
      constraint:'Recovery bonus: point only counts if player returns to a useful recovery position before the next shot.',
      checkerboard:'Complete pair then recover to attacking position before the next scoring opportunity unlocks. Example: [6-4] → recover → [8-1]. No recovery = pair not completed.',
      conditioned:'T Challenge or Opponent Off T recovery game.',
      technical:'Balance and follow-through overlay.',
      mental:'No Admiring Shots, Full Recovery After Every Shot.',
      animal:'🐺 Wolf + 🦅 Eagle',
      ppp:'Coach varies feed depth and width. Player strikes, reconnects with opponent information, then moves again.'
    },
    "Doesn't Volley":{
      pda:'Perception / Decision',
      lens:'Perceptual + Tactical + Mental',
      causes:['Does not recognise interceptable ball','Standing too deep','Fear of error','Volley action not balanced under pressure'],
      coachQuestion:'What information tells the player this ball is interceptable?',
      expected:'Player recognises volley affordances earlier and moves into the interception space.',
      constraint:'Volley opportunity bonus: player scores only when taking suitable balls early.',
      checkerboard:'Volley & Intercept series with wall/floor zone target.',
      conditioned:'Volley Window Game: bonus only when player intercepts before the ball drops into a defensive bounce opportunity.',
      technical:'Volley preparation overlay.',
      mental:'Attack After Advantage, Quiet Eye Before Attack.',
      animal:'🦁 Lion + 🦅 Eagle',
      ppp:'Activation feeds: easy volley control, then random volley/move feeds.'
    },
    'Forces Attack':{
      pda:'Decision',
      lens:'Tactical + Mental + Perceptual',
      causes:['Attacks before advantage is created','Poor opponent reading','Over-arousal or impatience','Does not reduce opponent options first'],
      coachQuestion:'What evidence showed that attack was actually available?',
      expected:'Player attacks after advantage indicators appear rather than attacking from hope or impatience.',
      advantage:['Opponent off T','Opponent stretched','Opponent moving away from T','Opponent below the ball','Opponent under time pressure','Opponent options reduced'],
      constraint:'Attack only after width, opponent off T, or limited-reply constraint.',
      checkerboard:'Reduce options sequence: create width before front-wall/floor finish.',
      conditioned:'Length Before Attack or Route Breaker.',
      technical:'External target focus overlay.',
      mental:'Attack After Advantage, Reset Within 3 Seconds.',
      animal:'🐱 Cat + 🦅 Eagle',
      ppp:'Use My Highlights clip of patient attack construction.'
    },
    'Late Preparation':{
      pda:'Perception / Action',
      lens:'Perceptual + Biomechanical',
      causes:['Ball recognised late','Preparation waits until arrival','Excessive backswing','Poor spacing to ball'],
      coachQuestion:'When did the player first know whether the ball was forehand, backhand, volley or bounce?',
      expected:'Preparation begins earlier because ball recognition begins earlier.',
      constraint:'Foam roller/cone behind player to constrain excessive swing; random feeds preserve information pickup.',
      checkerboard:'Early-intercept challenge using appropriate wall/floor pair.',
      conditioned:'Early Recognition Rally: player calls FOREHAND, BACKHAND, VOLLEY or BOUNCE as soon as they know, then the rally continues.',
      technical:'Late preparation overlay.',
      mental:'Quiet Eye Return, Tracking.',
      animal:'🦅 Eagle + 🐆 Cheetah',
      ppp:'Random coach hand feed: call ball early, move, strike.'
    },
    'Emotional Reactions':{
      pda:'Decision / Action',
      lens:'Mental',
      causes:['Attention stays on previous error','Bad call or opponent behaviour disrupts focus','Poor reset behaviour','Loss of next-ball orientation'],
      coachQuestion:'How long did attention stay on the previous error or disruption?',
      expected:'Player returns attention to the next ball within 3 seconds.',
      constraint:'Reset within 3 seconds or opponent receives bonus point.',
      checkerboard:'Simple pair challenge with reset rule after every error.',
      conditioned:'Compete To Last Ball game.',
      technical:'No technical correction first; stabilise regulation and attention.',
      mental:'Accept And Continue, Neutral Error Response, Compete To Last Ball.',
      animal:'🦮 Golden Retriever + 🐘 Elephant',
      ppp:'Stage 1 mental resilience highlight + Centre Breath.',
      why:'Error recovery is trainable behaviour. Elite performers regain useful attention quickly after disruption.'
    }
  };

  const current=cases[activeCase];

  return <div className="page diagnosticInterventionPage">
    <div className="pageTop"><div><h1>Diagnostic & Intervention</h1><p className="mutedText">Observe · Diagnose · Intervene</p></div><button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button></div>

    <div className="diagnosticTabs">
      <button className={tab==='foundations'?'activeTab':''} onClick={()=>setTab('foundations')}>📚 Foundations</button>
      <button className={tab==='pda'?'activeTab':''} onClick={()=>setTab('pda')}>🎯 PDA Diagnostic</button>
      <button className={tab==='lenses'?'activeTab':''} onClick={()=>setTab('lenses')}>🔍 Four Lenses</button>
      <button className={tab==='movement'?'activeTab':''} onClick={()=>setTab('movement')}>⚙️ Movement Principles</button>
      <button className={tab==='habits'?'activeTab':''} onClick={()=>setTab('habits')}>🧩 Habits & Origins</button>
      <button className={tab==='quickfix'?'activeTab':''} onClick={()=>setTab('quickfix')}>⚡ Quick Fix</button>
      <button className={tab==='overlayEngine'?'activeTab':''} onClick={()=>setTab('overlayEngine')}>🧱 Overlay Engine</button>
      <button className={tab==='science'?'activeTab':''} onClick={()=>setTab('science')}>🧠 Habit Science</button>
      <button className={tab==='builder'?'activeTab':''} onClick={()=>setTab('builder')}>🛠 Intervention Builder</button>
      <button className={tab==='principles'?'activeTab':''} onClick={()=>setTab('principles')}>🏆 Coaching Principles</button>
    </div>

    {tab==='foundations'&&<div className="diagnosticStagePanel">
      <h2>Perceive ↔ Move</h2>
      <div className="bernsteinBox">
        <h3>We perceive to move. We move to perceive.</h3>
        <p>Players do not simply perceive, decide and then act in a straight line. In squash, movement and perception continuously update each other. Movement creates information. Information guides movement.</p>
        <InfoButton id="perceiveMove"/>
      </div>
      <div className="errorComparisonGrid">
        <div className="claComparisonCard"><h3>Crossing a Busy Road</h3><p>It is easier to cross a busy road when you are already moving, adjusting and weaving than when you stand still and make one desperate run. As you move, gaps appear, speeds become clearer and options change. Squash works the same way.</p></div>
        <div className="claComparisonCard"><h3>James Gibson · Affordances</h3><p>A door handle affords gripping and pulling. Stairs provide information about step height and how the body should organise. In squash, a loose ball affords volley, attack or deception if the player is attuned to it.</p><InfoButton id="gibson"/></div>
        <div className="claComparisonCard"><h3>Nikolai Bernstein · Repetition Without Repetition</h3><p>Skilled blacksmiths produced consistent hammer outcomes even though every strike was different. Walking down a gravelly hill is similar: the goal is stable, but every step adapts to changing surface, slope and balance demands.</p><InfoButton id="bernstein"/></div>
        <div className="claComparisonCard"><h3>Karl Newell · Constraints</h3><p>Movement emerges from interacting individual, task and environmental constraints. Coaches do not directly create movement; they manipulate constraints so useful solutions can emerge.</p><InfoButton id="newell"/></div>
        <div className="claComparisonCard"><h3>Keith Davids · Ecological Dynamics</h3><p>Skill develops through perception-action coupling inside representative environments. The closer practice preserves meaningful information, the more likely behaviour transfers to open play.</p><InfoButton id="davids"/></div>
      </div>
    </div>}

    {tab==='pda'&&<div className="diagnosticStagePanel">
      <h2>PDA Diagnostic Tool</h2>
      <p>Before labelling an error as technical, ask where the breakdown occurred.</p>
      <div className="interventionToolGrid">{pda.map(item=><div className="interventionToolCard" key={item.title}><h3>{item.title}</h3><p>{item.text}</p><ul>{item.questions.map(q=><li key={q}>{q}</li>)}</ul></div>)}</div>
      <div className="infoBox"><strong>WWWH ↔ PDA Link</strong><p><b>Why</b> = what am I trying to achieve? · <b>When</b> = when is the opportunity available? · <b>Where</b> = where is the useful space? · <b>How</b> = what movement/action solution achieves it?</p><p><b>Anticipation</b> helps identify WHEN. <b>Perception</b> helps identify WHERE. <b>Decision</b> links WHY–WHEN–WHERE. <b>Action</b> delivers HOW.</p></div>
    </div>}

    {tab==='lenses'&&<div className="diagnosticStagePanel">
      <h2>Four Diagnostic Lenses</h2>
      <p>Technical is what the coach sees. The lenses help explain why the behaviour may be occurring.</p>
      <div className="infoBox"><strong>Important Principle</strong><p>Technical errors are often symptoms. The underlying cause may be perceptual, tactical, mental or biomechanical. Do not assume visible technique is the source of the problem.</p></div>
      <div className="interventionToolGrid">{lenses.map(lens=><div className="interventionToolCard" key={lens.title}><h3>{lens.icon} {lens.title}</h3><p>{lens.text}</p></div>)}</div>
    </div>}

    {tab==='movement'&&<div className="diagnosticStagePanel">
      <h2>Movement Principles</h2>
      <p>Biomechanics helps describe movement, but it does not prescribe one ideal technique. Skilled players develop individual solutions that satisfy the task.</p>
      <div className="errorComparisonGrid">{movementPrinciples.map(item=><div className="errorMiniCard" key={item[0]}><h3>{item[0]}</h3><p>{item[1]}</p><small>{item[2]}</small>{item[0]==='Elastic Energy & Reactivity'&&<InfoButton id="elastic"/>}</div>)}</div>
    </div>}


    {tab==='habits'&&<div className="diagnosticStagePanel habitOriginsPage">
      <h2>Non-Functional Habits, Missing Solutions & Their Origins</h2>
      <div className="bernsteinBox">
        <h3>Origin determines intervention.</h3>
        <p>Players do not repeat non-functional habits because they are wrong. They repeat them because those solutions became stable under previous constraints.</p>
        <p>A movement pattern is not defined by how it looks in isolation, but by how effectively it adapts under representative performance constraints.</p>
        <InfoButton id="origins"/>
      </div>

      <h3>Where Did The Habit Come From?</h3>
      <div className="originGrid">{habitOrigins.map(item=><div className="originCard" key={item.title}>
        <span>{item.type}</span><h3>{item.title}</h3><p>{item.text}</p><section><strong>Coach Debate</strong><p>{item.coach}</p>
</section><section><strong>Intervention Direction</strong><p>{item.intervention}</p></section>
      </div>)}</div>

      <h3>Type 1 / Type 2 / Add Rather Than Replace</h3>
      <div className="interventionToolGrid">{attractorTypes.map(item=><div className="interventionToolCard" key={item.title}>
        <h3>{item.title}</h3><p>{item.text}</p><p><strong>Action:</strong> {item.action}</p>
      </div>)}</div>
      <div className="infoBox"><strong>Meta-stability Goal</strong><p>The goal is not always to remove an existing movement solution. Some solutions have limited functionality. The coaching goal is to add more solutions and develop equal selectivity so the player can switch fluidly as information changes.</p><InfoButton id="attractors"/></div>

      <h3>Sample Non-Functional Habits</h3>
      <div className="habitCardList">{habitCards.map(card=><div className="habitCard" key={card.title}>
        <div className="habitCardTop"><h3>{card.title}</h3><span>{card.type}</span></div>
        <p><strong>Origin:</strong> {card.origin}</p>
        <p><strong>Why it stabilised:</strong> {card.why}</p>
        <p><strong>Coach debate:</strong> {card.debate}</p>
        <p><strong>Coach question:</strong> {card.coach}</p>
        <p><strong>Constraint direction:</strong> {card.intervention}</p>
      </div>)}</div>

      <h3>Not All Errors Mean The Same Thing</h3>
      <div className="errorTypeGrid">{errorTypes.map(row=><div className="errorTypeCard" key={row[0]}><strong>{row[0]}</strong><p>{row[1]}</p></div>)}</div>
      <div className="infoBox"><strong>Key Coaching Shift</strong><p>Do not ask only: “How do we stop the error?” Ask: “What type of error is this, where did it originate, and should we replace, rebuild, or expand the player’s solution landscape?”</p><InfoButton id="errors"/></div>
    </div>}



    {tab==='quickfix'&&<div className="diagnosticStagePanel quickFixEnginePage">
      <h2>Quick Fix · Habits Integration</h2>
      <p>Three-tap courtside workflow: select the visible behaviour, identify the origin, then choose add / replace / expand with a representative constraint.</p>
      <div className="quickFixPrincipleGrid">{quickFixPrinciples.map(row=><div className="quickFixPrinciple" key={row[0]}><strong>{row[0]}</strong><p>{row[1]}</p></div>)}</div>
      <h3>1. Select Observable Behaviour</h3>
      <div className="quickFixButtonGrid">{quickFixHabits.map(item=><button type="button" key={item.issue} className={quickFixIssue===item.issue?'activeQuickFix':''} onClick={()=>setQuickFixIssue(item.issue)}>{item.issue}</button>)}</div>
      <div className="quickFixResultCard">
        <div className="quickFixHeader"><h3>{selectedQuickFix.issue}</h3><span>{selectedQuickFix.type}</span></div>
        <div className="quickFixTwoCol">
          <section><strong>Visible Behaviour</strong><p>{selectedQuickFix.visible}</p></section>
          <section><strong>Likely Origin</strong><p>{selectedQuickFix.origin}</p></section>
          <section><strong>Add / Replace Decision</strong><p>{selectedQuickFix.addReplace}</p></section>
          <section><strong>Coach Question</strong><p>{selectedQuickFix.coachQuestion}</p></section>
        </div>
        <div className="quickFixActionStrip"><strong>Coach Cue</strong><p>{selectedQuickFix.cue}</p></div>
      </div>
      <h3>2. Apply Representative Constraint</h3>
      <div className="interventionToolGrid">
        <div className="interventionToolCard"><h3>Constraint</h3><p>{selectedQuickFix.constraint}</p></div>
        <div className="interventionToolCard"><h3>Checkerboard Link</h3><p>{selectedQuickFix.checkerboard}</p></div>
        <div className="interventionToolCard"><h3>Progression</h3><p>{selectedQuickFix.progression}</p></div>
        <div className="interventionToolCard"><h3>Regression</h3><p>{selectedQuickFix.regression}</p></div>
      </div>
      <div className="infoBox"><strong>Key Principle</strong><p>Quick Fix does not mean quick technical correction. It means quickly identifying the player’s current solution landscape: missing solution, dominant non-functional habit, compensation attractor, or useful solution that needs more selectable alternatives.</p></div>
    </div>}



    {tab==='science'&&<div className="diagnosticStagePanel habitSciencePage">
      <h2>Science of Habit Formation</h2>
      <p>Why do habits stabilise, why do old solutions return under pressure, and why are constraints often more powerful than verbal correction?</p>

      <div className="bernsteinBox">
        <h3>Repetition strengthens stability — not necessarily functionality.</h3>
        <p>The nervous system stabilises solutions that reduce uncertainty, effort or pressure. The repeated behaviour may be functional, partially functional, or non-functional when the environment changes.</p>
        <p>The coaching question is not simply “how much repetition?” It is: what information, pressure and constraints were present when the behaviour stabilised?</p>
      </div>

      <div className="scienceGrid">
        <div className="scienceCard">
          <h3>🧠 Basal Ganglia</h3>
          <p><strong>Role:</strong> Repeated behaviours become automatic and less dependent on conscious control.</p>
          <p><strong>Squash example:</strong> A player automatically attacks too early, admires their shot, or recovers late without consciously deciding to.</p>
          <p><strong>Coaching implication:</strong> “Stop doing that” often fails. Change the task constraints so the old habit no longer solves the problem.</p>
          <p className="scienceRef">Research links: Ann Graybiel · Kenji Doya</p>
        </div>

        <div className="scienceCard">
          <h3>🎯 Cerebellum</h3>
          <p><strong>Role:</strong> Timing, calibration, prediction, error correction and movement adjustment.</p>
          <p><strong>Squash example:</strong> Calibrating volley timing, lunge depth, racket spacing, force control or deceptive hold.</p>
          <p><strong>Coaching implication:</strong> Calibration improves through variable representative repetition, not only blocked repetition.</p>
          <p className="scienceRef">Research links: Daniel Wolpert · Nikolai Bernstein</p>
        </div>

        <div className="scienceCard">
          <h3>👁️ Dorsal Stream</h3>
          <p><strong>“Where / How” system.</strong></p>
          <p>Guides online movement, spatial control and timing.</p>
          <p><strong>Squash example:</strong> Tracking the ball while moving to intercept a volley.</p>
          <p><strong>Coaching implication:</strong> Players perceive to move and move to perceive. Static decision-making is not enough.</p>
        </div>

        <div className="scienceCard">
          <h3>🧩 Ventral Stream</h3>
          <p><strong>“What” system.</strong></p>
          <p>Supports recognition, opponent pattern reading and tactical interpretation.</p>
          <p><strong>Squash example:</strong> Recognising opponent deception, favourite patterns or likely reply.</p>
          <p><strong>Coaching implication:</strong> Recognition must be linked to action, not taught as classroom knowledge.</p>
        </div>

        <div className="scienceCard">
          <h3>🔁 Mono-Stable → Meta-Stable</h3>
          <p><strong>Mono-stable:</strong> one dominant solution used too often.</p>
          <p><strong>Multi-stable:</strong> several solutions exist.</p>
          <p><strong>Meta-stable:</strong> the player switches fluidly between solutions as information changes.</p>
          <p><strong>Squash example:</strong> A hard hitter keeps the penetrating drive but adds soft, height, hold and dying options with equal selectivity.</p>
        </div>

        <div className="scienceCard">
          <h3>⚠️ Pressure & Habit Reversion</h3>
          <p>Under pressure, older and more stable attractors often reappear.</p>
          <p><strong>Squash example:</strong> A player can vary pace in practice but returns to hard straight drives in competition.</p>
          <p><strong>Coaching implication:</strong> New behaviours must stabilise under fatigue, uncertainty, score pressure and opponent pressure.</p>
        </div>
      </div>

      <div className="infoBox">
        <strong>Key Principle</strong>
        <p>The brain does not simply store perfect movement templates. Skilled behaviour emerges through the interaction of player, task, environment and information. Constraints shape which behaviours stabilise and become more readily self-organised under pressure.</p>
      </div>

      <div className="scienceQuote"><p>A constraint is worth a 1000 words.</p></div>
    </div>}



    {tab==='overlayEngine'&&<div className="diagnosticStagePanel overlayEnginePage">
      <h2>Overlay Architecture Engine</h2>
      <p>Base games stay unchanged. Overlays sit on top of them as developmental filters. The coach decides what the game should encourage for the players in front of them.</p>

      <div className="bernsteinBox">
        <h3>Coach-centred game design</h3>
        <p>The app does not prescribe one correct solution. It provides tools that allow coaches to design representative environments appropriate to the needs of their players.</p>
        <p><strong>Sequence matters:</strong> Overlay 2 only matters after Overlay 1. Overlay 3 only matters after Overlay 2.</p>
      </div>

      <div className="overlayBaseSelector"><label>Base Game<select value={overlayBaseGame} onChange={e=>setOverlayBaseGame(e.target.value)}>{baseGameOptions.map(game=><option key={game} value={game}>{game}</option>)}</select></label></div>

      <div className="overlayStackGrid">{[1,2,3].map(n=>{
        const overlayValue=n===1?overlay1:n===2?overlay2:overlay3;
        const consequenceValue=n===1?consequence1:n===2?consequence2:consequence3;
        const setOverlay=n===1?setOverlay1:n===2?setOverlay2:setOverlay3;
        const setConsequence=n===1?setConsequence1:n===2?setConsequence2:setConsequence3;
        const current=findOverlay(overlayValue);
        return <div className="overlayStackCard" key={n}>
          <span className="overlayNumber">Overlay {n}</span>
          <label>Requirement<select value={overlayValue} onChange={e=>setOverlay(e.target.value)}>{overlayOptions.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
          <label>Consequence<select value={consequenceValue} onChange={e=>setConsequence(e.target.value)}>{consequenceOptions.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <div className="overlayMiniPreview"><strong>{current.category}</strong><p>{current.description}</p><em>{current.cue}</em></div>
        </div>;
      })}</div>

      <div className="overlayPreviewCard">
        <h3>Generated Overlay Stack</h3>
        <p><strong>Base Game:</strong> {overlayBaseGame}</p>
        <ol>{selectedOverlays.map(item=><li key={item.level}><strong>Overlay {item.level}: {item.overlay.name}</strong><span>{item.overlay.description}</span><b>Consequence: {item.consequence.text}</b></li>)}</ol>
      </div>

      <div className="overlayOutputGrid">
        <div className="overlayOutputCard"><h3>Tactical Emphasis</h3><p>{selectedOverlays.filter(x=>x.overlay.category.includes('Tactical')||x.overlay.category.includes('Decision')).map(x=>x.overlay.name).join(' · ')||'Coach-selected tactical emphasis appears here.'}</p></div>
        <div className="overlayOutputCard"><h3>Perception / Affordance</h3><p>{selectedOverlays.filter(x=>x.overlay.category.includes('Perceptual')||x.overlay.id==='unsetT'||x.overlay.id==='stillMoving'||x.overlay.id==='offT').map(x=>x.overlay.behaviour).join(' · ')||'Overlay stack can train information pickup and affordance recognition.'}</p></div>
        <div className="overlayOutputCard"><h3>Movement Coupling</h3><p>{selectedOverlays.filter(x=>x.overlay.category.includes('Movement')).map(x=>x.overlay.behaviour).join(' · ')||'Add recovery, balance or movement overlays if needed.'}</p></div>
        <div className="overlayOutputCard"><h3>Pressure / Consequence</h3><p>{selectedOverlays.map(x=>x.consequence.label).join(' → ')}</p></div>
      </div>

      <div className="infoBox"><strong>Example ATL Use</strong><p>Base game: ATL. Overlay 1: Opponent Not Set In T. Consequence: Unlock scoring. Overlay 2: Finish Window. Consequence: Finish within 3 shots. Overlay 3: Recover Before Score Unlock. Consequence: +2 bonus.</p><p>This keeps ATL intact while making the attack below the line dependent on perception of opponent state.</p></div>
    </div>}


    {tab==='builder'&&<div className="diagnosticStagePanel">
      <h2>Intervention Builder</h2>
      <p>Select the observable issue. The app then frames it through PDA, the four lenses and practical interventions.</p>
      <div className="quickLayers">{Object.keys(cases).map(name=><button type="button" key={name} className={activeCase===name?'activeLayer':''} onClick={()=>setActiveCase(name)}>{name}</button>)}</div>
      <div className="claComparisonCard">
        <h3>{activeCase}</h3>
        <section><strong>PDA Check</strong><p>{current.pda}</p></section>
        <section><strong>Primary Lens</strong><p>{current.lens}</p></section>
        <section><strong>Possible Causes</strong><ul>{current.causes.map(c=><li key={c}>{c}</li>)}</ul></section>
        <section><strong>Coach Question</strong><p>{current.coachQuestion}</p></section>
        {current.advantage&&<section><strong>Advantage Indicators</strong><ul>{current.advantage.map(a=><li key={a}>{a}</li>)}</ul><InfoButton id="hick" label="More Info: Reduce Options"/></section>}
        {current.why&&<section><strong>Why It Works</strong><p>{current.why}</p></section>}
        <section><strong>Expected Behaviour Change</strong><p>{current.expected}</p></section>
      </div>
      <div className="interventionToolGrid">
        <div className="interventionToolCard"><h3>Constraint</h3><p>{current.constraint}</p></div>
        <div className="interventionToolCard"><h3>Checkerboard</h3><p>{current.checkerboard}</p></div>
        <div className="interventionToolCard"><h3>Conditioned Game</h3><p>{current.conditioned}</p></div>
        <div className="interventionToolCard"><h3>Technical Overlay</h3><p>{current.technical}</p></div>
        <div className="interventionToolCard"><h3>Mental Overlay</h3><p>{current.mental}</p></div>
        <div className="interventionToolCard"><h3>Animal Pairing</h3><p>{current.animal}</p></div>
        <div className="interventionToolCard"><h3>PPP Recommendation</h3><p>{current.ppp}</p></div>
      </div>
    </div>}

    {tab==='principles'&&<div className="diagnosticStagePanel">
      <h2>Checkerboard Coaching Principles</h2>
      <div className="stageHintGrid">
        <div><strong>Game-Based First</strong><span>Learning has taken place when the behaviour appears in open rally or game situations.</span></div>
          <section className="shotsTimePanel">
            <div className="shotsTimeHeader">
              <span className="timeBadge take">🟢 TIME TAKER</span>
              <span className="timeBadge give">🔴 TIME GIVER</span>
            </div>
            <h3>Time Givers vs Time Takers</h3>
            <p><strong>Core question:</strong> Did this action give the opponent time or take time away?</p>
            <div className="shotsTimeGrid">
              <div>
                <h4>Time Takers</h4>
                <ul>
                  <li>Penetrating drive</li>
                  <li>Volley return of serve</li>
                  <li>Early intercept</li>
                  <li>Effective working length</li>
                </ul>
              </div>
              <div>
                <h4>Time Givers</h4>
                <ul>
                  <li>Non-functional crosscourt</li>
                  <li>Letting volley opportunities pass</li>
                  <li>Floating length</li>
                  <li>Late preparation or unnecessary retreat</li>
                </ul>
              </div>
            </div>
            <p className="shotsCallout">Coach lens: don't only ask if the shot looked good. Ask whether it changed the opponent's available time.</p>
          </section>


        <div><strong>Intention Not Action</strong><span>Describe the purpose, ball outcome and tactical effect before body mechanics.</span></div>
        <div><strong>External Focus</strong><span>Use target, space, opponent information and trajectory before body-part cues.</span><InfoButton id="wulf"/></div>
      </div>
      <div className="stageHintGrid">
        <div><strong>Descriptive Feedback</strong><span>Tell the player what happened before prescribing what to do.</span></div>
        <div><strong>Bandwidth Feedback</strong><span>Do not correct every error. Let players search and self-detect.</span></div>
        <div><strong>Agency Before Dependency</strong><span>The coach helps the player become less dependent on correction and more able to solve problems.</span></div>
      </div>
      <div className="infoBox"><strong>Quiet Eye Link</strong><p>Visual attention is a trainable performance behaviour. Use Quiet Eye, Tracking and Second Eye overlays when attention is the limiting factor.</p><InfoButton id="vickers" label="More Info: Quiet Eye"/></div>
    </div>}
  </div>;
}








function OverlayBuilderStandalone({setScreen,setSession}){
  const baseTemplates={
    'ATL / BTL':{category:'ATL / BTL',title:'ATL / BTL Game Logic Card',base:'Play the ATL / BTL base game exactly as configured by the coach.'},
    'Checkerboard':{category:'Checkerboard',title:'Checkerboard Game Logic Card',base:'Play the selected Checkerboard challenge exactly as set. Completion constraints, banking, levels and pair/triple logic remain unchanged.'},
    'Classic Conditioned':{category:'Classic Conditioned',title:'Classic Conditioned Game Logic Card',base:'Play the selected conditioned game exactly as configured.'},
    'Volley & Intercept':{category:'Volley & Intercept',title:'Volley & Intercept Game Logic Card',base:'Play the selected volley/intercept game exactly as configured.'},
    'Pressure':{category:'Pressure',title:'Pressure Game Logic Card',base:'Play the selected pressure game exactly as configured.'},
    'Technical':{category:'Technical',title:'Technical Game Logic Card',base:'Play the selected technical game exactly as configured.'},
    'Double Bounce':{category:'Double Bounce',title:'Double Bounce Game Logic Card',base:'Play the selected double-bounce game exactly as configured.'},
    'Custom':{category:'Custom',title:'Custom Game Logic Card',base:'Play the coach-defined base game exactly as explained.'}
  };
  const triggers=[
    ['oppNotSetT','Opponent not set in T','opponent is not set in the T'],['oppOffT','Opponent off T','opponent is off the T'],['oppStillMoving','Opponent still moving','opponent is still moving'],['oppMovingForward','Opponent moving forward','opponent is still moving forward'],['oppOffBalance','Opponent off balance','opponent is off balance'],['weakSideExposed','Weak side exposed','weak/open side is exposed'],['oppositeBodyLine','Opposite body line exposed','opponent is on the wrong side of your body line'],['reduceOptions','Reduce options first','you have reduced opponent options'],['widthAchieved','Width achieved','you have created width'],['completePair','Complete Checkerboard pair','you have completed the Checkerboard pair'],['completeTriple','Complete Checkerboard triple','you have completed the Checkerboard triple'],['volleyOpportunity','Volley opportunity appears','a volley opportunity appears'],['attackableBall','Attackable ball appears','the ball is attackable']
  ].map(([id,name,player])=>({id,name,player,text:player}));
  const actions=[['none','No required action','Choose the best solution.'],['btl','BTL attack','Attack below the line.'],['atl','ATL attack','Attack above the line.'],['volley','Volley next opportunity','Volley the next available ball.'],['oppositeSide','Attack opposite side','Attack the opposite side.'],['straightDrive','Straight drive','Play straight.'],['boast','Boast / angle','Use the boast or angle.'],['finish2','Finish within 2 shots','Win within 2 shots.'],['finish3','Finish within 3 shots','Win within 3 shots.'],['finish4','Finish within 4 shots','Win within 4 shots.']].map(([id,name,player])=>({id,name,player,text:player}));
  const consequences=[['plus1','+1','Earn +1 if successful.'],['plus2','+2','Earn +2 if successful.'],['plus3','+3','Earn +3 if successful.'],['plus4','+4','Earn +4 if successful.'],['rallyLost','Rally lost','If you break the constraint, you lose the rally.'],['reset','Challenge resets','If you miss the constraint, the challenge resets.'],['bonusLost','Bonus lost','If you miss the constraint, the bonus is gone.'],['coachConfirms','Coach confirms','Coach confirms whether the point counts.'],['coachAwards','Coach awards bonus','Coach awards the bonus.']].map(([id,name,player])=>({id,name,player,text:player}));
  const quality=[['cleanWinner','Clean winner +2','Clean winner earns +2 extra.'],['recoverBeforeContact','Recover before opponent contact +1','Recover before opponent contact earns +1 extra.'],['volleyWinner','Volley winner +2','Volley winner earns +2 extra.'],['balancedFinish','Balanced finish +1','Balanced finish earns +1 extra.'],['correctTarget','Correct target +1','Correct target earns +1 extra.']].map(([id,name,player])=>({id,name,player,text:player}));
  const [base,setBase]=useState('ATL / BTL');
  const [title,setTitle]=useState(baseTemplates['ATL / BTL'].title);
  const [baseRules,setBaseRules]=useState(baseTemplates['ATL / BTL'].base);
  const [baseScoring,setBaseScoring]=useState('Base game scoring remains unchanged. Game Logic adds only the selected extra consequence and quality modifiers.');
  const [selectedTriggers,setSelectedTriggers]=useState(['oppNotSetT']);
  const [newTrigger,setNewTrigger]=useState('reduceOptions');
  const [action,setAction]=useState('none');
  const [consequence,setConsequence]=useState('plus2');
  const [selectedQuality,setSelectedQuality]=useState([]);
  const [status,setStatus]=useState('');
  const T=id=>triggers.find(x=>x.id===id)||triggers[0]; const A=id=>actions.find(x=>x.id===id)||actions[0]; const C=id=>consequences.find(x=>x.id===id)||consequences[0]; const Q=id=>quality.find(x=>x.id===id);
  function changeBase(v){setBase(v);setTitle(baseTemplates[v].title);setBaseRules(baseTemplates[v].base);}
  function addTrigger(){if(selectedTriggers.length>=5){setStatus('Maximum of 5 triggers.');return;} if(!selectedTriggers.includes(newTrigger))setSelectedTriggers([...selectedTriggers,newTrigger]);}
  function removeTrigger(id){setSelectedTriggers(selectedTriggers.filter(x=>x!==id));}
  function toggleQuality(id){setSelectedQuality(selectedQuality.includes(id)?selectedQuality.filter(x=>x!==id):[...selectedQuality,id]);}
  const activeTriggers=selectedTriggers.map(T); const activeQuality=selectedQuality.map(Q).filter(Boolean); const selectedAction=A(action); const selectedConsequence=C(consequence);
  const coachView=[activeTriggers.length?'Triggers: '+activeTriggers.map(t=>t.name).join(' AND '):'No trigger stack selected', action==='none'?'Required Action: none — player self-organises':'Required Action: '+selectedAction.name, 'Consequence: '+selectedConsequence.name, activeQuality.length?'Quality Modifiers: '+activeQuality.map(q=>q.name).join(' · '):'No quality modifiers'].join('. ');
  const playerRules=[baseTemplates[base].base, activeTriggers.length?'Extra condition applies when '+activeTriggers.map(t=>t.player).join(' AND ')+'.':'', selectedAction.player, selectedConsequence.player, ...activeQuality.map(q=>q.player)].filter(Boolean);
  const builtGame={id:Date.now(),title,category:baseTemplates[base].category,duration:15,task:baseRules+' Game Logic: '+coachView,scoring:baseScoring+' Added consequence: '+selectedConsequence.player+(activeQuality.length?' Quality modifiers: '+activeQuality.map(q=>q.player).join(' '):''),rationale:'Game Logic layer augments the base game without changing its configuration.',coach:'Base game protected. '+coachView,layers:['Game Logic Builder',base,...activeTriggers.map(t=>t.name),...(action!=='none'?[selectedAction.name]:[]),selectedConsequence.name,...activeQuality.map(q=>q.name)],playerView:playerRules.join(' ')};
  function addToSession(){if(!setSession){setStatus('Session connection not available.');return;} setSession(prev=>[...prev,{...builtGame,id:Date.now()+Math.random()}]); setStatus('Game Logic card added to session.');}
  return <div className="page gameLogicBuilderPage">
    <div className="pageTop"><div><h1>Game Logic Builder</h1><p className="mutedText">Base game protected · trigger stack · optional action · consequence · quality modifiers</p></div><button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button></div>
    <div className="overlayPhilosophyBox"><strong>Base game protected</strong><p>This augments the game. It does not change any base game configuration, scoring system, completion constraint, banking rule, level progression, selected shot rule, side rule, timing rule or window rule unless the coach edits the base game itself.</p></div>
    <div className="overlayBuilderCard"><h2>1. Base Game</h2><label>Game Type<select value={base} onChange={e=>changeBase(e.target.value)}>{Object.keys(baseTemplates).map(g=><option key={g}>{g}</option>)}</select></label><label>Title<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Base Rules<textarea value={baseRules} onChange={e=>setBaseRules(e.target.value)}/></label><label>Base Scoring<textarea value={baseScoring} onChange={e=>setBaseScoring(e.target.value)}/></label></div>
    <div className="overlayBuilderCard"><h2>2. Trigger Stack</h2><p className="mutedText">Add up to 5 triggers. AND logic: all selected triggers must be satisfied.</p><div className="triggerAddRow"><select value={newTrigger} onChange={e=>setNewTrigger(e.target.value)}>{triggers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><button className="primaryBtn" onClick={addTrigger}>+ Add Trigger</button></div><div className="triggerStackList">{activeTriggers.map(t=><div className="triggerStackItem" key={t.id}><strong>{t.name}</strong><span>{t.text}</span><button className="secondaryBtn" onClick={()=>removeTrigger(t.id)}>Remove</button></div>)}</div></div>
    <div className="overlayBuilderCard"><h2>3. Required Action</h2><p className="mutedText">Default is no required action. Use only for a directed solution.</p><label>Required Action<select value={action} onChange={e=>setAction(e.target.value)}>{actions.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><div className="logicExplainBox"><strong>{selectedAction.name}</strong><p>{selectedAction.text}</p></div></div>
    <div className="overlayBuilderCard"><h2>4. Consequence</h2><label>Main Consequence<select value={consequence} onChange={e=>setConsequence(e.target.value)}>{consequences.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="logicExplainBox"><strong>{selectedConsequence.name}</strong><p>{selectedConsequence.text}</p></div></div>
    <div className="overlayBuilderCard"><h2>5. Quality Modifiers</h2><p className="mutedText">Optional execution bonuses. Stackable.</p><div className="qualityGrid">{quality.map(q=><button type="button" key={q.id} className={selectedQuality.includes(q.id)?'activeQualityBtn':''} onClick={()=>toggleQuality(q.id)}>{selectedQuality.includes(q.id)?'✓ ':'+ '}{q.name}</button>)}</div></div>
    <div className="generatedOverlayCard"><h2>6. Generated Output</h2><div className="dualViewGrid"><div className="overlayCoachOutput"><strong>Coach View</strong><p>{coachView}</p></div><div className="overlayCoachOutput playerViewCard"><strong>Player View</strong><ol>{playerRules.map((r,i)=><li key={i}>{r}</li>)}</ol></div></div><div className="buttonRow"><button className="primaryBtn" onClick={addToSession}>Add Complete Game Card To Session</button><button className="secondaryBtn" onClick={()=>setStatus('')}>Clear Status</button></div>{status&&<div className="statusBox">{status}</div>}</div>
  </div>;
}


function App(){
const[screen,setScreen]=useState('home');
const[backStack,setBackStack]=useState([]);
function go(next){
  if(!next||next===screen) return;
  setBackStack(prev=>[...prev,screen].slice(-30));
  setScreen(next);
}
function goBack(){
  setBackStack(prev=>{
    const last=prev.length?prev[prev.length-1]:'home';
    setScreen(last);
    return prev.slice(0,-1);
  });
}
const[players,setPlayers]=useState(()=>{try{return JSON.parse(localStorage.getItem(PLAYER_KEY))||[]}catch{return[]}});
const[session,setSession]=useState(()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY))||[]}catch{return[]}});
const[lastInvasionFormat,setLastInvasionFormat]=useState(()=>{
  try{
    const direct=localStorage.getItem('checkerboardInvasionFormat');
    if(direct==='points'||direct==='lives') return direct;
    const saved=JSON.parse(localStorage.getItem('checkerboardCompetitionProjection')||'{}');
    if(saved.invasionFormat==='points'||saved.invasionFormat==='lives') return saved.invasionFormat;
  }catch{}
  return 'lives';
});
useEffect(()=>{localStorage.setItem(PLAYER_KEY,JSON.stringify(players));},[players]);
useEffect(()=>{localStorage.setItem(SESSION_KEY,JSON.stringify(session));},[session]);
useEffect(()=>{try{localStorage.setItem('checkerboardInvasionFormat',lastInvasionFormat);}catch{}},[lastInvasionFormat]);
return <div>
<header className="hero">
  <div className="heroNav">
    <button className="homeBtn navBackBtn" onClick={goBack}>BACK</button>
    <button className="homeBtn" onClick={()=>go('home')}>HOME</button>
    <button className="homeBtn navProjectBtn" onClick={()=>go('projection')}>PROJECT</button>
    <button className="homeBtn navCompBtn" onClick={()=>go('competition')}>COMPETITION</button>
  </div>
  <div><div className="eyebrow">CHECKERBOARD COACH</div><h1>Checkerboard Squash™ v100h47</h1><p>Sessions · Games · Players · Competition</p></div>
</header>
<main className="container">
{screen==='home'&&<Home setScreen={go}/>}
      {screen==='rld'&&<RLDScreen setScreen={go}/>}
      {screen==='pressure'&&<PressureModule setScreen={go}/>}
{screen==='sessions'&&<Sessions session={session} setSession={setSession} setScreen={go}/>}
{screen==='tools'&&<ToolsArchitecture setScreen={go}/>}
      {screen==='diagnosticIntervention'&&<DiagnosticIntervention setScreen={go}/>}
      {screen==='diagnostic'&&<DiagnosticTemplate setScreen={go}/>} 
      {screen==='rotational'&&<RotationalAffordanceGames setScreen={go}/>} 
      {screen==='live'&&<LiveSessionDelivery session={session} setScreen={go}/>} 
      {screen==='projection'&&<ProjectionView session={session} setScreen={go} players={players}/>}
      {screen==='level0'&&<Level0Foundations setScreen={go} setSession={setSession}/>}
      {screen==='games'&&<Games setSession={setSession} setScreen={go}/>} 
      {screen==='gamesLibrary'&&<GamesLibrary setSession={setSession} setScreen={go}/>}
      {screen==='plugPlay'&&<PlugAndPlay setScreen={go} setSession={setSession}/>}
      {screen==='constraints'&&<GameConstraintsEngine setScreen={go} setSession={setSession}/>}
      {screen==='shots'&&<ShotsModule setScreen={go}/>}
{screen==='players'&&<PlayerHub players={players} setPlayers={setPlayers} session={session} setSession={setSession}/>}{screen==='technical'&&<UniversalOverlays setScreen={go}/>} {screen==='doubleBounce'&&<DoubleBounceTool setScreen={go}/>} {screen==='mentalSkills'&&<MentalSkillsPlaceholder setScreen={go}/>} 
{screen==='competition'&&<Competition players={players} initialInvasionFormat={lastInvasionFormat} onInvasionFormatChange={setLastInvasionFormat}/>} {screen==='storage'&&<Storage players={players} setPlayers={setPlayers} session={session} setSession={setSession}/>}
</main>

<footer className="checkerboardFooter">
  <div>© Henry Gillanders 2026 · Checkerboard Squash™</div>
  <div>MA Psychology · MSc Sport Psychology · WSF Level 3</div>
</footer>

</div>;
}

createRoot(document.getElementById('root')).render(<App/>);


/* LEVEL 0 PLACEHOLDER ROUTE
Add navigation tab:
LEVEL 0

Add route:
tab==='LEVEL 0'&&<Level0Exploration/>
*/
