
import React,{useEffect,useMemo,useState}from'react';
import{createRoot}from'react-dom/client';
import'./styles.css';

const PLAYER_KEY='checkerboard_master_v54_players';
const SESSION_KEY='checkerboard_master_v54_session';
const GAME_LIBRARY_KEY='checkerboard_master_v60_games';

const LEVELS=[
{label:'Bronze',level:1},{label:'Silver',level:2},{label:'Gold / Elite',level:3},{label:'Performance',level:4},{label:'Professional',level:5}
];

const ALL_LAYERS=['Clean Winner','Opponent Off T','T Challenge','Blind Finish','Volley Finish','Weak Side','4-Shot Window','2-Shot Window','Double Bounce','Quality Length Before Attack'];
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
    function projCurrentInvader(team){
      const list=[...(team?.players||[])].sort((a,b)=>(competitionProjection.invasionRankMap?.[b]??9999)-(competitionProjection.invasionRankMap?.[a]??9999));
      if(!list.length) return 'Waiting';
      return list[(competitionProjection.invasionPlayerRound||0)%list.length];
    }
    function projDefending(idx){
      if(!n) return null;
      return teams[idx%n];
    }
    function projInvading(idx){
      if(!n) return null;
      return teams[(idx - 1 + (competitionProjection.invasionCourtRound||0) + n) % n];
    }
    return <div className="projectionPage invasionOnlyProjector">
      <div className="projectionTop">
        <button className="secondaryBtn" onClick={()=>setScreen('home')}>← Home</button>
        <div>
          <span className="projectionKicker">LIVE EVENT DISPLAY</span>
          <h1>Invasion Game</h1>
        </div>
      </div>

      <div className="invasionProjectorBoard">
        <div className="invasionProjectorHeader">
          <span>PLAYER PROJECTION</span>
          <h1>Invasion Game</h1>
          <p>{competitionProjection.invasionFormat==='lives'?'Lives Format':'Points Format'} · Team points {(competitionProjection.invasionPlayerRound||0)+1} · Court rotation {(competitionProjection.invasionCourtRound||0)+1}</p>
        </div>

        <div className="finalProjectorSummary">
          <div><b>Format</b><strong>{competitionProjection.invasionFormat==='lives'?'LIVES':'POINTS'}</strong></div>
          <div><b>Courts</b><strong>{liveCourts}</strong></div>
          <div><b>Status</b><strong>{isLive?'LIVE':'WAITING'}</strong></div>
        </div>

        {!isLive&&(
          <div className="projectorWaitingBanner">START GAME on coach screen to begin live court display.</div>
        )}

        <div className="invasionProjectorRules">
          <strong>Essential Rules</strong>
          <div className="rulePillGrid">
            <span>{competitionProjection.invasionFormat==='lives'?'Defenders serve':'Invader serves'}</span>
            <span>{competitionProjection.invasionFormat==='lives'?'Base lives + carry-over':'Team points only'}</span>
            <span>All courts active</span>
            <span>{competitionProjection.invasionCourtAssignmentMode==='random'?'Random court selection':'Fixed court rotation'}</span>
          </div>
          <div className="projectorDbStrip">
            <b>Double-bounce:</b>
            {competitionProjection.playerNames&&competitionProjection.playerNames.length
              ?competitionProjection.playerNames.map(name=><span key={name}>{name}: {competitionProjection.playerBounces?.[name]||'No DB'}</span>)
              :<span>No players selected</span>}
          </div>
        </div>

        {competitionProjection.invasionFormat==='lives'&&n>0&&(
          <div className="finalProjectorCourts">
            {teams.map((_,idx)=>{
              const defending=projDefending(idx);
              const invading=projInvading(idx);
              const invader=projCurrentInvader(invading);
              const startLives=projStartLives(invading);
              const finish=competitionProjection.invasionFinishLives?.[invading?.id];
              return <div className="finalProjectorCourtCard" key={`project-screen-invasion-${idx}`}>
                <h2>Court {idx+1}</h2>
                <p><b>Invader:</b> {invader} · {invading?.name||''}</p>
                <p><b>Defending team:</b> {defending?.name||'Waiting'}</p>
                <div className="finalLifeNumbers">
                  <span>Lives</span><strong>{startLives}</strong>
                  <span>Remaining</span><strong>{finish!==undefined?finish:'Live'}</strong>
                </div>
              </div>;
            })}
          </div>
        )}

        {competitionProjection.invasionFormat==='points'&&n>0&&(
          <div className="finalProjectorCourts">
            {teams.map(team=>(
              <div className="finalProjectorCourtCard" key={team.id}>
                <h2>{team.name}</h2>
                <p><b>Players:</b> {team.players&&team.players.length?team.players.join(' · '):'Waiting'}</p>
                <div className="finalLifeNumbers">
                  <span>Team points</span><strong>{competitionProjection.invasionTeamPoints?.[team.id]||0}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
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
  {category:'🐾 Identity', title:'🐈 Cat', rule:'Patient opportunist: observe, stay balanced, wait, then strike efficiently.', coach:'Useful for rushed attackers. Cue: See before you strike.', pairings:['Width Before Attack','Quiet Eye Before Attack']},
  {category:'🐾 Identity', title:'🐅 Tiger', rule:'Powerful hunter: commit to attacking opportunities and act decisively.', coach:'Useful for passive or hesitant players. Cue: Hunt the ball.', pairings:['Activation Breath','Volley Opportunity']},
  {category:'🐾 Identity', title:'🐕 Retriever', rule:'Attention control and resilience: ignore hecklers, bad calls and opponent behaviour; stay focused on what matters.', coach:'Cue: Eyes on the prize. Coach observes no complaining, immediate recovery and next-ball focus.', pairings:['Refocus After Error','Centering Breath']},
  {category:'🐾 Identity', title:'🐺 Wolf', rule:'Disciplined tactical hunter: follow the plan, build pressure and make intelligent decisions.', coach:'Useful for emotional or impulsive players. Cue: Hunt with purpose.', pairings:['Route Breaker','Attack Only On Advantage']},
  {category:'🐾 Identity', title:'🦅 Eagle', rule:'Awareness and anticipation: scan early, see opportunities and remain calm.', coach:'Cue: Rise above. See everything. Links strongly with second eye and opponent reading.', pairings:['Second Eye','Opponent Reading']},
  {category:'🐾 Identity', title:'🦁 Lion', rule:'Confidence and responsibility: own the court and step forward under pressure.', coach:'Cue: Own the court. Watch posture, court presence and decision commitment.', pairings:['Positive Body Language','Attack On Advantage']},
  {category:'🐾 Identity', title:'🐘 Elephant', rule:'Protect what matters: routines, process goals, effort and composure.', coach:'Cue: Protect what matters. Useful when players chase score, rankings or distractions.', pairings:['Process Goal Focus','Accept And Continue']},
  {category:'👁 Visual Performance', title:'Quiet Eye Serve', rule:'Front wall target → ball → strike. Stable target fixation before the serve, then immediate action.', coach:'Quiet Eye is not just targeting: it is directing attention to task-relevant information.', pairings:['Centering Breath','Eagle']},
  {category:'👁 Visual Performance', title:'Quiet Eye Return', rule:'Opponent information → ball flight → movement. Player anchors attention to useful cues before return.', coach:'Use with return of serve and pressure starts.', pairings:['Second Eye','Opponent Reading']},
  {category:'👁 Visual Performance', title:'Tracking', rule:'Track ball flight to predict trajectory, bounce, speed and interception point.', coach:'Coach observes whether the player keeps visual connection during movement.', pairings:['Coach Feed & Strike','External Focus']},
  {category:'👁 Visual Performance', title:'Opponent Reading', rule:'Player watches opponent racquet preparation, body orientation, balance, movement and recovery state.', coach:'Useful in knock-up and tactical games.', pairings:['Eagle','Second Eye']},
  {category:'👁 Visual Performance', title:'Second Eye', rule:'Maintain access to opponent information while interacting with the ball.', coach:'Prevents opponent blindness and ball-only attention.', pairings:['Eagle','Tracking']},
  {category:'👁 Visual Performance', title:'External Focus', rule:'Attention goes to ball, target, space or opponent rather than internal body mechanics.', coach:'Use when player is over-thinking technique.', pairings:['Quiet Eye Serve','Cue Statement']},
  {category:'🫁 Regulation', title:'Calming Breath', rule:'Longer exhale breathing to down-regulate anxiety, rushing or over-arousal.', coach:'Use when player is panicking, tense or emotionally reactive.', pairings:['Elephant','Quiet Eye Serve']},
  {category:'🫁 Regulation', title:'Centering Breath', rule:'3 in / 3 hold / 3 out to return attention to the next task.', coach:'Default between-rally refocus breath.', pairings:['Cue Statement','One-Rally Reset']},
  {category:'🫁 Regulation', title:'Activation Breath', rule:'Sharp energising breath to increase readiness for flat or passive players.', coach:'Use with action cue: Hunt, Go, Attack.', pairings:['Tiger','Attack Opportunity']},
  {category:'🏆 Competitive Behaviours', title:'Refocus After Error', rule:'After an error: breath, cue, eyes up, ready posture.', coach:'Observable reset within 3 seconds.', pairings:['Retriever','Elephant']},
  {category:'🏆 Competitive Behaviours', title:'Process Goal Focus', rule:'Player protects today’s one process goal regardless of score.', coach:'Ask: what matters right now?', pairings:['Elephant','Retriever']},
  {category:'🏆 Competitive Behaviours', title:'Positive Body Language', rule:'Player shows ready posture and no visible collapse after errors or bad calls.', coach:'Useful with Lion and Retriever identities.', pairings:['Lion','Refocus After Error']},
  {category:'🏆 Competitive Behaviours', title:'Compete To The End', rule:'Player continues full effort until the rally is definitely over.', coach:'No early surrender, no admiring shots.', pairings:['Retriever','Tiger']}
];

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

  return <div className="page universalOverlaysPage">
    <div className="pageTop">
      <div>
        <h1>Universal Overlays</h1>
        <p className="mutedText">One overlay hub for tactical, technical and mental performance constraints.</p>
      </div>
      <button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button>
    </div>

    <div className="universalFamilyTabs">
      {['Tactical','Technical','Mental Performance'].map(tab=><button key={tab} className={family===tab?'activeFamilyTab':''} onClick={()=>setFamily(tab)}>
        {tab==='Tactical'?'🎯 ':tab==='Technical'?'🔧 ':'🧠 '}{tab}
      </button>)}
    </div>

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
        {!active.technical&&<section><h3>Coach Observation</h3><p>{active.coach}</p></section>}
        <section><h3>Recommended Pairings</h3><div className="chipRow">{(active.pairings||[]).map(x=><span key={x}>{x}</span>)}</div></section>
      </div>}
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
  {cat:'Attention', name:'Quiet Eye Before Serve', rule:'Target → Ball → Strike. Fixate front-wall target for 1–2 seconds, eyes to ball, serve immediately.'},
  {cat:'Attention', name:'Quiet Eye Before Attack', rule:'Stabilise gaze on target/space before attacking.'},
  {cat:'Attention', name:'Second Eye To Opponent', rule:'Maintain outside-eye access to opponent information space.'},
  {cat:'Attention', name:'External Target Focus', rule:'Use ball, target, space or opponent information rather than internal technical chatter.'},
  {cat:'Breathing', name:'Long Exhale Before Serve', rule:'Visible long controlled exhale before serve or pressure point.'},
  {cat:'Breathing', name:'Breath Before Serve', rule:'One visible centering breath before every serve.'},
  {cat:'Breathing', name:'Attack Breath', rule:'Sharp energising breath and attack cue before serve or attack phase.'},
  {cat:'Reset', name:'Reset Within 3 Seconds', rule:'After error/lost rally: breathe, cue word, eyes up, ready posture within 3 seconds.'},
  {cat:'Reset', name:'Cue Word After Error', rule:'Short cue word after error before next rally.'},
  {cat:'Competitive Behaviour', name:'No Admiring Shots', rule:'After every shot, recover or reposition immediately.'},
  {cat:'Competitive Behaviour', name:'Full Recovery After Every Shot', rule:'Attempt recovery even after poor shots or apparent winners.'},
  {cat:'Competitive Behaviour', name:'Compete To Last Ball', rule:'Continue effort until rally is definitely over.'},
  {cat:'Emotional Regulation', name:'Neutral Error Response', rule:'After error, show neutral body language and immediate readiness.'},
  {cat:'Emotional Regulation', name:'Accept And Continue', rule:'After bad call, bad bounce or disruption, reset and continue.'},
  {cat:'Tactical Awareness', name:'Recognise Opponent Vulnerability', rule:'Attack only when opponent is off-balance, late, unrecovered or out of position.'},
  {cat:'Tactical Awareness', name:'Attack Only On Advantage', rule:'Attack only after a clear pressure cue or positional advantage.'}
];


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



function MentalSkillsPlaceholder({setScreen}){
  const [section,setSection]=useState('menu');
  const [selectedAnimal,setSelectedAnimal]=useState(null);
  const [visualTopic,setVisualTopic]=useState('overview');
  const [custom,setCustom]=useState(()=>{try{return JSON.parse(localStorage.getItem('checkerboard_custom_animal')||'{}')}catch(e){return {}}});
  const animals=[
    {emoji:'🐈',name:'Cat',core:'Patience & Timing',strategy:'Survives by observing carefully, staying balanced and striking only when the moment is right.',behaviours:['Observe before acting','Stay balanced','Wait for real opportunity','Strike efficiently'],activation:['Smooth ghosting','Pause-scan-accelerate','Controlled feed and strike'],breakdown:['Rushes attacks','Forces low-percentage shots','Moves before seeing'],cue:'See before you strike.',overlays:['Width Before Attack','Quiet Eye Before Attack','External Focus']},
    {emoji:'🐅',name:'Tiger',core:'Commitment & Action',strategy:'Survives by committing fully when opportunity appears.',behaviours:['Attack decisively','Commit to decisions','Dominate space','No hesitation'],activation:['Explosive ghosting','Fast first step','Decisive feed-and-strike'],breakdown:['Hesitates','Plays safe when opportunity appears','Attacks without conviction'],cue:'Hunt the ball.',overlays:['Activation Breath','Volley Opportunity','Attack Only On Advantage']},
    {emoji:'🐕',name:'Retriever',core:'Attention Control & Resilience',strategy:'Survives by ignoring distractions and staying focused on what matters.',behaviours:['Ignore hecklers, bad calls and opponent behaviour','Chase every ball','Recover immediately','Next-ball focus'],activation:['Recover after every ghost','Chase every feed','Reset without complaint'],breakdown:['Complains','Dwells on errors','Stops chasing','Reacts to opponent'],cue:'Eyes on the prize.',overlays:['Refocus After Error','Centering Breath','Compete To The End']},
    {emoji:'🐺',name:'Wolf',core:'Discipline & Tactical Intelligence',strategy:'Survives through patience, planning and intelligent hunting.',behaviours:['Follow the plan','Build pressure','Make intelligent decisions','Stay disciplined'],activation:['Ghost tactical patterns','Vary pace with purpose','Feed and strike into planned targets'],breakdown:['Over-attacks','Forgets plan','Gets emotional'],cue:'Hunt with purpose.',overlays:['Route Breaker','Attack Only On Advantage','Process Goal Focus']},
    {emoji:'🦅',name:'Eagle',core:'Awareness & Anticipation',strategy:'Survives by rising above chaos, seeing early and choosing the right moment.',behaviours:['Scan early','Read opponent cues','Recognise opportunities','Stay calm under pressure'],activation:['Head-up ghosting','Scan before moving','Opponent-reading knock-up'],breakdown:['Ball-only attention','Late recognition','Gets drawn into chaos'],cue:'Rise above. See everything.',overlays:['Second Eye','Opponent Reading','Quiet Eye Return']},
    {emoji:'🦁',name:'Lion',core:'Confidence & Responsibility',strategy:'Survives by owning the space and stepping forward when pressure rises.',behaviours:['Positive body language','Take responsibility','Step forward under pressure','Lead by example'],activation:['Strong posture','Assertive first movement','Controlled breathing'],breakdown:['Shrinks','Waits for opponent mistakes','Negative posture'],cue:'Own the court.',overlays:['Positive Body Language','Activation Breath','Attack Only On Advantage']},
    {emoji:'🐘',name:'Elephant',core:'Protect What Matters',strategy:'Survives by protecting priorities and not wasting energy on irrelevant noise.',behaviours:['Protect routines','Protect process goals','Stay composed','Ignore score noise'],activation:['Stable ghosting','Deliberate reset','Controlled feed and strike'],breakdown:['Chases score','Panics after errors','Abandons routine'],cue:'Protect what matters.',overlays:['Process Goal Focus','Calming Breath','Accept And Continue']}
  ];
  const menu=[['🐾 Performance Identity','Animals, custom identity, survival strategy and observable behaviours','identity'],['👁 Visual Performance','Quiet Eye, tracking, opponent reading, second eye and external focus','visual'],['🚀 Pre-Performance Preparation','Identity, cue statement, breathing, process goal and greatest hits video','ppp'],['🏃 Activation & Calibration','Ghosting, animal ghosting, coach feed & strike and court-available options','activation'],['👁 Court Calibration','Official knock-up, opponent observation, Quiet Eye and information gathering','court'],['🎯 Cue Statements','Animal-linked cues and custom performance cues','cues'],['🫁 Breathing & Regulation','Calming, centering and activation breathing','breathing'],['🎬 Greatest Hits Videos','Performance identity reinforcement for players, parents and coaches','greatest'],['🎮 Mental Overlays','Use Universal Overlays to apply mental performance behaviours inside games','overlays']];
  const visualTopics=[['overview','👁 Overview'],['quiet','👁 Quiet Eye'],['tracking','🎾 Tracking'],['opponent','👤 Opponent Reading'],['second','👀 Second Eye'],['external','🎯 External Focus']];
  function saveCustom(){localStorage.setItem('checkerboard_custom_animal',JSON.stringify(custom));alert('Custom animal saved.');}
  function SquashBallGraphic(){return <div className="squashBallGraphic"><div className="trajectoryArc"></div><div className="squashBallCore">●</div><span className="trackLabel labelTrajectory">Trajectory</span><span className="trackLabel labelBounce">Bounce</span><span className="trackLabel labelSpeed">Speed</span><span className="trackLabel labelIntercept">Interception</span><div className="bounceDot"></div><div className="interceptDot"></div></div>;}
  const activeAnimal=selectedAnimal?animals.find(a=>a.name===selectedAnimal):null;
  return <div className="page mentalPerformancePage">
    <div className="pageTop"><div><h1>Mental Performance</h1><p className="mutedText">Survive • Prosper • Perform</p></div><button className="secondaryBtn" onClick={()=>activeAnimal?setSelectedAnimal(null):section==='menu'?setScreen('home'):setSection('menu')}>{activeAnimal?'Animals':section==='menu'?'Home':'Back'}</button></div>
    {activeAnimal&&<div className="animalFullPage"><div className="animalHero"><div className="animalEmoji">{activeAnimal.emoji}</div><div><h2>{activeAnimal.name}</h2><h3>{activeAnimal.core}</h3><p>{activeAnimal.strategy}</p></div></div><div className="mentalGrid"><div className="mentalCard"><h3>Observable Behaviours</h3>{activeAnimal.behaviours.map(x=><p key={x}>✓ {x}</p>)}</div><div className="mentalCard"><h3>Activation Exercises</h3>{activeAnimal.activation.map(x=><p key={x}>• {x}</p>)}</div><div className="mentalCard"><h3>Breakdown Behaviours</h3>{activeAnimal.breakdown.map(x=><p key={x}>✗ {x}</p>)}</div><div className="mentalCard"><h3>Recovery Cue</h3><p className="largeCue">“{activeAnimal.cue}”</p></div></div><div className="overlaySuggestionBox"><h3>Suggested Overlays</h3><div className="chipRow">{activeAnimal.overlays.map(x=><span key={x}>{x}</span>)}</div></div></div>}
    {!activeAnimal&&section==='menu'&&<div><div className="mentalPhilosophyBox"><h2>Survive and Prosper</h2><p>Mental performance is the ability to focus on what matters, regulate emotion, recover after setbacks and behave in ways that help the player adapt to the competitive environment.</p></div><div className="mentalMenuGrid">{menu.map(item=><button key={item[2]} className="mentalMenuCard" onClick={()=>setSection(item[2])}><h2>{item[0]}</h2><p>{item[1]}</p></button>)}</div></div>}
    {!activeAnimal&&section==='identity'&&<div><h2 className="sectionTitle">🐾 Performance Identity</h2><p className="mutedText">The animal is a memorable way to connect identity to observable performance behaviours.</p><div className="animalGrid">{animals.map(a=><button className="animalCard animalButtonCard" key={a.name} onClick={()=>setSelectedAnimal(a.name)}><div className="animalEmoji">{a.emoji}</div><h2>{a.name}</h2><h3>{a.core}</h3><p>{a.strategy}</p><p><strong>Cue:</strong> “{a.cue}”</p></button>)}</div><div className="customAnimalBox"><h2>➕ Create Your Own Animal</h2><p>Choose an animal that fits the player. The key question is: why did you choose it?</p><div className="customAnimalGrid"><input placeholder="Animal" value={custom.animal||''} onChange={e=>setCustom({...custom,animal:e.target.value})}/><input placeholder="Cue phrase" value={custom.cue||''} onChange={e=>setCustom({...custom,cue:e.target.value})}/><textarea placeholder="Why did you choose this animal?" value={custom.why||''} onChange={e=>setCustom({...custom,why:e.target.value})}/><textarea placeholder="What behaviours should a coach see?" value={custom.behaviours||''} onChange={e=>setCustom({...custom,behaviours:e.target.value})}/></div><button className="primaryBtn" onClick={saveCustom}>Save Custom Animal</button></div></div>}
    {!activeAnimal&&section==='visual'&&<div className="mentalContentPanel visualPerformancePanel"><h2>👁 Visual Performance</h2><p>Visual performance is the coachable system that helps players perceive the information that matters.</p><div className="visualTopicTabs">{visualTopics.map(t=><button key={t[0]} className={visualTopic===t[0]?'activeVisualTab':''} onClick={()=>setVisualTopic(t[0])}>{t[1]}</button>)}</div>{visualTopic==='overview'&&<div className="mentalGrid"><div className="mentalCard"><h3>Information Sources</h3><p>🎾 Ball</p><p>👤 Opponent</p><p>🎯 Target</p><p>📍 Space</p><p>⏱ Time</p></div><div className="mentalCard"><h3>Coaching Question</h3><p>What information is the player attending to?</p></div><div className="mentalCard"><h3>Visual Pillars</h3><p>Quiet Eye, Tracking, Opponent Reading, Second Eye and External Focus.</p></div></div>}{visualTopic==='quiet'&&<div className="mentalGrid"><div className="mentalCard"><h3>Definition</h3><p>Final fixation or tracking gaze directed toward task-relevant information before movement execution.</p></div><div className="mentalCard"><h3>Quiet Eye is not just targeting</h3><p>It can involve target fixation, ball tracking, opponent observation and space recognition.</p></div><div className="mentalCard"><h3>Serve</h3><p>Target → Ball → Strike</p></div><div className="mentalCard"><h3>Return</h3><p>Opponent → Ball → Movement</p></div><div className="mentalCard"><h3>Common Errors</h3><p>Excessive scanning, outcome watching, changing targets, internal technical focus.</p></div></div>}{visualTopic==='tracking'&&<div><SquashBallGraphic/><div className="mentalGrid"><div className="mentalCard"><h3>Purpose</h3><p>Predict trajectory, bounce, speed, interception point and available time.</p></div><div className="mentalCard"><h3>Progression</h3><p>1. Track → Move → Strike</p><p>2. Variable height feed</p><p>3. Variable depth feed</p><p>4. Variable pace feed</p><p>5. Opponent cue → Ball flight → Strike</p></div><div className="mentalCard"><h3>Common Errors</h3><p>Looking away early, looking at target before contact, losing ball during movement, outcome watching.</p></div></div></div>}{visualTopic==='opponent'&&<div className="mentalGrid"><div className="mentalCard"><h3>Information To Read</h3><p>Racquet preparation, shoulder orientation, balance, movement direction, recovery state and court position.</p></div><div className="mentalCard"><h3>Knock-Up Intelligence</h3><p>Use the 4-minute warm-up to assess pace tolerance, height tolerance, volley confidence, preparation quality and movement confidence.</p></div><div className="mentalCard"><h3>Coach Cue</h3><p>Watch the player, not just the ball.</p></div></div>}{visualTopic==='second'&&<div className="mentalGrid"><div className="mentalCard"><h3>Definition</h3><p>Maintain visual access to opponent information while interacting with the ball.</p></div><div className="mentalCard"><h3>Benefits</h3><p>Anticipation, tactical awareness, earlier recognition and better adaptation.</p></div><div className="mentalCard"><h3>Common Error</h3><p>Opponent blindness: ball, ball, ball — with no opponent information.</p></div></div>}{visualTopic==='external'&&<div className="mentalGrid"><div className="mentalCard"><h3>Attend To</h3><p>🎾 Ball</p><p>🎯 Target</p><p>📍 Space</p><p>👤 Opponent</p></div><div className="mentalCard"><h3>Avoid</h3><p>Wrist, elbow, swing mechanics, foot position — unless temporarily used as a correction.</p></div><div className="mentalCard"><h3>Example</h3><p>Instead of “keep your wrist firm”, use “send the ball through the back corner.”</p></div></div>}</div>}
    {!activeAnimal&&section==='greatest'&&<div className="mentalContentPanel"><h2>🎬 Greatest Hits Video</h2><p>A short video of the player’s best moments can reinforce performance identity before competition.</p><div className="mentalGrid"><div className="mentalCard"><h3>Purpose</h3><p>Remind the player: “This is what I do when I perform well.”</p></div><div className="mentalCard"><h3>Length</h3><p>60–180 seconds with the player’s chosen music.</p></div><div className="mentalCard"><h3>Include</h3><p>Movement, retrievals, resilience, good decisions, pressure moments, rallies and winners.</p></div><div className="mentalCard"><h3>Avoid</h3><p>Only trick shots, only winners, unrealistic editing or clips that promote low-percentage play.</p></div></div></div>}
    {!activeAnimal&&section==='ppp'&&<div className="mentalContentPanel"><h2>🚀 Pre-Performance Preparation</h2><p>Usually done in a corridor, badminton hall, car park or waiting area. It does not depend on having a court.</p><div className="prepFlow"><span>Identity</span><span>Cue</span><span>Breathing</span><span>Process Goal</span><span>Greatest Hits</span><span>Activation & Calibration</span><span>Court Calibration</span><span>Compete</span></div></div>}
    {!activeAnimal&&section==='activation'&&<div className="mentalContentPanel"><h2>🏃 Activation & Calibration</h2><p>This is the physical bridge from preparation to performance.</p><div className="mentalGrid"><div className="mentalCard"><h3>Ghosting</h3><p>Used for movement readiness and court-orientation imagery, not just fitness.</p></div><div className="mentalCard"><h3>Animal Ghosting</h3><p>Show the animal: Eagle scans, Retriever recovers, Tiger commits, Elephant controls tempo.</p></div><div className="mentalCard"><h3>Coach Feed & Strike</h3><p>Small-space squash-ball feed: player lunges and strikes controlled ball back to coach to catch.</p></div><div className="mentalCard"><h3>If Court Available</h3><p>Use representative rally prep: lengths, volley activation, boast-drive or tactical imagery.</p></div></div></div>}
    {!activeAnimal&&section==='court'&&<div className="mentalContentPanel"><h2>👁 Court Calibration</h2><p>The official 4-minute knock-up is information gathering, not just warming up.</p><div className="mentalGrid"><div className="mentalCard"><h3>Self Calibration</h3><p>Check timing, length, movement, racket preparation and touch.</p></div><div className="mentalCard"><h3>Opponent Observation</h3><p>Notice whether opponent handles height, pace, volleys, late preparation or rotational swing paths.</p></div><div className="mentalCard"><h3>Quiet Eye</h3><p>Now the ball, court and opponent exist. Use target → ball → strike to launch into performance.</p></div></div></div>}
    {!activeAnimal&&section==='cues'&&<div className="mentalContentPanel"><h2>🎯 Cue Statements</h2><div className="mentalGrid">{animals.map(a=><div className="mentalCard" key={a.name}><h3>{a.emoji} {a.name}</h3><p>“{a.cue}”</p></div>)}</div></div>}
    {!activeAnimal&&section==='breathing'&&<div className="mentalContentPanel"><h2>🫁 Breathing & Regulation</h2><div className="mentalGrid"><div className="mentalCard"><h3>😌 Calming</h3><p><strong>Use:</strong> anxiety, rushing, panic, over-arousal.</p><p><strong>Protocol:</strong> longer exhale breathing.</p><p><strong>Coach observes:</strong> slower tempo, reduced rushing, calmer reset.</p></div><div className="mentalCard"><h3>🎯 Centering</h3><p><strong>Use:</strong> refocus, between rallies, after errors.</p><p><strong>Protocol:</strong> 3 in / 3 hold / 3 out.</p><p><strong>Coach observes:</strong> breath, cue, eyes up, ready posture.</p></div><div className="mentalCard"><h3>⚡ Activation</h3><p><strong>Use:</strong> flat, passive or under-aroused players.</p><p><strong>Protocol:</strong> sharp energising breath and action cue.</p><p><strong>Coach observes:</strong> stronger posture, faster first movement, commitment.</p></div></div></div>}
    {!activeAnimal&&section==='overlays'&&<div className="mentalContentPanel"><h2>🎮 Mental Overlays</h2><p>Mental overlays are applied through the Universal Overlays section so coaches can combine tactical, technical and mental performance behaviours in one place.</p><button className="primaryBtn" onClick={()=>setScreen('technical')}>Open Universal Overlays</button></div>}
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


function App(){
const[screen,setScreen]=useState('home');
const[players,setPlayers]=useState(()=>{try{return JSON.parse(localStorage.getItem(PLAYER_KEY))||[]}catch{return[]}});
const[session,setSession]=useState(()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY))||[]}catch{return[]}});
useEffect(()=>{localStorage.setItem(PLAYER_KEY,JSON.stringify(players));},[players]);
useEffect(()=>{localStorage.setItem(SESSION_KEY,JSON.stringify(session));},[session]);
return <div>
<header className="hero"><button className="homeBtn" onClick={()=>setScreen('home')}>HOME</button><div><div className="eyebrow">CHECKERBOARD COACH</div><h1>Rebuilt Master v99h48</h1><p>Sessions · Games · Players · Competition</p></div></header>
<main className="container">
{screen==='home'&&<Home setScreen={setScreen}/>}
{screen==='sessions'&&<Sessions session={session} setSession={setSession} setScreen={setScreen}/>}
{screen==='tools'&&<ToolsArchitecture/>}
      {screen==='diagnostic'&&<DiagnosticTemplate setScreen={setScreen}/>} 
      {screen==='rotational'&&<RotationalAffordanceGames setScreen={setScreen}/>} 
      {screen==='live'&&<LiveSessionDelivery session={session} setScreen={setScreen}/>} 
      {screen==='projection'&&<ProjectionView session={session} setScreen={setScreen}/>}
      {screen==='level0'&&<Level0Exploration/>}
      {screen==='games'&&<Games setSession={setSession} setScreen={setScreen}/>}
{screen==='players'&&<PlayerHub players={players} setPlayers={setPlayers} session={session} setSession={setSession}/>}{screen==='technical'&&<UniversalOverlays setScreen={setScreen}/>} {screen==='doubleBounce'&&<DoubleBounceTool setScreen={setScreen}/>} {screen==='mentalSkills'&&<MentalSkillsPlaceholder setScreen={setScreen}/>} 
{screen==='competition'&&<Competition players={players}/>} {screen==='storage'&&<Storage players={players} setPlayers={setPlayers} session={session} setSession={setSession}/>}
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
