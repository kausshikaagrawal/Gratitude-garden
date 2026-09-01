import { sql, ensureDb } from './_db.js';
import { verifyToken } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await ensureDb();

    const { rows: totalResult } = await sql`
      SELECT COUNT(*) as count FROM activities WHERE user_id = ${user.userId}
    `;

    const { rows: breakdownResult } = await sql`
      SELECT type, COUNT(*) as count FROM activities
      WHERE user_id = ${user.userId}
      GROUP BY type
    `;

    const { rows: dateResult } = await sql`
      SELECT DISTINCT DATE(TO_TIMESTAMP(timestamp / 1000)) as d
      FROM activities WHERE user_id = ${user.userId}
    `;

    const activeDays = dateResult.length;
    const totalLogs = Number(totalResult[0].count);
    const avgPerActiveDay = activeDays > 0 ? (totalLogs / activeDays).toFixed(2) : 0;

    return res.json({
      totalLogs,
      breakdown: breakdownResult,
      activeDays,
      predictiveAvgPerDay: avgPerActiveDay
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
