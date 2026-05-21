
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
      const selected=Number(competitionProjection?.invasionStartingLives||competitionProjection?.invasionLives);
      if(selected>0) return selected;
      const playerCount=(team?.players||[]).length||1;
      const baseTotal=competitionProjection.invasionFairBaseTotal||playerCount;
      return Math.max(1,Math.floor(baseTotal/playerCount));
    }
    function projCarry(team){
      return competitionProjection.invasionCarryLives?.[team?.id]||0;
    }
    function projStartLives(team){
      return projBaseLives(team)+projCarry(team);
    }
    function projCurrentInvader(team){
      const list=team?.players||[];
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
  const [tab,setTab]=useState('attention');
  const [cue,setCue]=useState(()=>localStorage.getItem('checkerboard_mental_cue')||'See it. Then serve it.');
  const [goals,setGoals]=useState(()=>{try{return JSON.parse(localStorage.getItem('checkerboard_mental_goals')||'["Quiet eye before serve","Reset within 3 seconds","Full recovery after every shot"]')}catch(e){return ['Quiet eye before serve','Reset within 3 seconds','Full recovery after every shot']}});
  const [ratings,setRatings]=useState({focus:3,composure:3,regulation:3});
  function saveMental(){localStorage.setItem('checkerboard_mental_cue',cue);localStorage.setItem('checkerboard_mental_goals',JSON.stringify(goals));alert('Mental performance routine saved.');}
  const mentalOverlays=[
    {cat:'Attention',name:'Quiet Eye Before Serve',rule:'Select a precise front wall target, hold fixation for 1–2 seconds, transfer gaze to ball, serve immediately.',why:'Stabilises attention, supports external focus, reduces distraction and commits the player to serve intention.',coach:'Coach observes target selection, stable fixation, no scanning and immediate serve execution.',pair:'Long Exhale Before Serve'},
    {cat:'Attention',name:'Quiet Eye Before Attack',rule:'Before attacking, briefly stabilise gaze on the relevant target or space before striking.',why:'Creates a stable external focus before high-value decisions under pressure.',coach:'Coach looks for stable target attention rather than rushed or panicked striking.',pair:'Recognise Opponent Vulnerability'},
    {cat:'Attention',name:'Second Eye To Opponent',rule:'Preserve outside-eye access to opponent information space during recovery and preparation.',why:'Maintains pickup of opponent posture, racquet preparation and movement direction.',coach:'Loss of opponent visual access = “blind” call.',pair:'Reset Within 3 Seconds'},
    {cat:'Attention',name:'External Target Focus',rule:'Use ball, target, space or opponent information rather than internal technical chatter.',why:'External focus supports more automatic coordination and reduces over-control.',coach:'Player cue should refer to external information, not body mechanics.',pair:'See Space Before Strike'},
    {cat:'Breathing',name:'Long Exhale Before Serve',rule:'Player performs one visible long controlled exhale before serve or pressure point.',why:'Down-regulates over-arousal and helps anxious players reduce rushing.',coach:'Coach must be able to see a deliberate long exhale.',pair:'Quiet Eye Before Serve'},
    {cat:'Breathing',name:'Breath Before Serve',rule:'Player uses one centering breath before every serve.',why:'Resets attention and links routine to action without over-calming.',coach:'No breath before serve = overlay infraction.',pair:'Cue Word After Error'},
    {cat:'Breathing',name:'Attack Breath',rule:'Player uses a sharp energising breath and attack cue before serve or attack phase.',why:'Up-regulates flat or passive players toward competitive readiness.',coach:'Use only when player is under-aroused, not anxious.',pair:'Recognise Opponent Vulnerability'},
    {cat:'Reset',name:'Reset Within 3 Seconds',rule:'After error or lost rally, player shows visible reset within 3 seconds: breathe, cue word, eyes up, ready posture.',why:'Turns disruption into a repeatable re-engagement behaviour.',coach:'Coach counts visible reset behaviour, not private thoughts.',pair:'Second Eye To Opponent'},
    {cat:'Competitive Behaviour',name:'No Admiring Shots',rule:'After every shot, player must recover or reposition immediately.',why:'Prevents emotional attachment to the previous shot and supports next-action readiness.',coach:'Watching the shot instead of recovering is an infraction.',pair:'Full Recovery After Every Shot'},
    {cat:'Competitive Behaviour',name:'Full Recovery After Every Shot',rule:'Player attempts full recovery even after poor shots or apparent winners.',why:'Builds persistence, effort identity and competitive behaviour.',coach:'Failure to recover = loss of overlay point.',pair:'No Admiring Shots'},
    {cat:'Emotional Regulation',name:'Neutral Error Response',rule:'After error, player must show neutral body language and immediate readiness.',why:'Trains functioning despite frustration rather than trying to feel calm.',coach:'Visible frustration costs overlay.',pair:'One-Rally Reset'},
    {cat:'Tactical Awareness',name:'Recognise Opponent Vulnerability',rule:'Player may attack only when opponent is off-balance, late, unrecovered or outside useful position.',why:'Links mental performance to tactical judgement and patience.',coach:'Reckless attack without advantage loses overlay.',pair:'Quiet Eye Before Attack'}
  ];
  const breathing=[
    {title:'Calming: Physiological Sigh',state:'For anxious, rushed, tense or over-aroused players.',protocol:'Inhale through nose → small top-up inhale → long slow exhale through mouth. Repeat 3–5 cycles.',overlay:'Long Exhale Before Serve',coach:'Best for players who are hyper-stimulated or panicking.'},
    {title:'Centering: 3-3-3 Breath',state:'For distracted players who need to refocus and stay in the zone.',protocol:'Inhale 3 seconds → hold 3 seconds → exhale 3 seconds. Repeat 3 cycles.',overlay:'Breath Before Serve',coach:'Default squash reset routine between rallies or before serve.'},
    {title:'Activation: Power Breath',state:'For flat, passive or under-aroused players.',protocol:'Six rapid nasal breaths → one deep inhale → explosive exhale. Repeat 1–2 rounds.',overlay:'Attack Breath',coach:'Use with an action cue such as “hunt”, “go” or “attack”.'}
  ];
  const quietEyeSteps=['Select a precise front wall target.','Hold stable fixation on target for 1–2 seconds.','Transfer gaze naturally to the ball.','Serve immediately: Target → Ball → Strike.'];
  const overlayPairs=[['Calm & Focus','Quiet Eye Before Serve + Long Exhale Before Serve'],['Refocus','Reset Within 3 Seconds + Second Eye To Opponent'],['Competitive','No Admiring Shots + Full Recovery After Every Shot'],['Attack','Attack Breath + Recognise Opponent Vulnerability'],['Serve Routine','Quiet Eye Before Serve + Breath Before Serve + Cue Word']];
  return <div className="page mentalSkillsPage mentalPerformancePage">
    <div className="pageTop"><div><h1>Mental Performance</h1><p className="mutedText">Attention → Perception → Action → Behaviour → Performance.</p></div><button className="secondaryBtn" onClick={()=>setScreen('home')}>Home</button></div>
    <div className="mentalTabs"><button className={tab==='attention'?'activeTab':''} onClick={()=>setTab('attention')}>Attention</button><button className={tab==='breathing'?'activeTab':''} onClick={()=>setTab('breathing')}>Breathing</button><button className={tab==='overlays'?'activeTab':''} onClick={()=>setTab('overlays')}>Overlays</button><button className={tab==='routine'?'activeTab':''} onClick={()=>setTab('routine')}>Routines</button><button className={tab==='goals'?'activeTab':''} onClick={()=>setTab('goals')}>Goals</button></div>
    {tab==='attention'&&<section className="mentalPanel"><h2>Attention & Focus</h2><p>Performance begins with attention. Attention shapes information pickup, perception, decision-making, movement organisation and execution quality.</p><div className="mentalGrid"><div className="mentalCard"><h3>Core Principle</h3><p>Train where the player places attention, not what they should think. External information drives better action organisation than internal technical chatter.</p></div><div className="mentalCard"><h3>Notice → Reset → Re-engage</h3><p>The goal is not to suppress thoughts or nerves. The goal is to recognise disruption and return attention to the next useful action.</p></div><div className="mentalCard"><h3>Competitive Behaviour</h3><p>Feelings are unreliable. Observable behaviours can be trained: recover, reset, eyes up, breathe, compete to the last ball.</p></div></div><div className="quietEyeBox"><h2>Quiet Eye Before Serve</h2><p><strong>Definition:</strong> the final stable visual fixation on the intended front wall target before initiating the serve.</p><p><strong>Purpose:</strong> stabilise attention, support external focus, reduce distraction and commit to serve intention.</p><ol>{quietEyeSteps.map(step=><li key={step}>{step}</li>)}</ol><p className="coachCue">Coach cue: “See it. Then serve it.”</p></div></section>}
    {tab==='breathing'&&<section className="mentalPanel"><h2>Breathing Systems</h2><p>Breathing is an observable performance overlay. The coach chooses the routine based on the player’s state: calm down, centre, or activate.</p><div className="mentalGrid">{breathing.map(item=><div className="mentalCard breathSystemCard" key={item.title}><h3>{item.title}</h3><p><strong>Use:</strong> {item.state}</p><p><strong>Protocol:</strong> {item.protocol}</p><p><strong>Overlay:</strong> {item.overlay}</p><p>{item.coach}</p></div>)}</div></section>}
    {tab==='overlays'&&<section className="mentalPanel"><h2>Universal Mental Overlays</h2><p>Mental overlays should be available inside every game: checkerboard, ATL/BTL, double bounce, invasion, matchplay, pressure games and live projection.</p><div className="overlayMentalGrid">{mentalOverlays.map(o=><div className="mentalOverlayCard" key={o.name}><span>{o.cat}</span><h3>{o.name}</h3><p><strong>Rule:</strong> {o.rule}</p><p><strong>Why:</strong> {o.why}</p><p><strong>Coach:</strong> {o.coach}</p><p><strong>Pairs with:</strong> {o.pair}</p></div>)}</div></section>}
    {tab==='routine'&&<section className="mentalPanel"><h2>Match & Session Routines</h2><div className="routineBox"><label>Cue Statement</label><input value={cue} onChange={e=>setCue(e.target.value)} /><div className="chipRow">{['See it. Then serve it.','One rally at a time.','Move first. Reset fast.','Calm. Focused. In control.','Hunt.'].map(x=><button key={x} onClick={()=>setCue(x)}>{x}</button>)}</div></div><div className="mentalGrid"><div className="mentalCard"><h3>Pre-Match</h3><p>Cue statement → breathing routine → process goal → start.</p></div><div className="mentalCard"><h3>Between Rallies</h3><p>Notice disruption → breath/cue → eyes up → ready posture.</p></div><div className="mentalCard"><h3>Between Games</h3><p>Breath → repeat cue → select one process behaviour for the next game.</p></div><div className="mentalCard"><h3>Post Match</h3><p>Review behaviour: attention, reset, recovery, composure and tactical discipline.</p></div></div><h2>Suggested Overlay Pairs</h2><div className="mentalGrid">{overlayPairs.map(pair=><div className="mentalCard" key={pair[0]}><h3>{pair[0]}</h3><p>{pair[1]}</p></div>)}</div><button className="primaryBtn" onClick={saveMental}>Save Routine</button></section>}
    {tab==='goals'&&<section className="mentalPanel"><h2>Goals & Ratings</h2><p>Keep the goal system simple: long-term direction, current focus, today’s observable behaviour.</p><div className="goalList">{goals.map((g,i)=><input key={i} value={g} onChange={e=>setGoals(goals.map((x,idx)=>idx===i?e.target.value:x))}/>)}</div><div className="ratingGrid">{Object.entries(ratings).map(([key,value])=><div className="ratingCard" key={key}><h3>{key[0].toUpperCase()+key.slice(1)}</h3><input type="range" min="1" max="5" value={value} onChange={e=>setRatings({...ratings,[key]:e.target.value})}/><strong>{value}/5</strong></div>)}</div><button className="primaryBtn" onClick={saveMental}>Save Goals</button></section>}
  </div>;
}


function Home({setScreen}){
return <div className="homeGrid">
      <div className="homeBrandCard compactHomeBrand">
        <h1>Checkerboard Squash™</h1>
      </div>
      <button className="homeCard rotationalHomeCard" onClick={()=>setScreen('rotational')}>
        <h2>Rotational</h2>
        <p>Affordance Games</p>
        <p className="homeCardSub">Traditional Drills → CLA RLD</p>
      </button>
      <button className="homeCard diagnosticHomeCard" onClick={()=>setScreen('diagnostic')}>
        <h2>Diagnostic</h2>
        <p>Observe · Diagnose · Select Tool</p>
        <p className="homeCardSub">Diagnostic Clock → Tools → Live Quick Fix</p>
      </button>
      <button className="homeCard liveHomeCard" onClick={()=>setScreen('live')}>
        <h2>Live</h2>
        <p>Session Delivery Mode</p>
        <p className="homeCardSub">Timer · Current Game · Quick Fix · Project</p>
      </button>
      <button className="homeCard projectionHomeCard" onClick={()=>setScreen('projection')}>
        <h2>Project</h2>
        <p>Player / Projection View</p>
        <p className="homeCardSub">Simple rules · big text · less repetition</p>
      </button>
      <button className="homeCard toolsHomeCard" onClick={()=>setScreen('tools')}>
        <h2>Tools</h2>
        <p>Constraint & Coaching Tools</p>
        <p className="homeCardSub">Visual · Haptic · Spatial · Analogy · Scaling</p>
      </button>
      <button className="homeCard level0HomeCard" onClick={()=>setScreen('level0')}>
        <h2>Level 0</h2>
        <p>Exploration Stage · Ages 5–9</p>
        <p className="homeCardSub">Move · Track · Strike · Play · Mini Checkerboard</p>
      </button>
<button className="tile blue" onClick={()=>setScreen('sessions')}><h2>Sessions</h2><p>Build flexible rotation-based sessions.</p></button>
<button className="tile purple" onClick={()=>setScreen('games')}><h2>Level 1–5</h2><p>ATL / BTL, conditioned games, checkerboard, technical and pressure games.</p></button>
<button className="tile green" onClick={()=>setScreen('players')}><h2>Players</h2><p>Junior Programme Ranking, attendance and guests.</p></button>
<button className="tile red" onClick={()=>setScreen('competition')}><h2>Competition</h2><p>Round Robin, Monrad, Invasion and NSL.</p></button>
<button className="tile navy" onClick={()=>setScreen('storage')}><h2>Storage</h2><p>Backup and restore players, attendance and sessions.</p></button>
<button className="homeTile doubleBounceTile" onClick={()=>setScreen('doubleBounce')}>
  <h2>Double Bounce</h2>
  <p>Move Mindset · Tactical Patience · Rally Quality</p>
</button><button className="homeTile technicalOverlayTile" onClick={()=>setScreen('technical')}>
  <h2>Technical Overlays</h2>
  <p>Perception–Action Constraints · Live Overlay Engine</p>
</button><button className="homeTile mentalSkillsTile" onClick={()=>setScreen('mentalSkills')}>
  <h2>Mental Performance</h2>
  <p>Attention · Regulation · Competitive Behaviours</p>
</button></div>;
}

function GameSelector({onAddToSession,addButtonText='Add To Session'}){
const[category,setCategory]=useState(null);
const[atl,setAtl]=useState(DEFAULT_ATL);
const[selectedGame,setSelectedGame]=useState(null);
const[manualLayers,setManualLayers]=useState([]);const[atlHistory,setAtlHistory]=useState([]);
const cats=['ATL / BTL','Classic Conditioned','Checkerboard','Volley & Intercept','Pressure','Technical','Invasion','Matchplay'];
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
return <div>
<div className="gameMenuGrid">{cats.map(cat=><button key={cat} className={category===cat?'gameMenu activeGameMenu':'gameMenu'} onClick={()=>{setCategory(cat);setSelectedGame(null);}}>{cat}</button>)}</div>
{!category&&<div className="placeholder">Choose a game category. No game opens by default.</div>}
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
<div className="overlayPanel"><strong>Universal Overlays</strong><div className="quickLayers">{ALL_LAYERS.map(layer=><button key={layer} className={manualLayers.includes(layer)?'activeLayer':''} onClick={()=>toggleManualLayer(layer)}>{manualLayers.includes(layer)?'✓ ':'+ '}{layer}</button>)}</div><div className="buttonRow"><button className="secondaryBtn" onClick={undoAtl} disabled={atlHistory.length===0}>Undo ATL Change</button><button className="secondaryBtn" onClick={clearAtlOverlays}>Clear Overlays</button><button className="secondaryBtn" onClick={resetAtlBuilder}>Reset ATL / BTL</button></div></div>
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

function addLayer(index,layer){saveSessionSnapshot();const updated=clone(session);if(!updated[index].layers.includes(layer))updated[index].layers.push(layer);setSession(updated);}
function updateCb(index,code){saveSessionSnapshot();const updated=clone(session);updated[index].cbCode=code;if(code!=='None'&&!updated[index].layers.includes('CB Code'))updated[index].layers.push('CB Code');if(code==='None')updated[index].layers=updated[index].layers.filter(layer=>layer!=='CB Code');setSession(updated);}
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
<div className="chips">{game.layers.map(layer=><span className="badge" key={layer}>{layer}</span>)}</div>
<div className="quickLayers">{ALL_LAYERS.filter(layer=>!game.layers.includes(layer)).map(layer=><button key={layer} onClick={()=>addLayer(index,layer)}>+ {layer}</button>)}</div>
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
    <div className="overlayPanel"><strong>Additional Overlays</strong><div className="quickLayers">{ALL_LAYERS.map(layer=><button key={layer} className={(config.layers||[]).includes(layer)?'activeLayer':''} onClick={()=>toggleLayer(layer)}>{(config.layers||[]).includes(layer)?'✓ ':'+ '}{layer}</button>)}</div></div>
    
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
  const [atl,setAtl]=useState(DEFAULT_ATL); const [side,setSide]=useState('Right side'); const [useCustomCb,setUseCustomCb]=useState(false); const [customCbZone,setCustomCbZone]=useState('');
  const [manualLayers,setManualLayers]=useState([]);
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

    <div className="overlayPanel">
      <strong>Universal Overlays</strong>
      <div className="quickLayers">
        {ALL_LAYERS.map(layer=><button key={layer} className={manualLayers.includes(layer)?'activeLayer':''} onClick={()=>toggleManualLayer(layer)}>{manualLayers.includes(layer)?'✓ ':'+ '}{layer}</button>)}
      </div>
      <div className="buttonRow">
        <button className="secondaryBtn" onClick={undoAtl} disabled={atlHistory.length===0}>Undo ATL Change</button>
        <button className="secondaryBtn" onClick={clearAtlOverlays}>Clear Overlays</button>
        <button className="secondaryBtn" onClick={resetAtlBuilder}>Reset ATL / BTL</button>
      </div>
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

      <div className="conditionedOverlayChooser">
        <strong>Suggested overlays</strong><p className="overlayExplain">Suggested overlays are guidance only. Select what fits the group and learning aim.</p>
        <div className="quickLayers">{(game.suggestedOverlays||[]).map(layer=><button key={layer} className={(selectedOverlays[overlayKey(game)]||[]).includes(layer)?'activeLayer':''} onClick={()=>toggleGameOverlay(game,layer)}>{(selectedOverlays[overlayKey(game)]||[]).includes(layer)?'✓ ':'+ '}{layer}</button>)}</div>
        <div className="overlayInfoGrid">{(game.suggestedOverlays||[]).map(layer=><OverlayInfoCard key={layer} overlay={layer}/>)}</div>
        <div className="allOverlaySection"><strong>All overlays</strong><div className="quickLayers">{ALL_LAYERS.map(layer=><button key={layer} className={(selectedOverlays[overlayKey(game)]||[]).includes(layer)?'activeLayer':''} onClick={()=>toggleGameOverlay(game,layer)}>{(selectedOverlays[overlayKey(game)]||[]).includes(layer)?'✓ ':'+ '}{layer}</button>)}</div></div>
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
      layers:[],
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

  const overlayOptions=['Clean Winner','Opponent Off T','Volley Finish','Weak Side','4-Shot Window','2-Shot Window','Double Bounce','Quality Length Before Attack'];
  const cbOptions=['None','[5-4] + [5-1]','[6-3] + [6-2]','[5-4] + [8-1]','[6-3] + [7-2]','Custom'];

  function toggleLayer(layer){
    setLayers(prev=>prev.includes(layer)?prev.filter(item=>item!==layer):[...prev,layer]);
  }

  const games=[
    {
      id:'lives',
      title:'Invasion Game — Lives Format',
      tactical:'Survival · discipline · pressure management',
      task:'Defenders always serve. Players track lives. Same penalty applies to invader and defenders. Double-bounce handicaps are assigned in Competition: choose each player and set None, 1 DB, 2 DBs or Unlimited DBs.',
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

    <div className="gameClassGrid">
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
      <strong>Optional Overlays</strong>
      <p className="overlayExplain">No overlays are selected by default. Coach chooses what applies.</p>
      <div className="quickLayers">
        {overlayOptions.map(layer=><button key={layer} type="button" className={layers.includes(layer)?'activeLayer':''} onClick={()=>toggleLayer(layer)}>
          {layers.includes(layer)?'✓ ':'+ '}{layer}
        </button>)}
      </div>
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
  const randomBank=['Must play straight','Can only score in zone [1]','Can only score in zone [2]','Has 1 crosscourt per rally','Has 2 crosscourts per rally','Has 1 double bounce','Has 2 double bounces','Must win with a volley','Must complete a checkerboard pair before scoring','No condition'];

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
        <label>Double Bounce<select value={doubleBounce} onChange={e=>setDoubleBounce(e.target.value)}><option>None</option><option>1 double bounce</option><option>2 double bounces</option><option>Unlimited double bounces</option></select></label>
        <label>Checkerboard / Zone<select value={cbCode} onChange={e=>setCbCode(e.target.value)}>{cbOptions.map(option=><option key={option}>{option}</option>)}</select></label>
      </div>
    </div>

    <div className="technicalScoringBox alwaysVisibleScoring">
      <strong>Overlays</strong><p className="overlayExplain">No overlays are selected by default.</p>
      <div className="quickLayers">{overlayOptions.map(layer=><button key={layer} type="button" className={layers.includes(layer)?'activeLayer':''} onClick={()=>toggleLayer(layer)}>{layers.includes(layer)?'✓ ':'+ '}{layer}</button>)}</div>
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

function Games({setSession,setScreen}){
  const [activeClassId,setActiveClassId]=useState(null);
  const [message,setMessage]=useState('');
  const [savedCards,setSavedCards]=useState(()=>{
    try{
      const saved=localStorage.getItem(GAME_LIBRARY_KEY);
      return saved?JSON.parse(saved).map(normaliseGameCard):[];
    }catch{return[];}
  });
  const [editingCard,setEditingCard]=useState(null);

  useEffect(()=>{
    localStorage.setItem(GAME_LIBRARY_KEY,JSON.stringify(savedCards));
  },[savedCards]);

  const gameClasses=[
    {id:'atl',label:'ATL / BTL',category:'ATL / BTL'},
    {id:'checkerboard',label:'Checkerboard',category:'Checkerboard'},
    {id:'classic',label:'Classic Games',category:'Classic Conditioned'},
    {id:'technical',label:'Technical',category:'Technical'},
    {id:'volley',label:'Volley & Intercept',category:'Volley & Intercept'},
    {id:'pressure',label:'Pressure',category:'Pressure'},
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
    setSession(prev=>[...prev,finalGame]);
    setMessage(`${game.title||'Game'} added to Session Builder.`);
    setScreen('sessions');
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
    <MentalOverlaySelector context="Conditioned Games"/>


    <div className="gameClassGrid">
      {gameClasses.map(gameClass=>
        <button type="button" key={gameClass.id} className={activeClassId===gameClass.id?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>selectClass(gameClass.id)}>
          {gameClass.label}
        </button>
      )}
    </div>

    {!activeClassId&&<div className="placeholder">Tap a game class above.</div>}

    {editingCard&&<UniversalGameEditor key="editor" game={editingCard} onSave={saveCard} onCancel={()=>setEditingCard(null)}/>}

    {activeClassId==='checkerboard'&&<CheckerboardEngine key="checkerboard-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='atl'&&<ATLBTLDirectBuilder key="atl-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='classic'&&<ClassicConditionedBuilder key="classic-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='technical'&&<TechnicalFocusBuilder key="technical-engine" onAddToSession={addAndGo}/>}
    {activeClassId==='custom'&&<CustomGameBuilder key="custom-engine" onAddToSession={addAndGo}/>}

    

    {activeClassId&& !['checkerboard','atl','classic','technical','custom','saved'].includes(activeClassId)&&
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
            <button onClick={()=>addStay(card)}>Add To Session</button>
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
function saveSnapshot(){setHistory([...history,players]);}
function undo(){if(history.length===0)return;setPlayers(history[history.length-1]);setHistory(history.slice(0,-1));}
function updateCategory(category){const found=LEVELS.find(level=>level.label===category);setForm({...form,category,level:found?found.level:1});}
function savePlayer(){if(!form.name.trim())return;saveSnapshot();if(editing!==null){const updated=[...players];updated[editing]={...form,name:form.name.trim()};setPlayers(updated);}else setPlayers([...players,{...form,name:form.name.trim()}]);setForm(EMPTY_PLAYER);setEditing(null);setShowForm(false);}
function editPlayer(player,index){const{originalIndex,...clean}=player;setForm({...EMPTY_PLAYER,...clean});setEditing(index);setShowForm(true);window.scrollTo(0,0);}
function deletePlayer(index){saveSnapshot();setPlayers(players.filter((_,i)=>i!==index));}
function togglePresent(index){const updated=[...players];updated[index]={...updated[index],present:!updated[index].present};setPlayers(updated);}
function addGuest(){if(!guestName.trim())return;const level=guestEstimate.includes('5')?5:guestEstimate.includes('4')?4:guestEstimate.includes('3')?3:guestEstimate.includes('2')?2:1;saveSnapshot();setPlayers([...players,{...EMPTY_PLAYER,name:guestName.trim(),playerType:'Guest Player',category:'Guest',level,juniorRanking:'',guestEstimate,attendance:'Guest today',present:true}]);setGuestName('');setGuestEstimate('Level 3 guest');}
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
<button className="primaryBtn" onClick={addGuest}>Add Present Guest</button></div></div>
{players.length===0&&<div className="placeholder">No players added yet. Add players or guests above.</div>}
<div className="playerGrid">{sorted.map(player=><div className="playerCard" key={`${player.name}-${player.originalIndex}`}><h3>{player.name}</h3>
<div className="badgeRow"><span className="badge">{player.playerType}</span><span className="badge">{player.category}</span><span className="badge">Level {player.level}</span><span className="badge">{player.playerType==='Programme Player'?`JPR #${player.juniorRanking||'not set'}`:'Guest'}</span></div>
<div className="infoBox"><strong>Focus</strong><p>{player.focus||'No focus added.'}</p></div>
<div className="actionRow"><button className={player.present?'activePresent':''} onClick={()=>togglePresent(player.originalIndex)}>{player.present?'Present ✓':'Mark Present'}</button><button onClick={()=>editPlayer(player,player.originalIndex)}>Edit</button><button onClick={()=>deletePlayer(player.originalIndex)}>Delete</button></div>
</div>)}</div>
</div>;
}




function Competition({players=[]}){
  const [mode,setMode]=useState('invasion');
  const [invasionFormat,setInvasionFormat]=useState('lives');
  const [invasionCourts,setInvasionCourts]=useState(3);
  const [invasionStartingLives,setInvasionStartingLives]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('checkerboardCompetitionProjection'))?.invasionStartingLives||5}catch{return 5}
  });
  const [invasionRotation,setInvasionRotation]=useState('Rotate courts when one invader loses all lives.');
  const [invasionChallenge,setInvasionChallenge]=useState('Invader tries to win points / survive pressure while defenders control risk.');
  const [invasionTeams,setInvasionTeams]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('checkerboardCompetitionProjection'))?.invasionTeams||[]}catch{return[]}
  });
  const [invasionTeamPoints,setInvasionTeamPoints]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('checkerboardCompetitionProjection'))?.invasionTeamPoints||{}}catch{return{}}
  });
  const [invasionPlayerPoints,setInvasionPlayerPoints]=useState({});
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
  const [competitionLayers,setCompetitionLayers]=useState([]);
  const [competitionCbCode,setCompetitionCbCode]=useState('None');
  const [playerBounces,setPlayerBounces]=useState({});
  const [manualPlayers,setManualPlayers]=useState('');
  const [matchScore,setMatchScore]=useState({a:0,b:0});
  const [matchPlayers,setMatchPlayers]=useState({a:'Player A',b:'Player B'});
  const [matchScoring,setMatchScoring]=useState('PAR 11');
  const [rrFixtures,setRrFixtures]=useState([]);
  const [nslOrgTab,setNslOrgTab]=useState('config');
  const [nslTeams,setNslTeams]=useState(4);
  const [nslPlayersPerTeam,setNslPlayersPerTeam]=useState(3);
  const [nslPeriod1,setNslPeriod1]=useState(20);
  const [nslPeriod2,setNslPeriod2]=useState(20);
  const [nslPeriod3,setNslPeriod3]=useState(30);
  const [nslOvertime,setNslOvertime]=useState(5);
  const [showCompetitionProjection,setShowCompetitionProjection]=useState(false);

  const present=Array.isArray(players)?players.filter(player=>player.present):[];
  const automaticNames=present.length?present.map(player=>player.name):[];
  const manualNames=manualPlayers.split('\n').map(name=>name.trim()).filter(Boolean);
  const playerNames=automaticNames.length?automaticNames:manualNames;

  const overlayOptions=['Clean Winner','Opponent Off T','T Challenge','Blind Finish','Volley Finish','Weak Side','4-Shot Window','2-Shot Window','Double Bounce','Quality Length Before Attack'];
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

  function getInvasionFairBaseTotal(){
    const fair=getFairLivesRows(invasionTeams,2);
    return fair.rows.length?fair.rows[0].totalCapacity:(Number(invasionStartingLives)||5);
  }

  function getInvasionBaseLives(team){
    const teams=(invasionTeams||[]).filter(t=>(t.players||[]).length>0);
    const fair=getFairLivesRows(teams,2);
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
    const players=(team&&team.players)||[];
    if(!players.length) return 'Waiting';
    return players[invasionPlayerRound % players.length];
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
    if(!invasionTeams.length){
      generateInvasionTeams();
    }
    setInvasionGameStarted(true);
    try{localStorage.setItem('checkerboardInvasionGameStarted','true');}catch{}
    setShowInvasionDashboard(true);
    setTimeout(()=>{
      try{
        const saved=localStorage.getItem('checkerboardCompetitionProjection');
        const current=saved?JSON.parse(saved):{};
        localStorage.setItem('checkerboardCompetitionProjection',JSON.stringify({
          ...current,
          mode:'invasion',
          invasionFormat,
          invasionTeams:invasionTeams.length?invasionTeams:current.invasionTeams||[],
          playerNames,
          playerBounces,
          invasionTeamPoints,
          invasionCarryLives,
          invasionFinishLives,
          invasionFairBaseTotal:getInvasionFairBaseTotal(),
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
    if(!invasionTeams.length){
      generateInvasionTeams();
    }
    setInvasionGameStarted(true);
    setShowInvasionDashboard(true);
    setShowProjection(false);
    try{
      localStorage.setItem('checkerboardInvasionGameStarted','true');
      localStorage.setItem('checkerboardInvasionLive','true');
      localStorage.setItem('checkerboardProjectionTab','competition');
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
        invasionTeamPoints,
        invasionCarryLives,
        invasionFinishLives,
        invasionFairBaseTotal:getInvasionFairBaseTotal(),
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

  useEffect(()=>{
    if(!invasionGameStarted) return;
    try{
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
        invasionTeamPoints,
        invasionCarryLives,
        invasionFinishLives,
        invasionFairBaseTotal:getInvasionFairBaseTotal(),
        invasionPlayerRound,
        invasionCourtRound,
        invasionGameStarted,
        invasionCourtAssignmentMode,
        showInvasionDashboard
      }));
    }catch{}
  },[invasionGameStarted,invasionFormat,invasionStartingLives,invasionTeams,invasionCarryLives,invasionFinishLives,invasionPlayerRound,invasionCourtRound,invasionCourtAssignmentMode,showInvasionDashboard]);

  function generateInvasionTeams(){
    const present=playerNames.map(name=>players.find(p=>p.name===name)||name);
    const source=present.length?present:[...playerNames];
    const count=Math.max(1,Number(invasionCourts)||2);
    const seeded=snakeSeedPlayers(source,count);
    const nextTeams=seeded.map((teamPlayers,index)=>({
      id:`team-${index+1}`,
      name:`Team ${index+1}`,
      court:`Court ${index+1}`,
      players:teamPlayers
    }));
    setInvasionTeams(nextTeams);
    setInvasionTeamPoints({});
    setInvasionTeamLives({});
    setInvasionCarryLives({});
    setInvasionFinishLives({});
    setInvasionPlayerRound(0);
    setInvasionCourtRound(0);
  }

  function addInvasionTeamPoints(teamId,amount){
    setInvasionTeamPoints(prev=>({...prev,[teamId]:(prev[teamId]||0)+amount}));
  }

  function addInvasionPlayerPoints(playerName,amount){
    setInvasionPlayerPoints(prev=>({...prev,[playerName]:(prev[playerName]||0)+amount}));
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
    setInvasionTeamLives(prev=>{
      const next={};
      invasionTeams.forEach(team=>{next[team.id]=invasionStartingLives;});
      return next;
    });
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

  function buildSimultaneousInvasionCourts(step=invasionRotationStep,useRandom=invasionCourtAssignmentMode==='random'){
    if(!invasionTeams.length){
      setInvasionCourtAssignments([]);
      return;
    }
    const teams=useRandom?shuffleInvasionArray(invasionTeams):[...invasionTeams];
    const n=teams.length;
    const assignments=teams.map((defendingTeam,idx)=>{
      const invadingTeam=teams[(idx-1+n)%n];
      const invaderList=invadingTeam.players||[];
      const invader=invaderList.length?invaderList[step%invaderList.length]:'Waiting for invader';
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

  function generateRoundRobin(){
    const names=[...playerNames];
    if(names.length<2){
      setRrFixtures([]);
      return;
    }
    const list=names.length%2===1?[...names,'BYE']:[...names];
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
    setRrFixtures(rounds);
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
      title:'NSL',
      tactical:'Team ladder pressure · rotation discipline · repeated competitive exposure',
      purpose:'NSL is a ladder / team / rotation competition format. It does not use Lives Format.',
      rules:[
        'Use NSL for ladder, team or court-rotation competition formats.',
        'No Lives Format is used in NSL.',
        'No Invasion Points Format is used in NSL.',
        'Shared overlays, checkerboard codes and double-bounce handicaps may be added.',
        'Detailed NSL draw and rotation engine planned for next competition build.'
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
    <MentalOverlaySelector context="Competition Games"/>


      <div className="gameClassGrid">
        <button type="button" className={mode==='invasion'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('invasion')}>Invasion Game</button>
        <button type="button" className={mode==='matchplay'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('matchplay')}>Matchplay</button>
        <button type="button" className={mode==='roundRobin'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('roundRobin')}>Round Robin</button>
        <button type="button" className={mode==='monrad'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('monrad')}>Monrad</button>
        <button type="button" className={mode==='nsl'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('nsl')}>NSL</button>
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
                    ?`NSL · ${nslTeams||'—'} teams · ${nslPlayersPerTeam||'—'} players / team`
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

          {mode==='nsl'&&(
            <div className="projectionInfoCard wideProjectionCard">
              <strong>NSL Sheet</strong>
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
              <button type="button" className={invasionFormat==='lives'?'activeInvasionFormat':''} onClick={()=>setInvasionFormat('lives')}>Lives Format</button>
              <button type="button" className={invasionFormat==='points'?'activeInvasionFormat':''} onClick={()=>setInvasionFormat('points')}>Points Format</button>
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
              <button type="button" className="primaryBtn" onClick={generateInvasionTeams}>Generate Teams From Attendance</button>

              {invasionTeams.length>0&&(
                <div className="invasionTeamGrid">
                  {invasionTeams.map(team=>(
                    <div className="invasionTeamCard" key={team.id}>
                      <h3>{team.name}</h3>
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
                          <strong>Team Points: {invasionTeamPoints[team.id]||0}</strong>
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
                              <span>{player}: {invasionPlayerPoints[player]||0}</span>
                              <button type="button" onClick={()=>addInvasionPlayerPoints(player,1)}>+1</button>
                              <button type="button" onClick={()=>addInvasionPlayerPoints(player,3)}>+3</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {invasionFormat==='points'&&invasionTeams.length>0&&(
                <button type="button" className="secondaryBtn" onClick={resetInvasionPoints}>Reset Invasion Points</button>
              )}

              {invasionFormat==='lives'&&invasionTeams.length>0&&(
                <button type="button" className="secondaryBtn" onClick={resetInvasionLifeBanks}>Reset Team Life Banks</button>
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

                {showInvasionDashboard&&(
                  <div className="invasionCourtDashboard">
                    {(invasionCourtAssignments.length?invasionCourtAssignments:invasionTeams.map((team,idx)=>({court:idx+1,defendingTeamId:team.id,defendingTeamName:team.name,defenders:team.players||[],invadingTeamId:'',invadingTeamName:'Waiting',invader:'Generate / rotate courts'}))).map(assign=>(
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
                              return invTeam?getInvasionStartLives(invTeam):(Number(invasionStartingLives)||5);
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
                <p>LCM fair lives: smaller teams get more lives per player so each team has equal total capacity. Carry-over then adds to the next invasion.</p>

                <div className="fairLivesGrid">
                  {invasionTeams.map(team=>(
                    <div className="fairLivesTeamCard" key={team.id}>
                      <h3>{team.name}</h3>
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

                <button type="button" className="primaryBtn" onClick={postInvasionRotationLives}>Post Lives Score After Court Rotation</button>
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
                  {invasionTeams.map(team=>(
                    <div className="finalTeamStateCard" key={team.id}>
                      <h3>{team.name}</h3>
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
                      <p><b>Defending team:</b> {defending?.name||'Waiting'}</p>
                      <p><b>Invader:</b> {invading?getFinalInvader(invading):'Waiting'} · {invading?.name||''}</p>
                      <p><b>Start lives:</b> {invading?getFinalStartLives(invading):'—'}</p>
                    </div>;
                  })}
                </div>

                <div className="finalActionRow">
                  <button type="button" className="secondaryBtn" onClick={postFinalCourtResults}>Post Remaining Lives</button>
                  <button type="button" className="primaryBtn" onClick={rotateFinalCourts}>End Court Rotation</button>
                  <button type="button" className="primaryBtn" onClick={nextFinalInvaders}>Next Invaders</button>
                  <button type="button" className="secondaryBtn" onClick={resetFinalInvasionEngine}>Reset Invasion Engine</button>
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
          <div className="competitionEnginePanel">
            <button className="primaryBtn" onClick={generateRoundRobin}>Generate Round Robin Fixtures</button>
            {rrFixtures.length===0&&<p className="overlayExplain">Uses players marked present in Attendance. Enter manual players if none are present.</p>}
            {rrFixtures.length>0&&rrFixtures.map((round,idx)=>(
              <div className="fixtureRound" key={idx}>
                <strong>Round {idx+1}</strong>
                {round.map((match,midx)=><p key={midx}>{match.a} v {match.b}</p>)}
              </div>
            ))}
          </div>
        )}


        {mode==='nsl'&&(
          <div className="nslOrganiser">
            <div className="nslHero">
              <span>NSL ORGANISER</span>
              <h2>National Squash League</h2>
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
              <div className="nslPanel">
                <h3>Sheet / Draw</h3>
                <div className="nslSheet"><div>Period 1</div><div>Team 1 v Team 2</div><div>{nslPeriod1} min</div><div>Period 2</div><div>Team 3 v Team 4</div><div>{nslPeriod2} min</div><div>Period 3</div><div>Winners / ranked rotation</div><div>{nslPeriod3} min</div><div>Overtime</div><div>If required</div><div>{nslOvertime} min</div></div>
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
          <p className="overlayExplain">Applies to all competition modes. Coach chooses only the overlays needed for the format.</p>
          <div className="quickLayers">
            {overlayOptions.map(layer=>(
              <button type="button" key={layer} className={competitionLayers.includes(layer)?'activeLayer':''} onClick={()=>toggleLayer(layer)}>
                {competitionLayers.includes(layer)?'✓ ':'+ '}{layer}
              </button>
            ))}
          </div>

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
                  <select value={playerBounces[name]||'None'} onChange={e=>setBounceFor(name,e.target.value)}>
                    <option>None</option>
                    <option>1 double bounce</option>
                    <option>2 double bounces</option>
                    <option>Unlimited double bounces</option>
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
      version:'v58',
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
    const data=backupText || JSON.stringify({app:'Checkerboard Coach',version:'v58',created:new Date().toISOString(),players,session},null,2);
    const blob=new Blob([data],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='checkerboard-backup-v58.json';
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
                      ?`NSL · ${competitionProjection.nslTeams||'—'} teams · ${competitionProjection.nslPlayersPerTeam||'—'} players per team`
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
        {['Clean Winner','Opponent Off T','Volley Finish','Double Bounce','4-Shot Window','2-Shot Window','Quality Length Before Attack'].map(layer=><button key={layer} className={quickLayer===layer?'activeLayer':''} onClick={()=>setQuickLayer(quickLayer===layer?'':layer)}>{quickLayer===layer?'✓ ':'+ '}{layer}</button>)}
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

function App(){
const[screen,setScreen]=useState('home');
const[players,setPlayers]=useState(()=>{try{return JSON.parse(localStorage.getItem(PLAYER_KEY))||[]}catch{return[]}});
const[session,setSession]=useState(()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY))||[]}catch{return[]}});
useEffect(()=>{localStorage.setItem(PLAYER_KEY,JSON.stringify(players));},[players]);
useEffect(()=>{localStorage.setItem(SESSION_KEY,JSON.stringify(session));},[session]);
return <div>
<header className="hero"><button className="homeBtn" onClick={()=>setScreen('home')}>HOME</button><div><div className="eyebrow">CHECKERBOARD COACH</div><h1>Rebuilt Master v99h43</h1><p>Sessions · Games · Players · Competition</p></div></header>
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
{screen==='players'&&<Players players={players} setPlayers={setPlayers}/>}{screen==='technical'&&<TechnicalOverlays setScreen={setScreen}/>} {screen==='doubleBounce'&&<DoubleBounceTool setScreen={setScreen}/>} {screen==='mentalSkills'&&<MentalSkillsPlaceholder setScreen={setScreen}/>} 
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
