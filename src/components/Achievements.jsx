import { useMemo } from 'react';

const ACHIEVEMENTS = [
  {
    id: 'first_seed',
    emoji: '🌱',
    name: 'First Seed',
    desc: 'Plant your first gratitude',
    check: (data) => data.totalTrees >= 1,
    tier: 'bronze'
  },
  {
    id: 'growing',
    emoji: '🌿',
    name: 'Growing Strong',
    desc: 'Reach 10 trees',
    check: (data) => data.totalTrees >= 10,
    tier: 'bronze'
  },
  {
    id: 'forest',
    emoji: '🌳',
    name: 'Mini Forest',
    desc: 'Reach 25 trees',
    check: (data) => data.totalTrees >= 25,
    tier: 'silver'
  },
  {
    id: 'grove',
    emoji: '🏕️',
    name: 'Sacred Grove',
    desc: 'Reach 50 trees',
    check: (data) => data.totalTrees >= 50,
    tier: 'silver'
  },
  {
    id: 'centurion',
    emoji: '🏆',
    name: 'Centurion',
    desc: '100 trees planted',
    check: (data) => data.totalTrees >= 100,
    tier: 'gold'
  },
  {
    id: 'streak_3',
    emoji: '🔥',
    name: 'Getting Started',
    desc: '3-day streak',
    check: (data) => data.streak >= 3,
    tier: 'bronze'
  },
  {
    id: 'streak_7',
    emoji: '⚡',
    name: 'Week Warrior',
    desc: '7-day streak',
    check: (data) => data.streak >= 7,
    tier: 'silver'
  },
  {
    id: 'streak_30',
    emoji: '⭐',
    name: 'Monthly Master',
    desc: '30-day streak',
    check: (data) => data.streak >= 30,
    tier: 'gold'
  },
  {
    id: 'mindful',
    emoji: '🧘',
    name: 'Mindful Release',
    desc: 'Release 10 anxieties',
    check: (data) => {
      if (!data.history) return false;
      let count = 0;
      Object.values(data.history).forEach(day => {
        count += day.filter(l => l.type === 'anxiety').length;
      });
      return count >= 10;
    },
    tier: 'silver'
  },
  {
    id: 'dedicated',
    emoji: '💎',
    name: 'Dedicated Gardener',
    desc: 'Log 5+ entries in a single day',
    check: (data) => {
      if (!data.history) return false;
      return Object.values(data.history).some(day => day.length >= 5);
    },
    tier: 'gold'
  }
];

export default function Achievements({ data }) {
  const { earned, locked } = useMemo(() => {
    const earned = [];
    const locked = [];

    ACHIEVEMENTS.forEach(achievement => {
      if (achievement.check(data)) {
        earned.push(achievement);
      } else {
        locked.push(achievement);
      }
    });

    return { earned, locked };
  }, [data]);

  const progress = Math.round((earned.length / ACHIEVEMENTS.length) * 100);

  return (
    <div className="achievements-wrapper">
      <div className="achievements-header">
        <h3 className="achievements-title">Achievements</h3>
        <div className="achievements-progress">
          <div className="achievements-progress-bar">
            <div
              className="achievements-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="achievements-progress-text">
            {earned.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
      </div>

      <div className="achievements-grid">
        {earned.map(a => (
          <div key={a.id} className={`achievement-badge earned tier-${a.tier}`}>
            <span className="achievement-emoji">{a.emoji}</span>
            <div className="achievement-info">
              <span className="achievement-name">{a.name}</span>
              <span className="achievement-desc">{a.desc}</span>
            </div>
          </div>
        ))}
        {locked.map(a => (
          <div key={a.id} className="achievement-badge locked">
            <span className="achievement-emoji">🔒</span>
            <div className="achievement-info">
              <span className="achievement-name">{a.name}</span>
              <span className="achievement-desc">{a.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
