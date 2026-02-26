// components/Layout.jsx - Main dashboard layout with sidebar for Sub4Earn
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListTodo, Wallet, ShieldCheck, ArrowDownToLine,
  User, LogOut, Menu, X, ChevronRight, Settings, Users, FileCheck, CreditCard, Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const userNav = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/tasks',      label: 'Tasks',       icon: ListTodo },
  { to: '/wallet',     label: 'Wallet',      icon: Wallet },
  { to: '/kyc',        label: 'KYC',         icon: ShieldCheck },
  { to: '/withdraw',   label: 'Withdraw',    icon: ArrowDownToLine },
  { to: '/profile',    label: 'Profile',     icon: User },
];

const adminNav = [
  { to: '/admin',              label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/admin/tasks',        label: 'Tasks',       icon: ListTodo },
  { to: '/admin/proofs',       label: 'Proof Review', icon: Eye },
  { to: '/admin/kyc',          label: 'KYC Review',  icon: ShieldCheck },
  { to: '/admin/withdrawals',  label: 'Withdrawals', icon: CreditCard },
  { to: '/admin/users',        label: 'Users',       icon: Users },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = isAdmin ? adminNav : userNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/admin' || path === '/dashboard'
      ? location.pathname === path
      : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40
        transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S4E</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Sub4Earn</span>
          </div>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* User info pill */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{isAdmin ? 'Admin' : 'Member'}</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive(to)
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {isActive(to) && <ChevronRight size={14} />}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900 p-1"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S4</span>
            </div>
            <span className="font-bold text-gray-900">Sub4Earn</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.email?.[0]?.toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
