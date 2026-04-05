import { useState } from 'react';

export default function Journey({ data }) {
  const dates = Object.keys(data.history).sort((a,b) => new Date(b) - new Date(a));

  return (
    <section className="view active">
      <div className="header-banner glass-panel">
         <h2>Your Journey</h2>
         <p>Tap a day to view details</p>
      </div>

      <div className="history-list">
        {dates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon text-4xl">🌱</div>
            <h3>Your journey begins here</h3>
            <p>Plant a tree to start your gratitude garden!</p>
          </div>
        ) : (
          dates.map(dateStr => (
            <DayCard key={dateStr} dateStr={dateStr} logs={data.history[dateStr]} />
          ))
        )}
      </div>
    </section>
  );
}

function DayCard({ dateStr, logs }) {
  const [expanded, setExpanded] = useState(false);
  
  const [y, m, d] = dateStr.split('-');
  const localDateObj = new Date(y, m-1, d);
  const formattedDate = localDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const planted = logs.filter(l => l.type === 'gratitude').length;
  const cut = logs.filter(l => l.type === 'anxiety').length;
  const sortedLogs = [...logs].sort((a,b) => b.timestamp - a.timestamp);

  return (
    <div className={`day-card ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(!expanded)}>
      <div className="day-header">
        <div className="day-date">{formattedDate}</div>
        <div className="day-summary">
          {planted > 0 && <span className="summary-pill gratitude">✨ +{planted}</span>}
          {cut > 0 && <span className="summary-pill anxiety">🌬️ -{cut}</span>}
          <span className="chevron">▼</span>
        </div>
      </div>

      <div className="logs-container">
        <div className="logs-content">
           {sortedLogs.map((log, i) => {
             const time = new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
             const isGrati = log.type === 'gratitude';
             return (
               <div key={i} className="log-item">
                  <div className="log-icon">{isGrati ? '✨' : '🌬️'}</div>
                  <div className="log-content">
                     <div className="log-text">{log.text}</div>
                     <span className="log-time">{time}</span>
                  </div>
               </div>
             )
           })}
        </div>
      </div>
    </div>
  );
}
