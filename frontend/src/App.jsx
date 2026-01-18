import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import VisitorDash from './pages/VisitorDash';
import OwnerDash from './pages/OwnerDash';
import CarrierDash from './pages/CarrierDash';

function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Attempt to load user from storage on boot
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
    setInitializing(false);
  }, []);

  // Prevent flash of blank screen while checking localStorage
  if (initializing) return <div className="p-10 text-center font-mono">Initializing Project TNA...</div>;

  // 1. If no user, show Login screen
  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />;
  }

  // 2. If user exists, show dashboard based on role
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
        <h1 className="font-black text-blue-900 tracking-tighter">
          PROJECT TNA <span className="text-xs text-gray-400 ml-2">[{user.role}]</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">{user.name}</span>
          <button 
            onClick={() => { localStorage.clear(); setUser(null); }}
            className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg font-bold hover:bg-red-100"
          >
            LOGOUT
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto">
        {user.role === 'VISITOR' && <VisitorDash />}
        {user.role === 'OWNER' && <OwnerDash />}
        {user.role === 'CARRIER' && <CarrierDash />}
      </main>
    </div>
  );
}

export default App;