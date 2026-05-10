
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const levelCategories = [
  { label:'Bronze', level:1 },
  { label:'Silver', level:2 },
  { label:'Gold / Elite', level:3 },
  { label:'Performance', level:4 },
  { label:'Professional', level:5 }
];

const starterPlayers = [];


const gameCategories = [
  'ATL / BTL',
  'Classic Conditioned',
  'Checkerboard',
  'Volley & Intercept',
  'Pressure',
  'Technical',
  'Invasion',
  'Matchplay',
  'Warm Up / Perception'
];

const atlOptions = {
  btlCount: ['0 BTL shots', '1 BTL shot', '2 BTL shots', '3 BTL shots'],
  side: ['Both sides', 'Right side only', 'Left side only'],
  consecutive: ['No', 'Yes'],
  shotChoice: ['Any shot', 'Straight drop', 'Crosscourt drop', 'Boast', 'Drive', 'Kill'],
  volleyMethod: ['Players choice', 'Must be volley', 'No volley'],
  cbReference: ['None', '[8-1]', '[7-2]', '[6-4]', '[5-3]', '[5-4]', '[6-3]']
};

function buildAtlFromOptions(options) {
  const countNum = options.btlCount.startsWith('0') ? 0 : options.btlCount.startsWith('1') ? 1 : options.btlCount.startsWith('2') ? 2 : 3;
  const shots = [options.shot1, options.shot2, options.shot3].slice(0, countNum);
  const volleys = [options.volley1, options.volley2, options.volley3].slice(0, countNum);

  const shotText = countNum === 0
    ? 'No compulsory BTL shot; use ATL / BTL cue to manage tempo, balance and visual control.'
    : shots.map((s, idx) => {
        const method = volleys[idx] && volleys[idx] !== 'Players choice' ? ` (${volleys[idx].toLowerCase()})` : ' (player’s choice volley/non-volley)';
        return `BTL shot ${idx + 1}: ${s.toLowerCase()}${method}`;
      }).join('; ');

  const sideText = options.side === 'Both sides'
    ? 'Applies on both sides.'
    : `Applies on ${options.side.replace(' only','').toLowerCase()}.`;

  const consecutiveText = countNum <= 1 ? '' : (options.consecutive === 'Yes' ? 'BTL shots must be consecutive.' : 'BTL shots do not need to be consecutive.');
  const cbText = options.cbReference === 'None' ? '' : ` Checkerboard reference: ${options.cbReference}.`;

  const rationaleParts = [
    'slows the rally problem down enough for players to attend to balance, vision and better information pick-up'
  ];

  if (countNum === 0) rationaleParts.push('uses the ATL / BTL cue as a tempo and visual-control reference without forcing a specific low shot');
  if (countNum === 1) rationaleParts.push('uses one BTL event to create a simple low-trajectory decision inside live play');
  if (countNum === 2) rationaleParts.push('requires the player to repeat or connect low-trajectory decisions under rally pressure');
  if (countNum === 3) rationaleParts.push('creates a more complex sequence while preserving tactical awareness');
  if (options.consecutive === 'Yes' && countNum > 1) rationaleParts.push('the consecutive requirement tests whether players can sustain the constraint across linked shots');
  if (volleys.includes('Must be volley')) rationaleParts.push('volley requirement connects the selected shot outcome with early interception');
  if (volleys.includes('No volley')) rationaleParts.push('no-volley requirement encourages players to create the shot after the bounce');
  if (shots.includes('Boast')) rationaleParts.push('boast requirement links BTL control to angle creation and front-court disruption');
  if (shots.includes('Straight drop')) rationaleParts.push('straight drop requirement connects BTL control to front-court pressure');
  if (shots.includes('Crosscourt drop')) rationaleParts.push('crosscourt drop requirement changes the opponent’s movement problem');
  if (options.cbReference !== 'None') rationaleParts.push(`the ${options.cbReference} checkerboard reference gives the sequence a clear spatial target`);

  const overlayList = [];
  if (volleys.includes('Must be volley')) overlayList.push('Volley Finish');
  if (shots.includes('Boast') || shots.includes('Crosscourt drop')) overlayList.push('Blind Finish');
  if (countNum >= 2) overlayList.push('Opponent Off T');
  if (options.cbReference !== 'None') overlayList.push('CB Code');
  overlayList.push('Clean Winner');

  return {
    tactical:'Use ATL / BTL to slow play, regulate tempo and improve balance, vision and shot selection.',
    rules:`${options.btlCount}: ${shotText}. ${consecutiveText} ${sideText}${cbText}`,
    rationale:`This ATL / BTL structure ${rationaleParts.join(', ')}.`,
    coach:'Use the tape as an external visual cue. Keep rallies live. Coach balance, vision and shot choice rather than fixed technique.',
    overlays: overlayList.filter((v, i, a) => a.indexOf(v) === i).join(' · ')
  };
}

const starterGames = [
  {
    id:1,
    title:'ATL / BTL Structure Builder',
    category:'ATL / BTL',
    isAtlBuilder:true,
    atlOptions:{
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
    },
    tactical:'Use ATL / BTL to slow play, regulate tempo and improve balance, vision and shot selection.',
    rules:'No compulsory BTL shot; use ATL / BTL cue to manage tempo, balance and visual control.',
    rationale:'This ATL / BTL structure slows the rally problem down enough for players to attend to balance, vision and better information pick-up.',
    coach:'Use the tape as an external visual cue. Keep rallies live. Coach balance, vision and shot choice rather than fixed technique.',
    overlays:'Clean Winner',
    duration:'6–8 mins',
    level:'Levels 1–5',
    favourite:false
  },
  {
    id:2,
    title:'Length Before Attack',
    category:'Classic Conditioned',
    tactical:'Build pressure before front-court attack.',
    rules:'Player must create length before attacking short.',
    rationale:'Encourages patient pressure construction rather than rushed attacks.',
    coach:'Watch whether players attack only after the opponent is displaced or late.',
    overlays:'4-Shot Window · 2-Shot Window · Clean Winner · CB Code',
    duration:'8 mins',
    level:'Levels 2–5',
    favourite:false
  },
  {
    id:3,
    title:'Checkerboard Pair Challenge',
    category:'Checkerboard',
    tactical:'Recognise tactical affordances before attacking.',
    rules:'Complete a selected CB pair before scoring bonus unlocks.',
    rationale:'Builds tactical linking and opponent displacement awareness.',
    coach:'Players should recognise opportunity, not force the sequence.',
    overlays:'CB Code · 4-Shot Window · 2-Shot Window · Clean Winner',
    duration:'8 mins',
    level:'Levels 3–5',
    favourite:false
  }
];

function GameCard({game, toggleFavourite, addToSession, updateAtlOption}){
  return (
    <div className="gameCard">
      <div className="cardTop">
        <div>
          <div className="categoryTag">{game.category}</div>
          <h2>{game.title}</h2>
        </div>

        <button
          className={game.favourite ? 'favBtn activeFav' : 'favBtn'}
          onClick={() => toggleFavourite(game.id)}
        >
          ★
        </button>
      </div>

      {game.isAtlBuilder && (
        <div className="atlBuilderBox">
          <strong>ATL / BTL Structure</strong>
          <div className="atlOptionsGrid">
            <label>BTL Count<select value={game.atlOptions.btlCount} onChange={e => updateAtlOption(game.id,'btlCount',e.target.value)}>{atlOptions.btlCount.map(o => <option key={o}>{o}</option>)}</select></label>
            <label>Side<select value={game.atlOptions.side} onChange={e => updateAtlOption(game.id,'side',e.target.value)}>{atlOptions.side.map(o => <option key={o}>{o}</option>)}</select></label>
            <label>Consecutive<select value={game.atlOptions.consecutive} onChange={e => updateAtlOption(game.id,'consecutive',e.target.value)}>{atlOptions.consecutive.map(o => <option key={o}>{o}</option>)}</select></label>
            <label>CB Ref<select value={game.atlOptions.cbReference} onChange={e => updateAtlOption(game.id,'cbReference',e.target.value)}>{atlOptions.cbReference.map(o => <option key={o}>{o}</option>)}</select></label>

            {game.atlOptions.btlCount !== '0 BTL shots' && <label>BTL Shot 1<select value={game.atlOptions.shot1} onChange={e => updateAtlOption(game.id,'shot1',e.target.value)}>{atlOptions.shotChoice.map(o => <option key={o}>{o}</option>)}</select></label>}
            {game.atlOptions.btlCount !== '0 BTL shots' && <label>Shot 1 Method<select value={game.atlOptions.volley1} onChange={e => updateAtlOption(game.id,'volley1',e.target.value)}>{atlOptions.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></label>}

            {(game.atlOptions.btlCount === '2 BTL shots' || game.atlOptions.btlCount === '3 BTL shots') && <label>BTL Shot 2<select value={game.atlOptions.shot2} onChange={e => updateAtlOption(game.id,'shot2',e.target.value)}>{atlOptions.shotChoice.map(o => <option key={o}>{o}</option>)}</select></label>}
            {(game.atlOptions.btlCount === '2 BTL shots' || game.atlOptions.btlCount === '3 BTL shots') && <label>Shot 2 Method<select value={game.atlOptions.volley2} onChange={e => updateAtlOption(game.id,'volley2',e.target.value)}>{atlOptions.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></label>}

            {game.atlOptions.btlCount === '3 BTL shots' && <label>BTL Shot 3<select value={game.atlOptions.shot3} onChange={e => updateAtlOption(game.id,'shot3',e.target.value)}>{atlOptions.shotChoice.map(o => <option key={o}>{o}</option>)}</select></label>}
            {game.atlOptions.btlCount === '3 BTL shots' && <label>Shot 3 Method<select value={game.atlOptions.volley3} onChange={e => updateAtlOption(game.id,'volley3',e.target.value)}>{atlOptions.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></label>}
          </div>
        </div>
      )}

      <div className="infoBox">
        <strong>Tactical Problem</strong>
        <p>{game.tactical}</p>
      </div>

      <div className="infoBox">
        <strong>Task / Rules</strong>
        <p>{game.rules}</p>
      </div>

      <div className="infoBox">
        <strong>Rationale</strong>
        <p>{game.rationale}</p>
      </div>

      <div className="infoBox">
        <strong>Coach Help</strong>
        <p>{game.coach}</p>
      </div>

      <div className="metaGrid">
        <div><strong>Overlays</strong><span>{game.overlays}</span></div>
        <div><strong>Duration</strong><span>{game.duration}</span></div>
        <div><strong>Levels</strong><span>{game.level}</span></div>
      </div>

      <div className="actionRow">
        <button onClick={() => addToSession(game)}>Add To Session</button>
        <button>Duplicate</button>
        <button>Edit</button>
      </div>
    </div>
  );
}

function Games(){
  const [games, setGames] = useState(() => {
    try{
      const saved = localStorage.getItem('checkerboardGames');
      return saved ? JSON.parse(saved) : starterGames;
    }catch{
      return starterGames;
    }
  });

  const [sessionGames, setSessionGames] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    localStorage.setItem('checkerboardGames', JSON.stringify(games));
  }, [games]);

  const categories = ['All', ...gameCategories];

  const filteredGames = games.filter(game => {
    const matchesCategory = category === 'All' || game.category === category;
    const matchesSearch =
      game.title.toLowerCase().includes(search.toLowerCase()) ||
      game.rules.toLowerCase().includes(search.toLowerCase()) ||
      game.rationale.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function toggleFavourite(id){
    setGames(games.map(g => g.id === id ? {...g, favourite: !g.favourite} : g));
  }

  function addToSession(game){
    setSessionGames([...sessionGames, game]);
  }

  function updateAtlOption(id, key, value){
    setGames(games.map(g => {
      if(g.id !== id) return g;
      const atlOptions = {...g.atlOptions, [key]: value};
      const built = buildAtlFromOptions(atlOptions);
      return {...g, atlOptions, tactical: built.tactical, rules: built.rules, rationale: built.rationale, coach: built.coach, overlays: built.overlays};
    }));
  }

  return (
    <div className="page">
      <div className="pageTop">
        <h1>Games</h1>
        <button className="primaryBtn">Session Games: {sessionGames.length}</button>
      </div>

      <div className="topBar">
        <input className="searchInput" placeholder="Search games..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="categoryRow">
        {categories.map(c => (
          <button key={c} className={category === c ? 'catBtn activeCat' : 'catBtn'} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      <div className="gamesGrid">
        {filteredGames.map(game => (
          <GameCard key={game.id} game={game} toggleFavourite={toggleFavourite} addToSession={addToSession} updateAtlOption={updateAtlOption} />
        ))}
      </div>
    </div>
  );
}


function Home({goTo}){
  return (
    <div className="homeGrid">
      <button className="tile blue" onClick={() => goTo('sessions')}>
        <h2>Sessions</h2>
        <p>Build rotation-based sessions.</p>
      </button>

      <button className="tile purple" onClick={() => goTo('games')}>
        <h2>Games</h2>
        <p>ATL/BTL, classic conditioned, checkerboard.</p>
      </button>

      <button className="tile green" onClick={() => goTo('players')}>
        <h2>Players</h2>
        <p>Player levels, absolute junior programme rankinging, attendance and history.</p>
      </button>

      <button className="tile red" onClick={() => goTo('competition')}>
        <h2>Competition</h2>
        <p>Round robin, Monrad, NSL and invasion games.</p>
      </button>
    </div>
  );
}

function Players({players, setPlayers}){
    const [history, setHistory] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEstimate, setGuestEstimate] = useState('Level 3');
  const [showForm, setShowForm] = useState(false);

  const [newPlayer, setNewPlayer] = useState({
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
  });

  function saveSnapshot(){
    setHistory([...history, players]);
  }

  function undoLastChange(){
    if(history.length === 0) return;
    const previous = history[history.length - 1];
    setPlayers(previous);
    setHistory(history.slice(0, -1));
    setEditingIndex(null);
    setShowForm(false);
  }

  function updateCategory(category){
    const found = levelCategories.find(c => c.label === category);
    setNewPlayer({...newPlayer, category, level: found ? found.level : 1});
  }

  const sortedPlayers = players.map((p, originalIndex) => ({...p, originalIndex})).sort((a,b) => {
    const aRank = a.playerType === 'Programme Player' ? Number(a.juniorRanking && String(a.juniorRanking).trim() !== '' ? a.juniorRanking : 9999) : 99999;
    const bRank = b.playerType === 'Programme Player' ? Number(b.juniorRanking && String(b.juniorRanking).trim() !== '' ? b.juniorRanking : 9999) : 99999;
    return aRank - bRank;
  });

  function addPlayer(){
    if(!newPlayer.name) return;
    saveSnapshot();

    if(editingIndex !== null){
      const updated = [...players];
      updated[editingIndex] = newPlayer;
      setPlayers(updated);
    } else {
      setPlayers([...players, newPlayer]);
    }

    setNewPlayer({
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
    });
    setEditingIndex(null);
    setShowForm(false);
  }

  function editPlayer(player, index){
    const { originalIndex, ...cleanPlayer } = player;
    setNewPlayer({...cleanPlayer, juniorRanking: cleanPlayer.juniorRanking || ''});
    setEditingIndex(index);
    setShowForm(true);
    window.scrollTo(0,0);
  }

  function deletePlayer(index){
    saveSnapshot();
    setPlayers(players.filter((_, i) => i !== index));
  }

  function togglePresent(index){
    const updated = [...players];
    updated[index] = {...updated[index], present: !updated[index].present};
    setPlayers(updated);
  }

  function addQuickGuest(){
    if(!guestName.trim()) return;

    const levelGuess = guestEstimate.includes('5') ? 5 :
      guestEstimate.includes('4') ? 4 :
      guestEstimate.includes('3') ? 3 :
      guestEstimate.includes('2') ? 2 : 1;

    const guest = {
      name: guestName.trim(),
      playerType:'Guest Player',
      category:'Guest',
      level:levelGuess,
      rankingStatus:'Guest Estimate',
      juniorRanking:'',
      guestEstimate,
      attendance:'Guest today',
      focus:'',
      present:true
    };

    setPlayers([...players, guest]);
    setGuestName('');
    setGuestEstimate('Level 3');
  }

  return (
    <div className="page">
      <div className="pageTop">
        <h1>Players</h1>
        <div className="buttonRow">
          <button className="secondaryBtn" onClick={undoLastChange} disabled={history.length === 0}>
            Undo Last Change
          </button>
          <button className="primaryBtn" onClick={() => { setEditingIndex(null); setShowForm(!showForm); }}>
            + Add Player
          </button>
        </div>
      </div>

      {showForm && (
        <div className="formCard">
          <h3>{editingIndex !== null ? 'Edit Player' : 'Add Player'}</h3>
          <input
            placeholder="Player name"
            value={newPlayer.name}
            onChange={e => setNewPlayer({...newPlayer, name:e.target.value})}
          />

          <select
            value={newPlayer.category}
            onChange={e => updateCategory(e.target.value)}
          >
            {levelCategories.map(c => (
              <option key={c.label}>{c.label}</option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Absolute junior programme ranking"
            value={newPlayer.juniorRanking || ''}
              onChange={e => setNewPlayer({...newPlayer, juniorRanking:e.target.value})}
          />

          <textarea
            placeholder="Current coaching focus"
            value={newPlayer.focus}
            onChange={e => setNewPlayer({...newPlayer, focus:e.target.value})}
          />

          <div className="buttonRow">
            <button className="primaryBtn" onClick={addPlayer}>
              {editingIndex !== null ? 'Update Player' : 'Save Player'}
            </button>
            <button className="secondaryBtn" onClick={() => { setShowForm(false); setEditingIndex(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="attendanceSummary">
        <strong>Present today:</strong> {players.filter(p => p.present).length}
        <span>Competition will auto-use marked-present players.</span>
      </div>

      <div className="quickGuestBox">
        <strong>Add Guest To Today’s Attendance</strong>
        <div className="quickGuestRow">
          <input
            placeholder="Guest name"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
          />
          <select value={guestEstimate} onChange={e => setGuestEstimate(e.target.value)}>
            <option>Level 1 guest</option>
            <option>Level 2 guest</option>
            <option>Level 3 guest</option>
            <option>Level 4 guest</option>
            <option>Level 5 guest</option>
            <option>Adult challenge player</option>
            <option>Coach playing</option>
          </select>
          <button className="primaryBtn" onClick={addQuickGuest}>
            Add Present Guest
          </button>
        </div>
        <p>Guests are marked present immediately and flow into sessions and competitions, but do not affect Junior Programme Ranking.</p>
      </div>

      <div className="rankingNote">
        <strong>Competition ordering:</strong> programme players are sorted by Junior Programme Ranking #1, #2, #3, etc. Use Edit or Change Ranking on a player card to correct a ranking. Guests and coaches can join sessions/competitions but do not affect the junior ranking unless manually changed.
      </div>

      <div className="levelGuide">
        {levelCategories.map(c => (
          <div key={c.label}>
            <strong>{c.label}</strong>
            <span>Level {c.level}</span>
          </div>
        ))}
      </div>

      <div className="playerGrid">
        {sortedPlayers.map((p, i) => (
          <div className="playerCard" key={i}>
            <h3>{p.name}</h3>

            <div className="badgeRow">
              <span className="badge">{p.playerType}</span>
              <span className="badge">{p.category}</span>
              <span className="badge">Level {p.level}</span>
              <span className="badge displayOnly">{p.playerType === 'Programme Player' ? `Junior Ranking #${p.juniorRanking && String(p.juniorRanking).trim() !== '' ? p.juniorRanking : 'not set'}` : 'Guest / Unranked'}</span>
            </div>

            <div className="infoBox">
              <strong>Competition Slot</strong>
              <p>{p.playerType === 'Programme Player' ? `Junior Programme Ranking #${p.juniorRanking && String(p.juniorRanking).trim() !== '' ? p.juniorRanking : 'not set'}` : `Guest Estimate: ${p.guestEstimate || 'Not set'}`} · Level {p.level} · {p.category}</p>
            </div>

            <div className="infoBox">
              <strong>Attendance</strong>
              <p>{p.attendance}</p>
            </div>

            <div className="infoBox">
              <strong>Current Focus</strong>
              <p>{p.focus || 'No coaching focus added yet.'}</p>
            </div>

            <div className="actionRow">
              <button className={p.present ? 'presentBtn activePresent' : 'presentBtn'} onClick={() => togglePresent(p.originalIndex)}>
                {p.present ? 'Present ✓' : 'Mark Present'}
              </button>
              <button onClick={() => editPlayer(p, p.originalIndex)}>Edit</button>
              <button onClick={() => editPlayer(p, p.originalIndex)}>Change Ranking</button>
              <button onClick={() => deletePlayer(p.originalIndex)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function Competition({players}){
  const [format, setFormat] = useState('Round Robin');
  const [manualPlayers, setManualPlayers] = useState('');
  const [rrBoxes, setRrBoxes] = useState(1);
  const [generated, setGenerated] = useState([]);
  const [courts, setCourts] = useState(3);
  const [courtLives, setCourtLives] = useState(20);
  const [monradRounds, setMonradRounds] = useState(3);
  const [matchFormat, setMatchFormat] = useState('First to 11');

  const presentPlayers = players
    .filter(p => p.present)
    .sort((a,b) => {
      const aRank = a.playerType === 'Programme Player' ? Number(a.juniorRanking || 9999) : 9000 - Number(a.level || 0);
      const bRank = b.playerType === 'Programme Player' ? Number(b.juniorRanking || 9999) : 9000 - Number(b.level || 0);
      return aRank - bRank;
    });

  const names = presentPlayers.length > 0
    ? presentPlayers.map(p => p.name)
    : manualPlayers.split('\n').map(p => p.trim()).filter(Boolean);

  function buildCompetition(){
    if(names.length < 2){
      setGenerated(['Need at least 2 players marked present or entered manually.']);
      return;
    }

    if(format === 'Round Robin'){
      const boxCount = Math.min(rrBoxes, names.length);
      const boxes = Array.from({ length: boxCount }, () => []);

      names.forEach((name, index) => {
        boxes[index % boxCount].push(name);
      });

      const output = [];

      boxes.forEach((box, boxIndex) => {
        output.push(`Box ${boxIndex + 1}: ${box.join(', ')}`);

        for(let i=0;i<box.length;i++){
          for(let j=i+1;j<box.length;j++){
            output.push(`Box ${boxIndex + 1}: ${box[i]} vs ${box[j]}`);
          }
        }
      });

      const formatNote = rrBoxes === 1
        ? 'All players in one box.'
        : rrBoxes === 2
          ? 'Two pools. Use results for final / re-seed.'
          : rrBoxes === 3
            ? 'Three pools. Use results for second round.'
            : 'Four pools. Use results for second round.';

      setGenerated([
        `Round Robin · ${rrBoxes} box${rrBoxes > 1 ? 'es' : ''} · ${courts} courts · ${matchFormat}`,
        formatNote,
        'Standings order: matches won → games difference → points difference → head-to-head.',
        ...output
      ]);
      return;
    }

    if(format === 'Monrad'){
      const pairings = [];
      for(let i = 0; i < Math.floor(names.length / 2); i++){
        const a = names[i];
        const b = names[names.length - 1 - i];
        pairings.push(`Court ${(i % courts) + 1}: ${a} vs ${b}`);
      }
      if(names.length % 2 === 1){
        pairings.push(`Bye: ${names[Math.floor(names.length / 2)]}`);
      }
      setGenerated([
        `Monrad · ${monradRounds} rounds · ${courts} courts · ${matchFormat}`,
        'Round 1 seeded pairings:',
        ...pairings,
        'After each round: winners play winners, losers play losers, avoiding repeat matches where possible.'
      ]);
      return;
    }

    if(format === 'NSL'){
      const teamA = names.filter((_,i) => i % 2 === 0);
      const teamB = names.filter((_,i) => i % 2 !== 0);
      setGenerated([
        `NSL · ${courts} courts · ${matchFormat}`,
        `Team A: ${teamA.join(', ')}`,
        `Team B: ${teamB.join(', ')}`,
        'Teams are seeded from attendance order / Junior Programme Ranking.'
      ]);
      return;
    }

    if(format === 'Invasion Game'){
      const groups = Array.from({ length: courts }, () => []);
      names.forEach((name, index) => {
        groups[index % courts].push(name);
      });

      const output = groups.map((group, index) => {
        const playerCount = group.length;
        if(playerCount === 0) return `Court ${index + 1}: no players allocated`;
        const livesEach = Math.floor(courtLives / playerCount);
        const spare = courtLives % playerCount;
        return `Court ${index + 1}: ${group.join(', ')} — ${courtLives} total lives — ${livesEach} lives each${spare ? ` + ${spare} spare lives to allocate` : ''}`;
      });

      setGenerated([
        `Invasion Game · ${courts} courts · ${courtLives} lives per court`,
        ...output,
        'Principle: every court has the same total lives. Uneven player numbers are balanced by lives per player.'
      ]);
      return;
    }
  }

  return (
    <div className="page">
      <div className="pageTop">
        <h1>Competition</h1>
      </div>

      <div className="competitionCard">
        <label>Competition Format</label>
        <select value={format} onChange={e => setFormat(e.target.value)}>
          <option>Round Robin</option>
          <option>Monrad</option>
          <option>Invasion Game</option>
          <option>NSL</option>
        </select>

        {format === 'Round Robin' && (
          <div className="rrBoxSelector">
            <label>Round Robin Box Format</label>
            <div className="standingsNote">
              Final placings: matches won → games difference → points difference → head-to-head.
            </div>
            <div className="boxGrid">
              {[1,2,3,4].map(n => (
                <button
                  key={n}
                  className={rrBoxes === n ? 'boxOption activeBox' : 'boxOption'}
                  onClick={() => setRrBoxes(n)}
                >
                  <strong>{n} {n === 1 ? 'Box' : 'Boxes'}</strong>
                  <span>
                    {n === 1 ? 'All players in one group' :
                     n === 2 ? 'Two pools · final / re-seed' :
                     n === 3 ? 'Three pools · second round' :
                     'Four pools · second round'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="competitionControls">
          <div>
            <label>Courts</label>
            <div className="stepper">
              <button onClick={() => setCourts(Math.max(1, courts - 1))}>−</button>
              <strong>{courts}</strong>
              <button onClick={() => setCourts(Math.min(6, courts + 1))}>+</button>
            </div>
            <small>Supports 1–6 courts. Default is 3.</small>
          </div>

          {format === 'Invasion Game' && (
            <div>
              <label>Total Lives Per Court</label>
              <div className="stepper livesStepper">
                <button onClick={() => setCourtLives(Math.max(1, courtLives - 1))}>−</button>
                <strong>{courtLives}</strong>
                <button onClick={() => setCourtLives(courtLives + 1)}>+</button>
              </div>
              <small>Only used for Invasion Game.</small>
            </div>
          )}

          {format === 'Monrad' && (
            <>
              <div>
                <label>Rounds</label>
                <div className="stepper">
                  <button onClick={() => setMonradRounds(Math.max(1, monradRounds - 1))}>−</button>
                  <strong>{monradRounds}</strong>
                  <button onClick={() => setMonradRounds(monradRounds + 1)}>+</button>
                </div>
                <small>Typical Monrad: 3–5 rounds.</small>
              </div>
              <div>
                <label>Match Format</label>
                <select value={matchFormat} onChange={e => setMatchFormat(e.target.value)}>
                  <option>First to 11</option>
                  <option>Timed</option>
                  <option>Best of 3</option>
                  <option>Best of 5</option>
                </select>
                <small>Monrad does not use lives.</small>
              </div>
            </>
          )}

          {(format === 'Round Robin' || format === 'NSL') && (
            <div>
              <label>Match Format</label>
              <select value={matchFormat} onChange={e => setMatchFormat(e.target.value)}>
                <option>First to 11</option>
                <option>Timed</option>
                <option>Best of 3</option>
                <option>Best of 5</option>
                <option>Timed periods</option>
              </select>
              <small>{format} does not use lives.</small>
            </div>
          )}
        </div>

        <div className="presentCompetitionBox">
          <strong>Auto-entry from attendance</strong>
          <p>{presentPlayers.length} players marked present.</p>
          {presentPlayers.length > 0 && (
            <ol>
              {presentPlayers.map(p => (
                <li key={p.name}>
                  {p.name} {p.playerType === 'Programme Player' ? `(JPR #${p.juniorRanking || 'not set'})` : `(${p.guestEstimate || 'Guest'})`}
                </li>
              ))}
            </ol>
          )}
        </div>

        <label>Manual Players</label>
        <textarea
          rows="6"
          placeholder="Optional fallback: enter one player per line if no one is marked present"
          value={manualPlayers}
          onChange={e => setManualPlayers(e.target.value)}
        />

        <button className="primaryBtn" onClick={buildCompetition}>
          {format === 'Invasion Game' ? 'Generate Invasion Game' : `Generate ${format}`}
        </button>

        {format === 'Invasion Game' && (
          <div className="hintBox">
            Example: 20 lives per court. Court with 5 players = 4 lives each. Court with 4 players = 5 lives each.
          </div>
        )}
      </div>

      {generated.length > 0 && (
        <div className="competitionOutput">
          <h2>{format}</h2>
          {generated.map((g, i) => (
            <div className="fixtureCard" key={i}>{g}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function Placeholder({title}){
  return (
    <div className="page">
      <h1>{title}</h1>
      <div className="placeholder">
        This section will connect into the player database later.
      </div>
    </div>
  );
}

function App(){
  const [screen, setScreen] = useState('home');
  const [players, setPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem('checkerboardPlayers');
      return saved ? JSON.parse(saved) : starterPlayers;
    } catch {
      return starterPlayers;
    }
  });

  useEffect(() => {
    localStorage.setItem('checkerboardPlayers', JSON.stringify(players));
  }, [players]);

  return (
    <div>
      <header className="hero">
        <button className="homeBtn" onClick={() => setScreen('home')}>
          HOME
        </button>

        <div>
          <div className="eyebrow">CHECKERBOARD COACH</div>
          <h1>Programme Platform</h1>
          <p>Phase 48 · Integrated games library ATL</p>
        </div>
      </header>

      <main className="container">
        {screen === 'home' && <Home goTo={setScreen} />}
        {screen === 'players' && <Players players={players} setPlayers={setPlayers} />}
        {screen === 'sessions' && <Placeholder title="Sessions" />}
        {screen === 'games' && <Games />}
        {screen === 'competition' && <Competition players={players} />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
