import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const games = [
  {
    id: 'cb-singles',
    group: 'Checkerboard',
    title: 'CB Singles',
    subtitle: 'Single target challenge',
    type: 'single',
    code: '[6-3]',
    description: 'Nominate one checkerboard target. Player scores challenge points when they hit the nominated zone during live rally play.',
    rule: 'Win rally +1. Complete single +1. Clean winner +2 sits on top.'
  },
  {
    id: 'cb-pairs',
    group: 'Checkerboard',
    title: 'CB Pairs',
    subtitle: 'Two-shot tactical chain',
    type: 'pair',
    code: '[5-4] + [8-1]',
    description: 'Complete the nominated pair in order. The pair may be banked at Levels 1–3. At Levels 4–5 the conversion window applies.',
    rule: 'Win rally +1. Complete pair +2. Win after challenge +3. Clean winner +2.'
  },
  {
    id: 'cb-triples',
    group: 'Checkerboard',
    title: 'CB Triples',
    subtitle: 'Three-shot tactical chain',
    type: 'triple',
    code: '[5-4] + [6-3] + [8-1]',
    description: 'Use a three-shot sequence to stretch, switch and finish. Best for elite/performance players.',
    rule: 'Win rally +1. Complete triple +3. Win after challenge +3. Clean winner +2.'
  },
  {
    id: 'cb-blind',
    group: 'Checkerboard',
    title: 'CB Blind',
    subtitle: 'Hidden pair/triple challenge',
    type: 'blind',
    code: 'Secret card draw',
    description: 'Each player receives a secret challenge. Rally is normal, but challenge points are scored when their hidden sequence is completed.',
    rule: 'Pair +2. Triple +3. Win after challenge +3. Clean winner +2.'
  },
  {
    id: 't-zone',
    group: 'Conditioned Games',
    title: 'T-Zone Conversion',
    subtitle: 'Opponent outside marked T',
    type: 'tzone',
    code: 'Opponent off T → window opens',
    description: 'Bonus window opens when the opponent is outside the marked T-zone at contact. Player must then convert before the window closes.',
    rule: 'Level 4: win within 4 shots. Level 5: win within 2 shots.'
  },
  {
    id: 'route-breaker',
    group: 'Conditioned Games',
    title: 'Route Breaker',
    subtitle: 'Disrupt predictable route',
    type: 'classic',
    code: 'Change height / side / pace / depth',
    description: 'Player scores when they prevent repeated predictable patterns by changing the affordance landscape.',
    rule: 'Win rally +1. Clean finish +2 if the winning shot is unreachable.'
  },
  {
    id: 'double-bounce',
    group: 'Conditioned Games',
    title: 'Double Bounce Game',
    subtitle: 'Pressure-adjusted rally constraint',
    type: 'classic',
    code: 'Incoming player has double bounce',
    description: 'Incoming player is allowed double bounce. Winner loses a bounce after each rally they win to prevent over-dominance.',
    rule: 'Use as a balancing constraint, not a technical drill.'
  },
  {
    id: 'volleys',
    group: 'Checkerboard',
    title: 'CB Volleys',
    subtitle: 'Volley intercept and target',
    type: 'volley',
    code: 'Volley + nominated zone',
    description: 'Player must intercept on the volley and send the ball to the nominated checkerboard target zone.',
    rule: 'Challenge score only if the volley is intentional and target-directed.'
  }
];

const deck = [
  { name: 'Single length right', code: '[6-3]', type: 'single' },
  { name: 'Single length left', code: '[5-4]', type: 'single' },
  { name: 'Front finish right', code: '[7-2]', type: 'single' },
  { name: 'Front finish left', code: '[8-1]', type: 'single' },
  { name: 'Pair right deep/front', code: '[6-3] + [7-2]', type: 'pair' },
  { name: 'Pair left deep/front', code: '[5-4] + [8-1]', type: 'pair' },
  { name: 'Triple switch then finish', code: '[5-4] + [6-3] + [8-1]', type: 'triple' },
  { name: 'Blind pair', code: 'Secret pair card', type: 'blind' }
];

const levelText = {
  1: 'Level 1: simple single-shot target. Challenge is banked.',
  2: 'Level 2: pair challenge. Challenge is banked.',
  3: 'Level 3: triple or opponent-off-T condition. Challenge is banked.',
  4: 'Level 4: challenge must convert within 4 shots or reset.',
  5: 'Level 5: challenge must convert within 2 shots or reset.'
};

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)] || list[0];
}

function App() {
  const [page, setPage] = useState('home');
  const [selectedGame, setSelectedGame] = useState(null);
  const [level, setLevel] = useState(1);

  const goHome = () => {
    setPage('home');
    setSelectedGame(null);
  };

  const openGame = (game) => {
    setSelectedGame(game);
    setPage('game');
  };

  return (
    <div className="app">
      <Header goHome={goHome} />
      {page === 'home' && <Home setPage={setPage} openGame={openGame} />}
      {page === 'library' && <Library goHome={goHome} openGame={openGame} />}
      {page === 'generator' && <Generator goHome={goHome} level={level} setLevel={setLevel} />}
      {page === 'scoring' && <Scoring goHome={goHome} />}
      {page === 'session' && <SessionBuilder goHome={goHome} openGame={openGame} />}
      {page === 'game' && <GameDetail game={selectedGame} goHome={goHome} level={level} setLevel={setLevel} />}
    </div>
  );
}

function Header({ goHome }) {
  return (
    <header className="header">
      <button className="brand" onClick={goHome} aria-label="Return home">
        <span className="small">Squash Tactical Training</span>
        <span className="title">Checkerboard Coach</span>
        <span className="small">Stable V1 · Navigation fixed</span>
      </button>
    </header>
  );
}

function Home({ setPage, openGame }) {
  const featured = games.slice(0, 4);
  return (
    <main className="screen">
      <section className="hero">
        <h1>Courtside Checkerboard Tool</h1>
        <p>Simple navigation. Core games only. Match analysis kept separate.</p>
      </section>

      <section className="grid two">
        <button className="tile blue" onClick={() => setPage('library')}><strong>Game Library</strong><span>Browse all stable games</span></button>
        <button className="tile green" onClick={() => setPage('generator')}><strong>Challenge Generator</strong><span>Random singles, pairs, triples</span></button>
        <button className="tile gold" onClick={() => setPage('scoring')}><strong>Scoring Protocol</strong><span>Default Checkerboard rules</span></button>
        <button className="tile purple" onClick={() => setPage('session')}><strong>Session Builder</strong><span>Pick a simple session flow</span></button>
      </section>

      <section className="panel">
        <div className="section-head"><h2>Quick Start</h2></div>
        <div className="list">
          {featured.map((game) => <GameRow key={game.id} game={game} onClick={() => openGame(game)} />)}
        </div>
      </section>
    </main>
  );
}

function Library({ goHome, openGame }) {
  const groups = useMemo(() => {
    return games.reduce((acc, game) => {
      acc[game.group] = acc[game.group] || [];
      acc[game.group].push(game);
      return acc;
    }, {});
  }, []);

  return (
    <main className="screen">
      <PageTop title="Game Library" subtitle="All current stable Checkerboard games" goHome={goHome} />
      {Object.entries(groups).map(([group, items]) => (
        <section className="panel" key={group}>
          <h2>{group}</h2>
          <div className="list">
            {items.map((game) => <GameRow key={game.id} game={game} onClick={() => openGame(game)} />)}
          </div>
        </section>
      ))}
    </main>
  );
}

function Generator({ goHome, level, setLevel }) {
  const [type, setType] = useState('all');
  const filtered = type === 'all' ? deck : deck.filter((item) => item.type === type);
  const [challenge, setChallenge] = useState(randomItem(deck));

  const draw = () => setChallenge(randomItem(filtered.length ? filtered : deck));

  return (
    <main className="screen">
      <PageTop title="Challenge Generator" subtitle="Draw a usable Checkerboard challenge" goHome={goHome} />
      <section className="panel">
        <div className="filter-row">
          {['all','single','pair','triple','blind'].map((item) => (
            <button key={item} className={type === item ? 'active pill' : 'pill'} onClick={() => setType(item)}>{item}</button>
          ))}
        </div>
        <div className="challenge-card">
          <span className="small">Current draw</span>
          <h2>{challenge.name}</h2>
          <div className="code">{challenge.code}</div>
          <button className="primary" onClick={draw}>Draw New Challenge</button>
        </div>
      </section>
      <LevelSelector level={level} setLevel={setLevel} />
    </main>
  );
}

function Scoring({ goHome }) {
  return (
    <main className="screen">
      <PageTop title="Default Scoring Protocol" subtitle="Stable rules for Checkerboard games" goHome={goHome} />
      <section className="panel scoring">
        <p><strong>Win rally:</strong> +1</p>
        <p><strong>Complete single:</strong> +1</p>
        <p><strong>Complete pair:</strong> +2</p>
        <p><strong>Complete triple:</strong> +3</p>
        <p><strong>Win after completing challenge:</strong> +3 bonus</p>
        <p><strong>Clean winner:</strong> +2 sits on top of all scoring</p>
        <p><strong>Levels 1–3:</strong> challenge is banked.</p>
        <p><strong>Level 4:</strong> must convert within 4 shots or reset.</p>
        <p><strong>Level 5:</strong> must convert within 2 shots or reset.</p>
      </section>
      <section className="notice">Example: complete pair + win rally + conversion bonus + clean winner = 2 + 1 + 3 + 2 = 8.</section>
    </main>
  );
}

function SessionBuilder({ goHome, openGame }) {
  const flow = [games[0], games[1], games[3], games[4]];
  return (
    <main className="screen">
      <PageTop title="Simple Session Builder" subtitle="Stable V1: choose a flow, then run each game" goHome={goHome} />
      <section className="panel">
        <h2>60-minute simple flow</h2>
        <div className="list">
          {flow.map((game, index) => (
            <button className="row-button" key={game.id} onClick={() => openGame(game)}>
              <strong>{index + 1}. {game.title}</strong>
              <span>{index === 0 ? 'Warm-up target' : index === 1 ? 'Main tactical pair' : index === 2 ? 'Blind challenge' : 'Conversion game'}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function GameDetail({ game, goHome, level, setLevel }) {
  if (!game) return <Home setPage={() => {}} openGame={() => {}} />;
  return (
    <main className="screen">
      <PageTop title={game.title} subtitle={game.subtitle} goHome={goHome} />
      <section className="panel game-detail">
        <span className="small">{game.group}</span>
        <div className="code">{game.code}</div>
        <p>{game.description}</p>
        <div className="rule-box">{game.rule}</div>
      </section>
      <LevelSelector level={level} setLevel={setLevel} />
      <section className="panel">
        <h2>Coach Prompt</h2>
        <p>Keep the rally live. Let the player search for the solution. Only intervene if the constraint is unclear, unsafe, or too easy/hard.</p>
      </section>
    </main>
  );
}

function LevelSelector({ level, setLevel }) {
  return (
    <section className="panel">
      <h2>Level Progression</h2>
      <div className="level-row">
        {[1,2,3,4,5].map((number) => <button key={number} className={level === number ? 'active level' : 'level'} onClick={() => setLevel(number)}>{number}</button>)}
      </div>
      <div className="notice">{levelText[level]}</div>
    </section>
  );
}

function PageTop({ title, subtitle, goHome }) {
  return (
    <div className="page-top">
      <button className="back" onClick={goHome}>← Home</button>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

function GameRow({ game, onClick }) {
  return (
    <button className="row-button" onClick={onClick}>
      <strong>{game.title}</strong>
      <span>{game.subtitle}</span>
      <em>{game.code}</em>
    </button>
  );
}

createRoot(document.getElementById('root')).render(<App />);
