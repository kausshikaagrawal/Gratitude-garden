import { useRef } from 'react';

export default function SettingsPanel({ data }) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = data.importData(event.target.result);
      if (success) {
        alert("Data imported successfully!");
      } else {
        alert("Invalid backup file format.");
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if(window.confirm("Are you sure you want to completely erase your garden and history? This cannot be undone!")) {
       data.clearData();
    }
  };

  return (
    <section className="view active">
       <div className="header-banner glass-panel">
         <h2>Settings</h2>
         <p>Manage your experience & data</p>
       </div>

       <div className="settings-content glass-panel" style={{display: 'flex', flexDirection: 'column'}}>
          
          {/* Data Backup */}
          <div className="settings-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)'}}>
             <div className="settings-info">
               <h3 style={{fontFamily: 'Outfit', fontSize: '1.3rem'}}>Backup Data</h3>
               <p style={{color: 'var(--text-muted)'}}>Export to JSON, or import from an existing backup.</p>
             </div>
             <div className="settings-actions" style={{display: 'flex', gap: '10px'}}>
                <button onClick={data.exportData} className="btn btn-primary" style={{padding: '10px 20px', fontSize: '1rem'}}>
                   Export
                </button>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  style={{display: 'none'}} 
                  onChange={handleFileUpload} 
                />
                <button onClick={() => fileInputRef.current.click()} className="btn" style={{background: 'white', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '10px 20px', fontSize: '1rem'}}>
                  Import
                </button>
             </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-row danger-zone" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem'}}>
             <div className="settings-info">
                <h3 style={{fontFamily: 'Outfit', fontSize: '1.3rem', color: 'var(--danger)'}}>Danger Zone</h3>
                <p style={{color: 'var(--text-muted)'}}>Permanently delete all your trees and logs.</p>
             </div>
             <button onClick={handleClear} className="btn btn-danger" style={{padding: '10px 20px', fontSize: '1rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)'}}>
               Reset All Data
             </button>
          </div>

       </div>
    </section>
  );
}
