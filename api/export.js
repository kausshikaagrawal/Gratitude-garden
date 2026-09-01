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

    const { rows: activities } = await sql`
      SELECT type, text, timestamp FROM activities
      WHERE user_id = ${user.userId}
      ORDER BY timestamp ASC
    `;

    return res.json({ activities });
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
