
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STORAGE_KEY = 'checkerboardCoach_v51_players';

const levelCategories = [
  { label:'Bronze', level:1 },
  { label:'Silver', level:2 },
  { label:'Gold / Elite', level:3 },
  { label:'Performance', level:4 },
  { label:'Professional', level:5 }
];

const emptyPlayer = {
  name:'',
  playerType:'Programme Player',
  category:'Bronze',
  level:1,
  rankingStatus:'Ranked',
  juniorRanking:'',
  guestEstimate:'',
  attendance:'0 sessions',
  focus:'',
  present:false
};

const atlOptionsList = {
  btlCount: ['0 BTL shots', '1 BTL shot', '2 BTL shots', '3 BTL shots'],
  side: ['Both sides', 'Right side only', 'Left side only'],
  consecutive: ['No', 'Yes'],
  shotChoice: ['Any shot', 'Straight drop', 'Crosscourt drop', 'Boast', 'Drive', 'Kill'],
  volleyMethod: ['Players choice', 'Must be volley', 'No volley'],
  cbReference: ['None', '[8-1]', '[7-2]', '[6-4]', '[5-3]', '[5-4]', '[6-3]']
};

const defaultAtlOptions = {
  btlCount:'0 BTL shots',
  side:'Both sides',
  consecutive:'No',
  shot1:'Any shot',
  shot2:'Any shot',
  shot3:'Any shot',
  volley1:'Players choice',
  volley2:'Players choice',
  volley3:'Players choice',
  cbReference:'None'
};

function buildAtl(options){
  const countNum = options.btlCount.startsWith('0') ? 0 : options.btlCount.startsWith('1') ? 1 : options.btlCount.startsWith('2') ? 2 : 3;
  const shots = [options.shot1, options.shot2, options.shot3].slice(0, countNum);
  const methods = [options.volley1, options.volley2, options.volley3].slice(0, countNum);

  const shotText = countNum === 0
    ? 'No compulsory BTL shot; use ATL / BTL cue to manage tempo, balance and visual control.'
    : shots.map((shot, i) => {
      const method = methods[i] === 'Players choice' ? 'player’s choice volley/non-volley' : methods[i].toLowerCase();
      return `BTL shot ${i + 1}: ${shot.toLowerCase()} (${method})`;
    }).join('; ');

  const sideText = options.side === 'Both sides'
    ? 'Applies on both sides.'
    : `Applies on ${options.side.replace(' only','').toLowerCase()}.`;

  const consecutiveText = countNum <= 1 ? '' : (options.consecutive === 'Yes' ? 'BTL shots must be consecutive.' : 'BTL shots do not need to be consecutive.');
  const cbText = options.cbReference === 'None' ? '' : ` Checkerboard reference: ${options.cbReference}.`;

  const rationale = [
    'slows the rally problem down enough for players to attend to balance, vision and better information pick-up'
  ];

  if(countNum === 0) rationale.push('uses the ATL / BTL cue as a tempo and visual-control reference without forcing a specific low shot');
  if(countNum === 1) rationale.push('uses one BTL event to create a simple low-trajectory decision inside live play');
  if(countNum === 2) rationale.push('requires repeated or connected low-trajectory decisions under rally pressure');
  if(countNum === 3) rationale.push('creates a more complex sequence while preserving tactical awareness');
  if(options.consecutive === 'Yes' && countNum > 1) rationale.push('the consecutive requirement tests whether players can sustain the constraint across linked shots');
  if(methods.includes('Must be volley')) rationale.push('volley requirement connects the chosen shot outcome with early interception');
  if(methods.includes('No volley')) rationale.push('no-volley requirement encourages players to create the shot after the bounce');
  if(shots.includes('Boast')) rationale.push('boast requirement links BTL control to angle creation and front-court disruption');
  if(shots.includes('Straight drop')) rationale.push('straight drop requirement connects BTL control to front-court pressure');
  if(shots.includes('Crosscourt drop')) rationale.push('crosscourt drop requirement changes the opponent’s movement problem');
  if(options.cbReference !== 'None') rationale.push(`${options.cbReference} gives the task a clear checkerboard spatial reference`);

  const overlays = [];
  if(methods.includes('Must be volley')) overlays.push('Volley Finish');
  if(shots.includes('Boast') || shots.includes('Crosscourt drop')) overlays.push('Blind Finish');
  if(countNum >= 2) overlays.push('Opponent Off T');
  if(options.cbReference !== 'None') overlays.push('CB Code');
  overlays.push('Clean Winner');

  return {
    task:`${options.btlCount}: ${shotText}. ${consecutiveText} ${sideText}${cbText}`,
    rationale:`This ATL / BTL structure ${rationale.join(', ')}.`,
    coach:'Use the tape as an external visual cue. Keep rallies live. Coach balance, vision and shot choice rather than fixed technique.',
    overlays:[...new Set(overlays)]
  };
}

function sortPlayers(players){
  return [...players].map((p, originalIndex) => ({...p, originalIndex})).sort((a,b) => {
    const aRank = a.playerType === 'Programme Player'
      ? Number(a.juniorRanking && String(a.juniorRanking).trim() !== '' ? a.juniorRanking : 9999)
      : 9000 - Number(a.level || 0);
    const bRank = b.playerType === 'Programme Player'
      ? Number(b.juniorRanking && String(b.juniorRanking).trim() !== '' ? b.juniorRanking : 9999)
      : 9000 - Number(b.level || 0);
    return aRank - bRank;
  });
}

function Home({setScreen}){
  return <div className="homeGrid">
    <button className="tile blue" onClick={() => setScreen('sessions')}><h2>Sessions</h2><p>Session builder and rotation planning.</p></button>
    <button className="tile purple" onClick={() => setScreen('games')}><h2>Games</h2><p>ATL / BTL, conditioned games, checkerboard and pressure formats.</p></button>
    <button className="tile green" onClick={() => setScreen('players')}><h2>Players</h2><p>Junior Programme Ranking, attendance and guests.</p></button>
    <button className="tile red" onClick={() => setScreen('competition')}><h2>Competition</h2><p>Round Robin, Monrad, Invasion and NSL.</p></button>
  </div>;
}

function Players({players, setPlayers}){
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState(emptyPlayer);
  const [guestName, setGuestName] = useState('');
  const [guestEstimate, setGuestEstimate] = useState('Level 3 guest');

  function snapshot(){
    setHistory(prev => [...prev, players]);
  }

  function undo(){
    if(history.length === 0) return;
    const previous = history[history.length - 1];
    setPlayers(previous);
    setHistory(history.slice(0, -1));
    setEditingIndex(null);
    setShowForm(false);
  }

  function updateCategory(category){
    const found = levelCategories.find(c => c.label === category);
    setForm({...form, category, level:found ? found.level : 1});
  }

  function savePlayer(){
    if(!form.name.trim()) return;
    snapshot();
    if(editingIndex !== null){
      const updated = [...players];
      updated[editingIndex] = {...form, name:form.name.trim()};
      setPlayers(updated);
    } else {
      setPlayers([...players, {...form, name:form.name.trim()}]);
    }
    setForm(emptyPlayer);
    setEditingIndex(null);
    setShowForm(false);
  }

  function editPlayer(player, index){
    const { originalIndex, ...clean } = player;
    setForm({...emptyPlayer, ...clean});
    setEditingIndex(index);
    setShowForm(true);
    window.scrollTo(0,0);
  }

  function deletePlayer(index){
    snapshot();
    setPlayers(players.filter((_, i) => i !== index));
  }

  function togglePresent(index){
    const updated = [...players];
    updated[index] = {...updated[index], present:!updated[index].present};
    setPlayers(updated);
  }

  function addGuest(){
    if(!guestName.trim()) return;
    const levelGuess = guestEstimate.includes('5') ? 5 : guestEstimate.includes('4') ? 4 : guestEstimate.includes('3') ? 3 : guestEstimate.includes('2') ? 2 : 1;
    const guest = {
      ...emptyPlayer,
      name:guestName.trim(),
      playerType:'Guest Player',
      category:'Guest',
      level:levelGuess,
      rankingStatus:'Guest Estimate',
      juniorRanking:'',
      guestEstimate,
      attendance:'Guest today',
      present:true
    };
    snapshot();
    setPlayers([...players, guest]);
    setGuestName('');
    setGuestEstimate('Level 3 guest');
  }

  const sorted = sortPlayers(players);

  return <div className="page">
    <div className="pageTop">
      <h1>Players</h1>
      <div className="buttonRow">
        <button className="secondaryBtn" onClick={undo} disabled={history.length === 0}>Undo Last Change</button>
        <button className="primaryBtn" onClick={() => {setEditingIndex(null); setForm(emptyPlayer); setShowForm(!showForm);}}>+ Add Player</button>
      </div>
    </div>

    {showForm && <div className="formCard">
      <h3>{editingIndex !== null ? 'Edit Player' : 'Add Player'}</h3>
      <input placeholder="Player name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
      <select value={form.playerType} onChange={e => {
        const type = e.target.value;
        setForm({...form, playerType:type, rankingStatus:type === 'Programme Player' ? 'Ranked' : 'Guest Estimate'});
      }}>
        <option>Programme Player</option>
        <option>Guest Player</option>
        <option>Coach Player</option>
      </select>
      <select value={form.category} onChange={e => updateCategory(e.target.value)}>
        {levelCategories.map(c => <option key={c.label}>{c.label}</option>)}
        <option>Guest</option>
      </select>
      {form.playerType === 'Programme Player'
        ? <input type="number" min="1" placeholder="Junior Programme Ranking e.g. 2" value={form.juniorRanking || ''} onChange={e => setForm({...form, juniorRanking:e.target.value})} />
        : <input placeholder="Guest estimate e.g. Level 4 adult" value={form.guestEstimate || ''} onChange={e => setForm({...form, guestEstimate:e.target.value})} />
      }
      <textarea placeholder="Current coaching focus" value={form.focus || ''} onChange={e => setForm({...form, focus:e.target.value})} />
      <div className="buttonRow">
        <button className="primaryBtn" onClick={savePlayer}>{editingIndex !== null ? 'Update Player' : 'Save Player'}</button>
        <button className="secondaryBtn" onClick={() => {setShowForm(false); setEditingIndex(null); setForm(emptyPlayer);}}>Cancel</button>
      </div>
    </div>}

    <div className="attendanceSummary">
      <strong>Present today:</strong> {players.filter(p => p.present).length}
      <span>Competition will auto-use marked-present players.</span>
    </div>

    <div className="quickGuestBox">
      <strong>Add Guest To Today’s Attendance</strong>
      <div className="quickGuestRow">
        <input placeholder="Guest name" value={guestName} onChange={e => setGuestName(e.target.value)} />
        <select value={guestEstimate} onChange={e => setGuestEstimate(e.target.value)}>
          <option>Level 1 guest</option><option>Level 2 guest</option><option>Level 3 guest</option><option>Level 4 guest</option><option>Level 5 guest</option><option>Adult challenge player</option><option>Coach playing</option>
        </select>
        <button className="primaryBtn" onClick={addGuest}>Add Present Guest</button>
      </div>
      <p>Guests are marked present immediately and flow into competitions, but do not affect Junior Programme Ranking.</p>
    </div>

    <div className="rankingNote">
      <strong>Competition ordering:</strong> programme players are sorted by Junior Programme Ranking #1, #2, #3. Guests/coaches can join competitions without affecting the ranking.
    </div>

    <div className="levelGuide">
      {levelCategories.map(c => <div key={c.label}><strong>{c.label}</strong><span>Level {c.level}</span></div>)}
    </div>

    {players.length === 0 && <div className="placeholder">No players added yet. Add players or guests above.</div>}

    <div className="playerGrid">
      {sorted.map((p) => <div className="playerCard" key={`${p.name}-${p.originalIndex}`}>
        <h3>{p.name}</h3>
        <div className="badgeRow">
          <span className="badge">{p.playerType}</span>
          <span className="badge">{p.category}</span>
          <span className="badge">Level {p.level}</span>
          <span className="badge">{p.playerType === 'Programme Player' ? `Junior Ranking #${p.juniorRanking || 'not set'}` : 'Guest / Unranked'}</span>
        </div>
        <div className="infoBox"><strong>Competition Slot</strong><p>{p.playerType === 'Programme Player' ? `Junior Programme Ranking #${p.juniorRanking || 'not set'}` : `Guest Estimate: ${p.guestEstimate || 'Not set'}`} · Level {p.level} · {p.category}</p></div>
        <div className="infoBox"><strong>Attendance</strong><p>{p.attendance}</p></div>
        <div className="infoBox"><strong>Current Focus</strong><p>{p.focus || 'No coaching focus added yet.'}</p></div>
        <div className="actionRow">
          <button className={p.present ? 'presentBtn activePresent' : 'presentBtn'} onClick={() => togglePresent(p.originalIndex)}>{p.present ? 'Present ✓' : 'Mark Present'}</button>
          <button onClick={() => editPlayer(p, p.originalIndex)}>Edit</button>
          <button onClick={() => editPlayer(p, p.originalIndex)}>Change Ranking</button>
          <button onClick={() => deletePlayer(p.originalIndex)}>Delete</button>
        </div>
      </div>)}
    </div>
  </div>;
}

function Competition({players}){
  const [format, setFormat] = useState('Round Robin');
  const [manualPlayers, setManualPlayers] = useState('');
  const [generated, setGenerated] = useState([]);
  const [courts, setCourts] = useState(3);
  const [rrBoxes, setRrBoxes] = useState(1);
  const [courtLives, setCourtLives] = useState(20);
  const [monradRounds, setMonradRounds] = useState(3);
  const [matchFormat, setMatchFormat] = useState('First to 11');

  const presentPlayers = sortPlayers(players.filter(p => p.present));
  const names = presentPlayers.length > 0 ? presentPlayers.map(p => p.name) : manualPlayers.split('\n').map(p => p.trim()).filter(Boolean);

  function buildCompetition(){
    if(names.length < 2){
      setGenerated(['Need at least 2 players marked present or entered manually.']);
      return;
    }

    if(format === 'Round Robin'){
      const boxCount = Math.min(rrBoxes, names.length);
      const boxes = Array.from({ length: boxCount }, () => []);
      names.forEach((name, index) => boxes[index % boxCount].push(name));
      const output = [];
      boxes.forEach((box, boxIndex) => {
        output.push(`Box ${boxIndex + 1}: ${box.join(', ')}`);
        for(let i=0;i<box.length;i++){
          for(let j=i+1;j<box.length;j++){
            output.push(`Box ${boxIndex + 1}: ${box[i]} vs ${box[j]}`);
          }
        }
      });
      const note = rrBoxes === 1 ? 'All players in one box.' : rrBoxes === 2 ? 'Two pools. Use results for final / re-seed.' : rrBoxes === 3 ? 'Three pools. Use results for second round.' : 'Four pools. Use results for second round.';
      setGenerated([`Round Robin · ${rrBoxes} box${rrBoxes > 1 ? 'es' : ''} · ${courts} courts · ${matchFormat}`, note, 'Standings order: matches won → games difference → points difference → head-to-head.', ...output]);
      return;
    }

    if(format === 'Monrad'){
      const pairings = [];
      for(let i=0;i<Math.floor(names.length/2);i++){
        pairings.push(`Court ${(i % courts) + 1}: ${names[i]} vs ${names[names.length - 1 - i]}`);
      }
      if(names.length % 2 === 1) pairings.push(`Bye: ${names[Math.floor(names.length / 2)]}`);
      setGenerated([`Monrad · ${monradRounds} rounds · ${courts} courts · ${matchFormat}`, 'Round 1 seeded pairings:', ...pairings, 'After each round: winners play winners, losers play losers, avoiding repeats where possible.']);
      return;
    }

    if(format === 'NSL'){
      const teamA = names.filter((_,i) => i % 2 === 0);
      const teamB = names.filter((_,i) => i % 2 !== 0);
      setGenerated([`NSL · ${courts} courts · ${matchFormat}`, `Team A: ${teamA.join(', ')}`, `Team B: ${teamB.join(', ')}`, 'Teams are seeded from attendance order / Junior Programme Ranking.']);
      return;
    }

    if(format === 'Invasion Game'){
      const groups = Array.from({ length:courts }, () => []);
      names.forEach((name, index) => groups[index % courts].push(name));
      const output = groups.map((group, index) => {
        if(group.length === 0) return `Court ${index + 1}: no players allocated`;
        const livesEach = Math.floor(courtLives / group.length);
        const spare = courtLives % group.length;
        return `Court ${index + 1}: ${group.join(', ')} — ${courtLives} total lives — ${livesEach} lives each${spare ? ` + ${spare} spare lives to allocate` : ''}`;
      });
      setGenerated([`Invasion Game · ${courts} courts · ${courtLives} lives per court`, ...output, 'Principle: every court has the same total lives. Uneven player numbers are balanced by lives per player.']);
    }
  }

  return <div className="page">
    <div className="pageTop"><h1>Competition</h1></div>
    <div className="competitionCard">
      <label>Competition Format</label>
      <select value={format} onChange={e => setFormat(e.target.value)}>
        <option>Round Robin</option><option>Monrad</option><option>Invasion Game</option><option>NSL</option>
      </select>

      {format === 'Round Robin' && <div className="rrBoxSelector">
        <label>Round Robin Box Format</label>
        <div className="standingsNote">Final placings: matches won → games difference → points difference → head-to-head.</div>
        <div className="boxGrid">{[1,2,3,4].map(n => <button key={n} className={rrBoxes === n ? 'boxOption activeBox' : 'boxOption'} onClick={() => setRrBoxes(n)}><strong>{n} {n === 1 ? 'Box' : 'Boxes'}</strong><span>{n === 1 ? 'All players in one group' : n === 2 ? 'Two pools · final / re-seed' : n === 3 ? 'Three pools · second round' : 'Four pools · second round'}</span></button>)}</div>
      </div>}

      <div className="competitionControls">
        <div><label>Courts</label><div className="stepper"><button onClick={() => setCourts(Math.max(1, courts - 1))}>−</button><strong>{courts}</strong><button onClick={() => setCourts(Math.min(6, courts + 1))}>+</button></div><small>Supports 1–6 courts. Default is 3.</small></div>
        {format === 'Invasion Game' && <div><label>Total Lives Per Court</label><div className="stepper"><button onClick={() => setCourtLives(Math.max(1, courtLives - 1))}>−</button><strong>{courtLives}</strong><button onClick={() => setCourtLives(courtLives + 1)}>+</button></div><small>Only used for Invasion Game.</small></div>}
        {format === 'Monrad' && <>
          <div><label>Rounds</label><div className="stepper"><button onClick={() => setMonradRounds(Math.max(1, monradRounds - 1))}>−</button><strong>{monradRounds}</strong><button onClick={() => setMonradRounds(monradRounds + 1)}>+</button></div><small>Typical Monrad: 3–5 rounds.</small></div>
          <div><label>Match Format</label><select value={matchFormat} onChange={e => setMatchFormat(e.target.value)}><option>First to 11</option><option>Timed</option><option>Best of 3</option><option>Best of 5</option></select><small>Monrad does not use lives.</small></div>
        </>}
        {(format === 'Round Robin' || format === 'NSL') && <div><label>Match Format</label><select value={matchFormat} onChange={e => setMatchFormat(e.target.value)}><option>First to 11</option><option>Timed</option><option>Best of 3</option><option>Best of 5</option><option>Timed periods</option></select><small>{format} does not use lives.</small></div>}
      </div>

      <div className="presentCompetitionBox">
        <strong>Auto-entry from attendance</strong>
        <p>{presentPlayers.length} players marked present.</p>
        {presentPlayers.length > 0 && <ol>{presentPlayers.map(p => <li key={p.name}>{p.name} {p.playerType === 'Programme Player' ? `(JPR #${p.juniorRanking || 'not set'})` : `(${p.guestEstimate || 'Guest'})`}</li>)}</ol>}
      </div>

      <label>Manual Players</label>
      <textarea rows="6" placeholder="Optional fallback: enter one player per line if no one is marked present" value={manualPlayers} onChange={e => setManualPlayers(e.target.value)} />
      <button className="primaryBtn" onClick={buildCompetition}>{format === 'Invasion Game' ? 'Generate Invasion Game' : `Generate ${format}`}</button>
      {format === 'Invasion Game' && <div className="hintBox">Example: 20 lives per court. Court with 5 players = 4 lives each. Court with 4 players = 5 lives each.</div>}
    </div>

    {generated.length > 0 && <div className="competitionOutput"><h2>{format}</h2>{generated.map((g,i) => <div className="fixtureCard" key={i}>{g}</div>)}</div>}
  </div>;
}

function Games(){
  const [category, setCategory] = useState(null);
  const [atlOptions, setAtlOptions] = useState(defaultAtlOptions);
  const built = buildAtl(atlOptions);
  const categories = ['ATL / BTL', 'Classic Conditioned', 'Checkerboard', 'Volley & Intercept', 'Pressure', 'Technical', 'Invasion', 'Matchplay', 'Warm Up / Perception'];

  function setOpt(key, value){
    setAtlOptions(prev => ({...prev, [key]:value}));
  }

  return <div className="page">
    <div className="pageTop"><h1>Games</h1></div>
    <p className="introText">Select a category. No game is open by default.</p>
    <div className="gameMenuGrid">
      {categories.map(c => <button key={c} className={category === c ? 'gameMenu activeGameMenu' : 'gameMenu'} onClick={() => setCategory(c)}>{c}</button>)}
    </div>

    {!category && <div className="placeholder">Choose a game category above.</div>}

    {category === 'ATL / BTL' && <div className="gameCard">
      <div className="categoryTag">ATL / BTL</div>
      <h2>ATL / BTL Full Structure Builder</h2>
      <div className="atlOptionsGrid">
        <label>BTL Count<select value={atlOptions.btlCount} onChange={e => setOpt('btlCount', e.target.value)}>{atlOptionsList.btlCount.map(o => <option key={o}>{o}</option>)}</select></label>
        <label>Side<select value={atlOptions.side} onChange={e => setOpt('side', e.target.value)}>{atlOptionsList.side.map(o => <option key={o}>{o}</option>)}</select></label>
        <label>Consecutive<select value={atlOptions.consecutive} onChange={e => setOpt('consecutive', e.target.value)}>{atlOptionsList.consecutive.map(o => <option key={o}>{o}</option>)}</select></label>
        <label>CB Ref<select value={atlOptions.cbReference} onChange={e => setOpt('cbReference', e.target.value)}>{atlOptionsList.cbReference.map(o => <option key={o}>{o}</option>)}</select></label>

        {atlOptions.btlCount !== '0 BTL shots' && <label>BTL Shot 1<select value={atlOptions.shot1} onChange={e => setOpt('shot1', e.target.value)}>{atlOptionsList.shotChoice.map(o => <option key={o}>{o}</option>)}</select></label>}
        {atlOptions.btlCount !== '0 BTL shots' && <label>Shot 1 Method<select value={atlOptions.volley1} onChange={e => setOpt('volley1', e.target.value)}>{atlOptionsList.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></label>}

        {(atlOptions.btlCount === '2 BTL shots' || atlOptions.btlCount === '3 BTL shots') && <label>BTL Shot 2<select value={atlOptions.shot2} onChange={e => setOpt('shot2', e.target.value)}>{atlOptionsList.shotChoice.map(o => <option key={o}>{o}</option>)}</select></label>}
        {(atlOptions.btlCount === '2 BTL shots' || atlOptions.btlCount === '3 BTL shots') && <label>Shot 2 Method<select value={atlOptions.volley2} onChange={e => setOpt('volley2', e.target.value)}>{atlOptionsList.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></label>}

        {atlOptions.btlCount === '3 BTL shots' && <label>BTL Shot 3<select value={atlOptions.shot3} onChange={e => setOpt('shot3', e.target.value)}>{atlOptionsList.shotChoice.map(o => <option key={o}>{o}</option>)}</select></label>}
        {atlOptions.btlCount === '3 BTL shots' && <label>Shot 3 Method<select value={atlOptions.volley3} onChange={e => setOpt('volley3', e.target.value)}>{atlOptionsList.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></label>}
      </div>

      <div className="infoBox"><strong>Task / Rules</strong><p>{built.task}</p></div>
      <div className="infoBox"><strong>Rationale</strong><p>{built.rationale}</p></div>
      <div className="infoBox"><strong>Coach Help</strong><p>{built.coach}</p></div>
      <div className="chips">{built.overlays.map(o => <span className="badge" key={o}>{o}</span>)}</div>
    </div>}

    {category && category !== 'ATL / BTL' && <div className="placeholder">{category} games will be built next. ATL / BTL has been restored first because it has the complex selector logic.</div>}
  </div>;
}

function Placeholder({title}){
  return <div className="page"><h1>{title}</h1><div className="placeholder">This section will connect into the system later.</div></div>;
}

function App(){
  const [screen, setScreen] = useState('home');
  const [players, setPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }, [players]);

  return <div>
    <header className="hero">
      <button className="homeBtn" onClick={() => setScreen('home')}>HOME</button>
      <div>
        <div className="eyebrow">CHECKERBOARD COACH</div>
        <h1>Programme Platform</h1>
        <p>Stable Consolidated v51</p>
      </div>
    </header>
    <main className="container">
      {screen === 'home' && <Home setScreen={setScreen} />}
      {screen === 'players' && <Players players={players} setPlayers={setPlayers} />}
      {screen === 'competition' && <Competition players={players} />}
      {screen === 'games' && <Games />}
      {screen === 'sessions' && <Placeholder title="Sessions" />}
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
