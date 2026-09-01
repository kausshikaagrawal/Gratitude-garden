export default function SettingsPanel({ data }) {
  
  return (
    <section className="view active">
       <div className="header-banner glass-panel">
         <h2>Settings</h2>
         <p>Manage your account</p>
       </div>

       <div className="settings-content glass-panel" style={{display: 'flex', flexDirection: 'column'}}>
          
          <div className="settings-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)'}}>
             <div className="settings-info">
               <h3 style={{fontFamily: 'Outfit', fontSize: '1.3rem'}}>Account Profile</h3>
               <p style={{color: 'var(--text-muted)'}}>Logged in as <b>{data.username}</b>. Data is safely backed up to your API server.</p>
             </div>
          </div>

          <div className="settings-row" style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border)'}}>
             <div className="settings-info" style={{flex: 1, minWidth: '100%'}}>
               <h3 style={{fontFamily: 'Outfit', fontSize: '1.3rem'}}>Data Management</h3>
               <p style={{color: 'var(--text-muted)'}}>Export your garden to a JSON file, or restore a previous backup.</p>
             </div>
             
             <div style={{display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap'}}>
               <button onClick={data.exportData} className="btn" style={{padding: '10px 20px', fontSize: '1rem'}}>
                 Export Backup
               </button>
               
               <label className="btn" style={{padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', background: 'var(--sage-light)', color: 'var(--text-dark)', border: '1px solid var(--sage-dark)'}}>
                 Import Backup
                 <input 
                   type="file" 
                   accept=".json" 
                   style={{display: 'none'}} 
                   onChange={(e) => {
                     if (e.target.files?.[0]) data.importData(e.target.files[0]);
                     e.target.value = null; // reset input
                   }} 
                 />
               </label>

               <button onClick={() => {
                 if (window.confirm("Are you sure? This will delete all your garden data permanently!")) {
                   data.clearData();
                 }
               }} className="btn" style={{padding: '10px 20px', fontSize: '1rem', background: '#dc2626', color: 'white', marginLeft: 'auto', border: 'none'}}>
                 Clear All Data
               </button>
             </div>
          </div>

          <div className="settings-row danger-zone" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem'}}>
             <div className="settings-info">
                <h3 style={{fontFamily: 'Outfit', fontSize: '1.3rem', color: '#b45309'}}>Sign Out</h3>
                <p style={{color: 'var(--text-muted)'}}>Return to the login screen.</p>
             </div>
             <button onClick={data.handleLogout} className="btn" style={{padding: '10px 20px', fontSize: '1rem', background: 'white', border: '1px solid #b45309', color: '#b45309'}}>
               Log Out
             </button>
          </div>

       </div>
    </section>
  );
}
