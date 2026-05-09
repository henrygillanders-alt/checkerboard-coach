
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const overlays = ['Clean Winner','Opponent Off T','4-Shot Window','2-Shot Window','Blind Finish','Volley Finish'];

const baseChallenges = [
  '[6-4] + [8-1]',
  '[5-3] + [7-2]',
  '[6-3] + [8-1]',
  '[5-4] + [7-2]'
];

function pick(a){ return a[Math.floor(Math.random()*a.length)] }

function App(){
  const [blocks,setBlocks] = useState([
    {
      title:'CB Pairs',
      format:'King of Court',
      duration:8,
      challenge:pick(baseChallenges),
      overlays:['Clean Winner'],
      coach:'Create pressure before attacking.',
      progression:'Add Opponent Off T'
    }
  ]);

  function addBlock(){
    setBlocks([...blocks,{
      title:'New Block',
      format:'King of Court',
      duration:8,
      challenge:pick(baseChallenges),
      overlays:[],
      coach:'',
      progression:''
    }])
  }

  function update(i,key,val){
    const copy=[...blocks];
    copy[i][key]=val;
    setBlocks(copy);
  }

  function addLayer(i){
    const copy=[...blocks];
    const next = overlays.find(o=>!copy[i].overlays.includes(o));
    if(next) copy[i].overlays.push(next);
    setBlocks(copy);
  }

  function duplicateEvolve(i){
    const source = blocks[i];
    const copy=[...blocks];
    const evolved={
      ...source,
      title: source.title + ' Progression',
      duration: source.duration,
      overlays:[...source.overlays],
    };
    const next = overlays.find(o=>!evolved.overlays.includes(o));
    if(next) evolved.overlays.push(next);
    evolved.progression='Next layer added automatically';
    copy.splice(i+1,0,evolved);
    setBlocks(copy);
  }

  function move(i,dir){
    const copy=[...blocks];
    const ni=i+dir;
    if(ni<0 || ni>=copy.length) return;
    [copy[i],copy[ni]]=[copy[ni],copy[i]];
    setBlocks(copy);
  }

  function remove(i){
    setBlocks(blocks.filter((_,idx)=>idx!==i));
  }

  const total = blocks.reduce((a,b)=>a+Number(b.duration||0),0);

  return <div className="app">
    <header className="hero">
      <div>
        <div className="eyebrow">CHECKERBOARD COACH</div>
        <h1>Phase 10 · Modular Rotation Session Builder</h1>
        <p>King/challenger blocks with progressive layering.</p>
      </div>
      <div className="totalCard">
        <strong>Total Session</strong>
        <span>{total} mins</span>
      </div>
    </header>

    <main className="container">
      <section className="panel">
        <div className="topline">
          <div>
            <h2>Rotation-Based Session Design</h2>
            <p>Build flexible blocks and evolve the session every 1–2 rotations.</p>
          </div>
          <button className="primary" onClick={addBlock}>Add Block</button>
        </div>

        {blocks.map((b,i)=>
          <div className="block" key={i}>
            <div className="blockHeader">
              <strong>BLOCK {i+1}</strong>
              <div className="miniButtons">
                <button onClick={()=>move(i,-1)}>↑</button>
                <button onClick={()=>move(i,1)}>↓</button>
                <button onClick={()=>duplicateEvolve(i)}>Duplicate + Progress</button>
                <button onClick={()=>remove(i)}>Remove</button>
              </div>
            </div>

            <div className="grid">
              <label>
                Block Name
                <input value={b.title} onChange={e=>update(i,'title',e.target.value)} />
              </label>

              <label>
                Format
                <select value={b.format} onChange={e=>update(i,'format',e.target.value)}>
                  <option>King of Court</option>
                  <option>Challenger Court</option>
                  <option>Winner Stays On</option>
                  <option>2v1 Pressure</option>
                  <option>Conditioned Matchplay</option>
                </select>
              </label>

              <label>
                Duration
                <select value={b.duration} onChange={e=>update(i,'duration',e.target.value)}>
                  <option>5</option>
                  <option>6</option>
                  <option>7</option>
                  <option>8</option>
                  <option>10</option>
                </select>
              </label>

              <label>
                Challenge
                <input value={b.challenge} onChange={e=>update(i,'challenge',e.target.value)} />
              </label>
            </div>

            <div className="overlaySection">
              <div className="overlayTop">
                <h3>Layers / Overlays</h3>
                <button className="secondary" onClick={()=>addLayer(i)}>Add Next Layer</button>
              </div>

              <div className="chips">
                {b.overlays.map((o,idx)=>
                  <span className="chip" key={idx}>{o}</span>
                )}
              </div>
            </div>

            <div className="notes">
              <label>
                Coach Focus
                <textarea value={b.coach} onChange={e=>update(i,'coach',e.target.value)} />
              </label>

              <label>
                Next Progression
                <textarea value={b.progression} onChange={e=>update(i,'progression',e.target.value)} />
              </label>
            </div>
          </div>
        )}
      </section>
    </main>
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
