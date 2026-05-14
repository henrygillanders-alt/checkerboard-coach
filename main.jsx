
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


function ProjectionView({session,setScreen}){
  const [selectedIndex,setSelectedIndex]=useState(0);
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

function Home({setScreen}){
return <div className="homeGrid">
      <div className="homeBrandCard">
        <h1>Checkerboard Squash™</h1>
        <p>Henry Gillanders</p>
        <p>MA Psychology · MSc Sport Psychology · WSF Level 3</p>
        <small>© 2026 · All Rights Reserved</small>
      </div>
      <button className="homeCard rotationalHomeCard" onClick={()=>setScreen('rotational')}>
        <h2>ROTATIONAL</h2>
        <p>Affordance Games</p>
        <p className="homeCardSub">Traditional Drills → CLA RLD</p>
      </button>
      <button className="homeCard diagnosticHomeCard" onClick={()=>setScreen('diagnostic')}>
        <h2>DIAGNOSTIC</h2>
        <p>Observe · Diagnose · Select Tool</p>
        <p className="homeCardSub">Diagnostic Clock → Tools → Live Quick Fix</p>
      </button>
      <button className="homeCard liveHomeCard" onClick={()=>setScreen('live')}>
        <h2>LIVE</h2>
        <p>Session Delivery Mode</p>
        <p className="homeCardSub">Timer · Current Game · Quick Fix · Project</p>
      </button>
      <button className="homeCard projectionHomeCard" onClick={()=>setScreen('projection')}>
        <h2>PROJECT</h2>
        <p>Player / Projection View</p>
        <p className="homeCardSub">Simple rules · big text · less repetition</p>
      </button>
      <button className="homeCard toolsHomeCard" onClick={()=>setScreen('tools')}>
        <h2>TOOLS</h2>
        <p>Constraint & Coaching Tools</p>
        <p className="homeCardSub">Visual · Haptic · Spatial · Analogy · Scaling</p>
      </button>
      <button className="homeCard level0HomeCard" onClick={()=>setScreen('level0')}>
        <h2>LEVEL 0</h2>
        <p>Exploration Stage · Ages 5–9</p>
        <p className="homeCardSub">Move · Track · Strike · Play · Mini Checkerboard</p>
      </button>
<button className="tile blue" onClick={()=>setScreen('sessions')}><h2>Sessions</h2><p>Build flexible rotation-based sessions.</p></button>
<button className="tile purple" onClick={()=>setScreen('games')}><h2>Level 1–5</h2><p>ATL / BTL, conditioned games, checkerboard, technical and pressure games.</p></button>
<button className="tile green" onClick={()=>setScreen('players')}><h2>Players</h2><p>Junior Programme Ranking, attendance and guests.</p></button>
<button className="tile red" onClick={()=>setScreen('competition')}><h2>Competition</h2><p>Round Robin, Monrad, Invasion and NSL.</p></button>
<button className="tile navy" onClick={()=>setScreen('storage')}><h2>Storage</h2><p>Backup and restore players, attendance and sessions.</p></button>
</div>;
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
<div className="actionRow"><button onClick={()=>duplicate(index)}>Duplicate + Progress</button></div>
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
    <div className="categoryTag">TOOLS</div>
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
        {visibleCards.map(card=><UniversalGameCard key={card.id} game={card} onAdd={addStay} onEdit={setEditingCard} onDuplicate={duplicateCard} onDelete={deleteCard}/>)}
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
const sorted=sortPlayers(players);
return <div className="page">
<div className="pageTop"><h1>Players</h1><div className="buttonRow"><button className="secondaryBtn" onClick={undo} disabled={history.length===0}>Undo</button><button className="primaryBtn" onClick={()=>{setEditing(null);setForm(EMPTY_PLAYER);setShowForm(!showForm);}}>+ Add Player</button></div></div>
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
  const [competitionLayers,setCompetitionLayers]=useState([]);
  const [competitionCbCode,setCompetitionCbCode]=useState('None');
  const [playerBounces,setPlayerBounces]=useState({});
  const [manualPlayers,setManualPlayers]=useState('');

  const present=Array.isArray(players)?players.filter(player=>player.present):[];
  const automaticNames=present.length?present.map(player=>player.name):[];
  const manualNames=manualPlayers.split('\n').map(name=>name.trim()).filter(Boolean);
  const playerNames=automaticNames.length?automaticNames:manualNames;

  const overlayOptions=['Clean Winner','Opponent Off T','Blind Finish','Volley Finish','Weak Side','4-Shot Window','2-Shot Window','Double Bounce','Quality Length Before Attack'];
  const cbOptions=['None','[5-4] + [5-1]','[6-3] + [6-2]','[5-4] + [8-1]','[6-3] + [7-2]','Custom'];

  function toggleLayer(layer){
    setCompetitionLayers(prev=>prev.includes(layer)?prev.filter(item=>item!==layer):[...prev,layer]);
  }

  function setBounceFor(name,value){
    setPlayerBounces(prev=>({...prev,[name]:value}));
  }

  const modeInfo={
    invasion:{
      title:'Invasion Game',
      tactical:invasionFormat==='lives'
        ?'Survival · discipline · pressure management'
        :'Initiative · aggression · opportunity recognition',
      purpose:invasionFormat==='lives'
        ?'Preferred low-admin format. Players keep their own lives tally.'
        :'Points team format. Teams accumulate points across rotations.',
      rules:invasionFormat==='lives'
        ?[
          'Choose Lives format.',
          'Invader always serves.',
          'Defenders track remaining lives.',
          'Same penalty applies to invader and defenders.',
          'If a player hits out / into balcony, they lose the agreed life or penalty.',
          'Double-bounce handicaps can be assigned to individual players.'
        ]
        :[
          'Choose Points Format format.',
          'Invader always serves.',
          'Timed rotations.',
          '+1 if defending team hits the ball out.',
          '+3 if defending team hits the ball into the balcony.',
          'Total team score calculated at the end of all rotations.',
          'Double-bounce handicaps can be assigned to individual players.'
        ]
    },
    roundRobin:{
      title:'Round Robin',
      tactical:'Consistency across multiple opponents',
      purpose:'Every player/team competes against all others.',
      rules:['Draw grid and score-entry engine planned.','Standings and ranking calculation planned.','Shared overlays and double-bounce handicaps apply.']
    },
    monrad:{
      title:'Monrad',
      tactical:'Adaptation across progressive rounds',
      purpose:'Players face opponents with similar records after each round.',
      rules:['Winner/loser progression planned.','Automatic redraw planned.','Shared overlays and double-bounce handicaps apply.']
    },
    matchplay:{
      title:'Matchplay',
      tactical:'Opponent adaptation · score pressure · tactical clarity',
      purpose:'Run match-based formats with overlays, checkerboard codes and player-specific handicaps.',
      rules:[
        'Use matchplay when the goal is tactical adaptation under normal scoring pressure.',
        'Shared overlays and double-bounce handicaps apply.',
        'Coach can add checkerboard or tactical overlays as required.'
      ]
    },
    nsl:{
      title:'NSL',
      tactical:'Sustained pressure and fatigue adaptation',
      purpose:'Continuous ladder pressure environment.',
      rules:['Shared overlays and double-bounce handicaps apply.']
    }
  };

  const current=modeInfo[mode];

  return <div className="page">
    <div className="pageTop"><h1>Competition</h1></div>

    <div className="gameClassGrid">
      <button type="button" className={mode==='invasion'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('invasion')}>Invasion Game</button>
      <button type="button" className={mode==='roundRobin'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('roundRobin')}>Round Robin</button>
      <button type="button" className={mode==='monrad'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('monrad')}>Monrad</button>
      <button type="button" className={mode==='matchplay'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('matchplay')}>Matchplay</button>
      <button type="button" className={mode==='nsl'?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setMode('nsl')}>NSL</button>
    </div>

    <div className="gameCard">
      <div className="categoryTag">Competition Mode</div>
      <h2>{current.title}</h2>

      {mode==='invasion'&&<div className="atlOptionsGrid">
        <label>Invasion Format
          <select value={invasionFormat} onChange={e=>setInvasionFormat(e.target.value)}>
            <option value="lives">Lives Format</option>
            <option value="timed">Points Format</option>
          </select>
        </label>
      </div>}

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
        <ul>{current.rules.map(rule=><li key={rule}>{rule}</li>)}</ul>
      </div>

      <div className="technicalScoringBox alwaysVisibleScoring">
        <strong>Competition Overlays</strong>
        <p className="overlayExplain">Applies to all competition modes. Coach chooses only the overlays needed for the format.</p>
        <div className="quickLayers">
          {overlayOptions.map(layer=>
            <button type="button" key={layer} className={competitionLayers.includes(layer)?'activeLayer':''} onClick={()=>toggleLayer(layer)}>
              {competitionLayers.includes(layer)?'✓ ':'+ '}{layer}
            </button>
          )}
        </div>

        <label>Checkerboard Code / Sequence
          <select value={competitionCbCode} onChange={e=>setCompetitionCbCode(e.target.value)}>
            {cbOptions.map(option=><option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="technicalScoringBox">
        <strong>Double-Bounce Handicaps</strong>
        <p className="overlayExplain">Assign double-bounce allowances to particular players. This applies in all competition modes: choose each player’s DB allowance from the dropdown.</p>

        {!automaticNames.length&&<label>Manual Players
          <textarea value={manualPlayers} onChange={e=>setManualPlayers(e.target.value)} placeholder="One player per line"/>
        </label>}

        {playerNames.length>0&&<div className="playerBounceGrid">
          {playerNames.map(name=><label key={name}>{name}
            <select value={playerBounces[name]||'None'} onChange={e=>setBounceFor(name,e.target.value)}>
              <option>None</option>
              <option>1 double bounce</option>
              <option>2 double bounces</option>
              <option>Unlimited double bounces</option>
            </select>
          </label>)}
        </div>}

        {!playerNames.length&&<div className="placeholder">Mark players present or enter manual players to assign double-bounce handicaps.</div>}
      </div>

      <div className="infoBox">
        <strong>Active Competition Setup</strong>
        <p><strong>Mode:</strong> {current.title}</p>
        {mode==='invasion'&&<p><strong>Invasion format:</strong> {invasionFormat==='lives'?'Lives Format':'Points Format'}</p>}
        <p><strong>Overlays:</strong> {competitionLayers.length?competitionLayers.join(' · '):'None selected'}</p>
        <p><strong>Checkerboard:</strong> {competitionCbCode}</p>
      </div>
    </div>
  </div>;
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
  const active=session&&session.length?session[session.length-1]:null;

  const presentPlayers=Array.isArray(players)
    ?players.filter(player=>player.present)
    :[];

  return <div className="projectionPage">
    <div className="projectionPanel">
      <div className="projectionHeader">PLAYER DISPLAY / PROJECTION VIEW</div>

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
        <button className="secondaryBtn" onClick={()=>setScreen('projection')}>Project</button>
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
<header className="hero"><button className="homeBtn" onClick={()=>setScreen('home')}>HOME</button><div><div className="eyebrow">CHECKERBOARD COACH</div><h1>Rebuilt Master v99b</h1><p>Sessions · Games · Players · Competition</p></div></header>
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
{screen==='players'&&<Players players={players} setPlayers={setPlayers}/>}
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
