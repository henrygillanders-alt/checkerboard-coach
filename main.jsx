
import React,{useEffect,useMemo,useState}from'react';
import{createRoot}from'react-dom/client';
import'./styles.css';

const PLAYER_KEY='checkerboard_master_v54_players';
const SESSION_KEY='checkerboard_master_v54_session';
const GAME_LIBRARY_KEY='checkerboard_master_v60_games';

const LEVELS=[
{label:'Bronze',level:1},{label:'Silver',level:2},{label:'Gold / Elite',level:3},{label:'Performance',level:4},{label:'Professional',level:5}
];

const ALL_LAYERS=['Clean Winner','Opponent Off T','Blind Finish','Volley Finish','Weak Side','4-Shot Window','2-Shot Window','Double Bounce','Quality Length Before Attack'];
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
{id:'length-before-attack',title:'Length Before Attack',category:'Classic Conditioned',duration:8,format:'King of Court',task:'Player must create length pressure before attacking short.',rationale:'Encourages patient pressure construction rather than rushed attacks.',coach:'Watch whether players attack only after the opponent is displaced, late or off balance.',layers:['Quality Length Before Attack','Clean Winner'],cbCode:'None'},
{id:'off-t-bonus',title:'Opponent Off-T Bonus',category:'Classic Conditioned',duration:8,format:'King of Court',task:'Bonus if the winning shot is played while the opponent is outside the T-zone.',rationale:'Rewards recognition of opponent recovery state, not just shot execution.',coach:'Cue players to notice opponent position before selecting the attack.',layers:['Opponent Off T','Clean Winner'],cbCode:'None'},
{id:'cb-pair',title:'Checkerboard Pair Challenge',category:'Checkerboard',duration:8,format:'King of Court',task:'Complete a selected checkerboard pair before bonus scoring opens.',rationale:'Builds tactical linking and opponent displacement awareness.',coach:'Use the code as tactical intention, not a hoop to jump through.',layers:['CB Code','Clean Winner'],cbCode:'[6-4] + [8-1]'},
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
  return {id:Date.now()+Math.random(),title:'',category:'Custom Coach Game',duration:8,format:'King of Court',task:'',rationale:'',coach:'',layers:['Clean Winner'],cbCode:'None',saved:true,favourite:false};
}
function sortPlayers(players){
return players.map((player,originalIndex)=>({...player,originalIndex})).sort((a,b)=>{
const aRank=a.playerType==='Programme Player'?Number(a.juniorRanking&&String(a.juniorRanking).trim()!==''?a.juniorRanking:9999):9000-Number(a.level||0);
const bRank=b.playerType==='Programme Player'?Number(b.juniorRanking&&String(b.juniorRanking).trim()!==''?b.juniorRanking:9999):9000-Number(b.level||0);
return aRank-bRank;
});
}

function Home({setScreen}){
return <div className="homeGrid">
<button className="tile blue" onClick={()=>setScreen('sessions')}><h2>Sessions</h2><p>Build flexible rotation-based sessions.</p></button>
<button className="tile purple" onClick={()=>setScreen('games')}><h2>Games</h2><p>ATL / BTL, conditioned games, checkerboard and pressure games.</p></button>
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

function Sessions({session,setSession}){const[sessionHistory,setSessionHistory]=useState([]);function saveSessionSnapshot(){setSessionHistory(prev=>[...prev,clone(session)]);}function undoSession(){const last=sessionHistory[sessionHistory.length-1];if(!last)return;setSession(last);setSessionHistory(sessionHistory.slice(0,-1));}
const total=session.reduce((sum,game)=>sum+Number(game.duration||0),0);
function addGame(game){saveSessionSnapshot();setSession(prev=>[...prev,game]);}
function remove(index){saveSessionSnapshot();setSession(session.filter((_,i)=>i!==index));}
function duplicate(index){saveSessionSnapshot();const copy=clone(session[index]);copy.id=Date.now()+Math.random();copy.title=copy.title+' + progression';setSession([...session.slice(0,index+1),copy,...session.slice(index+1)]);}
function addLayer(index,layer){saveSessionSnapshot();const updated=clone(session);if(!updated[index].layers.includes(layer))updated[index].layers.push(layer);setSession(updated);}
function updateCb(index,code){saveSessionSnapshot();const updated=clone(session);updated[index].cbCode=code;if(code!=='None'&&!updated[index].layers.includes('CB Code'))updated[index].layers.push('CB Code');if(code==='None')updated[index].layers=updated[index].layers.filter(layer=>layer!=='CB Code');setSession(updated);}
return <div className="page">
<div className="pageTop"><h1>Session Builder</h1><div className="buttonRow"><div className="totalBox">Total: {total} mins</div><button className="secondaryBtn" onClick={undoSession} disabled={sessionHistory.length===0}>Undo</button><button className="secondaryBtn" onClick={()=>{saveSessionSnapshot();setSession([])}}>Clear Session</button></div></div>
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
  {level:3,label:'Level 3 — Triple + T-zone prevention',challenge:'triple',window:'No window',tZone:true,description:'Triple challenge. T-zone prevention applies. Challenge is banked once completed.'},
  {level:4,label:'Level 4 — Triple + 4-shot window',challenge:'triple',window:'4-shot window',tZone:true,description:'Triple challenge with T-zone prevention. Win within 4 shots after completing challenge or reset.'},
  {level:5,label:'Level 5 — Triple + 2-shot window',challenge:'triple',window:'2-shot window',tZone:true,description:'Triple challenge with T-zone prevention. Win within 2 shots after completing challenge or reset.'}
];
const COMPLETION_CONSTRAINTS=['Clean winner','Volley finish','Opposite side finish','Weak-side finish','Front wall finish','Floor finish','Opponent moving forward','Opponent off balance','Opponent off T'];
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


function ATLBTLDirectBuilder({onAddToSession}){
  const [atl,setAtl]=useState(DEFAULT_ATL);
  const [manualLayers,setManualLayers]=useState([]);
  const [atlHistory,setAtlHistory]=useState([]);

  const builtAtl=useMemo(()=>buildAtl(atl),[atl]);
  const composedAtl=useMemo(()=>({...builtAtl,layers:[...new Set([...(builtAtl.layers||[]),...manualLayers])]}),[builtAtl,manualLayers]);

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
  const [selectedFamily,setSelectedFamily]=useState('All');

  const scoringProtocol='Win rally = 1 · Complete challenge bonus by game · Win after completing challenge = +3 · Clean winner = +2 and sits on top of all scoring';

  const games=[
    {
      title:'What Does Advantage Look Like?',
      family:'Advantage Recognition',
      level:'Levels 1–3',
      duration:8,
      format:'King of Court',
      task:'Normal rally. A point is scored for winning the rally. Bonus is available when the winning shot is played after a visible advantage: opponent outside the T-zone, late, off balance, or still moving.',
      rationale:'Teaches players to recognise the state of the opponent before choosing to attack.',
      coach:'Ask: “What did the opponent look like before you attacked?” Reward recognition more than shot choice.',playerFocus:'Notice opponent position, balance and recovery before choosing to attack.',
      scoring:'Win rally = 1 · Win after visible advantage = +3 · Clean winner = +2',
      layers:['Opponent Off T','Clean Winner'],
      antiGaming:'If a player deliberately kills the rally to avoid the opponent earning a bonus, normal rally point is awarded to the opponent.'
    },
    {
      title:'T-Zone Denial Game',
      family:'T-Zone Games',
      level:'Levels 2–5',
      duration:8,
      format:'King of Court',
      task:'Bonus unlocks when the player wins the rally while the opponent is outside the marked T-zone. From higher levels, add 4-shot or 2-shot conversion windows.',
      rationale:'Connects tactical construction with opponent displacement and recovery prevention.',
      coach:'Use a marked T-zone. The opponent must clearly be outside it when the winning shot is played.',playerFocus:'Move the opponent away from the T before trying to finish.',
      scoring:'Win rally = 1 · Win while opponent outside T-zone = +3 · Clean winner = +2',
      layers:['Opponent Off T','4-Shot Window','2-Shot Window','Clean Winner'],
      antiGaming:'Opponent cannot intentionally stop movement or abandon recovery to distort the condition.'
    },
    {
      title:'Central Control: One Foot In T-Zone Finish',
      family:'T-Zone Games',
      level:'Levels 3–5',
      duration:8,
      format:'Rally Game',
      task:'Winning shot only receives bonus if the striker has at least one foot in the marked T-zone when striking the winning shot.',
      rationale:'Links central control, balance and tactical timing rather than only shot execution.',
      coach:'Use the foot-in-zone rule as a clear binary condition. Do not overcoach technique.',
      scoring:'Win rally = 1 · T-zone contact finish = +3 · Clean winner = +2',
      layers:['Opponent Off T','Clean Winner'],
      antiGaming:'If contact location is unclear, no bonus; rally point still stands.'
    },
    {
      title:'Central Control Volley Finish',
      family:'T-Zone Games',
      level:'Levels 3–5',
      duration:8,
      format:'Rally Game',
      task:'Bonus only applies when the winning shot is a volley played from central control.',
      rationale:'Encourages players to earn intercepting opportunities through pressure and positioning.',
      coach:'The volley should be earned, not hunted recklessly.',
      scoring:'Win rally = 1 · Volley finish from central control = +3 · Clean winner = +2',
      layers:['Volley Finish','Opponent Off T','Clean Winner'],
      antiGaming:'Do not award bonus for speculative/unsafe volley attempts that ignore rally information.'
    },
    {
      title:'Length Before Attack',
      family:'Pressure Construction',
      level:'Levels 2–5',
      duration:8,
      format:'King of Court',
      task:'Player must first create length pressure before attacking short. The attack bonus opens after the opponent is delayed, displaced or unable to recover normally.',
      rationale:'Prevents rushed front-court attacks and encourages pressure construction first.',
      coach:'Watch whether the attack is invited by opponent state or forced without advantage.',playerFocus:'Build length pressure first, then attack when the opponent is delayed or displaced.',
      scoring:'Win rally = 1 · Win after length-created advantage = +3 · Clean winner = +2',
      layers:['Quality Length Before Attack','4-Shot Window','2-Shot Window','Clean Winner'],
      antiGaming:'If a player hits short before any pressure is created, only the rally point is available.'
    },
    {
      title:'Route Breaker',
      family:'Pressure Construction',
      level:'Levels 3–5',
      duration:8,
      format:'Rally Game',
      task:'Player must change the opponent’s movement route before the bonus opens. Examples: pull forward then send behind, send across body-line, or force recovery away from T before attacking.',
      rationale:'Develops tactical disruption rather than repetitive pattern hitting.',
      coach:'Ask whether the opponent’s route was actually broken. If not, no bonus.',playerFocus:'Change the opponent’s movement route before selecting the winning shot.',
      scoring:'Win rally = 1 · Route broken before winning = +3 · Clean winner = +2',
      layers:['Opponent Off T','Weak Side','Clean Winner'],
      antiGaming:'Opponent cannot deliberately stop chasing to deny that their route was broken.'
    },
    {
      title:'Double Bounce Pressure',
      family:'Adapted Rules',
      level:'Mixed Standard',
      duration:8,
      format:'Winner Stays On',
      task:'Weaker player may use allocated double bounces. Stronger player has fewer or none. Winner can lose one double bounce after each rally won if coach wants progressive balancing.',
      rationale:'Balances mixed ability groups without removing perception, movement or rally pressure.',
      coach:'Use double bounce as a player-specific constraint, not a permanent advantage.',
      scoring:'Normal rally scoring · optional: winner loses one double bounce after each rally won',
      layers:['Double Bounce'],
      antiGaming:'Players may not intentionally wait for a second bounce if they could clearly play the first bounce safely, unless the learning purpose is movement timing.'
    },
    {
      title:'Winner Loses A Bounce',
      family:'Adapted Rules',
      level:'Mixed Standard',
      duration:8,
      format:'Winner Stays On',
      task:'Incoming player starts with double bounce. After every rally won, the winner loses one available bounce advantage until back to normal one-bounce squash.',
      rationale:'Prevents the strongest player over-dominating and keeps challenge high for everyone.',
      coach:'Use especially with uneven groups or mixed standards.',
      scoring:'Normal rally scoring · track bounce allowance per player',
      layers:['Double Bounce'],
      antiGaming:'If tracking becomes confusing, reset allowances every 3–5 rallies.'
    },
    {
      title:'Blind Finish Progression',
      family:'Blind / Hidden Conditions',
      level:'Levels 3–5',
      duration:8,
      format:'Rally Game',
      task:'Before the rally, player secretly receives a finish condition: front wall finish, floor finish, volley finish, opposite side finish or clean winner.',
      rationale:'Creates tactical intention while preserving live decision-making and secrecy.',
      coach:'The hidden condition should shape the player’s perception, not force a bad shot.',
      scoring:'Win rally = 1 · Achieve hidden finish = +2 · Win after hidden finish condition = +3 · Clean winner = +2',
      layers:['Blind Finish','Clean Winner','Volley Finish'],
      antiGaming:'If the hidden condition is impossible in the rally, player should continue normal rally rather than force it.'
    },
    {
      title:'Opponent Moving Forward',
      family:'Opponent-State Games',
      level:'Levels 3–5',
      duration:8,
      format:'Rally Game',
      task:'Bonus applies if the player wins while the opponent is still moving forward or has not recovered from forward movement.',
      rationale:'Develops recognition of opponent momentum and recovery state.',
      coach:'Clarify: opponent must still be moving forward, braking, or unable to recover normally when the winning shot is played.',
      scoring:'Win rally = 1 · Win while opponent moving forward = +3 · Clean winner = +2',
      layers:['Opponent Off T','Clean Winner'],
      antiGaming:'Do not award bonus if opponent had clearly recovered and reset.'
    },
    {
      title:'Opposite Side Finish',
      family:'Opponent-State Games',
      level:'Levels 3–5',
      duration:8,
      format:'Rally Game',
      task:'Bonus applies when the finishing shot is played to the opposite side of the opponent’s body line or recovery direction.',
      rationale:'Links finishing choice to opponent orientation rather than a fixed target.',
      coach:'Use body-line as the reference, not simply left/right court side.',
      scoring:'Win rally = 1 · Opposite side finish = +3 · Clean winner = +2',
      layers:['Weak Side','Clean Winner'],
      antiGaming:'If body-line reference is unclear, no bonus.'
    }
  ];

  const families=['All',...Array.from(new Set(games.map(game=>game.family)))];
  const filtered=selectedFamily==='All'?games:games.filter(game=>game.family===selectedFamily);

  function addGame(game){
    onAddToSession({
      ...game,
      id:Date.now()+Math.random(),
      category:'Classic Conditioned',
      cbCode:'None',
      format:game.format||'Rally Game',
      duration:game.duration||8,
      coachFocus:game.coach,playerFocus:game.playerFocus||'Focus on the cue that unlocks the scoring condition.',coach:`${game.coach} Anti-gaming: ${game.antiGaming}`,
      rationale:game.rationale,
      task:game.task,
      layers:game.layers||[],
      scoring:game.scoring
    });
  }

  return <div className="gameCard">
    <div className="categoryTag">Classic Conditioned</div>
    <h2>Classic Conditioned Games</h2>
    <p className="engineIntro">Conditioned games built around advantage recognition, opponent state, pressure construction and adapted rules.</p>

    <div className="conditionedProtocol">
      <strong>Default scoring protocol</strong>
      <p>{scoringProtocol}</p>
    </div>

    <div className="conditionedFamilyRow">
      {families.map(family=><button key={family} className={selectedFamily===family?'activeLayer':''} onClick={()=>setSelectedFamily(family)}>{family}</button>)}
    </div>

    <div className="libraryGrid">
      {filtered.map((game,index)=>
        <div className="libraryCard conditionedCard" key={index}>
          <div className="libraryCardTop">
            <div>
              <span className="categoryTag">{game.family}</span>
              <h3>{game.title}</h3>
            </div>
            <span className="levelPill">{game.level}</span>
          </div>
          <div className="infoBox"><strong>Task</strong><p>{game.task}</p></div>
          <div className="infoBox"><strong>Rationale</strong><p>{game.rationale}</p></div>
          <div className="infoBox"><strong>Coach Focus</strong><p>{game.coach}</p></div><div className="infoBox"><strong>Player Focus</strong><p>{game.playerFocus||'Focus on the cue that unlocks the scoring condition.'}</p></div>
          <div className="infoBox"><strong>Scoring</strong><p>{game.scoring}</p></div>
          <div className="infoBox"><strong>Anti-gaming</strong><p>{game.antiGaming}</p></div>
          <div className="chips">{game.layers.map(layer=><span className="badge" key={layer}>{layer}</span>)}</div>
          <button className="primaryBtn" onClick={()=>addGame(game)}>Add To Session</button>
        </div>
      )}
    </div>
  </div>;
}


function normaliseGameCard(game){
  return {
    id: game.id || Date.now()+Math.random(),
    title: game.title || '',
    category: game.category || 'Custom Coach Game',
    family: game.family || game.category || 'General',
    level: game.level || 'All levels',
    duration: game.duration || 8,
    format: game.format || 'King of Court',
    task: game.task || '',
    rationale: game.rationale || '',
    coachFocus: game.coachFocus || game.coach || '',
    playerFocus: game.playerFocus || '',
    scoring: game.scoring || 'Win rally = 1',
    antiGaming: game.antiGaming || '',
    layers: game.layers || [],
    cbCode: game.cbCode || 'None',
    saved: true,
    favourite: game.favourite || false
  };
}

function emptyUniversalGame(category='Custom Coach Game'){
  return normaliseGameCard({
    id:Date.now()+Math.random(),
    title:'',
    category,
    family:'Coach Created',
    level:'All levels',
    duration:8,
    format:'King of Court',
    task:'',
    rationale:'',
    coachFocus:'',
    playerFocus:'',
    scoring:'Win rally = 1',
    antiGaming:'',
    layers:[],
    cbCode:'None'
  });
}

function UniversalGameEditor({game,onSave,onCancel}){
  const [form,setForm]=useState(()=>normaliseGameCard(game||emptyUniversalGame()));

  function update(field,value){
    setForm(prev=>({...prev,[field]:value}));
  }

  function toggleLayer(layer){
    setForm(prev=>{
      const current=prev.layers||[];
      return {...prev,layers:current.includes(layer)?current.filter(item=>item!==layer):[...current,layer]};
    });
  }

  function save(){
    if(!form.title.trim()){
      alert('Game needs a title.');
      return;
    }
    onSave({...form,title:form.title.trim()});
  }

  return <div className="universalEditor">
    <h2>{form.id?'Edit Game Card':'New Game Card'}</h2>
    <div className="editorGrid">
      <label>Title<input value={form.title} onChange={e=>update('title',e.target.value)} placeholder="Game title"/></label>
      <label>Category<select value={form.category} onChange={e=>update('category',e.target.value)}>
        <option>ATL / BTL</option>
        <option>Checkerboard</option>
        <option>Classic Conditioned</option>
        <option>Volley & Intercept</option>
        <option>Pressure</option>
        <option>Technical</option>
        <option>Invasion</option>
        <option>Matchplay</option>
        <option>Custom Coach Game</option>
      </select></label>
      <label>Family<input value={form.family} onChange={e=>update('family',e.target.value)} placeholder="e.g. T-Zone Games"/></label>
      <label>Level / Progression<input value={form.level} onChange={e=>update('level',e.target.value)} placeholder="e.g. Levels 3–5"/></label>
      <label>Duration<input type="number" min="1" value={form.duration} onChange={e=>update('duration',Number(e.target.value))}/></label>
      <label>Format<select value={form.format} onChange={e=>update('format',e.target.value)}>
        <option>King of Court</option><option>Winner Stays On</option><option>Pairs</option><option>Team Courts</option><option>Feeding Rotation</option><option>Rally Game</option><option>Box League</option>
      </select></label>
      <label className="wide">Task / Rules<textarea value={form.task} onChange={e=>update('task',e.target.value)} placeholder="Clear binary game rules"/></label>
      <label className="wide">Rationale<textarea value={form.rationale} onChange={e=>update('rationale',e.target.value)} placeholder="Why this game exists"/></label>
      <label className="wide">Coach Focus<textarea value={form.coachFocus} onChange={e=>update('coachFocus',e.target.value)} placeholder="What the coach observes, rewards, or constrains"/></label>
      <label className="wide">Player Focus<textarea value={form.playerFocus} onChange={e=>update('playerFocus',e.target.value)} placeholder="What the player should attend to"/></label>
      <label className="wide">Scoring<textarea value={form.scoring} onChange={e=>update('scoring',e.target.value)} placeholder="Scoring protocol"/></label>
      <label className="wide">Anti-gaming<textarea value={form.antiGaming} onChange={e=>update('antiGaming',e.target.value)} placeholder="How to prevent players gaming the condition"/></label>
      <label>Checkerboard Code<select value={form.cbCode||'None'} onChange={e=>update('cbCode',e.target.value)}>{CB_CODES.map(code=><option key={code}>{code}</option>)}</select></label>
      <div className="wide overlayPanel">
        <strong>Constraints / Overlays</strong>
        <div className="quickLayers">{ALL_LAYERS.map(layer=><button key={layer} className={(form.layers||[]).includes(layer)?'activeLayer':''} onClick={()=>toggleLayer(layer)}>{(form.layers||[]).includes(layer)?'✓ ':'+ '}{layer}</button>)}</div>
      </div>
    </div>
    <div className="buttonRow">
      <button className="primaryBtn" onClick={save}>Save Game Card</button>
      <button className="secondaryBtn" onClick={onCancel}>Cancel</button>
    </div>
  </div>;
}

function UniversalGameCard({game,onAdd,onEdit,onDuplicate,onDelete}){
  const card=normaliseGameCard(game);
  return <div className="libraryCard universalCard">
    <div className="libraryCardTop">
      <div>
        <span className="categoryTag">{card.category}</span>
        <h3>{card.title}</h3>
      </div>
      <span className="levelPill">{card.level}</span>
    </div>
    <div className="infoBox"><strong>Task / Rules</strong><p>{card.task}</p></div>
    <div className="infoBox"><strong>Rationale</strong><p>{card.rationale}</p></div>
    <div className="infoBox"><strong>Coach Focus</strong><p>{card.coachFocus || 'Not set.'}</p></div>
    <div className="infoBox"><strong>Player Focus</strong><p>{card.playerFocus || 'Not set.'}</p></div>
    <div className="infoBox"><strong>Scoring</strong><p>{card.scoring}</p></div>
    {card.antiGaming&&<div className="infoBox"><strong>Anti-gaming</strong><p>{card.antiGaming}</p></div>}
    <div className="chips">{(card.layers||[]).map(layer=><span className="badge" key={layer}>{layer}</span>)}</div>
    {card.cbCode&&card.cbCode!=='None'&&<div className="cbMini">CB: {card.cbCode}</div>}
    <div className="actionRow">
      <button onClick={()=>onAdd(card)}>Add To Session</button>
      <button onClick={()=>onDuplicate(card)}>Duplicate Variant</button>
      <button onClick={()=>onEdit(card)}>Edit</button>
      <button onClick={()=>onDelete(card.id)}>Delete</button>
    </div>
  </div>;
}


function Games({setSession,setScreen}){
  const [activeClass,setActiveClass]=useState(null);
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

  function addAndGo(game){
    setSession(prev=>[...prev,{...normaliseGameCard(game),id:Date.now()+Math.random()}]);
    setMessage(`${game.title} added to Session Builder.`);
    setScreen('sessions');
  }

  function addStay(game){
    setSession(prev=>[...prev,{...normaliseGameCard(game),id:Date.now()+Math.random()}]);
    setMessage(`${game.title} added to current session.`);
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

  const gameClasses=['ATL / BTL','Checkerboard','Classic Conditioned','Volley & Intercept','Pressure','Technical','Invasion','Matchplay','Saved Cards'];
  const visibleCards=activeClass==='Saved Cards'?savedCards:savedCards.filter(card=>card.category===activeClass);

  return <div className="page">
    <div className="pageTop">
      <h1>Games Library</h1>
      <button className="primaryBtn" onClick={()=>setEditingCard(emptyUniversalGame(activeClass||'Custom Coach Game'))}>+ New Game Card</button>
    </div>

    <div className="gameClassGrid">
      {gameClasses.map(gameClass=>
        <button key={gameClass} className={activeClass===gameClass?'gameClassBtn activeGameClass':'gameClassBtn'} onClick={()=>setActiveClass(gameClass)}>
          {gameClass}
        </button>
      )}
    </div>

    {!activeClass&&<div className="placeholder">Tap a game class above.</div>}

    {editingCard&&<UniversalGameEditor game={editingCard} onSave={saveCard} onCancel={()=>setEditingCard(null)}/>}

    {activeClass==='Checkerboard'&&<CheckerboardEngine onAddToSession={addAndGo}/>}
    {activeClass==='ATL / BTL'&&<ATLBTLDirectBuilder onAddToSession={addAndGo}/>}
    {activeClass==='Classic Conditioned'&&<ClassicConditionedBuilder onAddToSession={addAndGo}/>}

    {activeClass&&activeClass!=='Checkerboard'&&activeClass!=='ATL / BTL'&&activeClass!=='Classic Conditioned'&&activeClass!=='Saved Cards'&&
      <div className="placeholder">{activeClass} games will be restored as the next functional class. Use + New Game Card to create coach cards now.</div>
    }

    {message&&<div className="statusBox">{message}</div>}

    {activeClass&&visibleCards.length>0&&<div>
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

function Competition({players}){const[compHistory,setCompHistory]=useState([]);function saveCompSnapshot(){setCompHistory(prev=>[...prev,{format,manual,generated,courts,boxes,lives,rounds,match,competitionLayers,competitionCbCode,doubleBounceRule,playerBounces}]);}function undoCompetition(){const last=compHistory[compHistory.length-1];if(!last)return;setFormat(last.format);setManual(last.manual);setGenerated(last.generated);setCourts(last.courts);setBoxes(last.boxes);setLives(last.lives);setRounds(last.rounds);setMatch(last.match);setCompetitionLayers(last.competitionLayers);setCompetitionCbCode(last.competitionCbCode);setDoubleBounceRule(last.doubleBounceRule);setPlayerBounces(last.playerBounces);setCompHistory(compHistory.slice(0,-1));}
const[format,setFormat]=useState('Round Robin');
const[manual,setManual]=useState('');
const[generated,setGenerated]=useState([]);
const[courts,setCourts]=useState(3);
const[boxes,setBoxes]=useState(1);
const[lives,setLives]=useState(20);
const[rounds,setRounds]=useState(3);
const[match,setMatch]=useState('First to 11');const[competitionLayers,setCompetitionLayers]=useState([]);const[competitionCbCode,setCompetitionCbCode]=useState('None');const[doubleBounceRule,setDoubleBounceRule]=useState('Incoming player always has double bounce. Winner loses one bounce after every rally they win.');const[playerBounces,setPlayerBounces]=useState({});
const present=sortPlayers(players.filter(player=>player.present));
const names=present.length?present.map(player=>player.name):manual.split('\n').map(name=>name.trim()).filter(Boolean);
function bounceFor(name){return playerBounces[name]||'None';}function setBounceFor(name,value){setPlayerBounces(prev=>({...prev,[name]:value}));}function bounceSummary(){const entries=names.map(name=>({name,bounce:bounceFor(name)})).filter(item=>item.bounce!=='None');return entries.length?['Player double bounces:',...entries.map(item=>`${item.name}: ${item.bounce}`)]:[];}function toggleCompetitionLayer(layer){saveCompSnapshot();setCompetitionLayers(prev=>prev.includes(layer)?prev.filter(item=>item!==layer):[...prev,layer]);}function layerSummary(){const parts=[];if(competitionLayers.length)parts.push(`Overlays: ${competitionLayers.join(' · ')}`);if(competitionCbCode!=='None')parts.push(`Checkerboard Code: ${competitionCbCode}`);if(competitionLayers.includes('Double Bounce')){parts.push(`Double Bounce Rule: ${doubleBounceRule}`);parts.push(...bounceSummary());}return parts;}function generate(){saveCompSnapshot();
if(names.length<2){setGenerated(['Need at least 2 players.']);return;}
if(format==='Round Robin'){const groupCount=Math.min(boxes,names.length);const groups=Array.from({length:groupCount},()=>[]);names.forEach((name,index)=>groups[index%groupCount].push(name));const output=[];groups.forEach((group,groupIndex)=>{output.push(`Box ${groupIndex+1}: ${group.join(', ')}`);for(let i=0;i<group.length;i++){for(let j=i+1;j<group.length;j++){output.push(`Box ${groupIndex+1}: ${group[i]} vs ${group[j]}`);}}});setGenerated([`Round Robin · ${boxes} box${boxes>1?'es':''} · ${courts} courts · ${match}`,...layerSummary(),'Standings: matches won → games difference → points difference → head-to-head.',...output]);return;}
if(format==='Monrad'){const output=[];for(let i=0;i<Math.floor(names.length/2);i++)output.push(`Court ${(i%courts)+1}: ${names[i]} vs ${names[names.length-1-i]}`);if(names.length%2)output.push(`Bye: ${names[Math.floor(names.length/2)]}`);setGenerated([`Monrad · ${rounds} rounds · ${courts} courts · ${match}`,...layerSummary(),'Round 1 seeded pairings:',...output]);return;}
if(format==='NSL'){const teamA=names.filter((_,index)=>index%2===0);const teamB=names.filter((_,index)=>index%2!==0);setGenerated([`NSL · ${courts} courts · ${match}`,...layerSummary(),`Team A: ${teamA.join(', ')}`,`Team B: ${teamB.join(', ')}`]);return;}
if(format==='Invasion Game'){const groups=Array.from({length:courts},()=>[]);names.forEach((name,index)=>groups[index%courts].push(name));const output=groups.map((group,index)=>{if(!group.length)return`Court ${index+1}: no players`;const each=Math.floor(lives/group.length);const spare=lives%group.length;return`Court ${index+1}: ${group.join(', ')} — ${lives} total lives — ${each} lives each${spare?` + ${spare} spare lives`:''}`;});setGenerated([`Invasion · ${courts} courts · ${lives} lives per court`,...layerSummary(),...output]);}
}
return <div className="page"><div className="pageTop"><h1>Competition</h1><button className="secondaryBtn" onClick={undoCompetition} disabled={compHistory.length===0}>Undo</button></div><div className="competitionCard">
<label>Competition Format</label><div className="formatGrid">{['Round Robin','Monrad','Invasion Game','NSL'].map(f=><button key={f} className={format===f?'formatBtn activeFormat':'formatBtn'} onClick={()=>setFormat(f)}>{f}</button>)}</div><select value={format} onChange={e=>setFormat(e.target.value)}><option>Round Robin</option><option>Monrad</option><option>Invasion Game</option><option>NSL</option></select>
{format==='Round Robin'&&<div className="rrBoxSelector"><label>Round Robin Box Format</label><div className="boxGrid">{[1,2,3,4].map(number=><button key={number} className={boxes===number?'boxOption activeBox':'boxOption'} onClick={()=>setBoxes(number)}><strong>{number} {number===1?'Box':'Boxes'}</strong></button>)}</div></div>}
<div className="competitionControls">
<div><label>Courts</label><div className="stepper"><button onClick={()=>setCourts(Math.max(1,courts-1))}>−</button><strong>{courts}</strong><button onClick={()=>setCourts(Math.min(6,courts+1))}>+</button></div></div>
{format==='Invasion Game'&&<div><label>Total Lives Per Court</label><div className="stepper"><button onClick={()=>setLives(Math.max(1,lives-1))}>−</button><strong>{lives}</strong><button onClick={()=>setLives(lives+1)}>+</button></div></div>}
{format==='Monrad'&&<div><label>Rounds</label><div className="stepper"><button onClick={()=>setRounds(Math.max(1,rounds-1))}>−</button><strong>{rounds}</strong><button onClick={()=>setRounds(rounds+1)}>+</button></div></div>}
{format!=='Invasion Game'&&<div><label>Match Format</label><select value={match} onChange={e=>setMatch(e.target.value)}><option>First to 11</option><option>Timed</option><option>Best of 3</option><option>Best of 5</option><option>Timed periods</option></select></div>}
</div>
<div className="competitionOverlayBox"><strong>Competition Overlays</strong><div className="quickLayers">{ALL_LAYERS.map(layer=><button key={layer} className={competitionLayers.includes(layer)?'activeLayer':''} onClick={()=>toggleCompetitionLayer(layer)}>{competitionLayers.includes(layer)?'✓ ':'+ '}{layer}</button>)}</div><div className="cbBox"><strong>Checkerboard Code</strong><select value={competitionCbCode} onChange={e=>setCompetitionCbCode(e.target.value)}>{CB_CODES.map(code=><option key={code}>{code}</option>)}</select></div>{competitionLayers.includes('Double Bounce')&&<div className="doubleBounceEdit"><strong>Editable Double Bounce Rule</strong><textarea value={doubleBounceRule} onChange={e=>setDoubleBounceRule(e.target.value)}/><div className="playerBounceGrid"><strong>Player Double Bounce Allocation</strong>{names.length===0&&<p>Add/mark players present first, or enter manual players.</p>}{names.map(name=><div className="playerBounceRow" key={name}><span>{name}</span><select value={bounceFor(name)} onChange={e=>setBounceFor(name,e.target.value)}><option>None</option><option>Unlimited double bounces</option><option>5 double bounces</option><option>4 double bounces</option><option>3 double bounces</option><option>2 double bounces</option><option>1 double bounce</option></select></div>)}</div></div>}</div>
<div className="presentCompetitionBox"><strong>Auto-entry from attendance</strong><p>{present.length} players marked present.</p>{present.length>0&&<ol>{present.map(player=><li key={player.name}>{player.name} {player.playerType==='Programme Player'?`(JPR #${player.juniorRanking||'not set'})`:`(${player.guestEstimate||'Guest'})`}</li>)}</ol>}</div>
<label>Manual Players</label><textarea rows="5" value={manual} onChange={e=>setManual(e.target.value)} placeholder="Fallback only: one player per line if no attendance marked"/>
<button className="primaryBtn" onClick={generate}>Generate {format}</button>
</div>
{generated.length>0&&<div className="competitionOutput"><h2>{format}</h2>{generated.map((item,index)=><div className="fixtureCard" key={index}>{item}</div>)}</div>}
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

function App(){
const[screen,setScreen]=useState('home');
const[players,setPlayers]=useState(()=>{try{return JSON.parse(localStorage.getItem(PLAYER_KEY))||[]}catch{return[]}});
const[session,setSession]=useState(()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY))||[]}catch{return[]}});
useEffect(()=>{localStorage.setItem(PLAYER_KEY,JSON.stringify(players));},[players]);
useEffect(()=>{localStorage.setItem(SESSION_KEY,JSON.stringify(session));},[session]);
return <div>
<header className="hero"><button className="homeBtn" onClick={()=>setScreen('home')}>HOME</button><div><div className="eyebrow">CHECKERBOARD COACH</div><h1>Rebuilt Master v73</h1><p>Sessions · Games · Players · Competition</p></div></header>
<main className="container">
{screen==='home'&&<Home setScreen={setScreen}/>}
{screen==='sessions'&&<Sessions session={session} setSession={setSession}/>}
{screen==='games'&&<Games setSession={setSession} setScreen={setScreen}/>}
{screen==='players'&&<Players players={players} setPlayers={setPlayers}/>}
{screen==='competition'&&<Competition players={players}/>} {screen==='storage'&&<Storage players={players} setPlayers={setPlayers} session={session} setSession={setSession}/>}
</main>
</div>;
}

createRoot(document.getElementById('root')).render(<App/>);
