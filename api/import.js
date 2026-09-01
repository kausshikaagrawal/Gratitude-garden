import { sql, ensureDb } from './_db.js';
import { verifyToken } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await ensureDb();

    const activities = req.body.activities;
    if (!Array.isArray(activities)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Clear existing data
    await sql`DELETE FROM activities WHERE user_id = ${user.userId}`;

    // Import new data
    for (const act of activities) {
      await sql`
        INSERT INTO activities (user_id, type, text, timestamp)
        VALUES (${user.userId}, ${act.type}, ${act.text || ''}, ${act.timestamp})
      `;
    }

    return res.json({ message: 'Data imported successfully' });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
