import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Shuffle, RotateCcw, Trophy, TimerReset } from 'lucide-react';
import { sessionGroups, quickStarts, challengeDeck } from './data/games.js';
import { scoreRally, levelWindowText } from './utils/scoring.js';
import './styles.css';

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function Header({ onHome }) {
  return (
    <header className="app-header" onClick={onHome}>
      <div className="eyebrow">Squash Tactical Training</div>
      <h1>Checkerboard</h1>
      <p>Constraints-led coach app · Version 1.1 rebuild</p>
    </header>
  );
}

function Home({ startSession }) {
  return (
    <main className="screen home-screen">
      <section>
        <h2>Start a Session</h2>
        <div className="grid three">
          {sessionGroups.map((group) => (
            <button key={group.id} className={`tile ${group.color}`} onClick={() => startSession(group)}>
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
            <button key={item.id} className={`tile ${item.color}`} onClick={() => startSession(item)}>
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function ChallengeCard({ challenge, level, setLevel, randomise }) {
  return (
    <section className="panel challenge-card">
      <div className="row between">
        <div>
          <div className="eyebrow">Current Challenge</div>
          <h2>{challenge.name}</h2>
        </div>
        <button className="icon-button" onClick={randomise}><Shuffle size={22} /> Random</button>
      </div>

      <div className="challenge-code">{challenge.code}</div>
      <p>{challenge.description}</p>

      <div className="level-strip">
        {[1,2,3,4,5].map((n) => (
          <button key={n} className={level === n ? 'active' : ''} onClick={() => setLevel(n)}>Level {n}</button>
        ))}
      </div>
      <div className="notice">{levelWindowText(level)}</div>
    </section>
  );
}

function ScorePad({ level }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [last, setLast] = useState(null);

  const add = (player, event) => {
    const points = scoreRally(event, level);
    if (player === 'A') setA((v) => v + points.total);
    if (player === 'B') setB((v) => v + points.total);
    setLast({ player, ...points });
  };

  return (
    <section className="panel">
      <div className="row between">
        <h2><Trophy size={20}/> Score</h2>
        <button className="ghost" onClick={() => { setA(0); setB(0); setLast(null); }}><RotateCcw size={18}/> Reset</button>
      </div>
      <div className="scoreboard">
        <div><span>Player A</span><strong>{a}</strong></div>
        <div><span>Player B</span><strong>{b}</strong></div>
      </div>

      <div className="score-buttons">
        {['A','B'].map((p) => (
          <div key={p}>
            <h3>{p === 'A' ? 'Player A' : 'Player B'}</h3>
            <button onClick={() => add(p, { win: true })}>Win rally +1</button>
            <button onClick={() => add(p, { challenge: 'single' })}>Single +1</button>
            <button onClick={() => add(p, { challenge: 'pair' })}>Pair +2</button>
            <button onClick={() => add(p, { challenge: 'triple' })}>Triple +3</button>
            <button onClick={() => add(p, { win: true, afterChallenge: true })}>Win after challenge +4</button>
            <button onClick={() => add(p, { win: true, afterChallenge: true, clean: true })}>Clean finish +6</button>
          </div>
        ))}
      </div>
      {last && <div className="notice">Last: Player {last.player} +{last.total} — {last.label}</div>}
    </section>
  );
}

function Session({ session, onHome }) {
  const deck = useMemo(() => challengeDeck.filter(c => session.filter === 'all' || c.type === session.filter), [session]);
  const [challenge, setChallenge] = useState(deck[0] || challengeDeck[0]);
  const [level, setLevel] = useState(1);

  const randomise = () => setChallenge(pickRandom(deck.length ? deck : challengeDeck));

  return (
    <main className="screen session-screen">
      <button className="back" onClick={onHome}>← Main Menu</button>
      <div className="session-title">
        <div className="eyebrow">Session</div>
        <h1>{session.title}</h1>
        <p>{session.subtitle}</p>
      </div>

      <ChallengeCard challenge={challenge} level={level} setLevel={setLevel} randomise={randomise} />
      <ScorePad level={level} />

      <section className="panel rules">
        <h2><TimerReset size={20}/> Default Scoring Protocol</h2>
        <p><strong>Win rally:</strong> +1</p>
        <p><strong>Complete challenge:</strong> single +1, pair +2, triple +3.</p>
        <p><strong>Win after challenge:</strong> +3 bonus, added to rally win and challenge points.</p>
        <p><strong>Clean winner:</strong> +2 sits on top of all other scoring.</p>
        <p><strong>Levels 1–3:</strong> challenge is banked. <strong>Level 4:</strong> finish within 4 shots or reset. <strong>Level 5:</strong> finish within 2 shots or reset.</p>
      </section>
    </main>
  );
}

function App() {
  const [session, setSession] = useState(null);
  return (
    <div className="app-shell">
      <Header onHome={() => setSession(null)} />
      {session ? <Session session={session} onHome={() => setSession(null)} /> : <Home startSession={setSession} />}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
