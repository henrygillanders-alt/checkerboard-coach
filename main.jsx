import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const layers = [
  'Clean Winner',
  'Opponent Off T',
  'Blind Finish',
  'Volley Finish',
  'Weak Side',
  '4-Shot Window',
  '2-Shot Window',
  'Double Bounce',
  'Quality Length Before Attack'
];

const activities = [
  {category:'ATL / BTL', title:'ATL Tape Height Control', duration:6, format:'King of Court', task:'Above tape / below tape cue', layers:['Clean Winner'], coach:'Use tape as a clear visual cue. Reward recognition of trajectory.'},
  {category:'ATL / BTL', title:'Height Change Recognition', duration:8, format:'King of Court', task:'Change height when opponent is late or off balance', layers:['Opponent Off T'], coach:'Player reads opponent position before choosing height.'},
  {category:'ATL / BTL', title:'Pace Variation Rotation', duration:8, format:'Challenger Court', task:'Soft dying / working / fast penetrating pace', layers:['Clean Winner'], coach:'Same prep, different ball outcome.'},

  {category:'Classic Conditioned', title:'Length Before Attack', duration:8, format:'King of Court', task:'Must create length before attacking short', layers:['Quality Length Before Attack'], coach:'Length should create the attack.'},
  {category:'Classic Conditioned', title:'Opponent Off-T Bonus', duration:8, format:'King of Court', task:'Bonus if winner is played while opponent is outside T-zone', layers:['Opponent Off T'], coach:'Notice the affordance; do not force the winner.'},
  {category:'Classic Conditioned', title:'Straight Drive Constraint', duration:6, format:'Challenger Court', task:'Mostly straight rally with agreed escape rule', layers:[], coach:'Simplify without removing live opponent information.'},

  {category:'Checkerboard', title:'CB Singles', duration:6, format:'King of Court', task:'[6-4]', layers:['Clean Winner'], coach:'One-shot checkerboard target inside live rally.'},
  {category:'Checkerboard', title:'CB Pairs', duration:8, format:'King of Court', task:'[6-4] + [8-1]', layers:['Clean Winner'], coach:'Two-shot chain: create then exploit space.'},
  {category:'Checkerboard', title:'CB Triples', duration:8, format:'King of Court', task:'[6-4] + [8-1] + [5-3]', layers:['Opponent Off T'], coach:'Use when pairs remain playable.'},
  {category:'Checkerboard', title:'CB + Blind Finish', duration:8, format:'King of Court', task:'[6-4] + [8-1] → blind finish', layers:['Blind Finish','Clean Winner'], coach:'Visible CB challenge with hidden finish condition.'},

  {category:'Technical Constraints', title:'Late Prep Obstacle Constraint', duration:6, format:'Feed + Live Rally', task:'Obstacle limits excessive backswing in back court', layers:[], coach:'Use briefly, then return to live rally.'},
  {category:'Technical Constraints', title:'Quiet Eye / Information Pick-up', duration:6, format:'Conditioned Matchplay', task:'Call opponent position before choosing shot', layers:['Opponent Off T'], coach:'Train information pick-up, not staring.'},
  {category:'Technical Constraints', title:'Wrist Control Constraint', duration:5, format:'Challenger Court', task:'Tape/feel constraint to reduce wrist break', layers:[], coach:'Use as sensation cue, then remove.'},

  {category:'Volley / Intercept', title:'Midcourt Intercept', duration:8, format:'King of Court', task:'Volley intercept from midcourt/T-zone', layers:['Volley Finish'], coach:'Earn the volley through pressure.'},
  {category:'Volley / Intercept', title:'Rapid Reload', duration:5, format:'2v1 Pressure', task:'Fast restart after selected rally or loose ball', layers:['2-Shot Window'], coach:'Time-pressure decision task.'},

  {category:'Pressure / Matchplay', title:'Tempo Pressure', duration:6, format:'King of Court', task:'Maintain decision quality under increased tempo', layers:['4-Shot Window'], coach:'Decision quality, not mindless speed.'},
  {category:'Pressure / Matchplay', title:'Winner Loses a Bounce', duration:8, format:'Winner Stays On', task:'Winner loses one bounce after each rally won', layers:['Double Bounce'], coach:'Useful for mixed standards.'},
  {category:'Pressure / Matchplay', title:'Vs Tall Player', duration:8, format:'Conditioned Matchplay', task:'Low trajectory and quick direction change', layers:['Weak Side'], coach:'Train the movement problem.'}
];

const categories = ['ATL / BTL','Classic Conditioned','Checkerboard','Technical Constraints','Volley / Intercept','Pressure / Matchplay'];

function cloneActivity(a) {
  return {
    id: Date.now() + Math.random(),
    title: a.title,
    category: a.category,
    duration: a.duration,
    format: a.format,
    task: a.task,
    layers: [...(a.layers || [])],
    coach: a.coach || '',
    progression: 'Duplicate and add/change one layer after 1–2 rotations.',
    editing: false
  };
}

function App(){
  const [page, setPage] = useState('home');
  const [session, setSession] = useState([]);
  const [category, setCategory] = useState('ATL / BTL');
  const [pickerOpen, setPickerOpen] = useState(false);

  const total = session.reduce((sum, item) => sum + Number(item.duration || 0), 0);

  function goBuilder(){ setPage('builder'); setPickerOpen(false); window.scrollTo(0,0); }
  function home(){ setPage('home'); setPickerOpen(false); window.scrollTo(0,0); }

  function addActivity(a){
    setSession([...session, cloneActivity(a)]);
    setPage('builder');
    setPickerOpen(false);
    window.scrollTo(0,0);
  }

  function addCustomNote(){
    setSession([...session, {
      id: Date.now() + Math.random(),
      title:'Custom Rotation',
      category:'Custom',
      duration:8,
      format:'King of Court',
      task:'Tap Edit to add task',
      layers:[],
      coach:'',
      progression:'',
      editing:true
    }]);
    setPage('builder');
  }

  function updateItem(i, key, value){
    const copy = [...session];
    copy[i][key] = value;
    setSession(copy);
  }

  function removeItem(i){ setSession(session.filter((_,idx) => idx !== i)); }

  function moveItem(i, dir){
    const copy = [...session];
    const ni = i + dir;
    if(ni < 0 || ni >= copy.length) return;
    [copy[i], copy[ni]] = [copy[ni], copy[i]];
    setSession(copy);
  }

  function addLayer(i, layer){
    const copy = [...session];
    if(!copy[i].layers.includes(layer)) copy[i].layers.push(layer);
    setSession(copy);
  }

  function removeLayer(i, layer){
    const copy = [...session];
    copy[i].layers = copy[i].layers.filter(l => l !== layer);
    setSession(copy);
  }

  function duplicateProgress(i){
    const source = session[i];
    const copy = [...session];
    const next = layers.find(l => !source.layers.includes(l));
    const evolved = {
      ...source,
      id: Date.now() + Math.random(),
      title: source.title + ' + progression',
      layers: next ? [...source.layers, next] : [...source.layers],
      progression: next ? `Added layer: ${next}` : 'Progression duplicated.'
    };
    copy.splice(i+1, 0, evolved);
    setSession(copy);
  }

  return <div>
    <header className="hero">
      <button className="homeBtn" onClick={home}>HOME</button>
      <div>
        <div className="eyebrow">CHECKERBOARD COACH</div>
        <h1>Session Builder</h1>
        <p>Phase 19 · Compact cards + add-from-library workflow</p>
      </div>
      {page === 'builder' && <div className="total"><strong>Total</strong><span>{total} min</span></div>}
    </header>

    {page === 'home' && <main className="container">
      <div className="homeGrid">
        <button className="tile blue" onClick={goBuilder}>
          <h2>Sessions</h2>
          <p>Build a session from compact rotation cards.</p>
        </button>
        <button className="tile purple" onClick={() => {setPage('library'); setPickerOpen(true);}}>
          <h2>Games</h2>
          <p>Choose ATL / BTL, classic, technical, CB, volley or pressure activities.</p>
        </button>
        <button className="tile green"><h2>Players</h2><p>Player notes and history later.</p></button>
        <button className="tile red"><h2>Competition</h2><p>Competition and match-day tools later.</p></button>
      </div>
    </main>}

    {page === 'library' && <main className="container">
      <div className="topline">
        <div><h2>Games / Activity Library</h2><p>Tap an activity to add it as a compact rotation card.</p></div>
        <button className="secondary" onClick={home}>Home</button>
      </div>

      <div className="chips categoryChips">
        {categories.map(c => <button key={c} className={category === c ? 'chip active' : 'chip'} onClick={() => setCategory(c)}>{c}</button>)}
      </div>

      <section className="panel">
        {activities.filter(a => a.category === category).map((a, i) => <button key={i} className="activityRow" onClick={() => addActivity(a)}>
          <div><strong>{a.title}</strong><span>{a.task}</span></div>
          <em>{a.duration} min</em>
        </button>)}
      </section>
    </main>}

    {page === 'builder' && <main className="container">
      <div className="topline">
        <div><h2>Session Builder</h2><p>Start empty. Add from Games, then duplicate and progress every 1–2 rotations.</p></div>
        <div className="topButtons">
          <button className="primary" onClick={() => setPickerOpen(!pickerOpen)}>+ Add From Games</button>
          <button className="secondary" onClick={addCustomNote}>+ Custom Rotation</button>
        </div>
      </div>

      {pickerOpen && <section className="picker">
        <h3>Add From Games</h3>
        <div className="chips categoryChips">
          {categories.map(c => <button key={c} className={category === c ? 'chip active' : 'chip'} onClick={() => setCategory(c)}>{c}</button>)}
        </div>
        {activities.filter(a => a.category === category).map((a, i) => <button key={i} className="activityRow" onClick={() => addActivity(a)}>
          <div><strong>{a.title}</strong><span>{a.task}</span></div>
          <em>{a.duration} min</em>
        </button>)}
      </section>}

      {session.length === 0 && <section className="empty">
        <h3>No rotations yet</h3>
        <p>Add from Games to build the session with compact cards. Nothing is preloaded.</p>
      </section>}

      {session.map((item, i) => <section className="rotationCard" key={item.id}>
        <div className="cardTop">
          <div>
            <div className="rotationNum">Rotation {i+1} · {item.duration} min · {item.format}</div>
            <h3>{item.title}</h3>
            <p className="category">{item.category}</p>
          </div>
          <div className="miniButtons">
            <button onClick={() => moveItem(i,-1)}>↑</button>
            <button onClick={() => moveItem(i,1)}>↓</button>
            <button onClick={() => duplicateProgress(i)}>Duplicate + Progress</button>
            <button onClick={() => updateItem(i,'editing',!item.editing)}>{item.editing ? 'Close Edit' : 'Edit'}</button>
            <button onClick={() => removeItem(i)}>Remove</button>
          </div>
        </div>

        <div className="taskBox">
          <strong>Task</strong>
          <p>{item.task}</p>
        </div>

        <div className="layerLine">
          <strong>Layers</strong>
          <div className="chips">
            {item.layers.length === 0 && <span className="muted">No layers yet</span>}
            {item.layers.map(l => <button key={l} className="chip active" onClick={() => removeLayer(i,l)}>{l} ×</button>)}
          </div>
        </div>

        <div className="quickLayers">
          {layers.filter(l => !item.layers.includes(l)).slice(0,4).map(l => <button key={l} onClick={() => addLayer(i,l)}>+ {l}</button>)}
        </div>

        {item.editing && <div className="editPanel">
          <label>Name<input value={item.title} onChange={e => updateItem(i,'title',e.target.value)} /></label>
          <label>Duration<select value={item.duration} onChange={e => updateItem(i,'duration',e.target.value)}><option>5</option><option>6</option><option>7</option><option>8</option><option>10</option></select></label>
          <label>Format<select value={item.format} onChange={e => updateItem(i,'format',e.target.value)}><option>King of Court</option><option>Challenger Court</option><option>Winner Stays On</option><option>2v1 Pressure</option><option>Conditioned Matchplay</option><option>Feed + Live Rally</option></select></label>
          <label className="wide">Task<textarea value={item.task} onChange={e => updateItem(i,'task',e.target.value)} /></label>
          <label>Coach Focus<textarea value={item.coach} onChange={e => updateItem(i,'coach',e.target.value)} /></label>
          <label>Next Progression<textarea value={item.progression} onChange={e => updateItem(i,'progression',e.target.value)} /></label>
        </div>}
      </section>)}
    </main>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
