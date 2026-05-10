
import React,{useEffect,useMemo,useState}from'react';
import{createRoot}from'react-dom/client';
import'./styles.css';

const PLAYER_KEY='checkerboard_master_v54_players';
const SESSION_KEY='checkerboard_master_v54_session';

const LEVELS=[
{label:'Bronze',level:1},{label:'Silver',level:2},{label:'Gold / Elite',level:3},{label:'Performance',level:4},{label:'Professional',level:5}
];

const ALL_LAYERS=['Clean Winner','Opponent Off T','Blind Finish','Volley Finish','Weak Side','4-Shot Window','2-Shot Window','Double Bounce','Quality Length Before Attack','CB Code'];
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
</div>;
}

function GameSelector({onAddToSession,addButtonText='Add To Session'}){
const[category,setCategory]=useState(null);
const[atl,setAtl]=useState(DEFAULT_ATL);
const[selectedGame,setSelectedGame]=useState(null);
const[manualLayers,setManualLayers]=useState([]);
const cats=['ATL / BTL','Classic Conditioned','Checkerboard','Volley & Intercept','Pressure','Technical','Invasion','Matchplay'];
const builtAtl=useMemo(()=>buildAtl(atl),[atl]);
const composedAtl=useMemo(()=>({...builtAtl,layers:[...new Set([...(builtAtl.layers||[]),...manualLayers])]}),[builtAtl,manualLayers]);
const games=standardGames();
function setAtlOption(key,value){setAtl(prev=>({...prev,[key]:value}));}
function toggleManualLayer(layer){setManualLayers(prev=>prev.includes(layer)?prev.filter(x=>x!==layer):[...prev,layer]);}
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
<div className="overlayPanel"><strong>Universal Overlays</strong><div className="quickLayers">{ALL_LAYERS.map(layer=><button key={layer} className={composedAtl.layers.includes(layer)?'activeLayer':''} onClick={()=>toggleManualLayer(layer)}>{composedAtl.layers.includes(layer)?'✓ ':'+ '}{layer}</button>)}</div></div>
<button className="primaryBtn" onClick={()=>addGame(composedAtl)}>{addButtonText}</button>
</div>}
{category&&category!=='ATL / BTL'&&<div className="gameList">
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

function Sessions({session,setSession}){
const total=session.reduce((sum,game)=>sum+Number(game.duration||0),0);
function addGame(game){setSession(prev=>[...prev,game]);}
function remove(index){setSession(session.filter((_,i)=>i!==index));}
function duplicate(index){const copy=clone(session[index]);copy.id=Date.now()+Math.random();copy.title=copy.title+' + progression';setSession([...session.slice(0,index+1),copy,...session.slice(index+1)]);}
function addLayer(index,layer){const updated=clone(session);if(!updated[index].layers.includes(layer))updated[index].layers.push(layer);setSession(updated);}
function updateCb(index,code){const updated=clone(session);updated[index].cbCode=code;if(code!=='None'&&!updated[index].layers.includes('CB Code'))updated[index].layers.push('CB Code');if(code==='None')updated[index].layers=updated[index].layers.filter(layer=>layer!=='CB Code');setSession(updated);}
return <div className="page">
<div className="pageTop"><h1>Session Builder</h1><div className="buttonRow"><div className="totalBox">Total: {total} mins</div><button className="secondaryBtn" onClick={()=>setSession([])}>Clear Session</button></div></div>
<GameSelector onAddToSession={addGame} addButtonText="Add To Session"/>
<h2>Session Rotations</h2>
{session.length===0&&<div className="placeholder">No rotations added yet. Choose a game above and tap Add To Session.</div>}
{session.map((game,index)=><div className="rotationCard" key={game.id||index}>
<div className="rotationTop"><div><strong>Rotation {index+1} · {game.duration} min · {game.format}</strong><h3>{game.title}</h3></div><button className="secondaryBtn" onClick={()=>remove(index)}>Remove</button></div>
<div className="infoBox"><strong>Task</strong><p>{game.task}</p></div>
<div className="infoBox"><strong>Rationale</strong><p>{game.rationale}</p></div>
<div className="infoBox"><strong>Coach Help</strong><p>{game.coach}</p></div>
<div className="cbBox"><strong>Checkerboard Code</strong><select value={game.cbCode||'None'} onChange={e=>updateCb(index,e.target.value)}>{CB_CODES.map(code=><option key={code}>{code}</option>)}</select></div>
<div className="chips">{game.layers.map(layer=><span className="badge" key={layer}>{layer}</span>)}</div>
<div className="quickLayers">{ALL_LAYERS.filter(layer=>!game.layers.includes(layer)).map(layer=><button key={layer} onClick={()=>addLayer(index,layer)}>+ {layer}</button>)}</div>
<div className="actionRow"><button onClick={()=>duplicate(index)}>Duplicate + Progress</button></div>
</div>)}
</div>;
}

function Games({setSession,setScreen}){
function addAndGo(game){setSession(prev=>[...prev,game]);setScreen('sessions');}
return <div className="page"><div className="pageTop"><h1>Games</h1></div><GameSelector onAddToSession={addAndGo} addButtonText="Add To Session"/></div>;
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

function Competition({players}){
const[format,setFormat]=useState('Round Robin');
const[manual,setManual]=useState('');
const[generated,setGenerated]=useState([]);
const[courts,setCourts]=useState(3);
const[boxes,setBoxes]=useState(1);
const[lives,setLives]=useState(20);
const[rounds,setRounds]=useState(3);
const[match,setMatch]=useState('First to 11');const[competitionLayers,setCompetitionLayers]=useState([]);const[competitionCbCode,setCompetitionCbCode]=useState('None');const[doubleBounceRule,setDoubleBounceRule]=useState('Incoming player always has double bounce. Winner loses one bounce after every rally they win.');
const present=sortPlayers(players.filter(player=>player.present));
const names=present.length?present.map(player=>player.name):manual.split('\n').map(name=>name.trim()).filter(Boolean);
function toggleCompetitionLayer(layer){setCompetitionLayers(prev=>prev.includes(layer)?prev.filter(item=>item!==layer):[...prev,layer]);}function layerSummary(){const parts=[];if(competitionLayers.length)parts.push(`Overlays: ${competitionLayers.join(' · ')}`);if(competitionCbCode!=='None')parts.push(`Checkerboard Code: ${competitionCbCode}`);if(competitionLayers.includes('Double Bounce'))parts.push(`Double Bounce Rule: ${doubleBounceRule}`);return parts;}function generate(){
if(names.length<2){setGenerated(['Need at least 2 players.']);return;}
if(format==='Round Robin'){const groupCount=Math.min(boxes,names.length);const groups=Array.from({length:groupCount},()=>[]);names.forEach((name,index)=>groups[index%groupCount].push(name));const output=[];groups.forEach((group,groupIndex)=>{output.push(`Box ${groupIndex+1}: ${group.join(', ')}`);for(let i=0;i<group.length;i++){for(let j=i+1;j<group.length;j++){output.push(`Box ${groupIndex+1}: ${group[i]} vs ${group[j]}`);}}});setGenerated([`Round Robin · ${boxes} box${boxes>1?'es':''} · ${courts} courts · ${match}`,...layerSummary(),'Standings: matches won → games difference → points difference → head-to-head.',...output]);return;}
if(format==='Monrad'){const output=[];for(let i=0;i<Math.floor(names.length/2);i++)output.push(`Court ${(i%courts)+1}: ${names[i]} vs ${names[names.length-1-i]}`);if(names.length%2)output.push(`Bye: ${names[Math.floor(names.length/2)]}`);setGenerated([`Monrad · ${rounds} rounds · ${courts} courts · ${match}`,...layerSummary(),'Round 1 seeded pairings:',...output]);return;}
if(format==='NSL'){const teamA=names.filter((_,index)=>index%2===0);const teamB=names.filter((_,index)=>index%2!==0);setGenerated([`NSL · ${courts} courts · ${match}`,...layerSummary(),`Team A: ${teamA.join(', ')}`,`Team B: ${teamB.join(', ')}`]);return;}
if(format==='Invasion Game'){const groups=Array.from({length:courts},()=>[]);names.forEach((name,index)=>groups[index%courts].push(name));const output=groups.map((group,index)=>{if(!group.length)return`Court ${index+1}: no players`;const each=Math.floor(lives/group.length);const spare=lives%group.length;return`Court ${index+1}: ${group.join(', ')} — ${lives} total lives — ${each} lives each${spare?` + ${spare} spare lives`:''}`;});setGenerated([`Invasion · ${courts} courts · ${lives} lives per court`,...layerSummary(),...output]);}
}
return <div className="page"><div className="pageTop"><h1>Competition</h1></div><div className="competitionCard">
<label>Competition Format</label><div className="formatGrid">{['Round Robin','Monrad','Invasion Game','NSL'].map(f=><button key={f} className={format===f?'formatBtn activeFormat':'formatBtn'} onClick={()=>setFormat(f)}>{f}</button>)}</div><select value={format} onChange={e=>setFormat(e.target.value)}><option>Round Robin</option><option>Monrad</option><option>Invasion Game</option><option>NSL</option></select>
{format==='Round Robin'&&<div className="rrBoxSelector"><label>Round Robin Box Format</label><div className="boxGrid">{[1,2,3,4].map(number=><button key={number} className={boxes===number?'boxOption activeBox':'boxOption'} onClick={()=>setBoxes(number)}><strong>{number} {number===1?'Box':'Boxes'}</strong></button>)}</div></div>}
<div className="competitionControls">
<div><label>Courts</label><div className="stepper"><button onClick={()=>setCourts(Math.max(1,courts-1))}>−</button><strong>{courts}</strong><button onClick={()=>setCourts(Math.min(6,courts+1))}>+</button></div></div>
{format==='Invasion Game'&&<div><label>Total Lives Per Court</label><div className="stepper"><button onClick={()=>setLives(Math.max(1,lives-1))}>−</button><strong>{lives}</strong><button onClick={()=>setLives(lives+1)}>+</button></div></div>}
{format==='Monrad'&&<div><label>Rounds</label><div className="stepper"><button onClick={()=>setRounds(Math.max(1,rounds-1))}>−</button><strong>{rounds}</strong><button onClick={()=>setRounds(rounds+1)}>+</button></div></div>}
{format!=='Invasion Game'&&<div><label>Match Format</label><select value={match} onChange={e=>setMatch(e.target.value)}><option>First to 11</option><option>Timed</option><option>Best of 3</option><option>Best of 5</option><option>Timed periods</option></select></div>}
</div>
<div className="competitionOverlayBox"><strong>Competition Overlays</strong><div className="quickLayers">{ALL_LAYERS.map(layer=><button key={layer} className={competitionLayers.includes(layer)?'activeLayer':''} onClick={()=>toggleCompetitionLayer(layer)}>{competitionLayers.includes(layer)?'✓ ':'+ '}{layer}</button>)}</div><div className="cbBox"><strong>Checkerboard Code</strong><select value={competitionCbCode} onChange={e=>setCompetitionCbCode(e.target.value)}>{CB_CODES.map(code=><option key={code}>{code}</option>)}</select></div>{competitionLayers.includes('Double Bounce')&&<div className="doubleBounceEdit"><strong>Editable Double Bounce Rule</strong><textarea value={doubleBounceRule} onChange={e=>setDoubleBounceRule(e.target.value)}/></div>}</div>
<div className="presentCompetitionBox"><strong>Auto-entry from attendance</strong><p>{present.length} players marked present.</p>{present.length>0&&<ol>{present.map(player=><li key={player.name}>{player.name} {player.playerType==='Programme Player'?`(JPR #${player.juniorRanking||'not set'})`:`(${player.guestEstimate||'Guest'})`}</li>)}</ol>}</div>
<label>Manual Players</label><textarea rows="5" value={manual} onChange={e=>setManual(e.target.value)} placeholder="Fallback only: one player per line if no attendance marked"/>
<button className="primaryBtn" onClick={generate}>Generate {format}</button>
</div>
{generated.length>0&&<div className="competitionOutput"><h2>{format}</h2>{generated.map((item,index)=><div className="fixtureCard" key={index}>{item}</div>)}</div>}
</div>;
}

function App(){
const[screen,setScreen]=useState('home');
const[players,setPlayers]=useState(()=>{try{return JSON.parse(localStorage.getItem(PLAYER_KEY))||[]}catch{return[]}});
const[session,setSession]=useState(()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY))||[]}catch{return[]}});
useEffect(()=>{localStorage.setItem(PLAYER_KEY,JSON.stringify(players));},[players]);
useEffect(()=>{localStorage.setItem(SESSION_KEY,JSON.stringify(session));},[session]);
return <div>
<header className="hero"><button className="homeBtn" onClick={()=>setScreen('home')}>HOME</button><div><div className="eyebrow">CHECKERBOARD COACH</div><h1>Rebuilt Master v56</h1><p>Sessions · Games · Players · Competition</p></div></header>
<main className="container">
{screen==='home'&&<Home setScreen={setScreen}/>}
{screen==='sessions'&&<Sessions session={session} setSession={setSession}/>}
{screen==='games'&&<Games setSession={setSession} setScreen={setScreen}/>}
{screen==='players'&&<Players players={players} setPlayers={setPlayers}/>}
{screen==='competition'&&<Competition players={players}/>}
</main>
</div>;
}

createRoot(document.getElementById('root')).render(<App/>);
