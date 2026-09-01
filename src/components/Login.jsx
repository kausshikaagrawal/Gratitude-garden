import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isRegistering ? '/api/register' : '/api/login';
    const payload = isRegistering ? { username, password, age, gender } : { username, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (text.includes('ECONNREFUSED') || text.includes('proxy') || response.status === 502 || response.status === 504) {
          throw new Error('Backend server is unreachable. Please run "npm run dev:full" or start the server on port 3001.');
        }
        throw new Error(text || `Server error (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isRegistering) {
        // Automatically switch to login after registration
        setIsRegistering(false);
        setError('Registration successful! Please log in.');
        setUsername('');
        setPassword('');
        setAge('');
        setGender('');
      } else {
        onLoginSuccess(data.token, data.username);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-panel">
        <h2>{isRegistering ? 'Start Your Journey 🌿' : 'Welcome Back 🌿'}</h2>
        {error && <div className={`error-message ${error.includes('successful') ? 'success' : ''}`}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              placeholder="e.g. Kaushika"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Enter your secret key"
            />
          </div>

          {isRegistering && (
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Age</label>
                <input 
                  type="number" 
                  min="13" 
                  max="120" 
                  value={age} 
                  onChange={(e) => setAge(e.target.value)} 
                  placeholder="e.g. 24"
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)} 
                  className="form-select"
                >
                  <option value="">Select Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-btn primary">
            {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Log In')}
          </button>
        </form>

        <p className="toggle-login" onClick={() => { setIsRegistering(!isRegistering); setError(null); }}>
          {isRegistering ? 'Already have an account? Log In' : 'New here? Plant your first seed'}
        </p>
      </div>
    </div>
  );
}
