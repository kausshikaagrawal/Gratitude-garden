import { sql, ensureDb } from '../_db.js';
import { verifyToken } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    await ensureDb();

    // Total users
    const { rows: userCountResult } = await sql`SELECT COUNT(*) as count FROM users`;

    // Total entries
    const { rows: entryCountResult } = await sql`SELECT COUNT(*) as count FROM activities`;

    // Users signed up in last 7 days
    const { rows: recentSignupResult } = await sql`
      SELECT COUNT(*) as count FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `;

    // Mood distribution
    const { rows: moodResult } = await sql`
      SELECT type, COUNT(*) as count FROM activities GROUP BY type
    `;

    // Daily activity trend (last 30 days)
    const { rows: dailyResult } = await sql`
      SELECT DATE(TO_TIMESTAMP(timestamp / 1000)) as date, COUNT(*) as count
      FROM activities
      WHERE timestamp >= ${Date.now() - 30 * 24 * 60 * 60 * 1000}
      GROUP BY DATE(TO_TIMESTAMP(timestamp / 1000))
      ORDER BY date ASC
    `;

    // Top 10 most active users
    const { rows: topUsersResult } = await sql`
      SELECT u.username, COUNT(a.id) as entries,
             MAX(a.timestamp) as last_active
      FROM users u
      LEFT JOIN activities a ON u.id = a.user_id
      GROUP BY u.id, u.username
      ORDER BY entries DESC
      LIMIT 10
    `;

    // Active today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { rows: activeTodayResult } = await sql`
      SELECT COUNT(DISTINCT user_id) as count FROM activities
      WHERE timestamp >= ${todayStart.getTime()}
    `;

    return res.json({
      totalUsers: Number(userCountResult[0].count),
      totalEntries: Number(entryCountResult[0].count),
      recentSignups: Number(recentSignupResult[0].count),
      activeToday: Number(activeTodayResult[0].count),
      moodDistribution: moodResult.map(r => ({ type: r.type, count: Number(r.count) })),
      dailyActivity: dailyResult.map(r => ({ date: r.date, count: Number(r.count) })),
      topUsers: topUsersResult.map(r => ({
        username: r.username,
        entries: Number(r.entries),
        lastActive: r.last_active ? Number(r.last_active) : null
      }))
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
