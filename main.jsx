import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const GAMES = [
  {
    id: 't-zone-return',
    category: 'T-Zone',
    title: 'Return to T Score',
    level: 'Junior beginner to Professional',
    purpose: 'Build awareness of recovery to the T after every shot.',
    setup: 'Normal rally. Mark or define the T-zone clearly.',
    scoring: 'Win rally +1. Each time opponent fails to recover to T before your next contact, you score +1.',
    coach: 'Look for players recognising opponent position before choosing the next shot.',
    progressions: ['Beginner: generous T-zone', 'Intermediate: smaller T-zone', 'Performance: bonus only if next shot creates pressure']
  },
  {
    id: 't-zone-off-t-finish',
    category: 'T-Zone',
    title: 'Opponent Off T Bonus',
    level: 'Intermediate to Professional',
    purpose: 'Reward recognising when the opponent is not recovered.',
    setup: 'Normal rally. T-zone is marked or agreed.',
    scoring: 'Win rally +1. +3 bonus if the winning shot is played while opponent is outside the T-zone.',
    coach: 'Do not force a winner. The aim is to notice the affordance when it appears.',
    progressions: ['Level 4: finish within 4 shots after opponent off T', 'Level 5: finish within 2 shots']
  },
  {
    id: 'cb-single',
    category: 'Checkerboard',
    title: 'CB Singles',
    level: 'Level 1',
    purpose: 'Introduce one-shot checkerboard targeting.',
    setup: 'Coach calls or player draws one checkerboard target.',
    scoring: 'Win rally +1. Complete single challenge +1. Clean winner bonus +2 sits on top.',
    coach: 'Keep the challenge simple enough that the player can still play a representative rally.',
    progressions: ['Use floor zones first', 'Add wall zones later', 'Add opponent off-T condition at Level 3']
  },
  {
    id: 'cb-pair',
    category: 'Checkerboard',
    title: 'CB Pairs',
    level: 'Level 2 to 5',
    purpose: 'Train tactical two-shot combinations.',
    setup: 'Player must complete a nominated pair such as [6-4] + [8-1].',
    scoring: 'Complete pair +2. If rally ends on second shot of pair, total is rally win + pair = 3. Win after pair +3 bonus.',
    coach: 'Watch whether the first shot actually creates the affordance for the second.',
    progressions: ['Level 3: opponent must be off T', 'Level 4: win within 4 shots', 'Level 5: win within 2 shots']
  },
  {
    id: 'cb-blind-pair',
    category: 'CB Blind',
    title: 'Blind Pair Challenge',
    level: 'Intermediate to Professional',
    purpose: 'Train disguised tactical intention and decision-making.',
    setup: 'Each player secretly receives a pair challenge. Opponent does not know the target.',
    scoring: 'Win rally +1. Complete pair +2. Win after challenge +3. Clean winner +2.',
    coach: 'Ensure players still respond to the rally, not blindly force the card.',
    progressions: ['Intermediate: no movement condition', 'Elite: opponent off T required', 'Professional: convert within 2 shots']
  },
  {
    id: 'double-bounce-winner-loses',
    category: 'Double Bounce',
    title: 'Winner Loses a Bounce',
    level: 'Junior beginner to Intermediate',
    purpose: 'Balance rallies and create adaptive pressure.',
    setup: 'Incoming player starts with double bounce. Winner loses one bounce after every rally they win.',
    scoring: 'Normal rally scoring. Constraint changes after each rally.',
    coach: 'Good for mixed ability groups because the advantage shifts dynamically.',
    progressions: ['Limit double bounce to back corners', 'Use only on defensive retrievals', 'Add target zones']
  },
  {
    id: 'classic-clean-winner',
    category: 'Classic Conditioned',
    title: 'Clean Winner Bonus',
    level: 'All levels',
    purpose: 'Reward genuine tactical advantage rather than forced errors only.',
    setup: 'Use with any conditioned game.',
    scoring: 'Clean winner bonus +2 sits on top of all other scoring.',
    coach: 'A clean winner means opponent cannot touch the ball with racquet despite trying.',
    progressions: ['Junior: coach decides', 'Performance: opponent/referee calls honestly']
  },
  {
    id: 'atl-btl-tape',
    category: 'ATL / BTL',
    title: 'Tape Height Control',
    level: 'Beginner to Elite',
    purpose: 'Train shot height variation using a visual cue.',
    setup: 'Use tape/visual band on front wall rather than service line where useful.',
    scoring: 'Point only counts if nominated shot travels above or below the tape as required.',
    coach: 'Tape is clearer and often more representative than the service line for juniors.',
    progressions: ['Above tape for length', 'Below tape for pressure', 'Player chooses based on opponent position']
  }
];

const CATEGORIES = ['All', 'T-Zone', 'Checkerboard', 'CB Blind', 'Double Bounce', 'Classic Conditioned', 'ATL / BTL'];

const QUICK = [
  { title: 'CB Singles', challenge: '[6-3]', note: 'Single target challenge' },
  { title: 'CB Pairs', challenge: '[5-4] + [8-1]', note: 'Two-shot tactical chain' },
  { title: 'CB Triples', challenge: '[6-4] + [8-1] + clean finish', note: 'Advanced challenge' }
];

function App() {
  const [page, setPage] = useState('home');
  const [category, setCategory] = useState('All');
  const [selectedGame, setSelectedGame] = useState(null);

  const filteredGames = useMemo(() => {
    if (category === 'All') return GAMES;
    return GAMES.filter(g => g.category === category);
  }, [category]);

  function home() {
    setPage('home');
    setCategory('All');
    setSelectedGame(null);
    window.scrollTo(0, 0);
  }

  function openLibrary(cat = 'All') {
    setCategory(cat);
    setSelectedGame(null);
    setPage('library');
    window.scrollTo(0, 0);
  }

  function openGame(game) {
    setSelectedGame(game);
    setPage('game');
    window.scrollTo(0, 0);
  }

  return (
    <div>
      <header className="hero">
        <button className="home" onClick={home}>HOME</button>
        <div>
          <div className="eyebrow">SQUASH TACTICAL TRAINING</div>
          <h1>Checkerboard Coach</h1>
          <p>PHASE 2 - GAME LIBRARY STARTED</p>
        </div>
      </header>

      {page === 'home' && (
        <main className="container">
          <h2>Courtside Checkerboard Tool</h2>
          <p className="lead">Stable navigation. First real games added. Match analysis kept separate.</p>

          <div className="grid two">
            <button className="card blue" onClick={() => openLibrary('All')}>
              <h3>Game Library</h3><p>{GAMES.length} games loaded</p>
            </button>
            <button className="card green" onClick={() => setPage('generator')}>
              <h3>Challenge Generator</h3><p>Singles, pairs, triples</p>
            </button>
            <button className="card amber" onClick={() => setPage('scoring')}>
              <h3>Scoring Protocol</h3><p>Default Checkerboard rules</p>
            </button>
            <button className="card purple" onClick={() => setPage('session')}>
              <h3>Session Builder</h3><p>Pick a simple session flow</p>
            </button>
          </div>

          <section className="panel">
            <h3>Quick Start</h3>
            {QUICK.map(q => (
              <button key={q.title} className="row" onClick={() => setPage('generator')}>
                <strong>{q.title}</strong>
                <span>{q.note}</span>
                <em>{q.challenge}</em>
              </button>
            ))}
          </section>
        </main>
      )}

      {page === 'library' && (
        <main className="container">
          <div className="topline">
            <h2>Game Library</h2>
            <button className="secondary" onClick={home}>Return Home</button>
          </div>
          <div className="chips">
            {CATEGORIES.map(c => (
              <button key={c} className={category === c ? 'chip active' : 'chip'} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
          <section className="panel">
            {filteredGames.map(game => (
              <button key={game.id} className="gameRow" onClick={() => openGame(game)}>
                <div><strong>{game.title}</strong><span>{game.category}</span></div>
                <em>{game.level}</em>
              </button>
            ))}
          </section>
        </main>
      )}

      {page === 'game' && selectedGame && (
        <main className="container">
          <div className="topline">
            <div>
              <h2>{selectedGame.title}</h2>
              <p className="lead">{selectedGame.category} - {selectedGame.level}</p>
            </div>
            <div className="buttons">
              <button className="secondary" onClick={() => openLibrary(selectedGame.category)}>Back to Library</button>
              <button className="secondary" onClick={home}>Home</button>
            </div>
          </div>
          <section className="panel gameCard">
            <h3>Purpose</h3><p>{selectedGame.purpose}</p>
            <h3>Set-up</h3><p>{selectedGame.setup}</p>
            <h3>Scoring</h3><p>{selectedGame.scoring}</p>
            <h3>Coach Observation</h3><p>{selectedGame.coach}</p>
            <h3>Progressions</h3>
            <ul>{selectedGame.progressions.map(p => <li key={p}>{p}</li>)}</ul>
          </section>
        </main>
      )}

      {page === 'generator' && (
        <main className="container">
          <div className="topline"><h2>Challenge Generator</h2><button className="secondary" onClick={home}>Home</button></div>
          <section className="panel">
            <h3>Starter Challenges</h3>
            {QUICK.map(q => <div className="challenge" key={q.title}><strong>{q.title}</strong><span>{q.challenge}</span></div>)}
          </section>
        </main>
      )}

      {page === 'scoring' && (
        <main className="container">
          <div className="topline"><h2>Default Scoring Protocol</h2><button className="secondary" onClick={home}>Home</button></div>
          <section className="panel">
            <p><strong>Win rally:</strong> +1</p>
            <p><strong>Single challenge:</strong> +1</p>
            <p><strong>Pair challenge:</strong> +2</p>
            <p><strong>Triple challenge:</strong> +3</p>
            <p><strong>Win after challenge:</strong> +3 bonus</p>
            <p><strong>Clean winner:</strong> +2 bonus sits on top of all scoring</p>
            <p><strong>Level 4:</strong> convert within 4 shots. <strong>Level 5:</strong> convert within 2 shots.</p>
          </section>
        </main>
      )}

      {page === 'session' && (
        <main className="container">
          <div className="topline"><h2>Simple Session Builder</h2><button className="secondary" onClick={home}>Home</button></div>
          <section className="panel">
            <ol>
              <li>Warm-up: Tape Height Control</li>
              <li>Main tactical block: CB Pairs</li>
              <li>Pressure block: Opponent Off T Bonus</li>
              <li>Finish: Clean Winner Bonus overlay</li>
            </ol>
          </section>
        </main>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
