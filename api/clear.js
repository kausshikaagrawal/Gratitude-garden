import { sql, ensureDb } from './_db.js';
import { verifyToken } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await ensureDb();

    await sql`DELETE FROM activities WHERE user_id = ${user.userId}`;

    return res.json({ message: 'Data cleared successfully' });
  } catch (error) {
    console.error('Clear error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
