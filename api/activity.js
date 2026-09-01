import { sql, ensureDb } from './_db.js';
import { verifyToken } from './_auth.js';

export default async function handler(req, res) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  await ensureDb();

  if (req.method === 'GET') {
    return handleGet(req, res, user);
  } else if (req.method === 'POST') {
    return handlePost(req, res, user);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res, user) {
  try {
    const { rows: activities } = await sql`
      SELECT type, text, timestamp FROM activities
      WHERE user_id = ${user.userId}
      ORDER BY timestamp ASC
    `;

    let totalTrees = 0;
    const history = {};

    activities.forEach(log => {
      if (log.type === 'gratitude') totalTrees++;
      else if (totalTrees > 0) totalTrees--;

      const date = new Date(Number(log.timestamp));
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!history[dateStr]) history[dateStr] = [];
      history[dateStr].push({
        type: log.type,
        text: log.text,
        timestamp: Number(log.timestamp)
      });
    });

    totalTrees = Math.max(0, totalTrees);

    return res.json({ totalTrees, history });
  } catch (error) {
    console.error('Activity GET error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req, res, user) {
  try {
    const { type, text } = req.body;

    if (!type || !['gratitude', 'anxiety'].includes(type)) {
      return res.status(400).json({ error: 'Invalid activity type' });
    }

    const timestamp = Date.now();

    await sql`
      INSERT INTO activities (user_id, type, text, timestamp)
      VALUES (${user.userId}, ${type}, ${text || ''}, ${timestamp})
    `;

    return res.status(201).json({ message: 'Activity logged successfully' });
  } catch (error) {
    console.error('Activity POST error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
