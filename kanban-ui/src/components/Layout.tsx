import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
      isActive 
        ? 'bg-pink-600 text-white' 
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="h-dvh bg-gray-950 flex flex-col overflow-hidden">
      <nav className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-2">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-pink-500 text-xl mr-2">📋</span>
            <NavLink to="/" className={navLinkClass}>
              Kanban
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/archive" className={navLinkClass}>
              📦 Archive
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              ⚙️ Settings
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/users" className={navLinkClass}>
                👥 Users
              </NavLink>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-gray-400 text-sm">
                  {user.email}
                  {user.role === 'admin' && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-pink-900/50 text-pink-300 text-xs rounded">
                      admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
