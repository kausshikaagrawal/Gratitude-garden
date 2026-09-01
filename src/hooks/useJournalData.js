import { useState, useEffect, useCallback } from 'react';

const defaultState = {
  totalTrees: 0,
  history: {},
  stats: null
};

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function useJournalData(token) {
  const [data, setData] = useState(defaultState);

  const fetchJournalData = useCallback(async () => {
    if (!token) return;
    try {
      const [activityRes, statsRes] = await Promise.all([
        fetch('/api/activity', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (activityRes.ok && statsRes.ok) {
        const activityData = await activityRes.json();
        const statsData = await statsRes.json();
        setData({
          totalTrees: activityData.totalTrees,
          history: activityData.history,
          stats: statsData
        });
      } else if (activityRes.status === 401 || activityRes.status === 403) {
         // Token might be expired, handled by logout naturally if we throw an event or just let user manually re-login
         localStorage.removeItem('gratitude_token');
         window.location.reload();
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchJournalData();
  }, [fetchJournalData]);

  const streak = (() => {
    if (!data.history || Object.keys(data.history).length === 0) return 0;
    
    let currentStreak = 0;
    const today = new Date();
    const todayStr = formatDate(today);
    
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    let currentDateCheckStr = todayStr;
    const loggedToday = data.history[todayStr]?.some(l => l.type === 'gratitude');
    
    if (!loggedToday) {
      const loggedYesterday = data.history[yesterdayStr]?.some(l => l.type === 'gratitude');
      if (loggedYesterday) currentDateCheckStr = yesterdayStr;
      else return 0;
    }

    let checkDate = new Date(currentDateCheckStr);
    while (true) {
      const dStr = formatDate(checkDate);
      if (data.history[dStr]?.some(l => l.type === 'gratitude')) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return currentStreak;
  })();

  const addLog = async (type, text) => {
    if (!token) return;

    // Optimistic Update
    const today = formatDate(new Date());
    const newHistory = { ...data.history };
    if (!newHistory[today]) newHistory[today] = [];
    
    newHistory[today] = [
      ...newHistory[today], 
      { type, text, timestamp: Date.now() }
    ];

    setData(prev => ({
      ...prev,
      totalTrees: type === 'gratitude' ? prev.totalTrees + 1 : Math.max(0, prev.totalTrees - 1),
      history: newHistory
    }));

    // Network request
    try {
      await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, text })
      });
      fetchJournalData(); // refresh stats in background
    } catch (err) {
      console.error("Failed to save log:", err);
    }
  };

  const exportData = async () => {
    if (!token) return false;
    try {
      const res = await fetch('/api/export', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data.activities, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gratitude_backup.json';
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const importData = async (file) => {
    if (!token) return false;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      let activities = [];
      
      if (Array.isArray(parsed)) {
        activities = parsed;
      } else if (parsed.history) {
        Object.values(parsed.history).forEach(day => {
          activities.push(...day);
        });
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activities })
      });
      if (!res.ok) throw new Error('Import failed');
      
      await fetchJournalData();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const clearData = async () => {
    if (!token) return false;
    // We let the frontend confirm handling or do it here if simple. 
    // Usually SettingsPanel has confirming logic. We'll do a simple confirm here as fallback.
    try {
      const res = await fetch('/api/clear', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to clear data');
      await fetchJournalData();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return { ...data, streak, addLog, importData, exportData, clearData };
}
