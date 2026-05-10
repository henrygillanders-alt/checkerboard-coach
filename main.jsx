
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';


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

  const tactical = 'Use ATL / BTL to slow play, regulate tempo and improve balance, vision and shot selection.';
  const rules = `${options.btlCount}: ${shotText}. ${consecutiveText} ${sideText}${cbText}`;

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
    tactical,
    rules,
    rationale: `This ATL / BTL structure ${rationaleParts.join(', ')}.`,
    coach: 'Use the tape as an external visual cue. Keep rallies live. Coach balance, vision and shot choice rather than fixed technique.',
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
    rules:'Player must hit 2 lengths before attacking.',
    rationale:'Encourages patient pressure construction rather than rushed attacks.',
    coach:'Watch if players attack before opponent is displaced.',
    overlays:'Finish within 4 shots · Clean winner bonus',
    duration:'8 mins',
    level:'Levels 2–5',
    favourite:false
  },
  {
    id:3,
    title:'Checkerboard Pair Challenge',
    category:'Checkerboard',
    tactical:'Recognise tactical affordances before attacking.',
    rules:'Complete [6-3] + [8-1] before scoring bonus unlocks.',
    rationale:'Builds tactical linking and opponent displacement awareness.',
    coach:'Players should recognise opportunity, not force sequence.',
    overlays:'2-shot finish · Clean winner',
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
        <div>
          <strong>Overlays</strong>
          <span>{game.overlays}</span>
        </div>

        <div>
          <strong>Duration</strong>
          <span>{game.duration}</span>
        </div>

        <div>
          <strong>Levels</strong>
          <span>{game.level}</span>
        </div>
      </div>

      <div className="actionRow">
        <button onClick={() => addToSession(game)}>
          Add To Session
        </button>

        <button>
          Duplicate
        </button>

        <button>
          Edit
        </button>
      </div>
    </div>
  );
}

function App(){
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

  const categories = [
    'All',
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

  const filteredGames = games.filter(game => {
    const matchesCategory =
      category === 'All' || game.category === category;

    const matchesSearch =
      game.title.toLowerCase().includes(search.toLowerCase()) ||
      game.rules.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  function toggleFavourite(id){
    setGames(games.map(g =>
      g.id === id
        ? {...g, favourite: !g.favourite}
        : g
    ));
  }

  function updateAtlOption(id, key, value){
    setGames(games.map(g => {
      if(g.id !== id) return g;
      const atlOptions = {...g.atlOptions, [key]: value};
      const built = buildAtlFromOptions(atlOptions);
      return {
        ...g,
        atlOptions,
        tactical: built.tactical,
        rules: built.rules,
        rationale: built.rationale,
        coach: built.coach,
        overlays: built.overlays
      };
    }));
  }


  function addToSession(game){
    setSessionGames([...sessionGames, game]);
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <div className="eyebrow">CHECKERBOARD COACH</div>
          <h1>Games Library</h1>
          <p>Phase 47 · Games Library ATL structures</p>
        </div>
      </header>

      <main className="container">
        <div className="topBar">
          <input
            className="searchInput"
            placeholder="Search games..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <button className="sessionCount">
            Session Games: {sessionGames.length}
          </button>
        </div>

        <div className="categoryRow">
          {categories.map(c => (
            <button
              key={c}
              className={category === c ? 'catBtn activeCat' : 'catBtn'}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="gamesGrid">
          {filteredGames.map(game => (
            <GameCard
              key={game.id}
              game={game}
              toggleFavourite={toggleFavourite}
              addToSession={addToSession}
              updateAtlOption={updateAtlOption}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
