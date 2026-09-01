import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const MOOD_COLORS = {
  gratitude: '#059669',
  anxiety: '#dc2626'
};

const GENDER_COLORS = {
  Female: '#ec4899',
  Male: '#3b82f6',
  'Non-binary': '#a855f7',
  'Prefer not to say': '#64748b',
  Other: '#f59e0b',
  Unspecified: '#94a3b8'
};

const CHART_GRADIENT_ID = 'adminAreaGradient';

export default function AdminDashboard({ token }) {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('gratitude_admin_key') || '');
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (adminKey !== 'Kausshika') return;

    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-admin-key': adminKey
          }
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load admin stats');
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [token, adminKey]);

  const handleKeySubmit = (e) => {
    e.preventDefault();
    if (keyInput.trim() === 'Kausshika') {
      localStorage.setItem('gratitude_admin_key', 'Kausshika');
      setAdminKey('Kausshika');
      setKeyError('');
    } else {
      setKeyError('Invalid Admin Key! Access denied.');
    }
  };

  if (adminKey !== 'Kausshika') {
    return (
      <section className="view active">
        <div className="login-container" style={{ minHeight: '60vh' }}>
          <div className="glass-panel login-panel" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <h2>👑 Admin Access Only</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Please enter the Secret Admin Key to unlock community analytics.
            </p>

            {keyError && <div className="error-message">{keyError}</div>}

            <form onSubmit={handleKeySubmit} className="login-form">
              <div className="form-group">
                <label>Secret Admin Key</label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Enter Secret Key"
                  required
                />
              </div>
              <button type="submit" className="submit-btn primary">
                Unlock Admin Dashboard 🔓
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="view active">
        <div className="admin-loading">
          <div className="loading-spinner" />
          <p>Loading analytics...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="view active">
        <div className="header-banner glass-panel">
          <h2>Admin Dashboard</h2>
          <p style={{ color: '#dc2626' }}>{error}</p>
          <button
            onClick={() => { localStorage.removeItem('gratitude_admin_key'); setAdminKey(''); }}
            className="submit-btn"
            style={{ marginTop: '1rem', width: 'auto', display: 'inline-flex' }}
          >
            🔒 Re-enter Admin Key
          </button>
        </div>
      </section>
    );
  }

  const gratitudeTotal = stats.moodDistribution.find(m => m.type === 'gratitude')?.count || 0;
  const gratitudeRatio = stats.totalEntries > 0
    ? Math.round((gratitudeTotal / stats.totalEntries) * 100)
    : 0;

  const pieData = stats.moodDistribution.map(m => ({
    name: m.type === 'gratitude' ? 'Gratitude' : 'Anxiety',
    value: m.count,
    color: MOOD_COLORS[m.type]
  }));

  const genderData = (stats.genderDemographics || []).map(g => ({
    name: g.gender,
    value: g.count,
    color: GENDER_COLORS[g.gender] || '#059669'
  }));

  const ageData = stats.ageDemographics || [];

  // Fill missing days in the 30-day trend
  const trendData = (() => {
    const map = {};
    (stats.dailyActivity || []).forEach(d => {
      const dateKey = typeof d.date === 'string' ? d.date.split('T')[0] : d.date;
      map[dateKey] = d.count;
    });

    const result = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      result.push({ date: label, entries: map[key] || 0 });
    }
    return result;
  })();

  return (
    <section className="view active" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header-banner glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>👑 Admin Dashboard</h2>
          <p>Community analytics, demographics & engagement overview</p>
        </div>
        <button
          onClick={() => { localStorage.removeItem('gratitude_admin_key'); setAdminKey(''); }}
          className="submit-btn"
          style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.9rem', background: '#dc2626' }}
        >
          🔒 Lock Admin
        </button>
      </div>

      {/* Overview Cards */}
      <div className="admin-cards">
        <div className="admin-card glass-panel">
          <div className="admin-card-icon">👥</div>
          <div className="admin-card-value">{stats.totalUsers}</div>
          <div className="admin-card-label">Total Users</div>
          {stats.recentSignups > 0 && (
            <div className="admin-card-badge">+{stats.recentSignups} this week</div>
          )}
        </div>

        <div className="admin-card glass-panel">
          <div className="admin-card-icon">📝</div>
          <div className="admin-card-value">{stats.totalEntries.toLocaleString()}</div>
          <div className="admin-card-label">Total Entries</div>
        </div>

        <div className="admin-card glass-panel">
          <div className="admin-card-icon">🟢</div>
          <div className="admin-card-value">{stats.activeToday}</div>
          <div className="admin-card-label">Active Today</div>
        </div>

        <div className="admin-card glass-panel">
          <div className="admin-card-icon">💚</div>
          <div className="admin-card-value">{gratitudeRatio}%</div>
          <div className="admin-card-label">Gratitude Ratio</div>
        </div>
      </div>

      {/* Activity Trend */}
      <div className="admin-section glass-panel">
        <h3>Activity Trend <span className="admin-section-subtitle">Last 30 days</span></h3>
        <div style={{ height: '220px', marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={CHART_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                interval={4}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderColor: 'var(--border)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }}
              />
              <Area
                type="monotone"
                dataKey="entries"
                stroke="#059669"
                strokeWidth={2.5}
                fill={`url(#${CHART_GRADIENT_ID})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="admin-split">
        <div className="admin-section glass-panel">
          <h3>📊 Gender Demographics</h3>
          {genderData.length > 0 ? (
            <>
              <div style={{ height: '200px', marginTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mood-legend" style={{ flexWrap: 'wrap', gap: '0.8rem' }}>
                {genderData.map(d => (
                  <div key={d.name} className="mood-legend-item">
                    <span className="mood-dot" style={{ background: d.color }} />
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="empty-chart-text">No demographic data yet</p>
          )}
        </div>

        <div className="admin-section glass-panel">
          <h3>🎂 Age Group Demographics</h3>
          {ageData.length > 0 ? (
            <div style={{ height: '200px', marginTop: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="group" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      borderColor: 'var(--border)',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-chart-text">No age data yet</p>
          )}
        </div>
      </div>

      {/* Mood Distribution + Leaderboard */}
      <div className="admin-split">
        <div className="admin-section glass-panel">
          <h3>Mood Distribution</h3>
          {pieData.length > 0 ? (
            <>
              <div style={{ height: '200px', marginTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mood-legend">
                {pieData.map(d => (
                  <div key={d.name} className="mood-legend-item">
                    <span className="mood-dot" style={{ background: d.color }} />
                    <span>{d.name}: {d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="empty-chart-text">No data yet</p>
          )}
        </div>

        <div className="admin-section glass-panel">
          <h3>🏆 Most Active Users</h3>
          {stats.topUsers.length > 0 ? (
            <div className="leaderboard">
              {stats.topUsers.map((user, i) => (
                <div key={user.username} className="leaderboard-row">
                  <div className="leaderboard-rank">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div className="leaderboard-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="leaderboard-info">
                    <span className="leaderboard-name">{user.username}</span>
                    <span className="leaderboard-entries">{user.entries} entries</span>
                  </div>
                  {user.lastActive && (
                    <span className="leaderboard-time">
                      {getRelativeTime(user.lastActive)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-chart-text">No users yet</p>
          )}
        </div>
      </div>
    </section>
  );
}

function getRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
