import React, { useState, useEffect, useRef } from 'react';
import AdminPanel from '../components/AdminPanel';

const API_BASE = 'http://localhost:8000/api';

function decodeJWT(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
}

const AdminUpload: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_jwt'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);

  // Check token expiry and auto-logout
  useEffect(() => {
    if (!token) return;
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      handleLogout();
      return;
    }
    const expiry = decoded.exp * 1000;
    const now = Date.now();
    if (expiry <= now) {
      handleLogout();
      return;
    }
    // Set timer to auto-logout
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(() => {
      handleLogout();
      alert('نشست شما به پایان رسید. لطفاً دوباره وارد شوید.');
    }, expiry - now);
    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
    // eslint-disable-next-line
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        setError('نام کاربری یا رمز عبور اشتباه است.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      localStorage.setItem('admin_jwt', data.access);
      setToken(data.access);
      setLoading(false);
    } catch (err) {
      setError('خطا در ورود.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_jwt');
    setToken(null);
    setUsername('');
    setPassword('');
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-center">ورود مدیر</h2>
          <div className="mb-4">
            <label className="block mb-1 text-gray-700">نام کاربری</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1 text-gray-700">رمز عبور</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            />
          </div>
          {error && <div className="mb-4 text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="absolute top-4 left-4">
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">خروج</button>
      </div>
      <AdminPanel isOpen={true} onClose={() => { window.location.href = '/'; }} token={token} />
    </div>
  );
};

export default AdminUpload; 