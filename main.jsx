
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const overlays = ['Clean Winner','Opponent Off T','4-Shot Window','2-Shot Window','Blind Finish','Volley Finish'];
const challenges = ['[6-4] + [8-1]','[5-3] + [7-2]','[6-3] + [8-1]','[5-4] + [7-2]'];

function pick(a){ return a[Math.floor(Math.random()*a.length)] }

function App(){
  const [page,setPage] = useState('home');

  const [blocks,setBlocks] = useState([
    {
      title:'CB Pairs',
      format:'King of Court',
      duration:8,
      challenge:pick(challenges),
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
      challenge:pick(challenges),
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
    const source=blocks[i];
    const evolved={...source, overlays:[...source.overlays], title:source.title+' Progression'};
    const next = overlays.find(o=>!evolved.overlays.includes(o));
    if(next) evolved.overlays.push(next);

    const copy=[...blocks];
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
      <button className="homeBtn" onClick={()=>setPage('home')}>HOME</button>

      <div>
        <div className="eyebrow">CHECKERBOARD COACH</div>
        <h1>Checkerboard Session System</h1>
        <p>Ecological squash session design.</p>
      </div>

      {page === 'builder' &&
        <div className="totalCard">
          <strong>Total Session</strong>
          <span>{total} mins</span>
        </div>
      }
    </header>

    {page === 'home' &&
      <main className="container">
        <div className="homeGrid">

          <button className="tile blue" onClick={()=>setPage('builder')}>
            <h2>Modular Rotation Builder</h2>
            <p>King/challenger session design with progressive layering.</p>
          </button>

          <button className="tile green">
            <h2>Game Library</h2>
            <p>Conditioned games and checkerboard games.</p>
          </button>

          <button className="tile red">
            <h2>Blind Deck</h2>
            <p>Hidden tactical challenges and finishes.</p>
          </button>

          <button className="tile purple">
            <h2>Challenge Generator</h2>
            <p>Random CB tactical progressions.</p>
          </button>

          <button className="tile amber">
            <h2>Scoring Protocol</h2>
            <p>Default checkerboard scoring rules.</p>
          </button>

        </div>
      </main>
    }

    {page === 'builder' &&
      <main className="container">
        <section className="panel">

          <div className="topline">
            <div>
              <h2>Rotation-Based Session Design</h2>
              <p>Build flexible blocks and evolve the challenge every 1–2 rotations.</p>
            </div>

            <button className="primary" onClick={addBlock}>
              Add Block
            </button>
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
                  Rotation Duration
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

                  <button className="secondary" onClick={()=>addLayer(i)}>
                    Add Next Layer
                  </button>
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
    }

  </div>
}

createRoot(document.getElementById('root')).render(<App />);
