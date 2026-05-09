
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const starterPlayers = [
  {
    name:'Anna Murphy',
    squad:'Gold',
    level:'Elite',
    attendance:'18 sessions',
    focus:'Early volley recognition'
  },
  {
    name:'Jack Byrne',
    squad:'Silver',
    level:'Intermediate',
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
        <p>Squads, attendance and player history.</p>
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
    squad:'Bronze',
    level:'Beginner',
    attendance:'0 sessions',
    focus:''
  });

  function addPlayer(){
    if(!newPlayer.name) return;
    setPlayers([...players, newPlayer]);
    setNewPlayer({
      name:'',
      squad:'Bronze',
      level:'Beginner',
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
            value={newPlayer.squad}
            onChange={e => setNewPlayer({...newPlayer, squad:e.target.value})}
          >
            <option>Mini Squash</option>
            <option>Bronze</option>
            <option>Silver</option>
            <option>Gold</option>
            <option>Performance</option>
            <option>Professional</option>
          </select>

          <select
            value={newPlayer.level}
            onChange={e => setNewPlayer({...newPlayer, level:e.target.value})}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Elite</option>
            <option>Performance</option>
            <option>Professional</option>
          </select>

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

      <div className="playerGrid">
        {players.map((p, i) => (
          <div className="playerCard" key={i}>
            <h3>{p.name}</h3>

            <div className="badgeRow">
              <span className="badge">{p.squad}</span>
              <span className="badge">{p.level}</span>
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
          <p>Phase 30 · Player database foundation</p>
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
