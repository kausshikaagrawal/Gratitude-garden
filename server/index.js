import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { getDb } from './db.js';

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = 'super-secret-gratitude-key-123'; // In production, move to .env

// --- Middleware to Authenticate JWT Tokens ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (token == null) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// --- AUTHENTICATION ROUTES ---

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const db = await getDb();
    
    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) return res.status(409).json({ error: 'Username already taken' });

    // Hash password & store
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword]);

    res.status(201).json({ message: 'User registered successfully', userId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = await getDb();

    // Fetch user
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Verify Password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    // Generate JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, username: user.username, userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- APP ACTIVITY ROUTES ---

app.get('/api/activity', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.userId;

    // We emulate the data structure expected by useJournalData `localStorage` equivalent
    const activities = await db.all('SELECT type, text, timestamp FROM activities WHERE user_id = ? ORDER BY timestamp ASC', [userId]);

    // Construct format
    // { totalTrees: X, history: { "YYYY-MM-DD": [{ type, text, timestamp }] } }
    let totalTrees = 0;
    const history = {};

    activities.forEach(log => {
      if (log.type === 'gratitude') totalTrees++;
      else if (totalTrees > 0) totalTrees--; // Anxiety/negative removes trees, max 0
      
      const date = new Date(log.timestamp);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!history[dateStr]) history[dateStr] = [];
      history[dateStr].push({
        type: log.type,
        text: log.text,
        timestamp: log.timestamp
      });
    });

    // Enforce totalTrees minimum zero if loop logic went below zero
    totalTrees = Math.max(0, totalTrees);

    res.json({ defaultState: false, totalTrees, history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/activity', authenticateToken, async (req, res) => {
  try {
    const { type, text } = req.body;
    const userId = req.user.userId;
    const timestamp = Date.now();

    const db = await getDb();
    await db.run('INSERT INTO activities (user_id, type, text, timestamp) VALUES (?, ?, ?, ?)', [userId, type, text || '', timestamp]);

    res.status(201).json({ message: 'Activity logged successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
     // Averages and predictions requested by the user
     const db = await getDb();
     const userId = req.user.userId;

     // 1. Total lifetime logs
     const totalLogs = await db.get('SELECT COUNT(*) as count FROM activities WHERE user_id = ?', [userId]);
     
     // 2. Breakdown
     const diffLogs = await db.all('SELECT type, COUNT(*) as count FROM activities WHERE user_id = ? GROUP BY type', [userId]);

     // 3. Average per day logic
     const dates = await db.all('SELECT DISTINCT date(timestamp / 1000, "unixepoch") as d FROM activities WHERE user_id = ?', [userId]);
     const activeDays = dates.length;
     const avgPerActiveDay = activeDays > 0 ? (totalLogs.count / activeDays).toFixed(2) : 0;
     
     res.json({
        totalLogs: totalLogs.count,
        breakdown: diffLogs,
        activeDays,
        predictiveAvgPerDay: avgPerActiveDay
     });
  } catch (error) {
     res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();

    // Total users
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');

    // Total entries
    const entryCount = await db.get('SELECT COUNT(*) as count FROM activities');

    // Mood distribution
    const moodResult = await db.all('SELECT type, COUNT(*) as count FROM activities GROUP BY type');

    // Top users
    const topUsersResult = await db.all(`
      SELECT u.username, COUNT(a.id) as entries, MAX(a.timestamp) as lastActive
      FROM users u
      LEFT JOIN activities a ON u.id = a.user_id
      GROUP BY u.id, u.username
      ORDER BY entries DESC
      LIMIT 10
    `);

    // Active today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const activeTodayResult = await db.get(
      'SELECT COUNT(DISTINCT user_id) as count FROM activities WHERE timestamp >= ?',
      [todayStart.getTime()]
    );

    // Daily activity (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const dailyResult = await db.all(`
      SELECT date(timestamp / 1000, 'unixepoch') as date, COUNT(*) as count
      FROM activities
      WHERE timestamp >= ?
      GROUP BY date(timestamp / 1000, 'unixepoch')
      ORDER BY date ASC
    `, [thirtyDaysAgo]);

    res.json({
      totalUsers: userCount?.count || 0,
      totalEntries: entryCount?.count || 0,
      recentSignups: userCount?.count || 0,
      activeToday: activeTodayResult?.count || 0,
      moodDistribution: moodResult.map(r => ({ type: r.type, count: r.count })),
      dailyActivity: dailyResult.map(r => ({ date: r.date, count: r.count })),
      topUsers: topUsersResult.map(r => ({
        username: r.username,
        entries: r.entries,
        lastActive: r.lastActive ? Number(r.lastActive) : null
      }))
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- DATA MANAGEMENT ROUTES ---

app.get('/api/export', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.userId;
    const activities = await db.all('SELECT type, text, timestamp FROM activities WHERE user_id = ? ORDER BY timestamp ASC', [userId]);
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/import', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.userId;
    const activities = req.body.activities; 

    if (!Array.isArray(activities)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Replace data completely
    await db.run('DELETE FROM activities WHERE user_id = ?', [userId]);
    
    for (const act of activities) {
      await db.run('INSERT INTO activities (user_id, type, text, timestamp) VALUES (?, ?, ?, ?)', 
        [userId, act.type, act.text || '', act.timestamp]
      );
    }
    
    res.json({ message: 'Data imported successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/clear', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.userId;
    await db.run('DELETE FROM activities WHERE user_id = ?', [userId]);
    res.json({ message: 'Data cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
