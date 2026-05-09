import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const overlays = [
  ['clean', 'Clean Winner', '+2 bonus sits on top of all scoring.'],
  ['offt', 'Opponent Off T', 'Bonus only applies when opponent is outside the marked T-zone.'],
  ['four', '4-Shot Window', 'Level 4: after challenge, win within 4 shots or reset.'],
  ['two', '2-Shot Window', 'Level 5: after challenge, win within 2 shots or reset.'],
  ['volley', 'Volley Finish', 'Winning shot must be a volley.'],
  ['blind', 'Blind Finish', 'Hidden finish condition is drawn before the rally.'],
  ['cb', 'Checkerboard Target', 'Add a single, pair or triple checkerboard challenge.'],
  ['weak', 'Weak Side', 'Challenge must attack the opponent weakness.']
];

const families = [
  {
    id:'checkerboard', title:'Checkerboard Games', colour:'blue',
    desc:'Singles, pairs, triples, blind challenges and tactical chains.',
    games:[
      game('CB Singles','Level 1','Introduce one-shot checkerboard targeting inside a live rally.','Coach calls/draws one target such as [6-4], [8-1], [5-3] or [7-2].','Win rally +1. Complete single challenge +1. Clean winner +2.','Keep the target simple enough that the rally remains representative.',['clean','offt','cb']),
      game('CB Pairs','Level 2–5','Train tactical two-shot combinations that create and then exploit space.','Use a nominated pair such as [6-4] + [8-1] or [5-3] + [7-2].','Complete pair +2. Win after pair +3. Clean winner +2.','The first shot should create the affordance for the second.',['clean','offt','four','two']),
      game('CB Triples','Level 3–5','Develop advanced tactical chaining and delayed conversion.','Player receives a three-part checkerboard chain.','Complete triple +3. Win after challenge +3. Clean winner +2.','Only use once players can complete pairs without losing rally realism.',['clean','offt','four','two']),
      game('Blind Pairs','Intermediate–Professional','Train hidden intention, disguise and decision-making.','Each player secretly receives a pair challenge.','Win rally +1. Complete pair +2. Win after challenge +3.','Stop players forcing the card. The game must still reward adaptation.',['blind','clean','four','two'])
    ]
  },
  {
    id:'tzone', title:'T Zone Games', colour:'amber',
    desc:'Central control, recovery, opponent off-T recognition and finish opportunities.',
    games:[
      game('Return to T Score','All levels','Build awareness of recovery to the T after every shot.','Normal rally. Mark or define the T-zone clearly.','Win rally +1. Opponent fails to recover to T before next contact = +1.','Look for players recognising opponent position before choosing the next shot.',['clean','volley']),
      game('Opponent Off-T Bonus','Intermediate–Professional','Reward recognising when the opponent is not recovered.','Normal rally. T-zone is marked or agreed.','Win rally +1. +3 bonus if winning shot is played while opponent is outside T-zone.','Do not force a winner. Notice the affordance when it appears.',['clean','four','two','volley']),
      game('T-Zone Volley Finish','Elite–Professional','Encourage central control and early interception.','Winner bonus requires volley finish from central control.','Win rally +1. +3 if winner is a volley from T-zone.','Watch for players hunting volleys too early instead of earning the interception.',['clean','offt','four','two'])
    ]
  },
  {
    id:'atl', title:'ATL / BTL Games', colour:'green',
    desc:'Above-the-line and below-the-line trajectory control using tape/visual cues.',
    games:[
      game('Tape Height Control','Beginner–Elite','Train shot height variation with a clear front-wall cue.','Use tape/visual band rather than service line where useful.','Point only counts if nominated shot travels above or below tape.','Tape is clearer and usually more representative than the service line for juniors.',['clean','offt','cb']),
      game('Height Change Recognition','Intermediate–Performance','Recognise when to change height rather than repeat trajectory.','Player changes height based on opponent position or poor recovery.','Win rally +1. Correct height-change decision +1.','Reward the decision more than technical perfection.',['clean','offt','four'])
    ]
  },
  {
    id:'classic', title:'Classic Conditioned Games', colour:'purple',
    desc:'Base representative games that can be shaped with overlays.',
    games:[
      game('Length Before Attack','Beginner–Performance','Build pressure before attacking short.','Attacking short is only allowed after achieving length.','Win rally +1. Bonus +2 for winning after legal length-before-attack sequence.','Length must create the attack, not become a hoop to jump through.',['clean','offt','four','two']),
      game('Straight Drive Constraint','Junior beginner–Intermediate','Simplify corridor control while keeping a live opponent problem.','Rally mostly straight with agreed escape rules.','Win rally +1. Bonus for maintaining pressure without overhitting.','Avoid making it a dead drill. Keep live decision-making.',['clean','cb']),
      game('Clean Winner Bonus Game','All levels','Reward genuine tactical advantage rather than errors only.','Use as overlay on any conditioned game.','+2 clean winner bonus sits on top.','Clarify: opponent cannot touch the ball with racquet despite trying.',['clean','offt','four','two'])
    ]
  },
  {
    id:'volley', title:'Volley Games', colour:'teal',
    desc:'Interception, central control, rapid reload and frontcourt pressure.',
    games:[
      game('Midcourt Intercept','Intermediate–Elite','Train earlier perception and interception opportunities.','Normal rally. Bonus for legal volley interceptions from midcourt/T-zone.','Win rally +1. Volley intercept +1. Win after volley intercept +3.','Volleys should emerge from pressure and positioning, not reckless hunting.',['clean','offt','four']),
      game('Rapid Reload','Elite–Professional','Create repeated stress and fast reorganisation.','Coach/player restarts quickly after selected rallies/feeds.','Score successful reloads or use timed blocks.','It is a pressure design, not just fitness.',['clean','two','cb'])
    ]
  },
  {
    id:'double', title:'Double Bounce Games', colour:'orange',
    desc:'Adaptive bounce rules to balance levels and shape retrieval/pressure.',
    games:[
      game('Winner Loses a Bounce','Junior beginner–Intermediate','Balance rallies and create adaptive pressure.','Incoming player starts with double bounce. Winner loses one bounce after each rally they win.','Normal rally scoring. Constraint changes after each rally.','Useful for mixed standards because advantage shifts dynamically.',['clean','cb'])
    ]
  },
  {
    id:'pressure', title:'Pressure / Chaos Games', colour:'red',
    desc:'Tempo, randomisation, restricted recovery and pressure solving.',
    games:[
      game('Tempo Pressure','Elite–Professional','Train decision-making under reduced time.','Normal rally with coach-called tempo blocks or rapid restarts.','Win rally +1. Quality decision under pressure +1.','Do not turn this into mindless speed. Decision quality is the point.',['clean','four','two'])
    ]
  },
  {
    id:'opponent', title:'Tactical Opponent Games', colour:'slate',
    desc:'Games shaped around player types: tall, retriever, hard hitter, deceiver.',
    games:[
      game('Vs Tall Player','Intermediate–Professional','Train low, quick direction changes against reach advantage.','Opponent plays as tall/reach-dominant profile.','Win rally +1. Tactical success +2. Clean winner +2.','Watch whether player is changing the opponent movement problem.',['clean','offt','cb','weak'])
    ]
  }
];

function game(title, level, objective, setup, scoring, coach, overlayIds){
  return { title, level, objective, setup, scoring, coach, overlayIds };
}

function App(){
  const [page,setPage]=useState('home');
  const [open,setOpen]=useState(['checkerboard']);
  const [selected,setSelected]=useState(null);
  const [active,setActive]=useState(['clean']);

  function home(){ setPage('home'); setSelected(null); window.scrollTo(0,0); }
  function library(){ setPage('library'); setSelected(null); window.scrollTo(0,0); }
  function openGame(g){ setSelected(g); setActive(g.overlayIds.includes('clean')?['clean']:[]); setPage('game'); window.scrollTo(0,0); }
  function toggleFamily(id){ setOpen(open.includes(id)?open.filter(x=>x!==id):[...open,id]); }
  function toggleOverlay(id){ setActive(active.includes(id)?active.filter(x=>x!==id):[...active,id]); }

  const activeOverlays = overlays.filter(o=>active.includes(o[0]));

  return <div>
    <header className="hero">
      <button className="home" onClick={home}>HOME</button>
      <div><div className="eyebrow">SQUASH TACTICAL TRAINING</div><h1>Checkerboard Coach</h1><p>PHASE 3 · EXPANDABLE LIBRARY + OVERLAYS</p></div>
    </header>

    {page==='home' && <main className="container">
      <h2>Courtside Coaching Tool</h2>
      <p className="lead">Game families, structured cards, and reusable overlays.</p>
      <div className="grid two">
        <button className="card blue" onClick={library}><h3>Game Library</h3><p>{families.length} families · {families.reduce((n,f)=>n+f.games.length,0)} games</p></button>
        <button className="card green" onClick={()=>setPage('overlays')}><h3>Overlay Framework</h3><p>{overlays.length} reusable constraints</p></button>
        <button className="card amber" onClick={()=>setPage('scoring')}><h3>Scoring Protocol</h3><p>Default Checkerboard rules</p></button>
        <button className="card purple" onClick={()=>setPage('session')}><h3>Session Builder</h3><p>Simple court-side flow</p></button>
      </div>
    </main>}

    {page==='library' && <main className="container">
      <div className="topline"><div><h2>Game Library</h2><p className="lead">Tap a family, then tap a game card.</p></div><button className="secondary" onClick={home}>Return Home</button></div>
      {families.map(f=><section key={f.id} className={'family '+f.colour}>
        <button className="familyHeader" onClick={()=>toggleFamily(f.id)}>
          <div><strong>{open.includes(f.id)?'▼':'▶'} {f.title}</strong><span>{f.desc}</span></div><em>{f.games.length} games</em>
        </button>
        {open.includes(f.id) && <div className="gameList">{f.games.map(g=><button key={g.title} className="gameRow" onClick={()=>openGame(g)}><div><strong>{g.title}</strong><span>{g.objective}</span></div><em>{g.level}</em></button>)}</div>}
      </section>)}
    </main>}

    {page==='game' && selected && <main className="container">
      <div className="topline"><div><h2>{selected.title}</h2><p className="lead">{selected.level}</p></div><div className="buttons"><button className="secondary" onClick={library}>Back to Library</button><button className="secondary" onClick={home}>Home</button></div></div>
      <section className="panel gameCard"><h3>Objective</h3><p>{selected.objective}</p><h3>Set-up</h3><p>{selected.setup}</p><h3>Scoring</h3><p>{selected.scoring}</p><h3>Coach Observation</h3><p>{selected.coach}</p></section>
      <section className="panel"><h3>Available Overlays</h3><p className="lead">Use overlays to scale the same base game rather than creating endless separate games.</p>
        <div className="overlayGrid">{overlays.map(o=>{const allowed=selected.overlayIds.includes(o[0]); const isActive=active.includes(o[0]); return <button key={o[0]} disabled={!allowed} className={isActive?'overlay active':allowed?'overlay':'overlay disabled'} onClick={()=>allowed&&toggleOverlay(o[0])}><strong>{o[1]}</strong><span>{o[2]}</span></button>})}</div>
        {activeOverlays.length>0 && <div className="activeBox"><h4>Active Overlay Notes</h4>{activeOverlays.map(o=><p key={o[0]}><strong>{o[1]}:</strong> {o[2]}</p>)}</div>}
      </section>
    </main>}

    {page==='overlays' && <main className="container"><div className="topline"><h2>Overlay Framework</h2><button className="secondary" onClick={home}>Home</button></div><section className="panel">{overlays.map(o=><div className="overlayInfo" key={o[0]}><h3>{o[1]}</h3><p>{o[2]}</p></div>)}</section></main>}

    {page==='scoring' && <main className="container"><div className="topline"><h2>Default Scoring Protocol</h2><button className="secondary" onClick={home}>Home</button></div><section className="panel"><p><strong>Win rally:</strong> +1</p><p><strong>Single challenge:</strong> +1</p><p><strong>Pair challenge:</strong> +2</p><p><strong>Triple challenge:</strong> +3</p><p><strong>Win after challenge:</strong> +3 bonus</p><p><strong>Clean winner:</strong> +2 bonus sits on top of all scoring</p><p><strong>Level 4:</strong> convert within 4 shots. <strong>Level 5:</strong> convert within 2 shots.</p></section></main>}

    {page==='session' && <main className="container"><div className="topline"><h2>Simple Session Builder</h2><button className="secondary" onClick={home}>Home</button></div><section className="panel"><ol><li>Choose one game family.</li><li>Pick one representative game.</li><li>Add one overlay only.</li><li>Progress to Level 4 or 5 only if the task remains playable.</li></ol></section></main>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
