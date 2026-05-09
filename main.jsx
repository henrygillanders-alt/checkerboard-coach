import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const overlayBank = {
  clean: { title:'Clean Winner', short:'+2 clean winner bonus', scoring:'+2 if opponent cannot touch the ball with racquet despite trying.', coach:'Only count genuine unreachable winners.' },
  offt: { title:'Opponent Off T', short:'Opponent outside T-zone', scoring:'+3 bonus if winning shot is played while opponent is outside the T-zone.', coach:'Player must recognise the affordance, not force the winner.' },
  four: { title:'4-Shot Window', short:'Level 4 conversion', scoring:'After completing the challenge, player must win within 4 shots or reset.', coach:'Use when the player can still perceive and adapt.' },
  two: { title:'2-Shot Window', short:'Level 5 conversion', scoring:'After completing the challenge, player must win within 2 shots or reset.', coach:'Professional difficulty only.' },
  volley: { title:'Volley Finish', short:'Winner must be volley', scoring:'+3 bonus only if final winning shot is a volley.', coach:'Reward earned interceptions, not reckless volley hunting.' },
  blind: { title:'Blind Finish', short:'Hidden finish condition', scoring:'Bonus applies only if secret condition is completed.', coach:'Useful for disguise and tactical intention.' },
  cb: { title:'Checkerboard Target', short:'Add zone challenge', scoring:'Single +1, pair +2 or triple +3 depending on challenge size.', coach:'Target should solve the rally problem.' },
  weak: { title:'Weak Side', short:'Attack weaker side', scoring:'+2 tactical bonus if point is built by attacking identified weakness.', coach:'Check that the player is changing the opponent’s movement problem.' }
};

const sessionBlocks = ['Warm-up', 'Main Block', 'Pressure Block', 'Finish'];

const singles = ['[6-4]', '[8-1]', '[5-3]', '[7-2]', '[6-3]', '[5-4]', '[8-2]', '[7-1]'];
const pairs = ['[6-4] + [8-1]', '[5-3] + [7-2]', '[6-3] + [8-1]', '[5-4] + [7-2]', '[6-4] + [5-3]', '[7-2] + [8-1]'];
const triples = ['[6-4] + [8-1] + [5-3]', '[5-3] + [7-2] + [8-1]', '[6-3] + [8-1] + [7-2]', '[5-4] + [7-2] + [6-3]'];
const blindFinishes = ['front wall finish', 'floor finish', 'side wall finish', 'volley finish', 'clean winner', 'opponent off T', 'front-court finish', 'back-court finish'];
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function pick(list){ return list[Math.floor(Math.random() * list.length)]; }

function g(title, family, level, objective, setup, rules, scoring, coach, overlays, block='Main Block') {
  return { id:title.toLowerCase().replaceAll(' ','-'), title, family, level, objective, setup, rules, scoring, coach, overlays, block };
}

const games = [
  g('CB Singles','Checkerboard Games','Level 1','Introduce one-shot checkerboard targeting inside a live rally.','Coach calls/draws one target such as [6-4], [8-1], [5-3] or [7-2].','Normal rally. Player earns challenge credit by completing the nominated target.','Win rally +1. Complete single challenge +1.','Keep the target simple enough that the rally remains representative.',['clean','offt','cb'],'Warm-up'),
  g('CB Pairs','Checkerboard Games','Level 2–5','Train tactical two-shot combinations that create and then exploit space.','Use a pair such as [6-4] + [8-1] or [5-3] + [7-2].','Player must complete both parts in order during the rally.','Complete pair +2. Win after pair +3.','The first shot should create the affordance for the second.',['clean','offt','four','two','blind'],'Main Block'),
  g('CB Triples','Checkerboard Games','Level 3–5','Develop advanced tactical chaining and delayed conversion.','Player receives a three-part checkerboard chain.','Complete the chain in order. At higher levels, convert within the window.','Complete triple +3. Win after challenge +3.','Only use once players can complete pairs without losing rally realism.',['clean','offt','four','two','blind'],'Pressure Block'),
  g('CB Challenge + Blind Finish','Checkerboard Games','Level 3–5','Complete a visible CB pair/triple, then convert with a hidden finish condition.','Player receives a checkerboard challenge and a secret finish card.','The CB challenge opens the scoring window. The final bonus depends on the hidden finish.','Pair +2 or triple +3. Win after challenge +3. Blind finish +3. Clean winner +2.','The pattern creates pressure, but the finish stays disguised.',['blind','clean','offt','four','two'],'Finish'),
  g('Blind Pairs','Checkerboard Games','Intermediate–Professional','Train hidden intention, disguise and decision-making.','Each player secretly receives a pair challenge.','Normal rally. Each player works toward hidden pair without announcing it.','Win rally +1. Complete pair +2. Win after challenge +3.','Stop players forcing the card. The game must still reward adaptation.',['blind','clean','four','two'],'Pressure Block'),
  g('Return to T Score','T Zone Games','All levels','Build awareness of recovery to the T after every shot.','Normal rally. Mark or define the T-zone clearly.','Coach/referee observes whether the opponent recovers before next contact.','Win rally +1. Opponent fails to recover to T before next contact = +1.','Look for players recognising opponent position before choosing the next shot.',['clean','volley'],'Warm-up'),
  g('Opponent Off-T Bonus','T Zone Games','Intermediate–Professional','Reward recognising when the opponent is not recovered.','Normal rally. T-zone is marked or agreed.','Bonus only if winner is played while opponent is outside the T-zone.','Win rally +1. +3 off-T winning shot bonus.','Do not force a winner. Notice the affordance when it appears.',['clean','four','two','volley'],'Pressure Block'),
  g('Tape Height Control','ATL / BTL Games','Beginner–Elite','Train shot height variation with a clear front-wall cue.','Use tape/visual band rather than service line where useful.','Coach nominates ATL or BTL for selected shots/phases.','Point only counts if nominated shot travels above or below tape.','Tape is clearer and usually more representative than the service line for juniors.',['clean','offt','cb'],'Warm-up'),
  g('Length Before Attack','Classic Conditioned Games','Beginner–Performance','Build pressure before attacking short.','Attacking short is only allowed after achieving length.','Player must first create pressure with length before attacking.','Win rally +1. Bonus +2 for winning after legal sequence.','Length must create the attack, not become a hoop to jump through.',['clean','offt','four','two'],'Main Block'),
  g('Midcourt Intercept','Volley Games','Intermediate–Elite','Train earlier perception and interception opportunities.','Normal rally. Bonus for legal volley interceptions from midcourt/T-zone.','Player scores bonus when they volley from an appropriate central position.','Win rally +1. Volley intercept +1. Win after volley intercept +3.','Volleys should emerge from pressure and positioning.',['clean','offt','four'],'Main Block'),
  g('Winner Loses a Bounce','Double Bounce Games','Junior beginner–Intermediate','Balance rallies and create adaptive pressure.','Incoming player starts with double bounce. Winner loses one bounce after each rally they win.','Constraint changes after each rally to stop over-domination.','Normal rally scoring.','Useful for mixed standards because advantage shifts dynamically.',['clean','cb'],'Warm-up'),
  g('Tempo Pressure','Pressure / Chaos Games','Elite–Professional','Train decision-making under reduced time.','Normal rally with coach-called tempo blocks or rapid restarts.','Player must maintain tactical quality under increased tempo.','Win rally +1. Quality decision under pressure +1.','Do not turn this into mindless speed. Decision quality is the point.',['clean','four','two'],'Pressure Block'),
  g('Vs Tall Player','Tactical Opponent Games','Intermediate–Professional','Train low, quick direction changes against reach advantage.','Opponent plays as tall/reach-dominant profile.','Reward successful low pressure and quick switch of direction.','Win rally +1. Tactical success +2. Clean winner +2.','Watch whether player is changing the opponent movement problem.',['clean','offt','cb','weak'],'Main Block')
];

const families = [...new Set(games.map(g => g.family))];

function makeChallenge(mode, level) {
  let challenge = pick(singles);
  let baseScore = 'Single challenge +1';
  let overlayIds = ['clean'];

  if (mode === 'Pairs') { challenge = pick(pairs); baseScore = 'Pair challenge +2. Win after pair +3.'; overlayIds = ['clean', 'offt']; }
  if (mode === 'Triples') { challenge = pick(triples); baseScore = 'Triple challenge +3. Win after challenge +3.'; overlayIds = ['clean', 'offt']; }
  if (mode === 'Blind') { challenge = pick(pairs); baseScore = 'Hidden pair +2. Win after hidden challenge +3.'; overlayIds = ['blind', 'clean']; }
  if (mode === 'CB + Blind Finish') { challenge = pick(pairs) + ' → blind finish: ' + pick(blindFinishes); baseScore = 'Visible pair +2. Win after challenge +3. Blind finish +3. Clean winner +2.'; overlayIds = ['blind','clean','offt']; }

  if (level >= 3 && !overlayIds.includes('offt')) overlayIds.push('offt');
  if (level === 4) overlayIds.push('four');
  if (level === 5) overlayIds.push('two');
  if (mode === 'Blind') challenge = challenge + ' / secret finish: ' + pick(blindFinishes);

  return { mode, level, challenge, baseScore, overlayIds,
    coach: mode === 'CB + Blind Finish'
      ? 'The CB challenge creates the pressure picture; the finish card keeps the final intention disguised.'
      : level <= 2 ? 'Keep the challenge playable and do not let the target dominate the rally.' :
      level === 3 ? 'Challenge only matters when it connects to opponent position, especially off T.' :
      level === 4 ? 'Use the four-shot window only if the player can still perceive and adapt.' :
      'Professional difficulty: convert quickly without forcing the pattern.'
  };
}

function drawBlindCard(deckType, level) {
  const card = `${pick(ranks)}${pick(suits)}`;
  let condition = pick(pairs);
  let title = 'Blind Pair';
  let scoring = 'Complete hidden pair +2. Win after hidden challenge +3. Clean winner +2.';

  if (deckType === 'Singles') { condition = pick(singles); title = 'Blind Single'; scoring = 'Complete hidden single +1. Win rally +1. Clean winner +2.'; }
  if (deckType === 'Triples') { condition = pick(triples); title = 'Blind Triple'; scoring = 'Complete hidden triple +3. Win after hidden challenge +3. Clean winner +2.'; }
  if (deckType === 'Finish') { condition = pick(blindFinishes); title = 'Blind Finish'; scoring = 'Win rally using secret finish condition +3. Clean winner +2.'; }
  if (deckType === 'CB + Finish') { condition = `${pick(pairs)} → ${pick(blindFinishes)}`; title = 'CB + Blind Finish'; scoring = 'Complete visible CB pair +2. Win after challenge +3. Secret finish +3. Clean winner +2.'; }
  if (deckType === 'Mixed') { return drawBlindCard(pick(['Singles', 'Pairs', 'Triples', 'Finish', 'CB + Finish']), level); }

  let windowText = '';
  if (level === 4) windowText = 'Must convert within 4 shots after completing the CB condition.';
  if (level === 5) windowText = 'Must convert within 2 shots after completing the CB condition.';

  return { card, title, deckType, level, condition, scoring, windowText,
    coach: deckType === 'CB + Finish'
      ? 'Player may know the CB pair but must keep the finish hidden. Use this to train disguise after creating pressure.'
      : 'Player keeps the card secret. The task should shape intention without forcing the rally.'
  };
}

function App() {
  const [page, setPage] = useState('home');
  const [openFamilies, setOpenFamilies] = useState(['Checkerboard Games']);
  const [selected, setSelected] = useState(null);
  const [active, setActive] = useState(['clean']);
  const [session, setSession] = useState([]);
  const [rotationBlocks, setRotationBlocks] = useState([
    {
      title:'CB Pairs',
      format:'King of Court',
      duration:8,
      challenge:'[6-4] + [8-1]',
      overlays:['Clean Winner'],
      coach:'Create pressure before attacking.',
      progression:'Add Opponent Off T'
    }
  ]);
  const [currentBlock, setCurrentBlock] = useState('Main Block');
  const [sessionDuration, setSessionDuration] = useState(60);
  const [openSessionBlocks, setOpenSessionBlocks] = useState(['Warm-up','Main Block','Pressure Block','Finish']);
  const [genMode, setGenMode] = useState('Pairs');
  const [genLevel, setGenLevel] = useState(3);
  const [generated, setGenerated] = useState(makeChallenge('Pairs', 3));
  const [deckType, setDeckType] = useState('Mixed');
  const [deckLevel, setDeckLevel] = useState(3);
  const [blindCard, setBlindCard] = useState(drawBlindCard('Mixed', 3));
  const [revealed, setRevealed] = useState(false);

  const activeOverlayObjects = active.map(id => overlayBank[id]).filter(Boolean);
  const generatedOverlays = generated.overlayIds.map(id => overlayBank[id]).filter(Boolean);

  function home(){ setPage('home'); setSelected(null); window.scrollTo(0,0); }
  function library(){ setPage('library'); setSelected(null); window.scrollTo(0,0); }
  function openGame(game){ setSelected(game); setCurrentBlock(game.block || 'Main Block'); setActive(game.overlays.includes('clean') ? ['clean'] : []); setPage('game'); window.scrollTo(0,0); }
  function toggleFamily(fam){ setOpenFamilies(v => v.includes(fam) ? v.filter(x => x !== fam) : [...v, fam]); }
  function toggleOverlay(id){ if(!selected?.overlays.includes(id)) return; setActive(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]); }
  function addToSession(){ if(selected){ setSession([...session, {type:'game', block:currentBlock, game:selected, overlays:active}]); setPage('session'); window.scrollTo(0,0); } }
  function generate(){ setGenerated(makeChallenge(genMode, genLevel)); }
  function addGenerated(){ setSession([...session, {type:'challenge', block: genLevel <= 2 ? 'Warm-up' : genLevel >= 4 ? 'Pressure Block' : 'Main Block', generated}]); setPage('session'); window.scrollTo(0,0); }
  function drawCard(){ setBlindCard(drawBlindCard(deckType, deckLevel)); setRevealed(false); }
  function addBlindCard(){ setSession([...session, {type:'blind', block:'Finish', blindCard}]); setPage('session'); window.scrollTo(0,0); }
  function removeSessionItem(index){ setSession(session.filter((_, i) => i !== index)); }
  function moveSessionItem(index, dir){
    const copy = [...session];
    const newIndex = index + dir;
    if(newIndex < 0 || newIndex >= copy.length) return;
    [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
    setSession(copy);
  }
  function setItemBlock(index, block) {
    setSession(session.map((item, i) => i === index ? {...item, block} : item));
  }

  function addRotationBlock(){
    setRotationBlocks([...rotationBlocks,{
      title:'New Block',
      format:'King of Court',
      duration:8,
      challenge:'[5-3] + [7-2]',
      overlays:[],
      coach:'',
      progression:''
    }])
  }
  function updateRotationBlock(i,key,val){
    const copy=[...rotationBlocks];
    copy[i][key]=val;
    setRotationBlocks(copy);
  }
  function addRotationLayer(i){
    const layerOptions = ['Clean Winner','Opponent Off T','4-Shot Window','2-Shot Window','Blind Finish','Volley Finish'];
    const copy=[...rotationBlocks];
    const next = layerOptions.find(o=>!copy[i].overlays.includes(o));
    if(next) copy[i].overlays.push(next);
    setRotationBlocks(copy);
  }
  function duplicateRotationBlock(i){
    const source = rotationBlocks[i];
    const copy=[...rotationBlocks];
    const evolved={...source, title:source.title+' Progression', overlays:[...source.overlays]};
    const layerOptions = ['Clean Winner','Opponent Off T','4-Shot Window','2-Shot Window','Blind Finish','Volley Finish'];
    const next = layerOptions.find(o=>!evolved.overlays.includes(o));
    if(next) evolved.overlays.push(next);
    evolved.progression='Next layer added automatically';
    copy.splice(i+1,0,evolved);
    setRotationBlocks(copy);
  }
  function moveRotationBlock(i,dir){
    const copy=[...rotationBlocks];
    const ni=i+dir;
    if(ni<0 || ni>=copy.length) return;
    [copy[i],copy[ni]]=[copy[ni],copy[i]];
    setRotationBlocks(copy);
  }
  function removeRotationBlock(i){
    setRotationBlocks(rotationBlocks.filter((_,idx)=>idx!==i));
  }

  function toggleSessionBlock(block) {
    setOpenSessionBlocks(v => v.includes(block) ? v.filter(x => x !== block) : [...v, block]);
  }
  function blockMinutes(block) {
    const plans = {
      60: {'Warm-up':'8–10 min', 'Main Block':'20–25 min', 'Pressure Block':'15–20 min', 'Finish':'5–10 min'},
      80: {'Warm-up':'10–12 min', 'Main Block':'30–35 min', 'Pressure Block':'20–25 min', 'Finish':'10–12 min'}
    };
    return plans[sessionDuration][block];
  }

  return <div>
    <header className="hero">
      <button className="home" onClick={home}>HOME</button>
      <div><div className="eyebrow">SQUASH TACTICAL TRAINING</div><h1>Checkerboard Coach</h1><p>PHASE 10C · FULL APP + MODULAR BUILDER</p></div>
    </header>

    {page === 'home' && <main className="container">
      <h2>Courtside Coaching Tool</h2>
      <p className="lead">Game library, live coach cards, random challenges, blind deck and expandable 60/80 minute session flow.</p>
      <div className="grid two">
        <button className="card blue" onClick={library}><h3>Game Library</h3><p>{families.length} families · {games.length} games</p></button>
        <button className="card green" onClick={() => setPage('generator')}><h3>Challenge Generator</h3><p>Singles, pairs, triples and CB + blind finish</p></button>
        <button className="card red" onClick={() => setPage('blindDeck')}><h3>Blind Deck</h3><p>Secret cards for players</p></button>
        <button className="card purple" onClick={() => setPage('session')}><h3>Session Flow</h3><p>{session.length} saved items</p></button>
        <button className="card red" onClick={() => setPage('rotationBuilder')}><h3>Modular Rotation Builder</h3><p>King of Court blocks and progressive layers</p></button>
        <button className="card amber" onClick={() => setPage('scoring')}><h3>Scoring Protocol</h3><p>Default Checkerboard rules</p></button>
      </div>
    </main>}

    {page === 'blindDeck' && <main className="container">
      <div className="topline"><div><h2>Blind Challenge Deck</h2><p className="lead">Draw a secret card. CB + Finish combines visible tactical pattern with hidden finish condition.</p></div><button className="secondary" onClick={home}>Home</button></div>
      <section className="panel"><h3>Deck Type</h3><div className="chips">{['Mixed','Singles','Pairs','Triples','Finish','CB + Finish'].map(t => <button key={t} className={deckType===t?'chip active':'chip'} onClick={() => { setDeckType(t); setBlindCard(drawBlindCard(t, deckLevel)); setRevealed(false); }}>{t}</button>)}</div><h3>Level</h3><div className="chips">{[1,2,3,4,5].map(l => <button key={l} className={deckLevel===l?'chip active':'chip'} onClick={() => { setDeckLevel(l); setBlindCard(drawBlindCard(deckType, l)); setRevealed(false); }}>Level {l}</button>)}</div></section>
      <section className="panel blindCard"><div className="playingCard"><div className="cardRank">{blindCard.card}</div><div className="cardTitle">{blindCard.title}</div><div className="cardCondition">{revealed ? blindCard.condition : 'Hidden Condition'}</div><div className="cardLevel">Level {blindCard.level}</div></div>{revealed && <div className="blindDetails"><p><strong>Scoring:</strong> {blindCard.scoring}</p>{blindCard.windowText && <p><strong>Window:</strong> {blindCard.windowText}</p>}<p><strong>Coach:</strong> {blindCard.coach}</p></div>}</section>
      <div className="buttons"><button className="primary" onClick={drawCard}>Draw New Card</button><button className="secondary" onClick={() => setRevealed(!revealed)}>{revealed ? 'Hide Card' : 'Reveal Card'}</button><button className="secondary" onClick={addBlindCard}>Add to Session</button></div>
    </main>}

    {page === 'generator' && <main className="container">
      <div className="topline"><div><h2>Random Challenge Generator</h2><p className="lead">Generate tactical challenges that scale by level.</p></div><button className="secondary" onClick={home}>Home</button></div>
      <section className="panel"><h3>Mode</h3><div className="chips">{['Singles','Pairs','Triples','Blind','CB + Blind Finish'].map(m => <button key={m} className={genMode === m ? 'chip active' : 'chip'} onClick={() => { setGenMode(m); setGenerated(makeChallenge(m, genLevel)); }}>{m}</button>)}</div><h3>Level</h3><div className="chips">{[1,2,3,4,5].map(l => <button key={l} className={genLevel === l ? 'chip active' : 'chip'} onClick={() => { setGenLevel(l); setGenerated(makeChallenge(genMode, l)); }}>Level {l}</button>)}</div></section>
      <section className="panel challengeCard"><div className="challengeTop"><span>{generated.mode}</span><em>Level {generated.level}</em></div><div className="challengeText">{generated.challenge}</div><p><strong>Base scoring:</strong> {generated.baseScore}</p><p><strong>Coach focus:</strong> {generated.coach}</p><h4>Overlays attached</h4>{generatedOverlays.map(o => <p key={o.title}><strong>{o.title}:</strong> {o.scoring}</p>)}</section>
      <div className="buttons"><button className="primary" onClick={generate}>Generate New Challenge</button><button className="secondary" onClick={addGenerated}>Add to Session</button></div>
    </main>}

    {page === 'library' && <main className="container">
      <div className="topline"><div><h2>Game Library</h2><p className="lead">Tap a family, then tap a game card.</p></div><button className="secondary" onClick={home}>Return Home</button></div>
      {families.map(fam => <section key={fam} className="family"><button className="familyHeader" onClick={() => toggleFamily(fam)}><div><strong>{openFamilies.includes(fam) ? '▼' : '▶'} {fam}</strong><span>{games.filter(g => g.family === fam).length} games</span></div></button>{openFamilies.includes(fam) && <div className="gameList">{games.filter(g => g.family === fam).map(game => <button key={game.id} className="gameRow" onClick={() => openGame(game)}><div><strong>{game.title}</strong><span>{game.objective}</span></div><em>{game.level}</em></button>)}</div>}</section>)}
    </main>}

    {page === 'game' && selected && <main className="container">
      <div className="topline"><div><h2>{selected.title}</h2><p className="lead">{selected.family} · {selected.level}</p></div><div className="buttons"><button className="secondary" onClick={library}>Back to Library</button><button className="secondary" onClick={home}>Home</button></div></div>
      <section className="panel gameCard"><h3>Objective</h3><p>{selected.objective}</p><h3>Set-up</h3><p>{selected.setup}</p><h3>Rules</h3><p>{selected.rules}</p><h3>Base Scoring</h3><p>{selected.scoring}</p><h3>Coach Observation</h3><p>{selected.coach}</p></section>
      <section className="panel"><h3>Overlay Builder</h3><p className="lead">Select overlays, then choose where this sits in the session.</p><div className="overlayGrid">{Object.entries(overlayBank).map(([id, o]) => { const allowed = selected.overlays.includes(id); const isActive = active.includes(id); return <button key={id} disabled={!allowed} className={isActive ? 'overlay active' : allowed ? 'overlay' : 'overlay disabled'} onClick={() => toggleOverlay(id)}><strong>{o.title}</strong><span>{o.short}</span></button> })}</div></section>
      <section className="panel coachCard"><div className="cardHead"><h3>Live Coach Card</h3><button className="primary" onClick={addToSession}>Add to Session</button></div>
        <p><strong>Game:</strong> {selected.title}</p><p><strong>Base task:</strong> {selected.objective}</p><p><strong>Base scoring:</strong> {selected.scoring}</p>
        <h4>Session block</h4><div className="chips">{sessionBlocks.map(b => <button key={b} className={currentBlock === b ? 'chip active' : 'chip'} onClick={() => setCurrentBlock(b)}>{b}</button>)}</div>
        {activeOverlayObjects.length > 0 && <><h4>Active overlay scoring</h4>{activeOverlayObjects.map(o => <p key={o.title}><strong>{o.title}:</strong> {o.scoring}</p>)}<h4>Coach reminders</h4>{activeOverlayObjects.map(o => <p key={o.title + 'c'}>• {o.coach}</p>)}</>}
      </section>
    </main>}

    {page === 'session' && <main className="container">
      <div className="topline"><div><h2>Session Flow</h2><p className="lead">Organise saved games into expandable Warm-up, Main Block, Pressure Block and Finish sections.</p></div><button className="secondary" onClick={home}>Home</button></div>
      <section className="panel sessionOverview">
        <div className="cardHead">
          <div>
            <h3>{sessionDuration}-Minute Template</h3>
            <p className="lead">60 minutes is the default. Use 80 minutes for longer court bookings.</p>
          </div>
          <div className="chips compact">
            <button className={sessionDuration === 60 ? 'chip active' : 'chip'} onClick={() => setSessionDuration(60)}>60 min</button>
            <button className={sessionDuration === 80 ? 'chip active' : 'chip'} onClick={() => setSessionDuration(80)}>80 min</button>
          </div>
        </div>
        <p><strong>Warm-up:</strong> {blockMinutes('Warm-up')} · <strong>Main:</strong> {blockMinutes('Main Block')} · <strong>Pressure:</strong> {blockMinutes('Pressure Block')} · <strong>Finish:</strong> {blockMinutes('Finish')}</p>
      </section>
      {session.length === 0 ? <section className="panel"><p>No games saved yet.</p><p>Open a game, generate a challenge or draw a blind card, then tap Add to Session.</p></section> :
        sessionBlocks.map(block => {
          const blockItems = session.filter(item => item.block === block);
          const isOpen = openSessionBlocks.includes(block);
          return <section className="panel sessionBlock" key={block}>
            <button className="sessionBlockHeader" onClick={() => toggleSessionBlock(block)}>
              <div><strong>{isOpen ? '▼' : '▶'} {block}</strong><span>{blockMinutes(block)} · {blockItems.length} item{blockItems.length === 1 ? '' : 's'}</span></div>
            </button>
            {isOpen && <>
              {blockItems.length === 0 && <p className="muted">No items yet.</p>}
              {session.map((item, i) => item.block === block ? <SessionItem key={i} item={item} i={i} move={moveSessionItem} remove={removeSessionItem} setBlock={setItemBlock} /> : null)}
            </>}
          </section>
        })
      }
      {session.length > 0 && <button className="primary" onClick={() => setSession([])}>Clear Session</button>}
    </main>}

    {page === 'rotationBuilder' && <main className="container">
      <div className="topline">
        <div><h2>Modular Rotation Builder</h2><p className="lead">Build King of Court / challenger blocks, usually 5–8 minute rotations, and add a layer every 1–2 rotations.</p></div>
        <button className="secondary" onClick={home}>Home</button>
      </div>

      <section className="panel sessionOverview">
        <div className="cardHead">
          <div>
            <h3>Rotation-Based Session</h3>
            <p className="lead">Designed for your flexible court workflow rather than a rigid lesson plan.</p>
          </div>
          <div className="totalCard inline">
            <strong>Total</strong>
            <span>{rotationBlocks.reduce((a,b)=>a+Number(b.duration||0),0)} mins</span>
          </div>
        </div>
        <button className="primary" onClick={addRotationBlock}>Add Block</button>
      </section>

      {rotationBlocks.map((b,i)=>
        <section className="panel rotationBlock" key={i}>
          <div className="blockHeader">
            <strong>BLOCK {i+1}</strong>
            <div className="miniButtons">
              <button onClick={()=>moveRotationBlock(i,-1)}>↑</button>
              <button onClick={()=>moveRotationBlock(i,1)}>↓</button>
              <button onClick={()=>duplicateRotationBlock(i)}>Duplicate + Progress</button>
              <button onClick={()=>removeRotationBlock(i)}>Remove</button>
            </div>
          </div>

          <div className="builderGrid">
            <label>Block Name<input value={b.title} onChange={e=>updateRotationBlock(i,'title',e.target.value)} /></label>
            <label>Format<select value={b.format} onChange={e=>updateRotationBlock(i,'format',e.target.value)}>
              <option>King of Court</option><option>Challenger Court</option><option>Winner Stays On</option><option>2v1 Pressure</option><option>Conditioned Matchplay</option>
            </select></label>
            <label>Rotation Duration<select value={b.duration} onChange={e=>updateRotationBlock(i,'duration',e.target.value)}>
              <option>5</option><option>6</option><option>7</option><option>8</option><option>10</option>
            </select></label>
            <label>Challenge<input value={b.challenge} onChange={e=>updateRotationBlock(i,'challenge',e.target.value)} /></label>
          </div>

          <div className="overlayTop">
            <h3>Layers / Overlays</h3>
            <button className="secondary" onClick={()=>addRotationLayer(i)}>Add Next Layer</button>
          </div>
          <div className="chips">{b.overlays.map((o,idx)=><span className="chip active" key={idx}>{o}</span>)}</div>

          <div className="builderGrid">
            <label>Coach Focus<textarea value={b.coach} onChange={e=>updateRotationBlock(i,'coach',e.target.value)} /></label>
            <label>Next Progression<textarea value={b.progression} onChange={e=>updateRotationBlock(i,'progression',e.target.value)} /></label>
          </div>
        </section>
      )}
    </main>}

    {page === 'scoring' && <main className="container"><div className="topline"><h2>Default Scoring Protocol</h2><button className="secondary" onClick={home}>Home</button></div><section className="panel"><p><strong>Win rally:</strong> +1</p><p><strong>Single challenge:</strong> +1</p><p><strong>Pair challenge:</strong> +2</p><p><strong>Triple challenge:</strong> +3</p><p><strong>Win after challenge:</strong> +3 bonus</p><p><strong>Blind finish after CB challenge:</strong> +3 bonus</p><p><strong>Clean winner:</strong> +2 bonus sits on top of all scoring</p><p><strong>Level 4:</strong> convert within 4 shots. <strong>Level 5:</strong> convert within 2 shots.</p></section></main>}
  </div>
}

function SessionItem({ item, i, move, remove, setBlock }) {
  let title = '', subtitle = '', detail = '';
  if(item.type === 'blind') { title = `Blind Card ${item.blindCard.card}`; subtitle = `${item.blindCard.title}: ${item.blindCard.condition}`; detail = `Level ${item.blindCard.level}`; }
  else if(item.type === 'challenge') { title = `Generated ${item.generated.mode}`; subtitle = item.generated.challenge; detail = `Level ${item.generated.level} · ${item.generated.overlayIds.map(id => overlayBank[id]?.title).filter(Boolean).join(' + ')}`; }
  else { title = item.game.title; subtitle = item.game.family; detail = item.overlays.map(id => overlayBank[id]?.title).filter(Boolean).join(' + ') || 'No overlay'; }

  return <div className="sessionItem">
    <strong>{i+1}. {title}</strong><span>{subtitle}</span><em>{detail}</em>
    <div className="miniButtons">
      <button onClick={() => move(i, -1)}>↑</button>
      <button onClick={() => move(i, 1)}>↓</button>
      {sessionBlocks.map(b => <button key={b} onClick={() => setBlock(i, b)}>{b}</button>)}
      <button onClick={() => remove(i)}>Remove</button>
    </div>
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
