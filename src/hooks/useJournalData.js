import { useState, useEffect } from 'react';

const STORAGE_KEY = 'kaushikas_garden_data';

const defaultState = {
  totalTrees: 0,
  history: {}
};

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function useJournalData() {
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultState;
    } catch {
      return defaultState;
    }
  });

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

  const saveData = (newState) => {
    setData(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const addLog = (type, text) => {
    const today = formatDate(new Date());
    const newHistory = { ...data.history };
    if (!newHistory[today]) newHistory[today] = [];
    
    newHistory[today] = [
      ...newHistory[today], 
      { type, text, timestamp: Date.now() }
    ];

    saveData({
      ...data,
      totalTrees: type === 'gratitude' ? data.totalTrees + 1 : Math.max(0, data.totalTrees - 1),
      history: newHistory
    });
  };

  const importData = (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.totalTrees !== undefined && parsed.history) {
        saveData(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "kaushikas_garden_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const clearData = () => saveData(defaultState);

  return { ...data, streak, addLog, importData, exportData, clearData };
}
