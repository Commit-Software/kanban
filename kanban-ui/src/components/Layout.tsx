import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-2 py-1.5 rounded-lg transition-colors text-xs font-medium whitespace-nowrap ${
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
      {/* Safe area spacer for iOS PWA */}
      <div className="flex-shrink-0 bg-gray-900 safe-top" />
      
      <nav className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-2 py-2 safe-left safe-right">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <NavLink to="/" className={navLinkClass}>
              📋 Kanban
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
          <div className="flex items-center gap-2 flex-shrink-0">
            {user && (
              <button
                onClick={handleLogout}
                className="px-2 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title={user.email}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-hidden safe-left safe-right">
        <Outlet />
      </div>
      
      {/* Bottom safe area for gesture bar */}
      <div className="flex-shrink-0 bg-gray-950 safe-bottom" />
    </div>
  );
}
