import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Shuffle, Home, ArrowLeft, RotateCcw } from 'lucide-react';
import { libraryGroups, quickStarts, challengeDeck } from './data/games.js';
import { scoreRally, levelWindowText } from './utils/scoring.js';
import './styles.css';

function App() {
  const [page, setPage] = useState('home');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [challenge, setChallenge] = useState(challengeDeck[0]);
  const [level, setLevel] = useState(1);

  const selectedGroup = useMemo(
    () => libraryGroups.find((g) => g.id === selectedGroupId) || null,
    [selectedGroupId]
  );

  function goHome() {
    setPage('home');
    setSelectedGroupId(null);
    setSelectedGame(null);
  }

  function openLibrary(groupId = null) {
    setSelectedGame(null);
    setSelectedGroupId(groupId);
    setPage('library');
  }

  function openQuickStart(id) {
    setSelectedGame(null);
    setSelectedGroupId(null);
    setPage(id);
  }

  function pickRandomChallenge() {
    setChallenge(challengeDeck[Math.floor(Math.random() * challengeDeck.length)]);
  }

  return (
    <div className="app-shell">
      <Header onHome={goHome} />
      {page !== 'home' && <NavBar onHome={goHome} onBack={() => (page === 'game' ? setPage('library') : goHome())} />}

      {page === 'home' && <HomePage openLibrary={openLibrary} openQuickStart={openQuickStart} />}
      {page === 'library' && <LibraryPage selectedGroup={selectedGroup} openLibrary={openLibrary} openGame={(game) => { setSelectedGame(game); setPage('game'); }} />}
      {page === 'game' && <GamePage game={selectedGame} group={selectedGroup} />}
      {page === 'singles' && <GeneratorPage title="CB Singles" type="single" challenge={challenge} pickRandomChallenge={pickRandomChallenge} level={level} setLevel={setLevel} />}
      {page === 'pairs' && <GeneratorPage title="CB Pairs" type="pair" challenge={challenge} pickRandomChallenge={pickRandomChallenge} level={level} setLevel={setLevel} />}
      {page === 'custom' && <CustomSession />}
      {page === 'main-menu' && <MainMenu setPage={setPage} />}
      {page === 'scoring' && <ScoringPage />}
    </div>
  );
}

function Header({ onHome }) {
  return (
    <header className="app-header" onClick={onHome}>
      <div className="eyebrow">Squash Tactical Training</div>
      <h1>Checkerboard</h1>
      <p>Constraints-led coach app · stabilised navigation</p>
    </header>
  );
}

function NavBar({ onHome, onBack }) {
  return (
    <div className="nav-bar">
      <button onClick={onBack}><ArrowLeft size={18} /> Back</button>
      <button onClick={onHome}><Home size={18} /> Home</button>
    </div>
  );
}

function HomePage({ openLibrary, openQuickStart }) {
  return (
    <main className="screen">
      <section>
        <h2>Start a Session</h2>
        <div className="grid three">
          {libraryGroups.map((group) => (
            <button key={group.id} className={`tile ${group.id}`} onClick={() => openLibrary(group.id)}>
              <strong>{group.title}</strong>
              <span>{group.subtitle}</span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2>Quick Start</h2>
        <div className="grid two">
          {quickStarts.map((item) => (
            <button key={item.id} className="tile quick" onClick={() => openQuickStart(item.id)}>
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function LibraryPage({ selectedGroup, openLibrary, openGame }) {
  const groups = selectedGroup ? [selectedGroup] : libraryGroups;
  return (
    <main className="screen">
      <h2>Library</h2>
      <p className="muted">Select a game. Home always returns to the start screen.</p>
      {selectedGroup && <button className="secondary" onClick={() => openLibrary(null)}>Show all categories</button>}
      {groups.map((group) => (
        <section key={group.id} className="panel">
          <h3>{group.title}</h3>
          <p>{group.subtitle}</p>
          <div className="list">
            {(group.games.length ? group.games : libraryGroups.flatMap((g) => g.games)).map((game) => (
              <button key={game} onClick={() => openGame(game)}>{game}</button>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function GamePage({ game, group }) {
  return (
    <main className="screen">
      <div className="panel big">
        <h2>{game || 'Game'}</h2>
        <p className="muted">{group?.title || 'Checkerboard Game'}</p>
        <h3>Rules</h3>
        <p>Play the rally normally. The checkerboard condition creates the scoring opportunity.</p>
        <h3>Default scoring</h3>
        <ul>
          <li>Win rally: +1</li>
          <li>Complete single: +1</li>
          <li>Complete pair: +2</li>
          <li>Complete triple: +3</li>
          <li>Win after challenge: +3 bonus</li>
          <li>Clean winner sits on top: +2</li>
        </ul>
      </div>
    </main>
  );
}

function GeneratorPage({ title, type, challenge, pickRandomChallenge, level, setLevel }) {
  const sampleScore = scoreRally({ win: true, challenge: type, clean: true });
  return (
    <main className="screen">
      <div className="panel big center">
        <h2>{title}</h2>
        <div className="challenge-card">{challenge}</div>
        <button className="primary" onClick={pickRandomChallenge}><Shuffle size={18} /> Draw new challenge</button>
        <div className="level-row">
          {[1,2,3,4,5].map((n) => <button className={level === n ? 'active' : ''} key={n} onClick={() => setLevel(n)}>Level {n}</button>)}
        </div>
        <p>{levelWindowText(level)}</p>
        <p className="muted">Example clean winning score: {sampleScore}</p>
      </div>
    </main>
  );
}

function CustomSession() {
  return (
    <main className="screen">
      <div className="panel big">
        <h2>Custom Session</h2>
        <p>Use this as a simple court-side session frame.</p>
        <ol>
          <li>Choose singles, pairs or triples.</li>
          <li>Choose Level 1–5.</li>
          <li>Use the default scoring protocol.</li>
          <li>Progress only when the rule is clear to both players.</li>
        </ol>
      </div>
    </main>
  );
}

function MainMenu({ setPage }) {
  return (
    <main className="screen">
      <h2>Main Menu</h2>
      <div className="grid two">
        <button className="tile" onClick={() => setPage('library')}>Library</button>
        <button className="tile" onClick={() => setPage('singles')}>Challenge Generator</button>
        <button className="tile" onClick={() => setPage('scoring')}>Scoring Protocol</button>
        <button className="tile" onClick={() => setPage('custom')}>Session Builder</button>
      </div>
    </main>
  );
}

function ScoringPage() {
  return (
    <main className="screen">
      <div className="panel big">
        <h2>Default Scoring Protocol</h2>
        <ul>
          <li>Win rally: +1</li>
          <li>Complete single challenge: +1</li>
          <li>Complete pair challenge: +2</li>
          <li>Complete triple challenge: +3</li>
          <li>Win after completing challenge: +3 bonus</li>
          <li>Clean winner bonus: +2 on top</li>
        </ul>
        <p>Levels 1–3: challenge is banked. Level 4: win within 4 shots. Level 5: win within 2 shots.</p>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
