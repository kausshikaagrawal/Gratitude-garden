import { ensureDb } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const setupKey = req.body.setupKey || req.headers['x-setup-key'];
  const expectedKey = process.env.ADMIN_SETUP_KEY;

  if (!expectedKey || setupKey !== expectedKey) {
    return res.status(403).json({ error: 'Invalid setup key' });
  }

  try {
    await ensureDb();
    return res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('DB init error:', error);
    return res.status(500).json({ error: 'Failed to initialize database' });
  }
}
