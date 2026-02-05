import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Kanban', icon: '📋' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/archive', label: 'Archive', icon: '📦' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
    ...(user?.role === 'admin' ? [{ to: '/users', label: 'Users', icon: '👥' }] : []),
  ];

  // Find current page - prefer exact match, then longest prefix match for non-root items
  const currentPage = navItems.find(item => item.to === location.pathname) 
    || navItems
        .filter(item => item.to !== '/' && location.pathname.startsWith(item.to))
        .sort((a, b) => b.to.length - a.to.length)[0]
    || navItems[0];

  async function handleLogout() {
    await logout();
    navigate('/login');
    setDrawerOpen(false);
  }

  return (
    <div 
      className="h-dvh bg-gray-950 flex flex-col overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Minimal header bar */}
      <header className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <h1 className="text-white font-semibold text-lg flex items-center gap-2">
            <span>{currentPage.icon}</span>
            <span>{currentPage.label}</span>
          </h1>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-gray-900 z-50 transform transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <span className="text-xl font-bold text-pink-500">📋 Kanban</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        >
          {user && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{user.email}</p>
                  {user.role === 'admin' && (
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-pink-900/50 text-pink-300 text-xs rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
