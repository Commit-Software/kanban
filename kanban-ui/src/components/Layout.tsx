import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
      isActive 
        ? 'bg-pink-600 text-white' 
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`;

  return (
    <div className="h-dvh bg-gray-950 flex flex-col overflow-hidden">
      {/* Top navigation bar */}
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
          </div>
          <div className="text-gray-500 text-xs">
            Agent Workspace
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
