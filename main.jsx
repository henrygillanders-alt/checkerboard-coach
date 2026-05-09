
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const levelCategories = [
  { label:'Bronze', level:1 },
  { label:'Silver', level:2 },
  { label:'Gold / Elite', level:3 },
  { label:'Performance', level:4 },
  { label:'Professional', level:5 }
];

const starterPlayers = [
  {
    name:'Anna Murphy',
    playerType:'Programme Player',
    category:'Gold / Elite',
    level:3,
    rankingStatus:'Ranked',
    juniorRanking:1,
    attendance:'18 sessions',
    focus:'Early volley recognition'
  },
  {
    name:'Jack Byrne',
    playerType:'Programme Player',
    category:'Silver',
    level:2,
    rankingStatus:'Ranked',
    juniorRanking:15,
    attendance:'11 sessions',
    focus:'Balance before attack'
  }
];

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

function Players(){
  const [players, setPlayers] = useState(starterPlayers);
  const [showForm, setShowForm] = useState(false);

  const [newPlayer, setNewPlayer] = useState({
    name:'',
    playerType:'Programme Player',
    category:'Bronze',
    level:1,
    rankingStatus:'Ranked',
    juniorRanking:1,
    guestEstimate:'',
    attendance:'0 sessions',
    focus:''
  });

  function updateCategory(category){
    const found = levelCategories.find(c => c.label === category);
    setNewPlayer({...newPlayer, category, level: found ? found.level : 1});
  }

  const sortedPlayers = [...players].sort((a,b) => {
    const aRank = a.playerType === 'Programme Player' ? Number(a.juniorRanking || 9999) : 99999;
    const bRank = b.playerType === 'Programme Player' ? Number(b.juniorRanking || 9999) : 99999;
    return aRank - bRank;
  });

  function addPlayer(){
    if(!newPlayer.name) return;
    setPlayers([...players, newPlayer]);
    setNewPlayer({
      name:'',
      playerType:'Programme Player',
      category:'Bronze',
      level:1,
      rankingStatus:'Ranked',
      juniorRanking:1,
      guestEstimate:'',
      attendance:'0 sessions',
      focus:''
    });
    setShowForm(false);
  }

  return (
    <div className="page">
      <div className="pageTop">
        <h1>Players</h1>
        <button className="primaryBtn" onClick={() => setShowForm(!showForm)}>
          + Add Player
        </button>
      </div>

      {showForm && (
        <div className="formCard">
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
            value={newPlayer.clubRank}
            onChange={e => setNewPlayer({...newPlayer, clubRank:e.target.value})}
          />

          <textarea
            placeholder="Current coaching focus"
            value={newPlayer.focus}
            onChange={e => setNewPlayer({...newPlayer, focus:e.target.value})}
          />

          <button className="primaryBtn" onClick={addPlayer}>
            Save Player
          </button>
        </div>
      )}

      <div className="rankingNote">
        <strong>Competition ordering:</strong> programme players are sorted by Junior Programme Ranking #1, #2, #3, etc. Guests and coaches can join sessions/competitions but do not affect the junior ranking unless manually changed.
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
              <span className="badge">{p.playerType === 'Programme Player' ? `Junior Ranking #${p.juniorRanking}` : 'Guest / Unranked'}</span>
            </div>

            <div className="infoBox">
              <strong>Competition Slot</strong>
              <p>{p.playerType === 'Programme Player' ? `Junior Programme Ranking #${p.juniorRanking}` : `Guest Estimate: ${p.guestEstimate || 'Not set'}`} · Level {p.level} · {p.category}</p>
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
              <button>Attendance</button>
              <button>Competition</button>
              <button>Notes</button>
            </div>
          </div>
        ))}
      </div>
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

  return (
    <div>
      <header className="hero">
        <button className="homeBtn" onClick={() => setScreen('home')}>
          HOME
        </button>

        <div>
          <div className="eyebrow">CHECKERBOARD COACH</div>
          <h1>Programme Platform</h1>
          <p>Phase 33 · Junior ranking + guests</p>
        </div>
      </header>

      <main className="container">
        {screen === 'home' && <Home goTo={setScreen} />}
        {screen === 'players' && <Players />}
        {screen === 'sessions' && <Placeholder title="Sessions" />}
        {screen === 'games' && <Placeholder title="Games" />}
        {screen === 'competition' && <Placeholder title="Competition" />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
