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
  {category:'ATL / BTL', title:'ATL / BTL Tape Height Control', duration:6, format:'King of Court', hasAtlOptions:true, task:'Use tape cue to shape above-tape and below-tape shot choices.', rationale:'Creates a clear visual affordance for trajectory selection while keeping decisions embedded in live play.', layers:['Clean Winner'], coach:'Use tape as a clear visual cue. Reward recognition of trajectory.',
    variations:[
      {name:'1 Shot Below', duration:6, task:'Each rally must include one shot below the tape cue.', rationale:'Introduces trajectory control without overloading the player. One below-tape shot creates a simple perception-action target inside live play.', layers:['Clean Winner']},
      {name:'2 Shots Below', duration:8, task:'Each player must produce two below-tape shots before bonus scoring opens.', rationale:'Increases stability of lower trajectory control while retaining rally realism and tactical decision-making.', layers:['Clean Winner']},
      {name:'Right Side Only', duration:6, format:'Challenger Court', task:'Below-tape scoring only applies on the right side of the court.', rationale:'Narrows the task constraint to one side so the player can explore better affordances for low trajectory under pressure.', layers:['Opponent Off T']},
      {name:'Below Must Be Volley', duration:8, task:'Below-tape bonus only counts if the below-tape shot is played as a volley.', rationale:'Links trajectory control with earlier interception and central positioning.', layers:['Volley Finish','Clean Winner']},
      {name:'Below-Tape Winner', duration:8, task:'Bonus only if the winning shot travels below the tape cue.', rationale:'Connects lower trajectory to tactical conversion rather than just technical execution.', layers:['Clean Winner','Opponent Off T']}
    ]
  },
  {category:'ATL / BTL', title:'Height Change Recognition', duration:8, format:'King of Court', task:'Change height when opponent is late or off balance.', rationale:'Develops perception of opponent recovery state and matching ball height to the opportunity.', layers:['Opponent Off T'], coach:'Player reads opponent position before choosing height.'},
  {category:'ATL / BTL', title:'Pace Variation Rotation', duration:8, format:'Challenger Court', task:'Soft dying / working / fast penetrating pace.', rationale:'Players learn that similar preparation can produce different ball speeds and shapes according to the rally problem.', layers:['Clean Winner'], coach:'Same prep, different ball outcome.'},

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


const atlOptions = {
  btlCount: ['0 BTL shots', '1 BTL shot', '2 BTL shots', '3 BTL shots'],
  side: ['Both sides', 'Right side only', 'Left side only'],
  consecutive: ['No', 'Yes'],
  shotChoice: ['Any shot', 'Straight drop', 'Crosscourt drop', 'Boast', 'Drive', 'Kill'],
  volleyMethod: ['Players choice', 'Must be volley', 'No volley'],
  cbReference: ['None', '[8-1]', '[7-2]', '[6-4]', '[5-3]', '[5-4]', '[6-3]']
};

function buildAtlFromOptions(item) {
  const options = item.atlOptions || {
    btlCount: '1 BTL shot',
    side: 'Both sides',
    consecutive: 'No',
    shot1: 'Any shot',
    shot2: 'Any shot',
    shot3: 'Any shot',
    cbReference: 'None'
  };

  const countNum = options.btlCount.startsWith('0') ? 0 : options.btlCount.startsWith('1') ? 1 : options.btlCount.startsWith('2') ? 2 : 3;
  const shots = [options.shot1, options.shot2, options.shot3].slice(0, countNum);
  const volleys = [options.volley1, options.volley2, options.volley3].slice(0, countNum);
  const shotText = countNum === 0
    ? 'No compulsory BTL shot; use ATL / BTL cue to manage tempo, balance and visual control.'
    : shots.map((s, idx) => {
        const method = volleys[idx] && volleys[idx] !== 'Players choice' ? ` (${volleys[idx].toLowerCase()})` : ' (player’s choice volley/non-volley)';
        return `BTL shot ${idx + 1}: ${s.toLowerCase()}${method}`;
      }).join('; ');

  const sideText = options.side === 'Both sides'
    ? 'Applies on both sides.'
    : `Applies on ${options.side.replace(' only','').toLowerCase()}.`;

  const consecutiveText = countNum <= 1 ? '' : (options.consecutive === 'Yes' ? 'BTL shots must be consecutive.' : 'BTL shots do not need to be consecutive.');

  const cbText = options.cbReference === 'None'
    ? ''
    : ` Checkerboard reference: ${options.cbReference}.`;

  const task = `${options.btlCount}: ${shotText}. ${consecutiveText} ${sideText}${cbText}`;

  const rationaleParts = [];
  rationaleParts.push('slows the rally problem down enough for players to attend to balance, vision and better information pick-up');
  rationaleParts.push(countNum === 0
    ? 'uses the ATL / BTL cue as a tempo and visual-control reference without forcing a specific low shot'
    : countNum === 1
      ? 'uses one BTL event to create a simple low-trajectory decision inside live play'
      : countNum === 2
        ? 'requires the player to repeat or connect low-trajectory decisions under rally pressure'
        : 'creates a more complex sequence where the player must manage several low-trajectory decisions without losing tactical awareness');

  if (options.consecutive === 'Yes') rationaleParts.push('the consecutive requirement increases pressure and tests whether the player can sustain the constraint across linked shots');
  if (options.side.includes('Right')) rationaleParts.push('right-side restriction narrows the information source and encourages side-specific solutions');
  if (options.side.includes('Left')) rationaleParts.push('left-side restriction narrows the information source and encourages side-specific solutions');
  if (volleys.includes('Must be volley')) rationaleParts.push('volley requirement connects the selected shot outcome with early interception');
  if (volleys.includes('No volley')) rationaleParts.push('no-volley requirement encourages players to create the shot after the bounce rather than relying on early interception');
  if (shots.includes('Boast')) rationaleParts.push('boast requirement links BTL control to angle creation and front-court disruption');
  if (shots.includes('Straight drop')) rationaleParts.push('straight drop requirement connects BTL control to front-court pressure');
  if (shots.includes('Crosscourt drop')) rationaleParts.push('crosscourt drop requirement asks the player to change the opponent’s movement problem after drawing them across the court');
  if (options.cbReference !== 'None') rationaleParts.push(`the ${options.cbReference} checkerboard reference gives the sequence a clear spatial target`);

  const generatedLayers = [];
  if (volleys.includes('Must be volley')) generatedLayers.push('Volley Finish');
  if (shots.includes('Boast') || shots.includes('Crosscourt drop')) generatedLayers.push('Blind Finish');
  if (countNum >= 2) generatedLayers.push('Opponent Off T');
  if (options.cbReference !== 'None') generatedLayers.push('Clean Winner');

  return {
    task,
    rationale: `This ATL / BTL sequence ${rationaleParts.join(', ')}.`,
    layers: generatedLayers.filter((v, i, a) => a.indexOf(v) === i)
  };
}
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
    rationale: a.rationale || 'This activity creates a representative problem for the player to solve under live rally information.',
    progression: 'Duplicate and add/change one layer after 1–2 rotations.',
    variations: a.variations || [],
    selectedVariation: a.variations?.[0]?.name || '',
    hasAtlOptions: a.hasAtlOptions || false,
    atlOptions: a.hasAtlOptions ? { btlCount:'0 BTL shots', side:'Both sides', consecutive:'No', shot1:'Any shot', shot2:'Any shot', shot3:'Any shot', volley1:'Players choice', volley2:'Players choice', volley3:'Players choice', cbReference:'None' } : null,
    editing: false
  };
}


function buildCoachHelp(item){
  if(item.category === 'ATL / BTL'){
    return {
      coach:'Use the tape as an external visual cue. Keep the rally live and coach balance, vision and shot choice.',
      player:'Recognise when the lower trajectory is available while staying balanced enough to see the opponent.',
      error:'Do not force the BTL shot from poor balance or lose opponent information.',
      progress:'Progress by adding Opponent Off T, more BTL shots, volley method, or a conversion window.'
    };
  }

  if(item.category === 'Checkerboard'){
    return {
      coach:'Use the checkerboard target as tactical intention, not a hoop. Reward recognition of space opening.',
      player:'Use the first shot to create a problem and look for the next space before committing.',
      error:'Avoid predetermining the whole sequence or ignoring opponent recovery.',
      progress:'Progress to Off T, Blind Finish, triples, or 4-shot / 2-shot conversion windows.'
    };
  }

  if(item.category === 'Classic Conditioned'){
    return {
      coach:'Keep the condition clear and binary. Reward good decisions, not just rule compliance.',
      player:'Understand what tactical problem the condition is creating and wait for the opportunity.',
      error:'Avoid forcing the condition too early or playing the rule instead of the rally.',
      progress:'Add Clean Winner, Off T, side-specific layer, or shorter conversion window.'
    };
  }

  return {
    coach:'Keep the task representative. Use short cues and let the rally provide feedback.',
    player:'Attend to opponent position, ball affordances and the task objective.',
    error:'Avoid forcing the target, losing balance, or ignoring the opponent’s movement problem.',
    progress:'Add a layer, increase pressure, reduce time, or add a finish condition.'
  };
}

function CoachHelpPanel({item}){
  const help = buildCoachHelp(item);

  return <div className="coachHelpPanel">
    <h4>Coach Help</h4>
    <div className="coachHelpGrid">
      <div><strong>Coach</strong><p>{help.coach}</p></div>
      <div><strong>Player</strong><p>{help.player}</p></div>
      <div><strong>Error</strong><p>{help.error}</p></div>
      <div><strong>Progress</strong><p>{help.progress}</p></div>
    </div>
  </div>
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
      rationale:'',
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

  function applyVariation(i, variationName){
    const copy = [...session];
    const item = copy[i];
    const variation = item.variations.find(v => v.name === variationName);
    if(!variation) return;
    item.selectedVariation = variation.name;
    item.duration = variation.duration || item.duration;
    item.format = variation.format || item.format;
    item.task = variation.task || item.task;
    item.rationale = variation.rationale || item.rationale;
    item.layers = [...(variation.layers || item.layers || [])];
    setSession(copy);
  }

  function updateAtlOption(i, key, value){
    const copy = [...session];
    const item = copy[i];
    item.atlOptions = {...item.atlOptions, [key]: value};
    const built = buildAtlFromOptions(item);
    item.task = built.task;
    item.rationale = built.rationale;
    item.layers = built.layers;
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
        <p>Phase 28 · Stable navigation + coach help</p>
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
          <div><strong>{a.title}</strong><span>{a.task}{a.variations ? ` · ${a.variations.length} variations` : ''}</span></div>
          <em>{a.duration} min</em>
        </button>)}
      </section>
    </main>}

    {page === 'builder' && <main className="container">
      <div className="topline">
        <div><h2>Session Builder</h2><p>Start empty. Add from Games, then duplicate and progress every 1–2 rotations.</p></div>
        <div className="topButtons">
          <button className="primary" onClick={() => setPickerOpen(!pickerOpen)}>+ Add From Games</button>
          
        </div>
      </div>

      {pickerOpen && <section className="picker">
        <h3>Add From Games</h3>
        <div className="chips categoryChips">
          {categories.map(c => <button key={c} className={category === c ? 'chip active' : 'chip'} onClick={() => setCategory(c)}>{c}</button>)}
        </div>
        {activities.filter(a => a.category === category).map((a, i) => <button key={i} className="activityRow" onClick={() => addActivity(a)}>
          <div><strong>{a.title}</strong><span>{a.task}{a.variations ? ` · ${a.variations.length} variations` : ''}</span></div>
          <em>{a.duration} min</em>
        </button>)}
      </section>}

      {session.length === 0 && <section className="empty">
        <h3>No rotations yet</h3>
        <p>Add from Games to build the session with compact cards. Nothing is preloaded and there are no dead custom forms.</p>
      </section>}

      {session.map((item, i) => <section className="rotationCard" key={item.id}>
        <div className="cardTop">
          <div>
            <div className="rotationNum">Rotation {i+1} · {item.duration} min · {item.format}</div>
            <h3>{item.title}</h3>
            <p className="category">{item.category}</p>
            
            {item.hasAtlOptions && <div className="atlOptions sequenceOptions">
              <div><span>BTL Count</span><select value={item.atlOptions.btlCount} onChange={e => updateAtlOption(i,'btlCount',e.target.value)}>{atlOptions.btlCount.map(o => <option key={o}>{o}</option>)}</select></div>
              <div><span>Side</span><select value={item.atlOptions.side} onChange={e => updateAtlOption(i,'side',e.target.value)}>{atlOptions.side.map(o => <option key={o}>{o}</option>)}</select></div>
              <div><span>Consecutive</span><select value={item.atlOptions.consecutive} onChange={e => updateAtlOption(i,'consecutive',e.target.value)}>{atlOptions.consecutive.map(o => <option key={o}>{o}</option>)}</select></div>
              <div><span>CB Ref</span><select value={item.atlOptions.cbReference} onChange={e => updateAtlOption(i,'cbReference',e.target.value)}>{atlOptions.cbReference.map(o => <option key={o}>{o}</option>)}</select></div>
              {item.atlOptions.btlCount !== '0 BTL shots' && <div><span>BTL Shot 1</span><select value={item.atlOptions.shot1} onChange={e => updateAtlOption(i,'shot1',e.target.value)}>{atlOptions.shotChoice.map(o => <option key={o}>{o}</option>)}</select></div>}
              {item.atlOptions.btlCount !== '0 BTL shots' && <div><span>Shot 1 Method</span><select value={item.atlOptions.volley1} onChange={e => updateAtlOption(i,'volley1',e.target.value)}>{atlOptions.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></div>}
              {(item.atlOptions.btlCount === '2 BTL shots' || item.atlOptions.btlCount === '3 BTL shots') && <div><span>BTL Shot 2</span><select value={item.atlOptions.shot2} onChange={e => updateAtlOption(i,'shot2',e.target.value)}>{atlOptions.shotChoice.map(o => <option key={o}>{o}</option>)}</select></div>}
              {(item.atlOptions.btlCount === '2 BTL shots' || item.atlOptions.btlCount === '3 BTL shots') && <div><span>Shot 2 Method</span><select value={item.atlOptions.volley2} onChange={e => updateAtlOption(i,'volley2',e.target.value)}>{atlOptions.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></div>}
              {item.atlOptions.btlCount === '3 BTL shots' && <div><span>BTL Shot 3</span><select value={item.atlOptions.shot3} onChange={e => updateAtlOption(i,'shot3',e.target.value)}>{atlOptions.shotChoice.map(o => <option key={o}>{o}</option>)}</select></div>}
              {item.atlOptions.btlCount === '3 BTL shots' && <div><span>Shot 3 Method</span><select value={item.atlOptions.volley3} onChange={e => updateAtlOption(i,'volley3',e.target.value)}>{atlOptions.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></div>}
            </div>}
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

        <div className="rationaleBox">
          <strong>Rationale</strong>
          <p>{item.rationale}</p>
        </div>

        <CoachHelpPanel item={item} />

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
          
          {item.hasAtlOptions && <div className="wide atlOptions editAtl">
            <label>BTL Count<select value={item.atlOptions.btlCount} onChange={e => updateAtlOption(i,'btlCount',e.target.value)}>{atlOptions.btlCount.map(o => <option key={o}>{o}</option>)}</select></label>
            <label>Side<select value={item.atlOptions.side} onChange={e => updateAtlOption(i,'side',e.target.value)}>{atlOptions.side.map(o => <option key={o}>{o}</option>)}</select></label>
            <label>Consecutive<select value={item.atlOptions.consecutive} onChange={e => updateAtlOption(i,'consecutive',e.target.value)}>{atlOptions.consecutive.map(o => <option key={o}>{o}</option>)}</select></label>
            <label>CB Reference<select value={item.atlOptions.cbReference} onChange={e => updateAtlOption(i,'cbReference',e.target.value)}>{atlOptions.cbReference.map(o => <option key={o}>{o}</option>)}</select></label>
            {item.atlOptions.btlCount !== '0 BTL shots' && <label>BTL Shot 1<select value={item.atlOptions.shot1} onChange={e => updateAtlOption(i,'shot1',e.target.value)}>{atlOptions.shotChoice.map(o => <option key={o}>{o}</option>)}</select></label>}
            {item.atlOptions.btlCount !== '0 BTL shots' && <label>Shot 1 Method<select value={item.atlOptions.volley1} onChange={e => updateAtlOption(i,'volley1',e.target.value)}>{atlOptions.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></label>}
            {(item.atlOptions.btlCount === '2 BTL shots' || item.atlOptions.btlCount === '3 BTL shots') && <label>BTL Shot 2<select value={item.atlOptions.shot2} onChange={e => updateAtlOption(i,'shot2',e.target.value)}>{atlOptions.shotChoice.map(o => <option key={o}>{o}</option>)}</select></label>}
            {(item.atlOptions.btlCount === '2 BTL shots' || item.atlOptions.btlCount === '3 BTL shots') && <label>Shot 2 Method<select value={item.atlOptions.volley2} onChange={e => updateAtlOption(i,'volley2',e.target.value)}>{atlOptions.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></label>}
            {item.atlOptions.btlCount === '3 BTL shots' && <label>BTL Shot 3<select value={item.atlOptions.shot3} onChange={e => updateAtlOption(i,'shot3',e.target.value)}>{atlOptions.shotChoice.map(o => <option key={o}>{o}</option>)}</select></label>}
            {item.atlOptions.btlCount === '3 BTL shots' && <label>Shot 3 Method<select value={item.atlOptions.volley3} onChange={e => updateAtlOption(i,'volley3',e.target.value)}>{atlOptions.volleyMethod.map(o => <option key={o}>{o}</option>)}</select></label>}
          </div>}
          <label>Name<input value={item.title} onChange={e => updateItem(i,'title',e.target.value)} /></label>
          <label>Duration<select value={item.duration} onChange={e => updateItem(i,'duration',e.target.value)}><option>5</option><option>6</option><option>7</option><option>8</option><option>10</option></select></label>
          <label>Format<select value={item.format} onChange={e => updateItem(i,'format',e.target.value)}><option>King of Court</option><option>Challenger Court</option><option>Winner Stays On</option><option>2v1 Pressure</option><option>Conditioned Matchplay</option><option>Feed + Live Rally</option></select></label>
          <label className="wide">Task<textarea value={item.task} onChange={e => updateItem(i,'task',e.target.value)} /></label>
          <label className="wide">Rationale<textarea value={item.rationale} onChange={e => updateItem(i,'rationale',e.target.value)} /></label>
          <label>Coach Focus<textarea value={item.coach} onChange={e => updateItem(i,'coach',e.target.value)} /></label>
          <label>Next Progression<textarea value={item.progression} onChange={e => updateItem(i,'progression',e.target.value)} /></label>
        </div>}
      </section>)}
    </main>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
