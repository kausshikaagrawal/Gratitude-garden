import fs from 'fs';
import path from 'path';

let vercelSql = null;

try {
  const pg = await import('@vercel/postgres');
  vercelSql = pg.sql;
} catch (e) {
  console.warn('@vercel/postgres import warning:', e.message);
}

const TMP_DB_PATH = path.join('/tmp', 'gratitude_db.json');

function loadMemoryDb() {
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const content = fs.readFileSync(TMP_DB_PATH, 'utf8');
      const data = JSON.parse(content);
      return {
        users: data.users || [],
        activities: data.activities || [],
        userIdCounter: data.userIdCounter || 1,
        activityIdCounter: data.activityIdCounter || 1
      };
    }
  } catch (e) {
    console.warn("Failed to load tmp db:", e);
  }
  return { users: [], activities: [], userIdCounter: 1, activityIdCounter: 1 };
}

function saveMemoryDb(db) {
  try {
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(db), 'utf8');
  } catch (e) {
    console.warn("Failed to save tmp db:", e);
  }
}

function usePostgres() {
  return Boolean(
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export async function ensureDb() {
  if (usePostgres() && vercelSql) {
    try {
      await vercelSql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          age INTEGER,
          gender VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      try {
        await vercelSql`ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER`;
        await vercelSql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50)`;
      } catch (e) {}

      await vercelSql`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          text TEXT DEFAULT '',
          timestamp BIGINT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
    } catch (e) {
      console.warn("Postgres init warning, using file fallback:", e.message);
    }
  }
}

export async function sql(strings, ...values) {
  if (usePostgres() && vercelSql) {
    try {
      return await vercelSql(strings, ...values);
    } catch (e) {
      console.warn("Postgres query error, falling back to file store:", e.message);
    }
  }

  // File-backed fallback implementation
  const memoryDb = loadMemoryDb();
  const memoryUsers = memoryDb.users;
  const memoryActivities = memoryDb.activities;

  const query = strings.join('?').trim();
  
  if (query.includes('SELECT id FROM users WHERE username =')) {
    const username = values[0];
    const user = memoryUsers.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    return { rows: user ? [{ id: user.id }] : [] };
  }

  if (query.includes('SELECT * FROM users WHERE username =')) {
    const username = values[0];
    const user = memoryUsers.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    return { rows: user ? [user] : [] };
  }

  if (query.includes('INSERT INTO users')) {
    const [username, password_hash, age, gender] = values;
    const user = { id: memoryDb.userIdCounter++, username, password_hash, age, gender, created_at: Date.now() };
    memoryUsers.push(user);
    saveMemoryDb(memoryDb);
    return { rows: [{ id: user.id }] };
  }

  if (query.includes('SELECT type, text, timestamp FROM activities WHERE user_id =')) {
    const userId = values[0];
    const userActivities = memoryActivities
      .filter(a => a.user_id === userId)
      .sort((a, b) => a.timestamp - b.timestamp);
    return { rows: userActivities };
  }

  if (query.includes('INSERT INTO activities')) {
    const [user_id, type, text, timestamp] = values;
    const act = { id: memoryDb.activityIdCounter++, user_id, type, text: text || '', timestamp };
    memoryActivities.push(act);
    saveMemoryDb(memoryDb);
    return { rows: [{ id: act.id }] };
  }

  if (query.includes('SELECT COUNT(*) as count FROM users')) {
    if (query.includes('created_at')) {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const count = memoryUsers.filter(u => u.created_at >= weekAgo).length;
      return { rows: [{ count }] };
    }
    return { rows: [{ count: memoryUsers.length }] };
  }

  if (query.includes('SELECT COUNT(*) as count FROM activities')) {
    if (query.includes('WHERE user_id =')) {
      const userId = values[0];
      const count = memoryActivities.filter(a => a.user_id === userId).length;
      return { rows: [{ count }] };
    }
    return { rows: [{ count: memoryActivities.length }] };
  }

  if (query.includes('SELECT type, COUNT(*) as count FROM activities')) {
    if (query.includes('WHERE user_id =')) {
      const userId = values[0];
      const counts = {};
      memoryActivities.filter(a => a.user_id === userId).forEach(a => {
        counts[a.type] = (counts[a.type] || 0) + 1;
      });
      return { rows: Object.entries(counts).map(([type, count]) => ({ type, count })) };
    }
    const counts = {};
    memoryActivities.forEach(a => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return { rows: Object.entries(counts).map(([type, count]) => ({ type, count })) };
  }

  if (query.includes('SELECT DATE')) {
    const thirtyDaysAgo = values[0] || 0;
    const map = {};
    memoryActivities.filter(a => a.timestamp >= thirtyDaysAgo).forEach(a => {
      const dateStr = new Date(a.timestamp).toISOString().split('T')[0];
      map[dateStr] = (map[dateStr] || 0) + 1;
    });
    return { rows: Object.entries(map).map(([date, count]) => ({ date, count })) };
  }

  if (query.includes('SELECT u.username')) {
    const counts = {};
    const lastActive = {};
    memoryActivities.forEach(a => {
      counts[a.user_id] = (counts[a.user_id] || 0) + 1;
      if (!lastActive[a.user_id] || a.timestamp > lastActive[a.user_id]) {
        lastActive[a.user_id] = a.timestamp;
      }
    });

    const rows = memoryUsers.map(u => ({
      username: u.username,
      entries: counts[u.id] || 0,
      last_active: lastActive[u.id] || null
    })).sort((a, b) => b.entries - a.entries).slice(0, 10);

    return { rows };
  }

  if (query.includes('SELECT COUNT(DISTINCT user_id)')) {
    const todayStart = values[0] || 0;
    const unique = new Set(memoryActivities.filter(a => a.timestamp >= todayStart).map(a => a.user_id));
    return { rows: [{ count: unique.size }] };
  }

  if (query.includes('gender')) {
    const counts = {};
    memoryUsers.forEach(u => {
      const g = u.gender || 'Unspecified';
      counts[g] = (counts[g] || 0) + 1;
    });
    return { rows: Object.entries(counts).map(([gender, count]) => ({ gender, count })) };
  }

  if (query.includes('SELECT age FROM users')) {
    return { rows: memoryUsers.map(u => ({ age: u.age })) };
  }

  if (query.includes('DELETE FROM activities WHERE user_id =')) {
    const userId = values[0];
    let modified = false;
    for (let i = memoryActivities.length - 1; i >= 0; i--) {
      if (memoryActivities[i].user_id === userId) {
        memoryActivities.splice(i, 1);
        modified = true;
      }
    }
    if (modified) saveMemoryDb(memoryDb);
    return { rows: [] };
  }

  return { rows: [] };
}
