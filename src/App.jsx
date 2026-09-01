import { useState } from 'react';
import { useJournalData } from './hooks/useJournalData';
import Garden from './components/Garden';
import Journey from './components/Journey';
import Analytics from './components/Analytics';
import AdminDashboard from './components/AdminDashboard';
import SettingsPanel from './components/SettingsPanel';
import Login from './components/Login';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('garden');
  
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('gratitude_token'));
  const [username, setUsername] = useState(localStorage.getItem('gratitude_username'));

  const journalData = useJournalData(token);

  const handleLoginSuccess = (newToken, newUsername) => {
    localStorage.setItem('gratitude_token', newToken);
    localStorage.setItem('gratitude_username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('gratitude_token');
    localStorage.removeItem('gratitude_username');
    setToken(null);
    setUsername(null);
    setActiveTab('garden');
  };

  const renderView = () => {
    if (!token) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    switch(activeTab) {
      case 'garden': return <Garden data={journalData} />;
      case 'journey': return <Journey data={journalData} />;
      case 'analytics': return <Analytics data={journalData} />;
      case 'admin': return <AdminDashboard token={token} />;
      case 'settings': return <SettingsPanel data={{ ...journalData, handleLogout, username }} />;
      default: return <Garden data={journalData} />;
    }
  };

  return (
    <>
      <div className="bg-gradient"></div>
      <div className="bg-blur"></div>

      <div className="app-container">
        <header className="glass-panel">
          <div className="logo">
            <span className="logo-icon">🌿</span>
            <h1>{username ? `${username}'s Garden` : 'Gratitude Garden'}</h1>
          </div>
          {token && (
            <nav className="tabs">
              <button className={`tab-btn ${activeTab === 'garden' ? 'active' : ''}`} onClick={() => setActiveTab('garden')}>Garden</button>
              <button className={`tab-btn ${activeTab === 'journey' ? 'active' : ''}`} onClick={() => setActiveTab('journey')}>Journey</button>
              <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics</button>
              <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>Admin</button>
              <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
            </nav>
          )}
        </header>

        <main>
          {renderView()}
        </main>
      </div>
    </>
  );
}

export default App;
