import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const challengeBanks = {
  Singles: ['[6-4]', '[8-1]', '[5-3]', '[7-2]', '[6-3]', '[5-4]', '[8-2]', '[7-1]'],
  Pairs: ['[6-4] + [8-1]', '[5-3] + [7-2]', '[6-3] + [8-1]', '[5-4] + [7-2]', '[6-4] + [5-3]', '[7-2] + [8-1]'],
  Triples: ['[6-4] + [8-1] + [5-3]', '[5-3] + [7-2] + [8-1]', '[6-3] + [8-1] + [7-2]', '[5-4] + [7-2] + [6-3]'],
  'CB + Blind Finish': ['[6-4] + [8-1] → blind finish', '[5-3] + [7-2] → blind finish', '[6-3] + [8-1] → blind finish', '[5-4] + [7-2] → blind finish']
};

const layerOptions = ['Clean Winner', 'Opponent Off T', '4-Shot Window', '2-Shot Window', 'Blind Finish', 'Volley Finish'];

const libraryGames = [
  { title:'CB Singles', type:'Singles', challenge:'[6-4]', coach:'One-shot checkerboard targeting inside a live rally.' },
  { title:'CB Pairs', type:'Pairs', challenge:'[6-4] + [8-1]', coach:'Two-shot tactical chain: create then exploit space.' },
  { title:'CB Triples', type:'Triples', challenge:'[6-4] + [8-1] + [5-3]', coach:'Three-shot tactical chain with delayed conversion.' },
  { title:'CB + Blind Finish', type:'CB + Blind Finish', challenge:'[6-4] + [8-1] → blind finish', coach:'Visible checkerboard challenge, hidden finish condition.' },
  { title:'Opponent Off-T Bonus', type:'Pairs', challenge:'[5-3] + [7-2]', coach:'Recognise opponent not recovered before attacking.' },
  { title:'Tape Height Control', type:'Singles', challenge:'[6-4]', coach:'Use ATL/BTL cue to vary trajectory.' },
  { title:'Midcourt Intercept', type:'Pairs', challenge:'[6-3] + [8-1]', coach:'Earn the volley/intercept through pressure.' },
  { title:'Length Before Attack', type:'Pairs', challenge:'[5-4] + [7-2]', coach:'Use length to create the attack.' }
];

function rand(list){ return list[Math.floor(Math.random() * list.length)]; }

function makeBlock(source = {}) {
  const type = source.type || 'Pairs';
  return {
    title: source.title || 'Rotation',
    format: source.format || 'King of Court',
    duration: source.duration || 8,
    challengeType: type,
    challenge: source.challenge || challengeBanks[type][0],
    layers: source.layers || ['Clean Winner'],
    coach: source.coach || 'Coach the information source, not just the shot.',
    progression: source.progression || 'After 1–2 rotations, duplicate this block and add the next layer.'
  };
}

function App(){
  const [page, setPage] = useState('home');
  const [blocks, setBlocks] = useState([makeBlock({title:'Rotation 1', type:'Pairs'})]);

  const total = blocks.reduce((sum,b) => sum + Number(b.duration || 0), 0);

  function home(){ setPage('home'); window.scrollTo(0,0); }
  function openBuilder(){ setPage('builder'); window.scrollTo(0,0); }

  function addBlock(source){
    setBlocks([...blocks, makeBlock(source)]);
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
    const type = copy[i].challengeType || 'Pairs';
    copy[i].challenge = rand(challengeBanks[type]);
    setBlocks(copy);
  }

  function addLayer(i){
    const copy = [...blocks];
    const next = layerOptions.find(l => !copy[i].layers.includes(l));
    if(next) copy[i].layers.push(next);
    setBlocks(copy);
  }

  function duplicateProgress(i){
    const source = blocks[i];
    const copy = [...blocks];
    const evolved = {...source, title: source.title + ' + layer', layers:[...source.layers]};
    const next = layerOptions.find(l => !evolved.layers.includes(l));
    if(next) evolved.layers.push(next);
    evolved.progression = 'Progressed block: same game, added layer.';
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

  return <div>
    <header className="hero">
      <button className="homeBtn" onClick={home}>HOME</button>
      <div>
        <div className="eyebrow">CHECKERBOARD COACH</div>
        <h1>Rotation Session Builder</h1>
        <p>Phase 15 · Clean rotation-only workflow</p>
      </div>
      {page === 'builder' && <div className="total"><strong>Total</strong><span>{total} min</span></div>}
    </header>

    {page === 'home' && <main className="container">
      <div className="homeGrid">
        <button className="tile blue" onClick={openBuilder}>
          <h2>Flexible Rotation Builder</h2>
          <p>Main workflow: King of Court, 5–8 minute rotations, add layers every 1–2 rotations.</p>
        </button>
        <button className="tile green" onClick={() => addBlock({title:'Random CB Pair', type:'Pairs', challenge:rand(challengeBanks.Pairs)})}>
          <h2>Quick Add Random Pair</h2>
          <p>Add a pair challenge directly as a rotation.</p>
        </button>
        <button className="tile red" onClick={() => addBlock({title:'CB + Blind Finish', type:'CB + Blind Finish', challenge:rand(challengeBanks['CB + Blind Finish']), layers:['Clean Winner','Blind Finish']})}>
          <h2>Quick Add CB + Blind Finish</h2>
          <p>Visible CB pair with hidden finish condition.</p>
        </button>
        <button className="tile purple" onClick={() => setPage('library')}>
          <h2>Game Library</h2>
          <p>Choose a game and add it directly to the rotation builder.</p>
        </button>
      </div>
    </main>}

    {page === 'library' && <main className="container">
      <div className="topline">
        <div><h2>Game Library</h2><p>Every game adds directly to the Rotation Builder. No Warm-up/Main/Pressure/Finish page exists in this build.</p></div>
        <button className="secondary" onClick={home}>Home</button>
      </div>
      <section className="panel">
        {libraryGames.map((g,i) => <button key={i} className="gameRow" onClick={() => addBlock(g)}>
          <div><strong>{g.title}</strong><span>{g.coach}</span></div>
          <em>{g.type}</em>
        </button>)}
      </section>
    </main>}

    {page === 'builder' && <main className="container">
      <div className="topline">
        <div>
          <h2>Flexible Rotation Builder</h2>
          <p>Build the session as a stack of rotations. No fixed template. Total time updates automatically.</p>
        </div>
        <button className="primary" onClick={() => addBlock({title:'New Rotation', type:'Pairs'})}>Add Rotation</button>
      </div>

      {blocks.map((b,i) => <section className="block" key={i}>
        <div className="blockHeader">
          <strong>Rotation {i+1}</strong>
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
            <option>King of Court</option><option>Challenger Court</option><option>Winner Stays On</option><option>2v1 Pressure</option><option>Conditioned Matchplay</option>
          </select></label>
          <label>Duration<select value={b.duration} onChange={e => updateBlock(i,'duration',e.target.value)}>
            <option>5</option><option>6</option><option>7</option><option>8</option><option>10</option>
          </select></label>
          <label>Challenge Type<select value={b.challengeType} onChange={e => changeChallengeType(i,e.target.value)}>
            <option>Singles</option><option>Pairs</option><option>Triples</option><option>CB + Blind Finish</option>
          </select></label>
          <label className="wide">CB Challenge<select value={b.challenge} onChange={e => updateBlock(i,'challenge',e.target.value)}>
            {challengeBanks[b.challengeType].map(c => <option key={c}>{c}</option>)}
          </select></label>
          <div className="wide"><button className="secondary full" onClick={() => drawChallenge(i)}>Draw New {b.challengeType}</button></div>
        </div>

        <div className="layerTop">
          <h3>Layers</h3>
          <button className="secondary" onClick={() => addLayer(i)}>Add Next Layer</button>
        </div>
        <div className="chips">{b.layers.map((l,idx) => <span key={idx} className="chip">{l}</span>)}</div>

        <div className="grid">
          <label>Coach Focus<textarea value={b.coach} onChange={e => updateBlock(i,'coach',e.target.value)} /></label>
          <label>Next Progression<textarea value={b.progression} onChange={e => updateBlock(i,'progression',e.target.value)} /></label>
        </div>
      </section>)}
    </main>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
