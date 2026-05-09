import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const demoSession = [
  {
    title:'ATL / BTL: 1 BTL Shot',
    duration:6,
    format:'King of Court',
    task:'Straight drop · player’s choice volley/non-volley',
    rationale:'Slows the rally problem down enough for players to attend to balance, vision and better information pick-up.',
    layers:['Clean Winner'],
    coachCue:[
      'Use the tape as an external visual cue.',
      'Keep the rally live.',
      'Do not stop play for technical correction unless the task breaks down.'
    ],
    playerObjective:[
      'Recognise when the lower trajectory is available.',
      'Stay balanced enough to see opponent position.',
      'Choose the shot, do not force it.'
    ],
    commonErrors:[
      'Forcing the low shot from poor balance.',
      'Watching the ball only.',
      'Losing T awareness after playing short.'
    ],
    progression:[
      'Add Opponent Off T scoring.',
      'Add consecutive BTL shots.',
      'Add must-be-volley requirement.',
      'Add 4-shot conversion window.'
    ]
  },
  {
    title:'CB Pairs',
    duration:8,
    format:'King of Court',
    task:'[6-4] + [8-1]',
    rationale:'Two-shot tactical chain: create then exploit space under live pressure.',
    layers:['Clean Winner','Opponent Off T'],
    coachCue:[
      'Do not over-coach exact swing shapes.',
      'Reward recognition of the second-ball opportunity.',
      'Keep attention on opponent positioning.'
    ],
    playerObjective:[
      'Recognise when the second space opens.',
      'Recover vision after the first shot.',
      'Stay balanced through the transition.'
    ],
    commonErrors:[
      'Predetermining the second shot.',
      'Overhitting the first ball.',
      'Ignoring opponent recovery.'
    ],
    progression:[
      'Add blind finish.',
      'Reduce to 4-shot window.',
      'Require clean winner.',
      'Move to triples.'
    ]
  }
];

function ExpandSection({title, items}){
  const [open, setOpen] = useState(false);

  return (
    <div className="expandBlock">
      <button className="expandBtn" onClick={() => setOpen(!open)}>
        {title}
      </button>

      {open && (
        <div className="expandContent">
          {items.map((item, i) => (
            <div key={i} className="bullet">
              • {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({item, index}){
  return (
    <section className="card">
      <div className="topLine">
        <div className="meta">
          Rotation {index + 1} · {item.duration} min · {item.format}
        </div>
      </div>

      <h2>{item.title}</h2>

      <div className="taskBox">
        <strong>Task</strong>
        <p>{item.task}</p>
      </div>

      <div className="rationaleBox">
        <strong>Rationale</strong>
        <p>{item.rationale}</p>
      </div>

      <div className="layerArea">
        <strong>Layers</strong>
        <div className="chips">
          {item.layers.map((layer, i) => (
            <span className="chip" key={i}>{layer}</span>
          ))}
        </div>
      </div>

      <div className="coachHelp">
        <h3>Coach Help</h3>

        <div className="helpGrid">
          <ExpandSection title="Coach" items={item.coachCue} />
          <ExpandSection title="Player" items={item.playerObjective} />
          <ExpandSection title="Error" items={item.commonErrors} />
          <ExpandSection title="Progress" items={item.progression} />
        </div>
      </div>
    </section>
  );
}

function App(){
  return (
    <div>
      <header className="hero">
        <div>
          <div className="eyebrow">CHECKERBOARD COACH</div>
          <h1>Session Builder</h1>
          <p>Phase 26 · Coach Help Layer</p>
        </div>
      </header>

      <main className="container">
        {demoSession.map((item, index) => (
          <Card item={item} index={index} key={index} />
        ))}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
