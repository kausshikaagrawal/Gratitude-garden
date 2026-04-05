import { useState } from 'react';

const TREE_EMOJIS = ['🌳', '🌲', '🌴'];
const STUMP_EMOJI = '🪵';

export default function Garden({ data }) {
  const [inputVal, setInputVal] = useState('');
  const [triggerAnim, setTriggerAnim] = useState(null);

  const isInputEmpty = !inputVal.trim();

  const handlePlant = () => {
    if (isInputEmpty) return;
    
    data.addLog('gratitude', inputVal.trim());
    setInputVal('');
    
    setTriggerAnim('plant');
    setTimeout(() => setTriggerAnim(null), 800);
  };

  const handleRelease = () => {
    if (isInputEmpty) return;

    data.addLog('anxiety', inputVal.trim());
    setInputVal('');

    setTriggerAnim('cut');
    setTimeout(() => setTriggerAnim(null), 600);
  };

  const renderTrees = () => {
    const trees = [];
    for(let i = 0; i < data.totalTrees; i++) {
       const isLast = (i === data.totalTrees - 1);
       let cls = "tree";
       if (isLast && triggerAnim === 'plant') cls += " animate-in";
       trees.push(
         <span key={i} className={cls}>{TREE_EMOJIS[i % TREE_EMOJIS.length]}</span>
       );
    }
    if (triggerAnim === 'cut') {
      trees.push(<span key={"cut"} className="stump animate-in">{STUMP_EMOJI}</span>);
    }
    return trees;
  };

  return (
    <section className="view active">
      <div className="stats-container">
        <div className="stat-card glass-panel">
          <div className="stat-icon leaf-icon">🌱</div>
          <div className="stat-info">
            <span className="stat-value">{data.totalTrees}</span>
            <span className="stat-label">Trees Alive</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon streak-icon">🔥</div>
          <div className="stat-info">
            <span className="stat-value">{data.streak}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>
      </div>

      <div className="garden-container glass-panel">
        <div className="garden-grid">
           {renderTrees()}
        </div>
      </div>

      <div className="input-section glass-panel">
        <h2 className="input-title">Log Your Thoughts</h2>
        <textarea 
          placeholder="What's on your mind? Type here to enable buttons..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
        />
        <div className="action-buttons">
          <button 
            disabled={isInputEmpty} 
            onClick={handlePlant} 
            className="btn btn-primary"
          >
            <span className="icon">✨</span> Plant Gratitude
          </button>
          <button 
            disabled={isInputEmpty} 
            onClick={handleRelease} 
            className="btn btn-danger"
          >
            <span className="icon">🌬️</span> Release Anxiety & Clear
          </button>
        </div>
      </div>
    </section>
  );
}
