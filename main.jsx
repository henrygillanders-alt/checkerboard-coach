
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

const starterPlayers = [];

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
  const [history, setHistory] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
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
    focus:''
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
      focus:''
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
              <button>Attendance</button>
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


function Competition(){
  const [format, setFormat] = useState('Round Robin');
  const [players, setPlayers] = useState('');
  const [generated, setGenerated] = useState([]);

  function buildCompetition(){
    const names = players
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean);

    if(names.length < 2){
      setGenerated([]);
      return;
    }

    if(format === 'Round Robin'){
      const rounds = [];
      for(let i=0;i<names.length;i++){
        for(let j=i+1;j<names.length;j++){
          rounds.push(`${names[i]} vs ${names[j]}`);
        }
      }
      setGenerated(rounds);
    }

    if(format === 'Monrad'){
      const rounds = names
        .map((p,i) => `Seed ${i+1}: ${p}`)
      setGenerated([
        'Round 1 pairings:',
        ...rounds
      ]);
    }

    if(format === 'NSL'){
      const teamA = names.filter((_,i) => i % 2 === 0);
      const teamB = names.filter((_,i) => i % 2 !== 0);

      setGenerated([
        `Team A: ${teamA.join(', ')}`,
        `Team B: ${teamB.join(', ')}`,
        'Rotate courts every 8 minutes.',
        'Winning team stays on.'
      ]);
    }

    if(format === 'Invasion Game'){
      setGenerated([
        '3v3 or 4v4 team format',
        'Teams invade target zones for points',
        'Rotate every 5–8 minutes',
        'Add checkerboard overlays where appropriate'
      ]);
    }
  }

  return (
    <div className="page">
      <div className="pageTop">
        <h1>Competition</h1>
      </div>

      <div className="competitionCard">
        <label>Competition Format</label>

        <select
          value={format}
          onChange={e => setFormat(e.target.value)}
        >
          <option>Round Robin</option>
          <option>Monrad</option>
          <option>Invasion Game</option>
          <option>NSL</option>
        </select>

        <label>Players</label>

        <textarea
          rows="10"
          placeholder="Enter one player per line"
          value={players}
          onChange={e => setPlayers(e.target.value)}
        />

        <button className="primaryBtn" onClick={buildCompetition}>
          Generate Competition
        </button>
      </div>

      {generated.length > 0 && (
        <div className="competitionOutput">
          <h2>{format}</h2>

          {generated.map((g, i) => (
            <div className="fixtureCard" key={i}>
              {g}
            </div>
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

  return (
    <div>
      <header className="hero">
        <button className="homeBtn" onClick={() => setScreen('home')}>
          HOME
        </button>

        <div>
          <div className="eyebrow">CHECKERBOARD COACH</div>
          <h1>Programme Platform</h1>
          <p>Phase 38 · Competition foundation</p>
        </div>
      </header>

      <main className="container">
        {screen === 'home' && <Home goTo={setScreen} />}
        {screen === 'players' && <Players />}
        {screen === 'sessions' && <Placeholder title="Sessions" />}
        {screen === 'games' && <Placeholder title="Games" />}
        {screen === 'competition' && <Competition />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
