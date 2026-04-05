import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics({ data }) {
  const chartData = useMemo(() => {
    if (!data.history) return [];
    
    // Get last 7 days
    const dates = [];
    for(let i=6; i>=0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }

    return dates.map(dateStr => {
      const logs = data.history[dateStr] || [];
      const gratitude = logs.filter(l => l.type === 'gratitude').length;
      const anxiety = logs.filter(l => l.type === 'anxiety').length;
      
      const [_, m, d] = dateStr.split('-');
      
      return {
        name: `${m}/${d}`,
        Gratitude: gratitude,
        Anxiety: anxiety,
      };
    });
  }, [data.history]);

  if (!data.history || Object.keys(data.history).length === 0) {
    return (
      <section className="view active">
        <div className="header-banner glass-panel">
          <h2>Analytics Dashboard</h2>
          <p>Your mood trends over the last 7 days</p>
        </div>
        <div className="empty-state">
           <span style={{fontSize: '3rem'}}>📊</span><br/>
           Log thoughts to see your analytics!
        </div>
      </section>
    );
  }

  return (
    <section className="view active">
       <div className="header-banner glass-panel">
         <h2>Analytics Dashboard</h2>
         <p>Your mood trends over the last 7 days</p>
       </div>

       <div className="glass-panel" style={{height: '250px', padding: '1.5rem'}}>
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{fill: 'var(--text-muted)', fontSize: 13}} />
              <YAxis allowDecimals={false} tick={{fill: 'var(--text-muted)', fontSize: 13}} />
              <Tooltip 
                contentStyle={{backgroundColor: 'white', borderColor: 'var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-md)'}}
                itemStyle={{color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold'}}
              />
              <Bar dataKey="Gratitude" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Anxiety" fill="var(--danger)" radius={[4, 4, 0, 0]} />
            </BarChart>
         </ResponsiveContainer>
       </div>
    </section>
  );
}
