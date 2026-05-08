import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const CATEGORIES = [
  { id: 'atl-btl', title: 'ATL / BTL', subtitle: 'Above & below line', color: 'blue',
    games: ['Above the Line Drives', 'Below the Line Pressure', 'Tape Height Control'] },
  { id: 't-zone', title: 'T-ZONE', subtitle: 'T-Zone games', color: 'amber',
    games: ['Return to T Score', 'Opponent Off T Bonus', 'T-Zone Volley Finish'] },
  { id: 'classic', title: 'CLASSIC CONDITIONED', subtitle: 'Classic conditioned', color: 'green',
    games: ['Serve Box Length', 'Straight Drive Constraint', 'Boast and Recover'] },
  { id: 'tactical', title: 'TACTICAL GAMES', subtitle: 'Tactical formats', color: 'orange',
    games: ['Route Breaker', 'Pressure Side Change', 'Volley Intercept'] },
  { id: 'cb-tactical', title: 'CB TACTICAL', subtitle: 'Tactical patterns', color: 'green',
    games: ['[6-4] then [8-1]', '[5-3] then [7-2]', 'Triple Challenge'] },
  { id: 'cb-volleys', title: 'CB VOLLEYS', subtitle: 'Volley games', color: 'teal',
    games: ['Volley Singles', 'Volley Pairs', 'Volley Clean Finish'] },
  { id: 'cb-blind', title: 'CB BLIND', subtitle: 'Blind challenges', color: 'purple',
    games: ['Blind Pair', 'Blind Triple', 'Hidden Finish'] },
  { id: 'double-bounce', title: 'DOUBLE BOUNCE', subtitle: 'Double bounce', color: 'green',
    games: ['Incoming Double Bounce', 'Winner Loses Bounce', 'Double Bounce Pressure'] },
];

const QUICK = [
  { id: 'quick-singles', title: 'CB SINGLES', subtitle: 'Single shot challenges', page: 'generator', mode: 'Singles' },
  { id: 'quick-pairs', title: 'CB PAIRS', subtitle: 'Pair challenges', page: 'generator', mode: 'Pairs' },
  { id: 'quick-custom', title: 'CUSTOM SESSION', subtitle: 'Build your own', page: 'session' },
  { id: 'quick-main', title: 'MAIN MENU', subtitle: 'All features & tabs', page: 'library' },
];

const CHALLENGES = {
  Singles: ['[6-4]', '[8-1]', '[5-3]', '[7-2]', '[6-3]', '[5-4]'],
  Pairs: ['[6-4] + [8-1]', '[5-3] + [7-2]', '[6-3] + [8-1]', '[5-4] + [7-2]'],
  Triples: ['[6-4] + [8-1] + clean finish', '[5-3] + [7-2] + clean finish'],
};

const LEVELS = [
  'Level 1: complete a single challenge',
  'Level 2: complete a pair challenge',
  'Level 3: complete challenge when opponent is off T',
  'Level 4: complete challenge and win within 4 shots',
  'Level 5: complete challenge and win within 2 shots',
];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function Header({ onHome, page }) {
  return (
    <header className="header">
      <button className="homeBtn" onClick={onHome}>HOME</button>
      <div>
        <div className="eyebrow">SQUASH TACTICAL TRAINING</div>
        <h1>CHECKERBOARD</h1>
        <p>Constraints-led coach app · stable navigation build</p>
      </div>
      <div className="pageTag">{page}</div>
    </header>
  );
}

function Home({ openCategory, goPage }) {
  return (
    <main className="screen">
      <section className="titleBlock">
        <h2>Start a Session</h2>
        <p>Choose a game family or quick-start a Checkerboard challenge.</p>
      </section>

      <div className="grid three">
        {CATEGORIES.map(cat => (
          <button key={cat.id} className={`tile ${cat.color}`} onClick={() => openCategory(cat.id)}>
            <strong>{cat.title}</strong>
            <span>{cat.subtitle}</span>
          </button>
        ))}
        <button className="tile purple" onClick={() => goPage('library')}>
          <strong>ALL GAMES</strong>
          <span>Browse everything</span>
        </button>
      </div>

      <h3 className="sectionLabel">Quick Start</h3>
      <div className="grid two">
        {QUICK.map(item => (
          <button key={item.id} className="tile blue" onClick={() => goPage(item.page, item.mode)}>
            <strong>{item.title}</strong>
            <span>{item.subtitle}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

function Library({ openCategory, openGame, onHome }) {
  return (
    <main className="screen">
      <div className="topline">
        <h2>Game Library</h2>
        <button className="secondary" onClick={onHome}>Return Home</button>
      </div>
      <div className="grid two">
        {CATEGORIES.map(cat => (
          <button key={cat.id} className={`tile ${cat.color}`} onClick={() => openCategory(cat.id)}>
            <strong>{cat.title}</strong>
            <span>{cat.games.length} games</span>
          </button>
        ))}
      </div>
      <div className="panel">
        <h3>All Games</h3>
        {CATEGORIES.flatMap(cat => cat.games.map(game => ({ cat, game }))).map(({cat, game}) => (
          <button key={cat.id + game} className="listRow" onClick={() => openGame(cat.id, game)}>
            <span>{game}</span><em>{cat.title}</em>
          </button>
        ))}
      </div>
    </main>
  );
}

function Category({ category, openGame, onLibrary, onHome }) {
  return (
    <main className="screen">
      <div className="topline">
        <div>
          <h2>{category.title}</h2>
          <p>{category.subtitle}</p>
        </div>
        <div className="actions">
          <button className="secondary" onClick={onLibrary}>Library</button>
          <button className="secondary" onClick={onHome}>Home</button>
        </div>
      </div>
      <div className="panel">
        {category.games.map(game => (
          <button key={game} className="listRow" onClick={() => openGame(category.id, game)}>
            <span>{game}</span><em>Open game card</em>
          </button>
        ))}
      </div>
    </main>
  );
}

function GameDetail({ category, game, onBack, onHome }) {
  return (
    <main className="screen">
      <div className="topline">
        <div>
          <h2>{game}</h2>
          <p>{category.title}</p>
        </div>
        <div className="actions">
          <button className="secondary" onClick={onBack}>Back</button>
          <button className="secondary" onClick={onHome}>Home</button>
        </div>
      </div>

      <div className="panel">
        <h3>Coach Card</h3>
        <p><strong>Set-up:</strong> Start with a normal rally. Add the constraint clearly before the rally begins.</p>
        <p><strong>Scoring:</strong> Win rally +1. Complete challenge for bonus. Clean winner sits on top.</p>
        <p><strong>Level 4:</strong> must convert within 4 shots. <strong>Level 5:</strong> must convert within 2 shots.</p>
      </div>
    </main>
  );
}

function Generator({ initialMode, onHome }) {
  const [mode, setMode] = useState(initialMode || 'Singles');
  const [level, setLevel] = useState(1);
  const [challenge, setChallenge] = useState(randomFrom(CHALLENGES[mode]));

  function generate(nextMode = mode) {
    setChallenge(randomFrom(CHALLENGES[nextMode]));
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    generate(nextMode);
  }

  return (
    <main className="screen">
      <div className="topline">
        <h2>Challenge Generator</h2>
        <button className="secondary" onClick={onHome}>Home</button>
      </div>

      <div className="panel bigChallenge">
        <div className="challenge">{challenge}</div>
        <p>{LEVELS[level - 1]}</p>
      </div>

      <div className="grid three">
        {['Singles', 'Pairs', 'Triples'].map(m => (
          <button key={m} className={m === mode ? 'tile active' : 'tile'} onClick={() => changeMode(m)}>
            <strong>{m}</strong>
            <span>challenge mode</span>
          </button>
        ))}
      </div>

      <div className="levelRow">
        {[1,2,3,4,5].map(n => (
          <button key={n} className={n === level ? 'level active' : 'level'} onClick={() => setLevel(n)}>L{n}</button>
        ))}
      </div>

      <button className="primary" onClick={() => generate()}>Generate New Challenge</button>
    </main>
  );
}

function SessionBuilder({ onHome }) {
  return (
    <main className="screen">
      <div className="topline">
        <h2>Session Builder</h2>
        <button className="secondary" onClick={onHome}>Home</button>
      </div>
      <div className="panel">
        <p>Version 1 keeps this simple: pick one warm-up game, one tactical challenge, one pressure finish.</p>
        <ol>
          <li>Warm-up: CB Singles</li>
          <li>Main block: CB Pairs</li>
          <li>Pressure block: Level 4 or Level 5 conversion</li>
        </ol>
      </div>
    </main>
  );
}

function App() {
  const [page, setPage] = useState('home');
  const [categoryId, setCategoryId] = useState(null);
  const [game, setGame] = useState(null);
  const [generatorMode, setGeneratorMode] = useState('Singles');

  const category = useMemo(() => CATEGORIES.find(c => c.id === categoryId), [categoryId]);

  function goHome() {
    setPage('home');
    setCategoryId(null);
    setGame(null);
    setGeneratorMode('Singles');
    window.scrollTo(0, 0);
  }

  function goPage(nextPage, mode) {
    setCategoryId(null);
    setGame(null);
    if (mode) setGeneratorMode(mode);
    setPage(nextPage);
    window.scrollTo(0, 0);
  }

  function openCategory(id) {
    setGame(null);
    setCategoryId(id);
    setPage('category');
    window.scrollTo(0, 0);
  }

  function openGame(catId, gameName) {
    setCategoryId(catId);
    setGame(gameName);
    setPage('game');
    window.scrollTo(0, 0);
  }

  const pageLabel = page === 'home' ? 'Home' : page;

  return (
    <>
      <Header onHome={goHome} page={pageLabel} />
      {page === 'home' && <Home openCategory={openCategory} goPage={goPage} />}
      {page === 'library' && <Library openCategory={openCategory} openGame={openGame} onHome={goHome} />}
      {page === 'category' && category && <Category category={category} openGame={(g) => openGame(category.id, g)} onLibrary={() => goPage('library')} onHome={goHome} />}
      {page === 'game' && category && game && <GameDetail category={category} game={game} onBack={() => openCategory(category.id)} onHome={goHome} />}
      {page === 'generator' && <Generator initialMode={generatorMode} onHome={goHome} />}
      {page === 'session' && <SessionBuilder onHome={goHome} />}
      <footer>Checkerboard Coach · Stabilised navigation v3</footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
