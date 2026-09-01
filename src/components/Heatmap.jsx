import { useMemo, useState } from 'react';

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function Heatmap({ history }) {
  const [tooltip, setTooltip] = useState(null);

  const { weeks, months } = useMemo(() => {
    const weeks = [];
    const months = [];
    const today = new Date();
    const totalDays = 140; // 20 weeks

    let lastMonth = -1;

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const dayOfWeek = d.getDay();
      const logs = history[dateStr] || [];
      const gratitudeCount = logs.filter(l => l.type === 'gratitude').length;
      const anxietyCount = logs.filter(l => l.type === 'anxiety').length;
      const totalCount = logs.length;

      const weekIndex = Math.floor((totalDays - 1 - i) / 7);
      if (!weeks[weekIndex]) weeks[weekIndex] = [];

      // Track month labels
      const month = d.getMonth();
      if (month !== lastMonth) {
        months.push({ weekIndex, label: d.toLocaleString('default', { month: 'short' }) });
        lastMonth = month;
      }

      weeks[weekIndex].push({
        date: dateStr,
        dayOfWeek,
        totalCount,
        gratitudeCount,
        anxietyCount,
        level: totalCount === 0 ? 0 : totalCount <= 1 ? 1 : totalCount <= 3 ? 2 : totalCount <= 5 ? 3 : 4,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }

    return { weeks, months };
  }, [history]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="heatmap-wrapper">
      <h3 className="heatmap-title">Contribution Activity</h3>
      <div className="heatmap-scroll">
        <div className="heatmap-container">
          <div className="heatmap-day-labels">
            {dayLabels.map((label, i) => (
              <span key={i} className="heatmap-day-label">{label}</span>
            ))}
          </div>
          <div className="heatmap-grid-area">
            <div className="heatmap-month-labels">
              {months.map((m, i) => (
                <span
                  key={i}
                  className="heatmap-month-label"
                  style={{ gridColumnStart: m.weekIndex + 1 }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div className="heatmap-grid">
              {weeks.map((week, wi) => (
                <div key={wi} className="heatmap-week">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={`heatmap-cell level-${day.level}`}
                      onMouseEnter={(e) => {
                        const rect = e.target.getBoundingClientRect();
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                          text: `${day.totalCount} entries on ${day.displayDate}`,
                          detail: day.totalCount > 0
                            ? `✨ ${day.gratitudeCount} gratitude · 🌬️ ${day.anxietyCount} released`
                            : 'No activity'
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div key={level} className={`heatmap-cell level-${level}`} />
        ))}
        <span className="heatmap-legend-label">More</span>
      </div>

      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="heatmap-tooltip-text">{tooltip.text}</div>
          <div className="heatmap-tooltip-detail">{tooltip.detail}</div>
        </div>
      )}
    </div>
  );
}
