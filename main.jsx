import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const layerOptions = [
  'Clean Winner',
  'Opponent Off T',
  '4-Shot Window',
  '2-Shot Window',
  'Blind Finish',
  'Volley Finish',
  'Weak Side Only',
  'Double Bounce',
  'Quality Length Before Attack'
];

const activityLibrary = [
  {
    category:'ATL / BTL',
    title:'ATL Tape Height Control',
    type:'ATL / BTL',
    defaultFormat:'King of Court',
    defaultDuration:6,
    challenge:'Above tape / below tape cue',
    coach:'Use tape as a clear front-wall reference. Reward recognition of trajectory rather than technical shape alone.',
    layers:['Clean Winner']
  },
  {
    category:'ATL / BTL',
    title:'Height Change Recognition',
    type:'ATL / BTL',
    defaultFormat:'King of Court',
    defaultDuration:8,
    challenge:'Change height when opponent is late/off balance',
    coach:'Player reads the opponent before choosing ATL or BTL.',
    layers:['Opponent Off T']
  },
  {
    category:'ATL / BTL',
    title:'Soft / Working / Fast Pace Rotation',
    type:'Pace Variation',
    defaultFormat:'Challenger Court',
    defaultDuration:8,
    challenge:'Vary pace: soft dying, working, fast penetrating',
    coach:'Same preparation, different ball outcome. Keep it live and adaptive.',
    layers:['Clean Winner']
  },

  {
    category:'Classic Conditioned Games',
    title:'Length Before Attack',
    type:'Conditioned Game',
    defaultFormat:'King of Court',
    defaultDuration:8,
    challenge:'Must create length before attacking short',
    coach:'Length should create the attack, not become a hoop to jump through.',
    layers:['Quality Length Before Attack','Clean Winner']
  },
  {
    category:'Classic Conditioned Games',
    title:'Opponent Off-T Bonus',
    type:'Conditioned Game',
    defaultFormat:'King of Court',
    defaultDuration:8,
    challenge:'Bonus if winning shot is played while opponent is outside T-zone',
    coach:'Do not force the winner. Notice the affordance when it appears.',
    layers:['Opponent Off T','Clean Winner']
  },
  {
    category:'Classic Conditioned Games',
    title:'Straight Drive Constraint',
    type:'Conditioned Game',
    defaultFormat:'Challenger Court',
    defaultDuration:6,
    challenge:'Mostly straight rally with agreed escape rule',
    coach:'Simplify the problem without removing live opponent information.',
    layers:['Clean Winner']
  },

  {
    category:'Technical Constraint Exercises',
    title:'Late Prep Obstacle Constraint',
    type:'Technical Constraint',
    defaultFormat:'Feed + Live Rally',
    defaultDuration:6,
    challenge:'Obstacle limits excessive backswing in back court',
    coach:'Constraint should guide organisation, then return quickly to live rally.',
    layers:[]
  },
  {
    category:'Technical Constraint Exercises',
    title:'Quiet Eye / Information Pick-up',
    type:'Technical Constraint',
    defaultFormat:'Conditioned Matchplay',
    defaultDuration:6,
    challenge:'Call opponent position before choosing shot',
    coach:'The goal is earlier information pick-up, not staring at the ball.',
    layers:['Opponent Off T']
  },
  {
    category:'Technical Constraint Exercises',
    title:'Wrist Control Constraint',
    type:'Technical Constraint',
    defaultFormat:'Challenger Court',
    defaultDuration:5,
    challenge:'Tape/feel constraint to reduce wrist break',
    coach:'Use briefly as a sensation cue, then remove and test in rally.',
    layers:['Clean Winner']
  },

  {
    category:'Checkerboard Challenges',
    title:'CB Singles',
    type:'Checkerboard',
    defaultFormat:'King of Court',
    defaultDuration:6,
    challenge:'[6-4]',
    challengeType:'Singles',
    coach:'Simple one-shot target challenge inside live rally.',
    layers:['Clean Winner']
  },
  {
    category:'Checkerboard Challenges',
    title:'CB Pairs',
    type:'Checkerboard',
    defaultFormat:'King of Court',
    defaultDuration:8,
    challenge:'[6-4] + [8-1]',
    challengeType:'Pairs',
    coach:'Two-shot chain: create then exploit space.',
    layers:['Clean Winner']
  },
  {
    category:'Checkerboard Challenges',
    title:'CB Triples',
    type:'Checkerboard',
    defaultFormat:'King of Court',
    defaultDuration:8,
    challenge:'[6-4] + [8-1] + [5-3]',
    challengeType:'Triples',
    coach:'Only use when pairs remain playable and representative.',
    layers:['Opponent Off T','Clean Winner']
  },
  {
    category:'Checkerboard Challenges',
    title:'CB + Blind Finish',
    type:'Checkerboard',
    defaultFormat:'King of Court',
    defaultDuration:8,
    challenge:'[6-4] + [8-1] → blind finish',
    challengeType:'CB + Blind Finish',
    coach:'Visible checkerboard pressure, hidden finish condition.',
    layers:['Blind Finish','Clean Winner']
  },

  {
    category:'Volley / Intercept Games',
    title:'Midcourt Intercept',
    type:'Volley Game',
    defaultFormat:'King of Court',
    defaultDuration:8,
    challenge:'Volley intercept from midcourt/T-zone',
    coach:'Earn the volley through pressure and positioning, not reckless hunting.',
    layers:['Volley Finish','Clean Winner']
  },
  {
    category:'Volley / Intercept Games',
    title:'Rapid Reload',
    type:'Pressure Game',
    defaultFormat:'2v1 Pressure',
    defaultDuration:5,
    challenge:'Fast restart after selected rally or loose ball',
    coach:'This is a time-pressure decision task, not just fitness.',
    layers:['2-Shot Window']
  },

  {
    category:'Pressure / Matchplay',
    title:'Tempo Pressure',
    type:'Pressure Game',
    defaultFormat:'King of Court',
    defaultDuration:6,
    challenge:'Maintain decision quality under increased tempo',
    coach:'Do not make it mindless speed. Decision quality is the point.',
    layers:['4-Shot Window','Clean Winner']
  },
  {
    category:'Pressure / Matchplay',
    title:'Winner Loses a Bounce',
    type:'Double Bounce',
    defaultFormat:'Winner Stays On',
    defaultDuration:8,
    challenge:'Winner loses one bounce after each rally won',
    coach:'Useful for mixed levels; advantage shifts dynamically.',
    layers:['Double Bounce']
  },
  {
    category:'Pressure / Matchplay',
    title:'Vs Tall Player',
    type:'Opponent Type',
    defaultFormat:'Conditioned Matchplay',
    defaultDuration:8,
    challenge:'Low trajectory and quick direction change',
    coach:'Train the movement problem, not just the label “tall player”.',
    layers:['Weak Side Only','Clean Winner']
  }
];

const challengeBanks = {
  Singles: ['[6-4]', '[8-1]', '[5-3]', '[7-2]', '[6-3]', '[5-4]', '[8-2]', '[7-1]'],
  Pairs: ['[6-4] + [8-1]', '[5-3] + [7-2]', '[6-3] + [8-1]', '[5-4] + [7-2]', '[6-4] + [5-3]', '[7-2] + [8-1]'],
  Triples: ['[6-4] + [8-1] + [5-3]', '[5-3] + [7-2] + [8-1]', '[6-3] + [8-1] + [7-2]', '[5-4] + [7-2] + [6-3]'],
  'CB + Blind Finish': ['[6-4] + [8-1] → blind finish', '[5-3] + [7-2] → blind finish', '[6-3] + [8-1] → blind finish', '[5-4] + [7-2] → blind finish']
};

function rand(list){ return list[Math.floor(Math.random() * list.length)]; }

function makeBlock(activity = activityLibrary[0]) {
  return {
    title: activity.title,
    category: activity.category,
    type: activity.type,
    format: activity.defaultFormat || 'King of Court',
    duration: activity.defaultDuration || 8,
    challengeType: activity.challengeType || '',
    challenge: activity.challenge,
    layers: [...(activity.layers || [])],
    coach: activity.coach,
    progression: 'After 1–2 rotations, duplicate this block and add/change the layer.'
  };
}

function App(){
  const [page, setPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [blocks, setBlocks] = useState([]);

  const categories = ['All', ...Array.from(new Set(activityLibrary.map(a => a.category)))];
  const filteredActivities = selectedCategory === 'All'
    ? activityLibrary
    : activityLibrary.filter(a => a.category === selectedCategory);

  const total = blocks.reduce((sum,b) => sum + Number(b.duration || 0), 0);

  function home(){ setPage('home'); window.scrollTo(0,0); }
  function openBuilder(){ setPage('builder'); window.scrollTo(0,0); }
  function openLibrary(){ setPage('library'); window.scrollTo(0,0); }

  function addActivity(activity){
    setBlocks([...blocks, makeBlock(activity)]);
    setPage('builder');
    window.scrollTo(0,0);
  }

  function updateBlock(i,key,value){
    const copy = [...blocks];
    copy[i][key] = value;
    setBlocks(copy);
  }

  function changeChallengeType(i,type){
    const copy = [...blocks];
    copy[i].challengeType = type;
    copy[i].challenge = challengeBanks[type][0];
    setBlocks(copy);
  }

  function drawChallenge(i){
    const copy = [...blocks];
    const type = copy[i].challengeType;
    if(type && challengeBanks[type]) copy[i].challenge = rand(challengeBanks[type]);
    setBlocks(copy);
  }

  function addLayer(i){
    const copy = [...blocks];
    const next = layerOptions.find(l => !copy[i].layers.includes(l));
    if(next) copy[i].layers.push(next);
    setBlocks(copy);
  }

  function removeLayer(i, layer){
    const copy = [...blocks];
    copy[i].layers = copy[i].layers.filter(l => l !== layer);
    setBlocks(copy);
  }

  function duplicateProgress(i){
    const source = blocks[i];
    const copy = [...blocks];
    const evolved = {...source, title: source.title + ' + layer', layers:[...source.layers]};
    const next = layerOptions.find(l => !evolved.layers.includes(l));
    if(next) evolved.layers.push(next);
    evolved.progression = 'Progressed block: same activity with added layer.';
    copy.splice(i+1,0,evolved);
    setBlocks(copy);
  }

  function moveBlock(i,dir){
    const copy = [...blocks];
    const ni = i + dir;
    if(ni < 0 || ni >= copy.length) return;
    [copy[i], copy[ni]] = [copy[ni], copy[i]];
    setBlocks(copy);
  }

  function removeBlock(i){
    setBlocks(blocks.filter((_,idx) => idx !== i));
  }

  function addBlank(){
    setBlocks([...blocks, {
      title:'Custom Rotation',
      category:'Custom',
      type:'Custom',
      format:'King of Court',
      duration:8,
      challengeType:'',
      challenge:'Type your own challenge',
      layers:[],
      coach:'',
      progression:''
    }]);
    setPage('builder');
  }

  return <div>
    <header className="hero">
      <button className="homeBtn" onClick={home}>HOME</button>
      <div>
        <div className="eyebrow">CHECKERBOARD COACH</div>
        <h1>Checkerboard Coach</h1>
        <p>Phase 18 · Empty rotation builder</p>
      </div>
      {page === 'builder' && <div className="total"><strong>Total</strong><span>{total} min</span></div>}
    </header>

    {page === 'home' && <main className="container">
      <div className="homeGrid">
        <button className="tile blue" onClick={openBuilder}>
          <h2>Sessions</h2>
          <p>Build flexible King of Court / challenger rotation sessions.</p>
        </button>

        <button className="tile purple" onClick={openLibrary}>
          <h2>Games</h2>
          <p>ATL / BTL, technical constraints, conditioned games, checkerboard, volley and pressure games.</p>
        </button>

        <button className="tile green">
          <h2>Players</h2>
          <p>Player notes and history will sit here later.</p>
        </button>

        <button className="tile red">
          <h2>Competition</h2>
          <p>Future competition, ladder, teams and match-day tools.</p>
        </button>
      </div>
    </main>}

    {page === 'library' && <main className="container">
      <div className="topline">
        <div>
          <h2>Games / Activity Library</h2>
          <p>Choose any game/activity and add it directly to the session rotation builder.</p>
        </div>
        <button className="secondary" onClick={home}>Home</button>
      </div>

      <div className="chips selector">
        {categories.map(cat => <button key={cat} className={selectedCategory === cat ? 'chip active' : 'chip'} onClick={() => setSelectedCategory(cat)}>{cat}</button>)}
      </div>

      <section className="panel">
        {filteredActivities.map((a,i) => <button key={i} className="gameRow" onClick={() => addActivity(a)}>
          <div>
            <strong>{a.title}</strong>
            <span>{a.category} · {a.coach}</span>
          </div>
          <em>{a.defaultDuration} min</em>
        </button>)}
      </section>
    </main>}

    {page === 'builder' && <main className="container">
      <div className="topline">
        <div>
          <h2>Flexible Rotation Builder</h2>
          <p>Choose from all games and exercises. Use 5–8 minute King of Court rotations, then duplicate and progress.</p>
        </div>
        <div className="topButtons">
          <button className="secondary" onClick={openLibrary}>Add From Games</button>
          <button className="primary" onClick={addBlank}>Add Custom Rotation</button>
        </div>
      </div>

      {blocks.length === 0 && <section className="panel emptyState">
        <h3>No rotations added yet</h3>
        <p>Use <strong>Add From Games</strong> to choose ATL / BTL, classic conditioned games, technical constraints, checkerboard challenges, volley games or pressure games.</p>
        <p>Or use <strong>Add Custom Rotation</strong> to build a rotation from scratch.</p>
      </section>}

      {blocks.map((b,i) => <section className="block" key={i}>
        <div className="blockHeader">
          <div>
            <strong>Rotation {i+1}: {b.title}</strong>
            <span>{b.category} · {b.type}</span>
          </div>
          <div className="miniButtons">
            <button onClick={() => moveBlock(i,-1)}>↑</button>
            <button onClick={() => moveBlock(i,1)}>↓</button>
            <button onClick={() => duplicateProgress(i)}>Duplicate + Progress</button>
            <button onClick={() => removeBlock(i)}>Remove</button>
          </div>
        </div>

        <div className="grid">
          <label>Rotation Name<input value={b.title} onChange={e => updateBlock(i,'title',e.target.value)} /></label>
          <label>Format<select value={b.format} onChange={e => updateBlock(i,'format',e.target.value)}>
            <option>King of Court</option><option>Challenger Court</option><option>Winner Stays On</option><option>2v1 Pressure</option><option>Conditioned Matchplay</option><option>Feed + Live Rally</option>
          </select></label>
          <label>Duration<select value={b.duration} onChange={e => updateBlock(i,'duration',e.target.value)}>
            <option>5</option><option>6</option><option>7</option><option>8</option><option>10</option>
          </select></label>

          {b.challengeType ? <label>CB Challenge Type<select value={b.challengeType} onChange={e => changeChallengeType(i,e.target.value)}>
            <option>Singles</option><option>Pairs</option><option>Triples</option><option>CB + Blind Finish</option>
          </select></label> : <label>Activity Type<input value={b.type} onChange={e => updateBlock(i,'type',e.target.value)} /></label>}

          {b.challengeType ? <label className="wide">CB Challenge<select value={b.challenge} onChange={e => updateBlock(i,'challenge',e.target.value)}>
            {challengeBanks[b.challengeType].map(c => <option key={c}>{c}</option>)}
          </select></label> : <label className="wide">Challenge / Task<input value={b.challenge} onChange={e => updateBlock(i,'challenge',e.target.value)} /></label>}

          {b.challengeType && <div className="wide"><button className="secondary full" onClick={() => drawChallenge(i)}>Draw New {b.challengeType}</button></div>}
        </div>

        <div className="layerTop">
          <h3>Layers / Constraints</h3>
          <button className="secondary" onClick={() => addLayer(i)}>Add Next Layer</button>
        </div>
        <div className="chips">
          {b.layers.length === 0 && <span className="muted">No layers yet.</span>}
          {b.layers.map((l,idx) => <button key={idx} className="chip active" onClick={() => removeLayer(i,l)}>{l} ×</button>)}
        </div>

        <div className="grid">
          <label>Coach Focus<textarea value={b.coach} onChange={e => updateBlock(i,'coach',e.target.value)} /></label>
          <label>Next Progression<textarea value={b.progression} onChange={e => updateBlock(i,'progression',e.target.value)} /></label>
        </div>
      </section>)}
    </main>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
