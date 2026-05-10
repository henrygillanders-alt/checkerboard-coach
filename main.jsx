
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const starterGames = [
  {
    id:1,
    title:'ATL 1 Below',
    category:'ATL / BTL',
    tactical:'Slow play to improve balance and visual control.',
    rules:'Player must play 1 shot below the service line before attacking.',
    rationale:'Slows tempo so players can stabilise movement and improve perception-action control.',
    coach:'Watch for balanced hitting base and visual tracking before acceleration.',
    overlays:'Volley only · Straight drop only · [8-1]',
    duration:'6–8 mins',
    level:'Levels 1–3',
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

function GameCard({game, toggleFavourite, addToSession}){
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

  function addToSession(game){
    setSessionGames([...sessionGames, game]);
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <div className="eyebrow">CHECKERBOARD COACH</div>
          <h1>Games Library</h1>
          <p>Phase 46 · Games Library Core</p>
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
            />
          ))}
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
