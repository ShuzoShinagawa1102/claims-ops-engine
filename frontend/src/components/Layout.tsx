import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Shield } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Exceptions Queue', href: '/exceptions', icon: AlertTriangle },
];

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-slate-900 text-white">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-700">
          <Shield size={22} className="text-indigo-400" />
          <span className="text-lg font-semibold tracking-tight">Claims Ops</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-500">
          v1.0.0 · Claims Ops Engine
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-slate-200 px-8 py-4 shadow-sm">
          <h1 className="text-base font-semibold text-slate-800">Insurance Claims Operations</h1>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
