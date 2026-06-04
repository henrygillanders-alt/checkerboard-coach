
import React,{useEffect,useMemo,useState}from'react';
import{createRoot}from'react-dom/client';
import'./styles.css';

const APP_VERSION='v100h24';
const TEAM_NAMING_STANDARD="Max's Team"; // universal setup/projection naming standard
const UNIVERSAL_DB_OPTIONS=['No DB','1 DB','2 DB','3 DB','4 DB','5 DB','Unlimited DB'];
const INVASION_UI_STATE_KEY='checkerboardInvasionUiState';

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

function ProjectionView({session,setScreen}){
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
  },[initialInvasionFormat,onInvasionFormatChange]);

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
  const shotFamilies=[
    {name:'Lobs',what:'A high recovering or pressuring ball that changes time and height.',when:'When under pressure, when opponent crowds the T, or when height can move the opponent away from the middle.',where:'Front-wall height above the service line, dying into back-court space where possible.',how:'Use constraints that reward height, depth, delay and recovery rather than asking for a perfect swing shape.'},
    {name:'Penetrating Drives',what:'A flatter driving ball that travels through the court quickly.',when:'When space is available behind the opponent or when the player can take time away.',where:'Length target lanes, back-court floor zones and side-wall depth windows.',how:'Shape the task around ball speed, line, depth and opponent displacement.'},
    {name:'Working Length',what:'A rally-building length that contains, probes and holds court position.',when:'When the player needs stability, pressure without over-risk, or a platform before attacking.',where:'Consistent back-court landing zones with enough height to recover and organise.',how:'Use quality-length-before-attack constraints and reward repeatable tactical effect.'},
    {name:'Volleys',what:'Early interception to reduce opponent time and protect the T.',when:'When the ball presents above reachable height, when opponent is recovering, or when central control is available.',where:'Volley to depth, straight containment, cross-court change, or short finish depending on information.',how:'Use intercept gates, T-zone rules and external cues such as “take time away”.'},
    {name:'Drops',what:'A short attacking or pressure-changing ball that must die quickly.',when:'When opponent is deep, late, off balance, or expecting length.',where:'Front-court floor zones with clear height and dying-ball targets.',how:'Use dying-ball, second-bounce and opponent-start-position constraints rather than fixed hand-position coaching.'}
  ];
  const principles=[
    ['Use of constraints','Change task, space, scoring, bounce rules, targets or opponent behaviour to invite the desired shot solution.'],
    ['Reduce verbal correction','Coach with short task instructions and observable outcomes; avoid repeated technical fixing.'],
    ['External focus first','Direct attention to ball flight, target, opponent movement, time, space and tactical effect.'],
    ['Body parts only if necessary','Use body-part cues only as a temporary bridge; finish with an external-focus cue.'],
    ['Variability not fixed repetition','Vary feed, position, pace, target and opponent pressure so the shot adapts to context.'],
    ['Use analogies','Use simple images such as “send the ball upstairs”, “make it die”, “take time away”.'],
    ['Use video','Show tactical effect, opponent movement and ball outcome rather than only racket mechanics.'],
    ['Self-discovery','Let the player search for workable solutions before the coach gives an answer.']
  ];
  const builderCards=[
    {title:'Shot Page Structure',text:'Each shot should be built around WSF What · When · Where · How, with CLA principles underneath.'},
    {title:'Coaching Position',text:'The module should challenge technique-perfection coaching and frame technique as functional adaptation.'},
    {title:'App Integration',text:'Shots starts as a Home tile and can later connect to Games Library, Session Builder and Diagnostic interventions.'}
  ];
  return <div className="page shotsPage">
    <div className="pageTop"><div><h1>Shots</h1><p className="mutedText">CLA shot development · What · When · Where · How</p></div><button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button></div>
    <div className="libraryStageIntro shotsIntro"><h2>Developing shot types without chasing technical perfection</h2><p>Shots are developed as adaptable solutions to game problems. The coach designs constraints that help players discover how ball shape, height, pace, line, timing and opponent information create tactical effect.</p></div>
    <h2>CLA Principles For Coaching Technique</h2>
    <div className="shotsPrincipleGrid">{principles.map(([title,text])=><div className="gameCard shotsPrincipleCard" key={title}><h3>{title}</h3><p>{text}</p></div>)}</div>
    <h2>WSF What · When · Where · How Shot Families</h2>
    <div className="shotsFamilyGrid">{shotFamilies.map(shot=><div className="gameCard shotFamilyCard" key={shot.name}><div className="categoryTag">Shot Type</div><h2>{shot.name}</h2><div className="shotQuad"><div><strong>What</strong><p>{shot.what}</p></div><div><strong>When</strong><p>{shot.when}</p></div><div><strong>Where</strong><p>{shot.where}</p></div><div><strong>How</strong><p>{shot.how}</p></div></div></div>)}</div>
    <h2>Builder Notes</h2>
    <div className="shotsBuilderGrid">{builderCards.map(card=><div className="statusBox" key={card.title}><strong>{card.title}</strong><p>{card.text}</p></div>)}</div>
  </div>;
}


function PlugAndPlay({setScreen,setSession}){
  const [active,setActive]=useState('Pressure');
  const outcomes=['Pressure','Length','Volleys','Movement','T-Zone','Double Bounce'];
  const games=[
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
  const filtered=games.filter(g=>g.tags.includes(active));
  function loadGame(game){
    const card={
      title:game.title,
      category:'Plug & Play',
      task:`${game.type} · ${game.players} · ${game.level}`,
      rationale:game.why,
      coach:game.coach,
      playerFocus:game.player,
      scoring:game.score,
      whatToDo:game.what,
      antiGaming:'Keep the constraint tied to the learning purpose. Remove or reduce it if players start exploiting it.',
      suggestedOverlays:game.tags.filter(t=>['Pressure','Length','Volleys','T-Zone','Double Bounce','Movement'].includes(t))
    };
    if(typeof setSession==='function') setSession(prev=>[...(prev||[]),card]);
  }
  return <div className="page plugPlayPage">
    <div className="pageTop"><div><h1>Plug & Play</h1><p className="mutedText">Select an outcome. Run a proven game.</p></div><button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button></div>
    <div className="libraryStageIntro plugPlayIntro"><h2>Coach View: What do you want to improve today?</h2><p>Plug & Play organises games by coaching outcome rather than by game type. A game can appear in several categories because the same constraint can solve several coaching problems.</p></div>
    <div className="universalFamilyTabs plugPlayTabs">{outcomes.map(o=><button key={o} className={active===o?'activeFamilyTab':''} onClick={()=>setActive(o)}>{o}</button>)}</div>
    <div className="plugPlayOutcomeBar"><strong>{active}</strong><span>{filtered.length} ready-to-run games</span></div>
    <div className="plugPlayGrid">{filtered.map(game=><div className="gameCard plugPlayCard" key={game.id}>
      <div className="plugPlayCardTop"><span className="categoryTag">{game.id} · {game.type}</span><span className="plugLevel">{game.level}</span></div>
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
  </div>;
}


function GameConditionsEngine({setScreen,setSession,onAddToSession,embedded=false,initialBaseGame='ATL / BTL',onClose}){
  const [family,setFamily]=useState('Tactical Conditions');
  const [selected,setSelected]=useState({});
  const [status,setStatus]=useState('');
  const [baseGame,setBaseGame]=useState(initialBaseGame||'ATL / BTL');
  const [appliesTo,setAppliesTo]=useState('Whole game');
  const [consequence,setConsequence]=useState('No Bonus');
  const [customCode,setCustomCode]=useState('[5-4]');
  const baseGames=['ATL / BTL','Checkerboard','Matchplay','Invasion','Pressure','Double Bounce','Plug & Play'];
  const applicationOptions=['Whole game','Selected player','Stronger player','Selected team','Both players'];
  const consequenceOptions=['No Bonus','Opponent +1','Lose Rally','Warning Then Penalty','Bonus +1','Bonus +2'];
  const conditionFamilies={
    'Tactical Conditions':[
      {id:'TC01',title:'Opponent Off T',type:'Required / Bonus',develops:'Opportunity recognition',rule:'Attack, score or gain bonus only when the opponent is visibly off the T at striker contact.',rationale:'Encourages players to attack genuine advantage rather than attacking by habit.',best:'ATL/BTL · Matchplay · Plug & Play · Pressure'},
      {id:'TC02',title:'Quality Length Before Attack',type:'Required',develops:'Pressure before attack',rule:'Player must create a quality length before attacking short or going BTL.',rationale:'Builds rally construction and reduces premature attacking.',best:'ATL/BTL · Length games · Pressure games'},
      {id:'TC03',title:'Checkerboard Gate',type:'Required',develops:'Tactical preparation',rule:'Complete a selected Checkerboard challenge before the attack is valid. Example: complete [5-4] before BTL.',rationale:'Links attack to a clear tactical affordance gate using the app language.',best:'ATL/BTL · Checkerboard · Matchplay'},
      {id:'TC04',title:'Weak Side Access',type:'Required / Bonus',develops:'Targeting opponent weakness',rule:'Attack or bonus must use the nominated weak-side zone or route.',rationale:'Connects decision making to opponent-specific tactical information.',best:'Matchplay · Plug & Play · Pressure'},
      {id:'TC05',title:'First Volley Opportunity',type:'Tactical behaviour',develops:'Interception intent',rule:'If a realistic volley opportunity appears, player is rewarded for taking it.',rationale:'Encourages volley behaviour without forcing impossible volleys.',best:'Volley games · T-Zone · Anticipation'},
      {id:'TC06',title:'4 Shot Conversion Window',type:'Conversion',develops:'Opportunity conversion',rule:'Complete condition, then win within 4 shots.',rationale:'Turns recognition into a conversion challenge under time pressure.',best:'Checkerboard Level 4 · Pressure'},
      {id:'TC07',title:'2 Shot Conversion Window',type:'Conversion',develops:'Elite urgency',rule:'Complete condition, then win within 2 shots.',rationale:'Creates high-level urgency and punishes slow conversion.',best:'Checkerboard Level 5 · Performance'}
    ],
    'Behaviour Conditions':[
      {id:'BC01',title:'Racquet Above Wrist',type:'Technical',develops:'Ready shape',rule:'If racquet head drops below wrist in preparation, apply selected consequence.',rationale:'Establishes a useful preparation behaviour through the game rather than stopping for instruction.',best:'Group sessions · Volleys · Technical focus'},
      {id:'BC02',title:'Early Preparation',type:'Technical',develops:'Earlier organisation',rule:'Preparation must be visible before leaving the T or before the final approach step.',rationale:'Couples movement and preparation earlier under representative pressure.',best:'ATL/BTL · Checkerboard · Movement games'},
      {id:'BC03',title:'Non-Playing Arm Visible',type:'Technical',develops:'Body organisation',rule:'Non-playing arm must remain useful/visible during preparation and spacing.',rationale:'Constrains body shape without over-coaching swing mechanics.',best:'Drive games · Back-court games'},
      {id:'BC04',title:'Finish To Front Wall',type:'Technical',develops:'Target-directed swing',rule:'If follow-through wraps away from the front-wall target line, apply consequence.',rationale:'Uses an external target finish to reduce wrap-around habits.',best:'Forehand follow-through · Drives'},
      {id:'BC05',title:'Positive Body Language',type:'Mental',develops:'Reset behaviour',rule:'Negative reaction after error triggers warning or point consequence.',rationale:'Builds competitive stability in group sessions without long coach lectures.',best:'Competition · Matchplay · Junior groups'},
      {id:'BC06',title:'Move First',type:'Mental / Movement',develops:'Commitment to movement',rule:'Hesitation or stopping when ball is reachable triggers coach consequence.',rationale:'Builds a move-first mindset, especially with slow or doubtful movers.',best:'Double Bounce · Movement · Invasion'},
      {id:'BC07',title:'Commit To Decision',type:'Mental',develops:'Decisive action',rule:'Indecisive half-attack or pull-out triggers no bonus or opponent point.',rationale:'Encourages players to make and own decisions under pressure.',best:'Pressure · Deception · Matchplay'}
    ],
    'Handicap Conditions':[
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
      {id:'CE01',title:'No Bonus',type:'Soft consequence',develops:'Low-friction learning',rule:'Condition failure means no bonus awarded but rally continues.',rationale:'Good first step for learning without over-penalising.',best:'Junior beginner · New condition'},
      {id:'CE02',title:'Opponent +1',type:'Point consequence',develops:'Accountability',rule:'Condition failure gives opponent one point.',rationale:'Useful when behaviour is established but needs pressure.',best:'Groups · Behaviour conditions'},
      {id:'CE03',title:'Lose Rally',type:'Hard consequence',develops:'Strong behaviour shaping',rule:'Condition failure immediately loses rally.',rationale:'Use sparingly for clear behaviours that are already understood.',best:'Performance · Strong habit correction'},
      {id:'CE04',title:'Warning Then Penalty',type:'Progressive consequence',develops:'Fair behaviour change',rule:'First offence warning, second offence penalty.',rationale:'Good for mental/technical behaviours in groups.',best:'Junior groups · Behaviour conditions'},
      {id:'CE05',title:'Bonus +1 / +2',type:'Reward consequence',develops:'Positive shaping',rule:'Condition success earns bonus.',rationale:'Encourages desired behaviour without making game feel punitive.',best:'Plug & Play · Tactical conditions'}
    ]
  };
  const families=Object.keys(conditionFamilies);
  const activeList=conditionFamilies[family]||[];
  function toggle(item){setStatus('');setSelected(prev=>({...prev,[item.id]:prev[item.id]?undefined:item}));}
  const picked=Object.values(selected).filter(Boolean);
  const selectedSummary=picked.length?picked.map(x=>`${x.title} (${x.type})`).join(' · '):'No conditions selected';
  function addToSession(){
    const title=`${baseGame} + Game Conditions`;
    const game={
      id:Date.now()+Math.random(),title,category:'Game Conditions',duration:10,
      task:`Base game: ${baseGame}. Apply to: ${appliesTo}. Checkerboard code / spatial code: ${customCode}.`,
      rationale:'Conditions keep the base game simple while shaping tactical decisions, behaviour standards or handicap restrictions.',
      whatToDo:picked.length?picked.map(x=>`${x.title}: ${x.rule}`).join(' '):'Select conditions, then apply them to a base game.',
      scoring:`Consequence: ${consequence}. Use only the minimum consequence needed to shape the behaviour.`,
      coach:'Choose the base game first, then add the minimum condition needed for the coaching problem.',
      playerFocus:'Understand the condition. Solve the rally problem inside it.',
      suggestedOverlays:picked.map(x=>x.title),layers:['Game Conditions'],cbCode:customCode,conditions:picked,applyTo:appliesTo,consequence
    };
    if(typeof onAddToSession==='function'){onAddToSession(game);setStatus('Game Conditions card added to session.');return;}
    if(typeof setSession==='function'){setSession(prev=>[...(prev||[]),game]);setStatus('Game Conditions card added to session.');return;}
    setStatus('Session connection not available.');
  }
  return <div className="page gameConditionsPage">
    {!embedded&&<div className="pageTop"><div><h1>Game Conditions</h1><p className="mutedText">Base game first. Then tactical, behaviour and handicap conditions with clear rationale.</p></div><button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button></div>}
    {embedded&&<div className="conditionsEmbeddedTop"><div><h2>Game Conditions</h2><p className="mutedText">Add tactical, behaviour or handicap conditions to this base game without leaving the page.</p></div><button className="secondaryBtn" onClick={onClose}>Close Conditions</button></div>}
    <div className="conditionsIntro"><h2>v100h10 Embedded Conditions Workflow</h2><p>Stop separating overlays, game logic and special rules. Choose the base game, add a small number of conditions, then choose the consequence.</p><p><strong>Decision test:</strong> tactical decision, behaviour standard or handicap restriction?</p></div>
    <div className="conditionBuilderPanel">
      <div><label>Base Game</label><select value={baseGame} onChange={e=>setBaseGame(e.target.value)}>{baseGames.map(x=><option key={x}>{x}</option>)}</select></div>
      <div><label>Apply To</label><select value={appliesTo} onChange={e=>setAppliesTo(e.target.value)}>{applicationOptions.map(x=><option key={x}>{x}</option>)}</select></div>
      <div><label>Consequence</label><select value={consequence} onChange={e=>setConsequence(e.target.value)}>{consequenceOptions.map(x=><option key={x}>{x}</option>)}</select></div>
      <div><label>CB Code / Spatial Code</label><input value={customCode} onChange={e=>setCustomCode(e.target.value)} placeholder="[5-4] or [5]+[7]"/></div>
    </div>
    <div className="conditionsExampleBox"><h2>Example</h2><p><strong>Base Game:</strong> ATL / BTL</p><p><strong>Tactical condition:</strong> Complete <strong>[5-4]</strong> before BTL.</p><p><strong>Handicap restriction:</strong> Stronger player allowed zones <strong>[5]+[7]</strong> only.</p><p><strong>Behaviour condition:</strong> Racquet above wrist. Consequence: {consequence}.</p></div>
    <div className="conditionsTabs">{families.map(f=><button key={f} className={family===f?'activeConditionTab':''} onClick={()=>setFamily(f)}>{f}</button>)}</div>
    <div className="conditionsLayout">
      <div className="conditionsGrid">{activeList.map(item=><button key={item.id} className={selected[item.id]?'conditionCard selectedConditionCard':'conditionCard'} onClick={()=>toggle(item)}>
        <span className="conditionCode">{item.id} · {item.type}</span><h2>{item.title}</h2><p><strong>Develops</strong><br/>{item.develops}</p><p><strong>Rule</strong><br/>{item.rule}</p><p><strong>Rationale</strong><br/>{item.rationale}</p><p><strong>Best used with</strong><br/>{item.best}</p>
      </button>)}</div>
      <aside className="activeConditionsPanel"><h2>Selected Conditions</h2><div className="activeConditionMeta"><p><strong>Base:</strong> {baseGame}</p><p><strong>Apply to:</strong> {appliesTo}</p><p><strong>Consequence:</strong> {consequence}</p><p><strong>CB / Spatial:</strong> {customCode}</p></div>{picked.length===0?<p>No conditions selected.</p>:picked.map(item=><div key={item.id} className="activeConditionItem"><strong>{item.title}</strong><span>{item.type}</span><p>{item.rule}</p></div>)}<button className="primaryBtn" onClick={addToSession}>Add Conditions Card To Session</button>{status&&<div className="statusBox">{status}</div>}<div className="playerViewMini"><h3>Player View Preview</h3><p><strong>WHAT TO DO</strong><br/>{baseGame} with selected conditions.</p><p><strong>HOW TO SCORE</strong><br/>{consequence}</p><p><strong>KEY FOCUS</strong><br/>{selectedSummary}</p></div></aside>
    </div>
  </div>;
}
function Home({setScreen}){
return <div className="homeGrid homeGridV99h52">
      <div className="homeBrandCard compactHomeBrand"><h1>Checkerboard Squash™</h1></div>

      <button className="tile green homeTitleOnly" onClick={()=>setScreen('players')}><h2>Players</h2></button>
      <button className="homeCard gamesLibraryHomeCard homeTitleOnly" onClick={()=>setScreen('gamesLibrary')}><h2>Games Library</h2></button>
      <button className="homeCard plugPlayHomeCard homeTitleOnly" onClick={()=>setScreen('plugPlay')}><h2>Plug & Play</h2></button>
      <button className="homeCard conditionsHomeCard homeTitleOnly" onClick={()=>setScreen('conditions')}><h2>Game Conditions</h2></button>

      <button className="homeCard shotsHomeCard homeTitleOnly" onClick={()=>setScreen('shots')}><h2>Shots</h2></button>
      <button className="tile red homeTitleOnly" onClick={()=>setScreen('competition')}><h2>Competition</h2></button>

      <button className="tile blue homeTitleOnly" onClick={()=>setScreen('sessions')}><h2>Sessions</h2></button>
      <button className="homeCard projectionHomeCard homeTitleOnly" onClick={()=>setScreen('projection')}><h2>Project</h2></button>

      <button className="homeCard diagnosticHomeCard homeTitleOnly" onClick={()=>setScreen('diagnosticIntervention')}><h2>Diagnostic & Intervention</h2></button>
      <button className="homeCard liveHomeCard homeTitleOnly" onClick={()=>setScreen('live')}><h2>Live</h2></button>

      
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
    {tab==='explore'&&<div><div className="libraryStageIntro"><h2>🔍 Explore</h2><p>Discovery, affordance exploration, movement confidence and simple representative tasks.</p></div><Level0Exploration/></div>}
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
{category&&<div className="conditionsAttachBar"><div><strong>Base game:</strong> {conditionsBaseGame}<br/><span className="mutedText">Design the base game, then add tactical, behaviour or handicap conditions from this same page.</span></div><button className="primaryBtn" onClick={()=>setShowConditions(v=>!v)}>{showConditions?'Hide Conditions':'Add Game Conditions'}</button></div>}
{showConditions&&category&&<GameConditionsEngine embedded initialBaseGame={conditionsBaseGame} onClose={()=>setShowConditions(false)} onAddToSession={addGame}/>} 
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
<div className="infoBox"><strong>Coach Focus</strong><p>{game.coach}</p></div><div className="infoBox"><strong>Player Focus</strong><p>{game.playerFocus||'Focus on the cue that unlocks the scoring condition.'}</p></div>
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
    <h2>Checkerboard Level Builder</h2>
    <p className="engineIntro">Level controls challenge type, T-zone prevention and conversion window automatically.</p>
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
    <div className="completionBox"><strong>Completion Constraints</strong><div className="quickLayers">{COMPLETION_CONSTRAINTS.map(item=><button key={item} className={(config.completionConstraints||[]).includes(item)?'activeLayer':''} onClick={()=>toggleCompletion(item)}>{(config.completionConstraints||[]).includes(item)?'✓ ':'+ '}{item}</button>)}</div></div>
    <div className="technicalScoringBox alwaysVisibleScoring"><strong>Universal Overlays</strong><OverlayFamilyTabs selectedOverlays={config.layers||[]} onToggle={toggleLayer} context="Checkerboard" /></div>
    
    {config.deliveryMode==='Blind'&&<div className="blindCardPanel">
      <strong>Blind Card Delivery</strong>
      <p>Two separate decks: one hidden checkerboard challenge deck and one hidden finish challenge deck.</p>

      <div className="blindDeckGrid">
        <div className="blindDeckBox">
          <h3>Blind Checkerboard Challenge Deck</h3>
          <div className="buttonRow">
            <button className="primaryBtn" onClick={generateBlindChallengeCard}>Generate Challenge Card</button>
            <button className="secondaryBtn" onClick={revealBlindChallengeCard}>Reveal My Challenge</button>
            <button className="secondaryBtn" onClick={acknowledgeBlindChallengeCard}>Acknowledge & Close</button>
          </div>
          <div className={config.blindChallengeFace==='revealed'?'blindCard revealedCard':'blindCard'}>
            {config.blindChallengeFace==='revealed'&&config.blindChallengeCard
              ? <div><span>My Checkerboard Challenge</span><strong>{config.blindChallengeCard}</strong></div>
              : <div><span>Hidden Checkerboard Card</span><strong>Tap Reveal</strong></div>}
          </div>
        </div>

        <div className="blindDeckBox">
          <h3>Blind Finish Challenge Deck</h3>
          <div className="buttonRow">
            <button className="primaryBtn" onClick={generateBlindFinishCard}>Generate Finish Card</button>
            <button className="secondaryBtn" onClick={revealBlindFinishCard}>Reveal My Finish</button>
            <button className="secondaryBtn" onClick={acknowledgeBlindFinishCard}>Acknowledge & Close</button>
          </div>
          <div className={config.blindFinishFace==='revealed'?'blindCard revealedCard':'blindCard'}>
            {config.blindFinishFace==='revealed'&&config.blindFinishCard
              ? <div><span>My Finish Challenge</span><strong>{config.blindFinishCard}</strong></div>
              : <div><span>Hidden Finish Card</span><strong>Tap Reveal</strong></div>}
          </div>
        </div>
      </div>
    </div>}

    <div className="gameCard previewCard"><div className="categoryTag">Checkerboard Preview</div><h2>{built.title}</h2><div className="infoBox"><strong>Task / Rules</strong><p>{built.task}</p></div><div className="infoBox"><strong>Scoring</strong><p>{built.scoring}</p></div><div className="infoBox"><strong>Rationale</strong><p>{built.rationale}</p></div><div className="infoBox"><strong>Coach Help</strong><p>{built.coach}</p></div><div className="chips">{built.layers.map(layer=><span className="badge" key={layer}>{layer}</span>)}</div><button className="primaryBtn" onClick={()=>onAddToSession(built)}>Add Checkerboard To Session</button></div>
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

function ATLBTLDirectBuilder({onAddToSession}){
  const savedAtlDraft=(()=>{try{const saved=localStorage.getItem(GAME_LIBRARY_ATL_DRAFT_KEY);return saved?JSON.parse(saved):null;}catch{return null;}})();
  const [atl,setAtl]=useState(savedAtlDraft?.atl||DEFAULT_ATL); const [side,setSide]=useState(savedAtlDraft?.side||'Right side'); const [useCustomCb,setUseCustomCb]=useState(!!savedAtlDraft?.useCustomCb); const [customCbZone,setCustomCbZone]=useState(savedAtlDraft?.customCbZone||'');
  const [manualLayers,setManualLayers]=useState(savedAtlDraft?.manualLayers||[]);
  const [atlHistory,setAtlHistory]=useState([]);

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
    <h2>ATL / BTL Full Structure Builder</h2>
    <div className="statusBox atlDraftSavedNote">ATL / BTL draft is saved automatically while you work.</div>

    <div className="atlOptionsGrid">
      <label>BTL Count<select value={atl.btlCount} onChange={e=>setAtlOption('btlCount',e.target.value)}>{ATL_LISTS.btlCount.map(option=><option key={option}>{option}</option>)}</select></label>
      
      <label>Consecutive<select value={atl.consecutive} onChange={e=>setAtlOption('consecutive',e.target.value)}>{ATL_LISTS.consecutive.map(option=><option key={option}>{option}</option>)}</select></label><label>Side<select value={side} onChange={e=>setSide(e.target.value)}><option>Right side</option><option>Left side</option><option>Both sides</option><option>Player choice</option></select></label>
      <label>Auto CB Zone / Sequence<input value={autoCbZone} readOnly /></label>
      <label>Custom Override<select value={useCustomCb?'Yes':'No'} onChange={e=>setUseCustomCb(e.target.value==='Yes')}><option>No</option><option>Yes</option></select></label>
      {useCustomCb&&<label>Custom CB Sequence<input value={customCbZone} onChange={e=>setCustomCbZone(e.target.value)} placeholder="[6-3] + [6-2]"/></label>}
      

      {atl.btlCount!=='0 BTL shots'&&<label>BTL Shot 1<select value={atl.shot1} onChange={e=>setAtlOption('shot1',e.target.value)}>{ATL_LISTS.shotChoice.map(option=><option key={option}>{option}</option>)}</select></label>}
      {atl.btlCount!=='0 BTL shots'&&<label>Shot 1 Method<select value={atl.method1} onChange={e=>setAtlOption('method1',e.target.value)}>{ATL_LISTS.method.map(option=><option key={option}>{option}</option>)}</select></label>}

      {(atl.btlCount==='2 BTL shots'||atl.btlCount==='3 BTL shots')&&<label>BTL Shot 2<select value={atl.shot2} onChange={e=>setAtlOption('shot2',e.target.value)}>{ATL_LISTS.shotChoice.map(option=><option key={option}>{option}</option>)}</select></label>}
      {(atl.btlCount==='2 BTL shots'||atl.btlCount==='3 BTL shots')&&<label>Shot 2 Method<select value={atl.method2} onChange={e=>setAtlOption('method2',e.target.value)}>{ATL_LISTS.method.map(option=><option key={option}>{option}</option>)}</select></label>}

      {atl.btlCount==='3 BTL shots'&&<label>BTL Shot 3<select value={atl.shot3} onChange={e=>setAtlOption('shot3',e.target.value)}>{ATL_LISTS.shotChoice.map(option=><option key={option}>{option}</option>)}</select></label>}
      {atl.btlCount==='3 BTL shots'&&<label>Shot 3 Method<select value={atl.method3} onChange={e=>setAtlOption('method3',e.target.value)}>{ATL_LISTS.method.map(option=><option key={option}>{option}</option>)}</select></label>}
    </div>

    <div className="infoBox"><strong>Side</strong><p>{side}</p></div><div className="infoBox"><strong>Effective CB Zone / Sequence</strong><p>{composedAtl.cbCode}</p></div><div className="infoBox"><strong>Task / Rules</strong><p>{composedAtl.task}</p></div>
    <div className="infoBox"><strong>Rationale</strong><p>{composedAtl.rationale}</p></div>
    <div className="infoBox"><strong>Coach Help</strong><p>{composedAtl.coach}</p></div>
    <div className="chips">{composedAtl.layers.map(layer=><span className="badge" key={layer}>{layer}</span>)}</div>

    <OverlayFamilyTabs selectedOverlays={manualLayers} onToggle={toggleManualLayer} context="ATL / BTL" />

    <div className="buttonRow">
      <button className="secondaryBtn" onClick={undoAtl} disabled={atlHistory.length===0}>Undo ATL Change</button>
      <button className="secondaryBtn" onClick={clearAtlOverlays}>Clear Overlays</button>
      <button className="secondaryBtn" onClick={resetAtlBuilder}>Reset ATL / BTL</button>
    </div>

    <button className="primaryBtn" onClick={()=>addGame(composedAtl)}>Add ATL / BTL To Session</button>
  </div>;
}





function ClassicConditionedBuilder({onAddToSession}){
  const [selectedProblem,setSelectedProblem]=useState(null);
  const [selectedGame,setSelectedGame]=useState(null);
  const [scoringChoices,setScoringChoices]=useState({});
  const [selectedOverlays,setSelectedOverlays]=useState({});

  const games=[
    {title:'Return to Sender',problem:'Opponent Awareness',shortRationale:'Discourages repeatedly hitting back to opponent position.',level:'Levels 2–5',task:'Players only receive bonus points if the winning shot is played away from the opponent recovery line/body-line rather than back towards the opponent.',rationale:'Develops perception of opponent positioning before target selection.',coach:'Reward recognition of opponent position rather than pure shot quality.',playerFocus:'Notice where the opponent is recovering and avoid sending the ball back into that space.',scoring:'Win rally = 1 · Win away from opponent recovery line = +3 · Clean winner = +2',antiGaming:'No bonus if the direction change is accidental or unclear.',suggestedOverlays:['Weak Side','Opponent Off T','Clean Winner']},
    {title:'Opposite Side Finish',problem:'Opponent Awareness',shortRationale:'Encourages players to finish away from opponent body-line and recovery direction.',level:'Levels 3–5',task:'Bonus applies when the finishing shot is played to the opposite side of the opponent’s body line or recovery direction.',rationale:'Links finishing choice to opponent orientation rather than a fixed target.',coach:'Use body-line and recovery direction as the reference, not simply left/right court side.',playerFocus:'Read the opponent’s recovery direction before choosing the finish.',scoring:'Win rally = 1 · Opposite side finish = +3 · Clean winner = +2',antiGaming:'If body-line reference is unclear, no bonus.',suggestedOverlays:['Weak Side','Opponent Off T','Clean Winner']},
    {title:'Server Above The Line',problem:'Neutralise vs Attack',shortRationale:'Develops recognition of neutralising versus attacking situations.',level:'Levels 2–5',task:'Server must strike above the line. Receiver may use double bounces initially to stabilise rallies and recognise when to neutralise versus when to attack.',rationale:'Helps players distinguish survival/neutral phases from genuine attacking opportunities.',coach:'Observe whether players attack from neutral positions or only after creating advantage.',playerFocus:'Recognise when you are under pressure versus when the rally has shifted in your favour.',scoring:'Win rally = 1 · Correct attack recognition = +3',antiGaming:'Do not reward random attacking from neutral or defensive positions.',suggestedOverlays:['Quality Length Before Attack','Double Bounce','Opponent Off T']},
    {title:'Length Before Attack',problem:'Neutralise vs Attack',shortRationale:'Prevents rushed attacking before pressure has been created.',level:'Levels 2–5',task:'Player must create length pressure before attacking short. Attack bonus opens only after the opponent is delayed, displaced or unable to recover normally.',rationale:'Encourages patient pressure construction rather than premature front-court attacks.',coach:'Watch whether the attack is invited by opponent state or forced without advantage.',playerFocus:'Build length pressure first, then attack when the opponent is delayed or displaced.',scoring:'Win rally = 1 · Win after length-created advantage = +3 · Clean winner = +2',antiGaming:'If a player hits short before any pressure is created, only the rally point is available.',suggestedOverlays:['Quality Length Before Attack','Opponent Off T','4-Shot Window','Clean Winner']},
    {title:'T-Zone Denial',problem:'T-Zone Games',shortRationale:'Rewards displacement before attack.',level:'Levels 2–5',task:'Bonus unlocks when the opponent is outside the marked T-zone before the finishing shot.',rationale:'Connects tactical pressure with recovery denial.',coach:'Use a clearly marked T-zone. Award only when the opponent is clearly outside it.',playerFocus:'Move opponent away from central recovery before attacking.',scoring:'Win rally = 1 · Opponent outside T-zone finish = +3 · Clean winner = +2',antiGaming:'Opponent cannot intentionally stop recovering to manipulate the condition.',suggestedOverlays:['Opponent Off T','4-Shot Window','Clean Winner']},
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
      <p className="engineIntro">Games where the server carries the condition. These are useful when the coach wants one player to train a specific tactical or technical behaviour while the receiver plays more freely.</p>
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
      <div className="infoBox"><strong>Anti-gaming</strong><p>{game.antiGaming}</p></div>

      <div className="technicalScoringBox alwaysVisibleScoring conditionedOverlayChooser">
        <strong>Universal Overlays</strong>
        <p className="overlayExplain">Use the same Technical / Tactical / Mental Performance overlay engine as Competition and ATL / BTL. Suggested overlays for this game: {(game.suggestedOverlays||[]).join(' · ')||'None'}.</p>
        <OverlayFamilyTabs selectedOverlays={selectedOverlays[overlayKey(game)]||[]} onToggle={layer=>toggleGameOverlay(game,layer)} context={game.title} />
      </div>
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

      <div className="technicalScoringBox alwaysVisibleScoring"><strong>Editable Scoring / Consequence</strong><p className="overlayExplain">Choose the consequence level. This keeps coach autonomy rather than prescribing one correct solution.</p>
        <label>Scoring protocol<select value={choice(card).name} onChange={e=>setScore(card,'name',e.target.value)}>{protocols.map(p=><option key={p[0]}>{p[0]}</option>)}</select></label>
        {choice(card).name==='Coach custom'&&<div className="customScoringGrid"><label>Custom scoring<textarea value={choice(card).customScore} onChange={e=>setScore(card,'customScore',e.target.value)} placeholder="Example: each transgression = +1 to opponent"/></label><label>Custom consequence<textarea value={choice(card).customConsequence} onChange={e=>setScore(card,'customConsequence',e.target.value)} placeholder="Example: rally continues but bonus is removed"/></label></div>}
        <div className="infoBox"><strong>Selected scoring</strong><p>{protocol(card).score}</p></div>
        <div className="infoBox"><strong>Selected consequence</strong><p>{protocol(card).consequence}</p></div>
      </div>

      <div className="technicalScoringBox alwaysVisibleScoring">
        <strong>Universal Overlays</strong>
        <OverlayFamilyTabs selectedOverlays={selectedOverlays[k(card)]||[]} onToggle={layer=>toggleTechnicalOverlay(card,layer)} context={`Technical Diagnostic · ${card.title}`} />
      </div>

      <button className="primaryBtn" onClick={()=>addDiagnostic(card)}>Add Diagnostic To Session</button>
    </div>)}
  </div>;
}

function Level0Exploration(){
  const pillars=[
    {title:'MOVE',text:'Balance, rhythm, agility and movement confidence.'},
    {title:'TRACK',text:'Ball pickup, timing and visual stability.'},
    {title:'STRIKE',text:'Different swing shapes and striking adaptability.'},
    {title:'SEND & RECEIVE',text:'Cooperative rallying and directional awareness.'},
    {title:'PLAY',text:'Exploratory games and creativity.'},
    {title:'MINI CHECKERBOARD',text:'Visual target awareness before formal notation.'}
  ];

  return <div className="gameCard">
    <div className="categoryTag">Level 0</div>
    <h2>Level 0 — Exploration Stage (5–9 yrs)</h2>

    <div className="diagnosticPrinciple">
      <strong>Level 0 Philosophy</strong>
      <p>This is not mini adult squash. Level 0 focuses on exploration, movement literacy, adaptability, creativity and representative play. Influenced by Athletic Skills Model, England Squash, Squash Canada, US Squash, observed Egyptian junior development and presented through a Constraints-Led Approach framework.</p>
    </div>

    <div className="infoBox">
      <strong>Core Principles</strong>
      <ul>
        <li>Exploration before optimisation</li>
        <li>Variability before precision</li>
        <li>Play before correction</li>
        <li>Movement literacy before tactical systems</li>
      </ul>
    </div>

    <div className="problemGrid">
      {pillars.map(pillar=><div className="problemBtn activeProblem" key={pillar.title}>
        <strong>{pillar.title}</strong>
        <span>{pillar.text}</span>
      </div>)}
    </div>

    <div className="technicalScoringBox alwaysVisibleScoring">
      <strong>Level 0 Coach Card Structure</strong>
      <p>Goal → Equipment → How to Play → Progress → Simplify → What to Observe</p>
    </div>
  </div>;
}


function ToolsArchitecture(){
  const toolGroups=[

    {
      title:'Counterbalance Tools',
      tools:[
        {
          name:'Side-Wall Ball Return Tool',
          type:'Environmental Feedback / Counterbalance Tool',
          purpose:'Prevent non-playing arm crossing the body on forehand and promote side-wall orientation. Player releases a squash ball from the non-playing hand at the end of follow-through so it hits the side wall behind them and rolls straight back to their feet.',
          levels:'Level 0–3',
          progression:'Static feed → hand feed → live rally feed → faded use'
        },
        {
          name:'Second Racquet Counterbalance Tool',
          type:'Spatial Constraint / External Focus',
          purpose:'Player holds a second racquet or object in the non-playing hand so it must stay away from the swing path, encouraging the arm to remain behind/outside the body line.',
          levels:'Level 0–3',
          progression:'Static swing → fed ball → rally constraint'
        }
      ]
    },
    {
      title:'Rhythm & Tempo Tools',
      tools:[
        {
          name:'Waltz Rhythm Tool',
          type:'Auditory Constraint / Tempo Regulation',
          purpose:'Use 3/4 waltz rhythm, such as Blue Danube-style timing, to encourage relaxed movement rhythm, smoother striking and reduced rushing.',
          levels:'Level 0–5',
          progression:'Coach sings/counts 1-2-3 → metronome pulse → faster/slower tempo → faded rhythm cue'
        }
      ]
    },

    {
      title:'Visual Perception Tools',
      tools:[
        {
          name:'2 Coloured Racquet',
          type:'Informational Constraint',
          purpose:'Improve visual attention to the information source at contact.',
          levels:'Level 0–3',
          progression:'Continuous call → intermittent call → random call → fade out'
        }
      ]
    },
    {
      title:'Coordination Feedback Tools',
      tools:[
        {
          name:'Happy Smiley Face',
          type:'External Focus / Haptic Feedback',
          purpose:'Reduce wrist collapse through playful external focus.',
          levels:'Level 0–2',
          progression:'Visible feedback → faded awareness'
        },
        {
          name:'Hand to Forearm Tape',
          type:'Haptic Informational Feedback',
          purpose:'Immediate feedback when wrist collapses.',
          levels:'Level 0–3',
          progression:'Reduce reliance gradually'
        },
        {
          name:'Dog Buzzer',
          type:'Feedback Tool',
          purpose:'Awareness cue for inefficient movement behaviours.',
          levels:'Level 1–5',
          progression:'Intermittent cueing → fade out'
        }
      ]
    },
    {
      title:'Body Alignment Tools',
      tools:[
        {
          name:'Shoulder Alignment Tape',
          type:'Environmental Constraint',
          purpose:'Promote side-wall or front-wall orientation using external focus.',
          levels:'Level 0–3',
          progression:'Large visual references → subtle references'
        }
      ]
    },
    {
      title:'Spatial Constraint Tools',
      tools:[
        {
          name:'Wall Swing Constraint',
          type:'Environmental / Spatial Constraint',
          purpose:'Reduce excessive rotating swing patterns.',
          levels:'Level 0–5',
          progression:'Against wall → floor line → live feeds'
        }
      ]
    },
    {
      title:'Scaling Tools',
      tools:[
        {
          name:'Challenge Point Overlay',
          type:'Progression / Regression System',
          purpose:'Adjust difficulty based on success rate.',
          levels:'All Levels',
          progression:'<50% simplify · ~70% optimal · >85% increase challenge'
        }
      ]
    },
    {
      title:'Analogy Tools',
      tools:[
        {
          name:'Elastic Band to T',
          type:'Movement Analogy',
          purpose:'Encourage explosive recovery and return to T.',
          levels:'Level 0–5',
          progression:'Simple awareness → integrated movement behaviour'
        },
        {
          name:'Skimming Stones',
          type:'Forehand Swing Analogy',
          purpose:'Encourage elbow-leading forehand swing shape.',
          levels:'Level 0–3',
          progression:'Throwing action → racquet integration'
        },
        {
          name:'Eagle Spreading Wings',
          type:'Balance / Coordination Analogy',
          purpose:'Promote non-playing arm usage for balance.',
          levels:'Level 0–2',
          progression:'Large movements → subtle balance behaviour'
        }
      ]
    }
  ];

  return <div className="gameCard toolsPage">
    <div className="categoryTag">Tools</div>
    <h2>Constraints & Coaching Tools</h2>

    <div className="diagnosticPrinciple">
      <strong>Constraints-Led Coaching Tools</strong>
      <p>Tools shape behaviour through informational, spatial, environmental, haptic and task constraints rather than excessive verbal instruction.</p>
    </div>

    <div className="infoBox">
      <strong>Framework</strong>
      <p>Tools and interventions underpinned by a Constraints-Led Approach framework.</p>
    </div>
    <div className="infoBox">
      <strong>Newly Added Tools</strong>
      <ul>
        <li>Side-Wall Ball Return Tool</li>
        <li>Second Racquet Counterbalance Tool</li>
        <li>Waltz Rhythm Tool</li>
      </ul>
    </div>

    {toolGroups.map(group=><div className="expandedGame selectedExpandedGame" key={group.title}>
      <span className="categoryTag">{group.title}</span>
      <h3>{group.title}</h3>

      {group.tools.map(tool=><div className="constraintSuggestionBox" key={tool.name}>
        <strong>{tool.name}</strong>

        <div className="quickLayers">
          <span className="badge">{tool.type}</span>
          <span className="badge">{tool.levels}</span>
        </div>

        <p><strong>Purpose:</strong> {tool.purpose}</p>
        <p><strong>Progression:</strong> {tool.progression}</p>
      </div>)}
    </div>)}
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
  const [title,setTitle]=useState('Custom Conditioned Game');
  const [assignment,setAssignment]=useState('Server');
  const [namedPlayer,setNamedPlayer]=useState('');
  const [conditionText,setConditionText]=useState('');
  const [straightOnly,setStraightOnly]=useState('None');
  const [crosscourtLimit,setCrosscourtLimit]=useState('None');
  const [doubleBounce,setDoubleBounce]=useState('None');
  const [cbCode,setCbCode]=useState('None');
  const [scoring,setScoring]=useState('Win rally = 1. Bonus scoring set by coach.');
  const [playerFocus,setPlayerFocus]=useState('Read the condition, play the rally, and adapt.');
  const [layers,setLayers]=useState([]);
  const [randomMode,setRandomMode]=useState('Open');
  const [randomResult,setRandomResult]=useState('');

  const overlayOptions=['Clean Winner','Opponent Off T','T Challenge','Volley Finish','Weak Side','4-Shot Window','2-Shot Window','Zone Finish','Quality Length Before Attack'];
  const cbOptions=['None','[1]','[2]','[3]','[4]','[5]','[6]','[7]','[8]','[5-4] + [8-1]','[6-3] + [7-2]','Custom'];
  const randomBank=['Must play straight','Can only score in zone [1]','Can only score in zone [2]','Has 1 crosscourt per rally','Has 2 crosscourts per rally','Has 1 DB','Has 2 DB','Has 3 DB','Has 4 DB','Has 5 DB','Must win with a volley','Must complete a checkerboard pair before scoring','No condition'];

  function toggleLayer(layer){setLayers(prev=>prev.includes(layer)?prev.filter(item=>item!==layer):[...prev,layer]);}
  function resetCustom(){
    setTitle('Custom Conditioned Game');setAssignment('Server');setNamedPlayer('');setConditionText('');
    setStraightOnly('None');setCrosscourtLimit('None');setDoubleBounce('None');setCbCode('None');
    setScoring('Win rally = 1. Bonus scoring set by coach.');setPlayerFocus('Read the condition, play the rally, and adapt.');
    setLayers([]);setRandomMode('Open');setRandomResult('');
  }
  function generateRandom(){
    const a=randomBank[Math.floor(Math.random()*randomBank.length)];
    const b=randomBank[Math.floor(Math.random()*randomBank.length)];
    setRandomResult(randomMode==='Blind'?'Blind random conditions generated. Coach reveals conditions when appropriate.':`Player A: ${a} · Player B: ${b}`);
  }

  const assignedTo=assignment==='Named Player'?(namedPlayer||'Named Player'):assignment;
  const structured=[conditionText||null,straightOnly!=='None'?straightOnly:null,crosscourtLimit!=='None'?crosscourtLimit:null,doubleBounce!=='None'?doubleBounce:null,cbCode!=='None'?`Checkerboard / Zone: ${cbCode}`:null,layers.length?`Overlays: ${layers.join(' · ')}`:null].filter(Boolean);
  const activeCondition=structured.length?`${assignedTo}: ${structured.join(' · ')}`:`${assignedTo}: No condition set`;

  function addGame(){
    onAddToSession({
      id:Date.now()+Math.random(),title,duration:8,format:'Custom',category:'Custom',family:'Custom Conditioned Game',
      level:'Coach Designed',task:activeCondition,
      rationale:'Coach-designed conditioned game using selected constraints, overlays, checkerboard zones and player-specific conditions.',
      coach:'Observe whether the condition changes perception, decision-making and tactical behaviour.',
      coachFocus:'Observe whether the condition changes perception, decision-making and tactical behaviour.',
      player:playerFocus,playerFocus,scoring,layers,cbCode,crosscourtLimit,doubleBounce
    });
  }

  return <div className="gameCard customGameBuilder">
    <div className="categoryTag">Custom</div>
    <h2>Custom Game Builder</h2>
    <p className="engineIntro">Design a game by assigning conditions to the server, receiver, both players or a named player. Nothing is selected by default.</p>

    <label>Game Title<input value={title} onChange={e=>setTitle(e.target.value)} /></label>

    <div className="atlOptionsGrid">
      <label>Assign Condition To<select value={assignment} onChange={e=>setAssignment(e.target.value)}><option>Server</option><option>Receiver</option><option>Both</option><option>Named Player</option></select></label>
      {assignment==='Named Player'&&<label>Named Player<input value={namedPlayer} onChange={e=>setNamedPlayer(e.target.value)} placeholder="e.g. John" /></label>}
    </div>

    <label>Condition Text<textarea value={conditionText} onChange={e=>setConditionText(e.target.value)} placeholder="e.g. John must play straight / Jack has 2 crosscourts per rally / Server can only score in zone [1]" /></label>

    <div className="technicalScoringBox alwaysVisibleScoring">
      <strong>Structured Conditions</strong>
      <div className="atlOptionsGrid">
        <label>Straight Only<select value={straightOnly} onChange={e=>setStraightOnly(e.target.value)}><option>None</option><option>Straight Only</option></select></label>
        <label>Crosscourt Allowance<select value={crosscourtLimit} onChange={e=>setCrosscourtLimit(e.target.value)}><option>None</option><option>0 crosscourts</option><option>1 crosscourt per rally</option><option>2 crosscourts per rally</option><option>3 crosscourts per rally</option><option>Unlimited</option></select></label>
        <label>Double Bounce<select value={doubleBounce} onChange={e=>setDoubleBounce(e.target.value)}><option>None</option><option>1 double bounce</option><option>2 double bounces</option><option>3 double bounces</option><option>Unlimited double bounces</option></select></label>
        <label>Checkerboard / Zone<select value={cbCode} onChange={e=>setCbCode(e.target.value)}>{cbOptions.map(option=><option key={option}>{option}</option>)}</select></label>
      </div>
    </div>

    <div className="technicalScoringBox alwaysVisibleScoring">
      <strong>Universal Overlays</strong><p className="overlayExplain">No overlays are selected by default.</p>
      <OverlayFamilyTabs selectedOverlays={layers} onToggle={toggleLayer} context="Custom Game" />
    </div>

    <label>Scoring<textarea value={scoring} onChange={e=>setScoring(e.target.value)} /></label>
    <label>Player Focus<textarea value={playerFocus} onChange={e=>setPlayerFocus(e.target.value)} /></label>

    <div className="technicalScoringBox">
      <strong>Random Condition Generator</strong>
      <label>Random Mode<select value={randomMode} onChange={e=>setRandomMode(e.target.value)}><option>Open</option><option>Blind</option></select></label>
      <button className="secondaryBtn" type="button" onClick={generateRandom}>Generate Random Conditions</button>
      {randomResult&&<div className="infoBox"><strong>Random Result</strong><p>{randomResult}</p></div>}
    </div>

    <div className="infoBox"><strong>Active Custom Game</strong><p>{activeCondition}</p><p><strong>Scoring:</strong> {scoring}</p></div>
    <div className="buttonRow"><button className="primaryBtn" onClick={addGame}>Add Custom Game To Session</button><button className="secondaryBtn" type="button" onClick={resetCustom}>Reset Custom Game</button></div>
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
    {id:'rallyLost',name:'Rally lost',text:'Rally is lost if broken.',player:'If you break the rule, you lose the rally.'},
    {id:'reset',name:'Challenge resets',text:'Challenge resets if not completed.',player:'If you miss the condition, the challenge resets.'},
    {id:'bonusLost',name:'Bonus lost',text:'The bonus is lost if not completed.',player:'If you miss the condition, the bonus is gone.'},
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
    {id:'classic',label:'Classic Games',category:'Classic Conditioned'},
    {id:'technical',label:'Technical',category:'Technical'},
    {id:'volley',label:'Volley & Intercept',category:'Volley & Intercept'},
    {id:'pressure',label:'Pressure',category:'Pressure'},
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

    {logicCard&&<div className="logicDraftSection"><div className="statusBox"><strong>Built Base Game Held:</strong> {logicCard.title||'Game'} · Add Game Logic or add base game only below.</div><InlineGameLogicBuilder baseGame={logicCard} onAddBase={(game)=>{addStay(game);setLogicCard(null);}} onAddLogic={(game)=>{addStay(game);setLogicCard(null);}} onCancel={()=>setLogicCard(null)}/></div>}

    {activeClassId&&activeClassId!=='saved'&&<UniversalDBHandicapPanel onAddToSession={addStay}/>}

    {editingCard&&<UniversalGameEditor key="editor" game={editingCard} onSave={saveCard} onCancel={()=>setEditingCard(null)}/>}

    {activeClassId==='checkerboard'&&<CheckerboardEngine key="checkerboard-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='atl'&&<ATLBTLDirectBuilder key="atl-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='classic'&&<ClassicConditionedBuilder key="classic-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='technical'&&<TechnicalFocusBuilder key="technical-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='custom'&&<CustomGameBuilder key="custom-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='information'&&<InformationAnticipationBuilder onAddToSession={addAndGo}/>} 
    {activeClassId==='doubleBounce'&&<div className="gameCard"><div className="categoryTag">Double Bounce</div><h2>Double Bounce</h2><p className="mutedText">Double Bounce is now a normal Games Library class. Use this protocol here, then add it to the session when ready.</p><DoubleBounceTool setScreen={setScreen}/></div>}
    {activeClassId==='rotations'&&<div className="gameCard"><div className="categoryTag">Rotations</div><h2>Rotational Affordance Games</h2><p className="mutedText">Rotations have moved from the Home screen into the Games Library, alongside the other game classes.</p><RotationalAffordanceGames setScreen={setScreen}/></div>}

    

    {activeClassId&& !['checkerboard','atl','classic','technical','custom','doubleBounce','rotations','saved'].includes(activeClassId)&&
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
  // v100h19: restore the active Invasion format from saved state so a Points game does not reopen on Lives.
  const [mode,setMode]=useState('invasion');
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
  const [competitionLayers,setCompetitionLayers]=useState([]);
  const [competitionCbCode,setCompetitionCbCode]=useState('None');
  const [playerBounces,setPlayerBounces]=useState({});
  const [manualPlayers,setManualPlayers]=useState('');
  const [matchScore,setMatchScore]=useState({a:0,b:0});
  const [matchPlayers,setMatchPlayers]=useState({a:'Player A',b:'Player B'});
  const [matchScoring,setMatchScoring]=useState('PAR 11');
  const [rrFixtures,setRrFixtures]=useState([]);
  const [rrResults,setRrResults]=useState({});
  const [rrBoxCount,setRrBoxCount]=useState(1);
  const [rrBoxes,setRrBoxes]=useState([]);
  const [rrBoxFixtures,setRrBoxFixtures]=useState([]);
  const [rrBoxResults,setRrBoxResults]=useState({});
  const [rrFinalBoxes,setRrFinalBoxes]=useState([]);
  const [rrFinalFixtures,setRrFinalFixtures]=useState([]);
  const [rrFinalResults,setRrFinalResults]=useState({});
  const [monradRounds,setMonradRounds]=useState([]);
  const [monradResults,setMonradResults]=useState({});
  const [monradPlacingRounds,setMonradPlacingRounds]=useState([]);
  const [monradPlacingResults,setMonradPlacingResults]=useState({});
  const [monradFinalPlaces,setMonradFinalPlaces]=useState({});
  const [nslOrgTab,setNslOrgTab]=useState('config');
  const [nslTeams,setNslTeams]=useState(4);
  const [nslPlayersPerTeam,setNslPlayersPerTeam]=useState(3);
  const [nslPeriod1,setNslPeriod1]=useState(20);
  const [nslPeriod2,setNslPeriod2]=useState(20);
  const [nslPeriod3,setNslPeriod3]=useState(30);
  const [nslOvertime,setNslOvertime]=useState(5);
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
    setRrResults(prev=>({...prev,[rrKey(roundIndex,matchIndex)]:winner}));
  }

  function getRoundRobinStandings(){
    const table={};
    playerNames.forEach(name=>{table[name]={name,played:0,wins:0,losses:0,points:0};});
    rrFixtures.forEach((round,ridx)=>round.forEach((match,midx)=>{
      const winner=rrResults[rrKey(ridx,midx)];
      if(!winner) return;
      const loser=winner===match.a?match.b:match.a;
      [match.a,match.b].forEach(name=>{if(!table[name]) table[name]={name,played:0,wins:0,losses:0,points:0}; table[name].played+=1;});
      table[winner].wins+=1;
      table[winner].points+=3;
      table[loser].losses+=1;
    }));
    return Object.values(table).sort((a,b)=>b.points-a.points||b.wins-a.wins||a.name.localeCompare(b.name));
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
    setter(prev=>({...prev,[rrBoxKey(boxIndex,roundIndex,matchIndex,stage)]:winner}));
  }

  function getBoxStandings(box,fixtures,results,boxIndex,stage='group'){
    const table={};
    (box.players||[]).forEach(name=>{table[name]={name,played:0,wins:0,losses:0,points:0};});
    (fixtures||[]).forEach((round,ridx)=>round.forEach((match,midx)=>{
      const winner=results[rrBoxKey(boxIndex,ridx,midx,stage)];
      if(!winner) return;
      const loser=winner===match.a?match.b:match.a;
      [match.a,match.b].forEach(name=>{if(!table[name]) table[name]={name,played:0,wins:0,losses:0,points:0}; table[name].played+=1;});
      if(table[winner]){table[winner].wins+=1;table[winner].points+=3;}
      if(table[loser]) table[loser].losses+=1;
    }));
    return Object.values(table).sort((a,b)=>b.points-a.points||b.wins-a.wins||a.name.localeCompare(b.name));
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
    setMonradResults(prev=>({...prev,[monradResultKey(roundIndex,matchIndex)]:winner}));
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
    setMonradPlacingResults(prev=>({...prev,[monradPlaceKey(roundIndex,groupId,matchIndex)]:winner}));
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
    const rows=[...playerNames].map(name=>({name,place:monradFinalPlaces[name]||'—'}));
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
      updatedAt:new Date().toISOString()
    };
    try{
      localStorage.setItem('checkerboardCompetitionProjection',JSON.stringify(projectionState));
    }catch{}
  },[mode,invasionFormat,competitionLayers,competitionCbCode,playerBounces,manualPlayers,matchScore,matchPlayers,matchScoring,rrFixtures,nslTeams,nslPlayersPerTeam,nslPeriod1,nslPeriod2,nslPeriod3,nslOvertime,current.title,current.tactical,current.purpose]);


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
                    ?`NSSL · ${nslTeams||'—'} teams · ${nslPlayersPerTeam||'—'} players / team`
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
          <div className="competitionEnginePanel competitionDrawPanel">
            <div className="drawHeaderCard">
              <h2>Monrad Draw Engine</h2>
              <p>Generate a progressive draw. Winners move toward winners, players continue playing after every round.</p>
              <div className="buttonRow">
                <button className="primaryBtn" onClick={generateMonradFirstRound}>Generate Round 1</button>
                <button className="secondaryBtn" onClick={generateNextMonradRound}>Generate Next Round</button>
              </div>
            </div>
            {monradRounds.length===0&&<p className="overlayExplain">Use players marked present in Attendance. Round 1 pairs the top half against the lower half; later rounds pair players with similar records and avoid repeats where possible.</p>}
            {monradRounds.length>0&&(
              <div className="monradBracketScroll">
                {monradRounds.map((round,ridx)=>(
                  <div className="monradRoundColumn" key={ridx}>
                    <div className="drawRoundTitle">Round {ridx+1}</div>
                    {round.map((match,midx)=>{
                      const winner=match.b==='BYE'?match.a:monradResults[monradResultKey(ridx,midx)];
                      return <div className="monradMatchCard" key={midx}>
                        <div className={winner===match.a?'drawPlayerLine winnerLine':'drawPlayerLine'}><span>{match.a}</span>{match.b!=='BYE'&&<button type="button" onClick={()=>setMonradWinner(ridx,midx,match.a)}>Win</button>}</div>
                        <div className={winner===match.b?'drawPlayerLine winnerLine':'drawPlayerLine'}><span>{match.b}</span>{match.b!=='BYE'&&<button type="button" onClick={()=>setMonradWinner(ridx,midx,match.b)}>Win</button>}</div>
                      </div>;
                    })}
                  </div>
                ))}
                <div className="standingsBox monradStandingsBox">
                  <h3>Monrad Table</h3>
                  <div className="standingsTable">
                    <div><b>Player</b><b>Played</b><b>Wins</b></div>
                    {Object.values(monradPlayerScores()).sort((a,b)=>b.wins-a.wins||a.name.localeCompare(b.name)).map(row=><div key={row.name}><span>{row.name}</span><span>{row.played}</span><span>{row.wins}</span></div>)}
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
              <p>Teams: {nslTeams} · Players per team: {nslPlayersPerTeam}</p>
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
            <div className="atlOptionsGrid">
              <label>Player A
                <input value={matchPlayers.a} onChange={e=>setMatchPlayers(prev=>({...prev,a:e.target.value}))}/>
              </label>
              <label>Player B
                <input value={matchPlayers.b} onChange={e=>setMatchPlayers(prev=>({...prev,b:e.target.value}))}/>
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

            <div className="matchScoreBoard">
              <div>
                <strong>{matchPlayers.a}</strong>
                <span>{matchScore.a}</span>
                <button className="secondaryBtn" onClick={()=>setMatchScore(prev=>({...prev,a:prev.a+1}))}>+1</button>
              </div>
              <div>
                <strong>{matchPlayers.b}</strong>
                <span>{matchScore.b}</span>
                <button className="secondaryBtn" onClick={()=>setMatchScore(prev=>({...prev,b:prev.b+1}))}>+1</button>
              </div>
            </div>

            <button className="secondaryBtn" onClick={resetMatch}>Reset Match Score</button>
          </div>
        )}

        {mode==='roundRobin'&&(
          <div className="competitionEnginePanel competitionDrawPanel">
            <div className="drawHeaderCard">
              <h2>Round Robin Box Engine</h2>
              <p>Choose one or more boxes. First stage boxes feed final placing boxes: box winners play for top places, second-placed players play for the next places, and so on.</p>
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
                  <div className="standingsTable">
                    <div><b>Player</b><b>P</b><b>W</b><b>L</b><b>Pts</b></div>
                    {getRoundRobinStandings().map(row=><div key={row.name}><span>{row.name}</span><span>{row.played}</span><span>{row.wins}</span><span>{row.losses}</span><span>{row.points}</span></div>)}
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
              <div className="buttonRow">
                <button className="primaryBtn" onClick={generateMonradPlacingDraw}>Generate Placing Draw</button>
                <button className="secondaryBtn" onClick={generateNextMonradPlacingRound}>Generate Next Placing Round</button>
              </div>
            </div>
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
              {[['config','Config'],['players',`Players (${playerNames.length})`],['teams',`Teams (${nslTeams})`],['sheet','Sheet']].map(tab=>
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
                    <strong>{fixture.a} v {fixture.b}</strong>
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
      progression:'Increase tactical freedom and release conditions.'
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
        <p>Use the selected tool in the live session. Change the task, space, time, equipment, rule or scoring condition.</p>
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
      constraint:'Attack only after width, opponent off T, or limited-reply condition.',
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
        <p>A movement pattern is not defined by how it looks in isolation, but by how effectively it adapts under representative performance conditions.</p>
        <InfoButton id="origins"/>
      </div>

      <h3>Where Did The Habit Come From?</h3>
      <div className="originGrid">{habitOrigins.map(item=><div className="originCard" key={item.title}>
        <span>{item.type}</span><h3>{item.title}</h3><p>{item.text}</p><section><strong>Coach Debate</strong><p>{item.coach}</p></section><section><strong>Intervention Direction</strong><p>{item.intervention}</p></section>
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
  const consequences=[['plus1','+1','Earn +1 if successful.'],['plus2','+2','Earn +2 if successful.'],['plus3','+3','Earn +3 if successful.'],['plus4','+4','Earn +4 if successful.'],['rallyLost','Rally lost','If you break the rule, you lose the rally.'],['reset','Challenge resets','If you miss the condition, the challenge resets.'],['bonusLost','Bonus lost','If you miss the condition, the bonus is gone.'],['coachConfirms','Coach confirms','Coach confirms whether the point counts.'],['coachAwards','Coach awards bonus','Coach awards the bonus.']].map(([id,name,player])=>({id,name,player,text:player}));
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
  <div><div className="eyebrow">CHECKERBOARD COACH</div><h1>Rebuilt Master v100h24 Universal Navigation</h1><p>Sessions · Games · Players · Competition</p></div>
</header>
<main className="container">
{screen==='home'&&<Home setScreen={go}/>}
{screen==='sessions'&&<Sessions session={session} setSession={setSession} setScreen={go}/>}
{screen==='tools'&&<ToolsArchitecture/>}
      {screen==='diagnosticIntervention'&&<DiagnosticIntervention setScreen={go}/>}
      {screen==='diagnostic'&&<DiagnosticTemplate setScreen={go}/>} 
      {screen==='rotational'&&<RotationalAffordanceGames setScreen={go}/>} 
      {screen==='live'&&<LiveSessionDelivery session={session} setScreen={go}/>} 
      {screen==='projection'&&<ProjectionView session={session} setScreen={go}/>}
      {screen==='level0'&&<Level0Exploration/>}
      {screen==='games'&&<Games setSession={setSession} setScreen={go}/>} 
      {screen==='gamesLibrary'&&<GamesLibrary setSession={setSession} setScreen={go}/>}
      {screen==='plugPlay'&&<PlugAndPlay setScreen={go} setSession={setSession}/>}
      {screen==='conditions'&&<GameConditionsEngine setScreen={go} setSession={setSession}/>}
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
