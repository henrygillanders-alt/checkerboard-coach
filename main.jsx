import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const overlayBank = {
  clean: { title:'Clean Winner', short:'+2 clean winner bonus', scoring:'+2 if opponent cannot touch the ball with racquet despite trying.', coach:'Only count genuine unreachable winners. Do not reward opponents giving up.' },
  offt: { title:'Opponent Off T', short:'Opponent outside T-zone', scoring:'+3 bonus if the winning shot is played while opponent is outside the marked/defined T-zone.', coach:'Player must recognise the affordance, not force the winner.' },
  four: { title:'4-Shot Window', short:'Level 4 conversion', scoring:'After completing the challenge, player must win within 4 shots or the challenge resets.', coach:'Use when player can complete the task without losing rally realism.' },
  two: { title:'2-Shot Window', short:'Level 5 conversion', scoring:'After completing the challenge, player must win within 2 shots or the challenge resets.', coach:'Professional difficulty. Use only when the task is stable.' },
  volley: { title:'Volley Finish', short:'Winner must be volley', scoring:'+3 bonus only if final winning shot is a volley.', coach:'Reward earned interceptions, not reckless volley hunting.' },
  blind: { title:'Blind Finish', short:'Hidden finish condition', scoring:'Bonus applies only if the secret finish condition is completed.', coach:'Useful for disguise and intention under uncertainty.' },
  cb: { title:'Checkerboard Target', short:'Add zone challenge', scoring:'Add single +1, pair +2 or triple +3 depending on challenge size.', coach:'Target should solve the rally problem, not replace perception.' },
  weak: { title:'Weak Side', short:'Attack weaker side', scoring:'+2 tactical bonus if point is built by attacking identified weakness.', coach:'Check that the player is moving the opponent, not just hitting to a label.' }
};

function g(title, family, level, objective, setup, rules, scoring, coach, overlays) {
  return { id:title.toLowerCase().replaceAll(' ','-'), title, family, level, objective, setup, rules, scoring, coach, overlays };
}

const games = [
  g('CB Singles','Checkerboard Games','Level 1','Introduce one-shot checkerboard targeting inside a live rally.','Coach calls/draws one target such as [6-4], [8-1], [5-3] or [7-2].','Normal rally. Player earns challenge credit by completing the nominated target.','Win rally +1. Complete single challenge +1.','Keep the target simple enough that the rally remains representative.',['clean','offt','cb']),
  g('CB Pairs','Checkerboard Games','Level 2–5','Train tactical two-shot combinations that create and then exploit space.','Use a pair such as [6-4] + [8-1] or [5-3] + [7-2].','Player must complete both parts in order during the rally.','Complete pair +2. Win after pair +3.','The first shot should create the affordance for the second.',['clean','offt','four','two']),
  g('CB Triples','Checkerboard Games','Level 3–5','Develop advanced tactical chaining and delayed conversion.','Player receives a three-part checkerboard chain.','Complete the chain in order. At higher levels, convert within the window.','Complete triple +3. Win after challenge +3.','Only use once players can complete pairs without losing rally realism.',['clean','offt','four','two']),
  g('Blind Pairs','Checkerboard Games','Intermediate–Professional','Train hidden intention, disguise and decision-making.','Each player secretly receives a pair challenge.','Normal rally. Each player works toward hidden pair without announcing it.','Win rally +1. Complete pair +2. Win after challenge +3.','Stop players forcing the card. The game must still reward adaptation.',['blind','clean','four','two']),

  g('Return to T Score','T Zone Games','All levels','Build awareness of recovery to the T after every shot.','Normal rally. Mark or define the T-zone clearly.','Coach/referee observes whether the opponent recovers before next contact.','Win rally +1. Opponent fails to recover to T before next contact = +1.','Look for players recognising opponent position before choosing the next shot.',['clean','volley']),
  g('Opponent Off-T Bonus','T Zone Games','Intermediate–Professional','Reward recognising when the opponent is not recovered.','Normal rally. T-zone is marked or agreed.','Bonus only if winner is played while opponent is outside the T-zone.','Win rally +1. +3 off-T winning shot bonus.','Do not force a winner. Notice the affordance when it appears.',['clean','four','two','volley']),
  g('T-Zone Volley Finish','T Zone Games','Elite–Professional','Encourage central control and early interception.','Winner bonus requires volley finish from central control.','Rally can be won normally, but bonus needs volley finish from T-zone.','Win rally +1. +3 if winner is a volley from T-zone.','Watch for players hunting volleys too early instead of earning the interception.',['clean','offt','four','two']),

  g('Tape Height Control','ATL / BTL Games','Beginner–Elite','Train shot height variation with a clear front-wall cue.','Use tape/visual band rather than service line where useful.','Coach nominates ATL or BTL for selected shots/phases.','Point only counts if nominated shot travels above or below tape.','Tape is clearer and usually more representative than the service line for juniors.',['clean','offt','cb']),
  g('Height Change Recognition','ATL / BTL Games','Intermediate–Performance','Recognise when to change height rather than repeat trajectory.','Player changes height based on opponent position or poor recovery.','Player must choose height in response to the rally state.','Win rally +1. Correct height-change decision +1.','Reward the decision more than technical perfection.',['clean','offt','four']),

  g('Length Before Attack','Classic Conditioned Games','Beginner–Performance','Build pressure before attacking short.','Attacking short is only allowed after achieving length.','Player must first create pressure with length before attacking.','Win rally +1. Bonus +2 for winning after legal length-before-attack sequence.','Length must create the attack, not become a hoop to jump through.',['clean','offt','four','two']),
  g('Straight Drive Constraint','Classic Conditioned Games','Junior beginner–Intermediate','Simplify corridor control while keeping a live opponent problem.','Rally mostly straight with agreed escape rules.','Crosscourt/boast only allowed as escape or coach-called variation.','Win rally +1. Bonus for maintaining pressure without overhitting.','Avoid making it a dead drill. Keep live decision-making.',['clean','cb']),
  g('Clean Winner Bonus Game','Classic Conditioned Games','All levels','Reward genuine tactical advantage rather than errors only.','Use as overlay on any conditioned game.','A clean winner means opponent cannot touch ball with racquet despite trying.','+2 clean winner bonus sits on top.','Clarify before starting. Do not count balls where opponent gives up early.',['clean','offt','four','two']),

  g('Midcourt Intercept','Volley Games','Intermediate–Elite','Train earlier perception and interception opportunities.','Normal rally. Bonus for legal volley interceptions from midcourt/T-zone.','Player scores bonus when they volley from an appropriate central position.','Win rally +1. Volley intercept +1. Win after volley intercept +3.','Volleys should emerge from pressure and positioning, not reckless hunting.',['clean','offt','four']),
  g('Rapid Reload','Volley Games','Elite–Professional','Create repeated stress and fast reorganisation.','Coach/player restarts quickly after selected rallies/feeds.','Player must recover, scan and solve the next ball quickly.','Score successful reloads or use timed blocks.','It is a pressure design, not just fitness.',['clean','two','cb']),

  g('Winner Loses a Bounce','Double Bounce Games','Junior beginner–Intermediate','Balance rallies and create adaptive pressure.','Incoming player starts with double bounce. Winner loses one bounce after each rally they win.','Constraint changes after each rally to stop one player over-dominating.','Normal rally scoring.','Useful for mixed standards because advantage shifts dynamically.',['clean','cb']),

  g('Tempo Pressure','Pressure / Chaos Games','Elite–Professional','Train decision-making under reduced time.','Normal rally with coach-called tempo blocks or rapid restarts.','Player must maintain tactical quality under increased tempo.','Win rally +1. Quality decision under pressure +1.','Do not turn this into mindless speed. Decision quality is the point.',['clean','four','two']),

  g('Vs Tall Player','Tactical Opponent Games','Intermediate–Professional','Train low, quick direction changes against reach advantage.','Opponent plays as tall/reach-dominant profile.','Reward successful low pressure and quick switch of direction.','Win rally +1. Tactical success +2. Clean winner +2.','Watch whether player is changing the opponent movement problem.',['clean','offt','cb','weak'])
];

const families = [...new Set(games.map(g => g.family))];

function App() {
  const [page, setPage] = useState('home');
  const [openFamilies, setOpenFamilies] = useState(['Checkerboard Games']);
  const [selected, setSelected] = useState(null);
  const [active, setActive] = useState(['clean']);
  const [session, setSession] = useState([]);

  const activeOverlayObjects = active.map(id => overlayBank[id]).filter(Boolean);

  function home(){ setPage('home'); setSelected(null); window.scrollTo(0,0); }
  function library(){ setPage('library'); setSelected(null); window.scrollTo(0,0); }
  function openGame(game){ setSelected(game); setActive(game.overlays.includes('clean') ? ['clean'] : []); setPage('game'); window.scrollTo(0,0); }
  function toggleFamily(fam){ setOpenFamilies(v => v.includes(fam) ? v.filter(x => x !== fam) : [...v, fam]); }
  function toggleOverlay(id){ if(!selected?.overlays.includes(id)) return; setActive(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]); }
  function addToSession(){ if(selected){ setSession([...session, {game:selected, overlays:active}]); setPage('session'); window.scrollTo(0,0); } }

  return <div>
    <header className="hero">
      <button className="home" onClick={home}>HOME</button>
      <div><div className="eyebrow">SQUASH TACTICAL TRAINING</div><h1>Checkerboard Coach</h1><p>PHASE 4 · COACH CARDS + SESSION FLOW</p></div>
    </header>

    {page === 'home' && <main className="container">
      <h2>Courtside Coaching Tool</h2>
      <p className="lead">Expandable game families, overlays, coach cards and a basic session flow.</p>
      <div className="grid two">
        <button className="card blue" onClick={library}><h3>Game Library</h3><p>{families.length} families · {games.length} games</p></button>
        <button className="card green" onClick={() => setPage('overlays')}><h3>Overlay Framework</h3><p>{Object.keys(overlayBank).length} reusable constraints</p></button>
        <button className="card amber" onClick={() => setPage('scoring')}><h3>Scoring Protocol</h3><p>Default Checkerboard rules</p></button>
        <button className="card purple" onClick={() => setPage('session')}><h3>Session Flow</h3><p>{session.length} saved items</p></button>
      </div>
    </main>}

    {page === 'library' && <main className="container">
      <div className="topline"><div><h2>Game Library</h2><p className="lead">Tap a family, then tap a game card.</p></div><button className="secondary" onClick={home}>Return Home</button></div>
      {families.map(fam => <section key={fam} className="family">
        <button className="familyHeader" onClick={() => toggleFamily(fam)}>
          <div><strong>{openFamilies.includes(fam) ? '▼' : '▶'} {fam}</strong><span>{games.filter(g => g.family === fam).length} games</span></div>
        </button>
        {openFamilies.includes(fam) && <div className="gameList">{games.filter(g => g.family === fam).map(game => <button key={game.id} className="gameRow" onClick={() => openGame(game)}><div><strong>{game.title}</strong><span>{game.objective}</span></div><em>{game.level}</em></button>)}</div>}
      </section>)}
    </main>}

    {page === 'game' && selected && <main className="container">
      <div className="topline"><div><h2>{selected.title}</h2><p className="lead">{selected.family} · {selected.level}</p></div><div className="buttons"><button className="secondary" onClick={library}>Back to Library</button><button className="secondary" onClick={home}>Home</button></div></div>
      <section className="panel gameCard">
        <h3>Objective</h3><p>{selected.objective}</p>
        <h3>Set-up</h3><p>{selected.setup}</p>
        <h3>Rules</h3><p>{selected.rules}</p>
        <h3>Base Scoring</h3><p>{selected.scoring}</p>
        <h3>Coach Observation</h3><p>{selected.coach}</p>
      </section>

      <section className="panel">
        <h3>Overlay Builder</h3>
        <p className="lead">Select one or two overlays. The Coach Card below updates automatically.</p>
        <div className="overlayGrid">{Object.entries(overlayBank).map(([id, o]) => {
          const allowed = selected.overlays.includes(id);
          const isActive = active.includes(id);
          return <button key={id} disabled={!allowed} className={isActive ? 'overlay active' : allowed ? 'overlay' : 'overlay disabled'} onClick={() => toggleOverlay(id)}><strong>{o.title}</strong><span>{o.short}</span></button>
        })}</div>
      </section>

      <section className="panel coachCard">
        <div className="cardHead"><h3>Live Coach Card</h3><button className="primary" onClick={addToSession}>Add to Session</button></div>
        <p><strong>Game:</strong> {selected.title}</p>
        <p><strong>Base task:</strong> {selected.objective}</p>
        <p><strong>Base scoring:</strong> {selected.scoring}</p>
        {activeOverlayObjects.length > 0 && <>
          <h4>Active overlay scoring</h4>
          {activeOverlayObjects.map(o => <p key={o.title}><strong>{o.title}:</strong> {o.scoring}</p>)}
          <h4>Coach reminders</h4>
          {activeOverlayObjects.map(o => <p key={o.title + 'c'}>• {o.coach}</p>)}
        </>}
      </section>
    </main>}

    {page === 'session' && <main className="container">
      <div className="topline"><div><h2>Session Flow</h2><p className="lead">Build a simple courtside flow from selected games.</p></div><button className="secondary" onClick={home}>Home</button></div>
      <section className="panel">
        {session.length === 0 ? <div><p>No games saved yet.</p><p>Open a game, choose overlays, then tap Add to Session.</p></div> : session.map((item, i) => <div className="sessionItem" key={i}><strong>{i+1}. {item.game.title}</strong><span>{item.game.family}</span><em>{item.overlays.map(id => overlayBank[id]?.title).filter(Boolean).join(' + ') || 'No overlay'}</em></div>)}
      </section>
      <button className="primary" onClick={() => setSession([])}>Clear Session</button>
    </main>}

    {page === 'overlays' && <main className="container">
      <div className="topline"><h2>Overlay Framework</h2><button className="secondary" onClick={home}>Home</button></div>
      <section className="panel">{Object.entries(overlayBank).map(([id,o]) => <div className="overlayInfo" key={id}><h3>{o.title}</h3><p><strong>{o.short}</strong></p><p>{o.scoring}</p><p>{o.coach}</p></div>)}</section>
    </main>}

    {page === 'scoring' && <main className="container">
      <div className="topline"><h2>Default Scoring Protocol</h2><button className="secondary" onClick={home}>Home</button></div>
      <section className="panel"><p><strong>Win rally:</strong> +1</p><p><strong>Single challenge:</strong> +1</p><p><strong>Pair challenge:</strong> +2</p><p><strong>Triple challenge:</strong> +3</p><p><strong>Win after challenge:</strong> +3 bonus</p><p><strong>Clean winner:</strong> +2 bonus sits on top of all scoring</p><p><strong>Level 4:</strong> convert within 4 shots. <strong>Level 5:</strong> convert within 2 shots.</p></section>
    </main>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
