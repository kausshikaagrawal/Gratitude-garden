import { useState } from 'react';
import { useJournalData } from './hooks/useJournalData';
import Garden from './components/Garden';
import Journey from './components/Journey';
import Analytics from './components/Analytics';
import SettingsPanel from './components/SettingsPanel';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('garden');
  const journalData = useJournalData();

  const renderView = () => {
    switch(activeTab) {
      case 'garden': return <Garden data={journalData} />;
      case 'journey': return <Journey data={journalData} />;
      case 'analytics': return <Analytics data={journalData} />;
      case 'settings': return <SettingsPanel data={journalData} />;
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
            <h1>Kaushika's Garden</h1>
          </div>
          <nav className="tabs">
            <button className={`tab-btn ${activeTab === 'garden' ? 'active' : ''}`} onClick={() => setActiveTab('garden')}>Garden</button>
            <button className={`tab-btn ${activeTab === 'journey' ? 'active' : ''}`} onClick={() => setActiveTab('journey')}>Journey</button>
            <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics</button>
            <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
          </nav>
        </header>

        <main>
          {renderView()}
        </main>
      </div>
    </>
  );
}

export default App;
