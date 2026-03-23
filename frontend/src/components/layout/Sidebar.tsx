import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Warehouse,
  BookOpen,
  BarChart3,
  Calendar,
  History,
  Bell,
  Banknote,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import client from '../../api/client';
import { getCurrentUser, isAdminUser } from '../../utils/userAccess';
import { clearAuthSession, getAuthToken } from '../../utils/authStorage';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/pos', icon: ShoppingCart, label: 'POS Терминал', primary: true },
  { to: '/catalog', icon: BookOpen, label: 'Каталог' },
  { to: '/products', icon: Package, label: 'Товары' },
  { to: '/sales', icon: History, label: 'История продаж' },
  { to: '/customers', icon: Users, label: 'Клиенты' },
  { to: '/expenses', icon: Banknote, label: 'Расходы' },
  { to: '/reminders', icon: Calendar, label: 'Напоминания' },
  { to: '/reports', icon: BarChart3, label: 'Отчёты' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAdmin = isAdminUser(user);
  const [remindersCount, setRemindersCount] = useState(0);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const refreshRemindersCount = () => {
      client.get('/reminders')
        .then((res) => {
          const items = Array.isArray(res.data) ? res.data : [];
          setRemindersCount(items.filter((item: any) => !item.isCompleted).length);
        })
        .catch(() => {
          setRemindersCount(0);
        });
    };

    refreshRemindersCount();
    window.addEventListener('focus', refreshRemindersCount);
    window.addEventListener('reminders-updated', refreshRemindersCount as EventListener);

    return () => {
      window.removeEventListener('focus', refreshRemindersCount);
      window.removeEventListener('reminders-updated', refreshRemindersCount as EventListener);
    };
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!isAdmin && (item.to === '/' || item.to === '/reports' || item.to === '/settings')) {
      return false;
    }
    if (item.to === '/reports' || item.to === '/settings') {
      return isAdmin;
    }
    return true;
  });

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-[#0f172a]/45 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-[#314155] bg-[#243042] text-[#eaf1f8] transition-transform duration-300 lg:sticky lg:top-0 lg:shrink-0 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="p-6">
          <div className="flex cursor-pointer items-center space-x-3" onClick={() => navigate('/')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5b8def] text-white shadow-lg shadow-[#5b8def]/25">
              <Warehouse size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-semibold leading-none tracking-tight">Wholesale</span>
              <span className="mt-0.5 text-[10px] text-[#94a3b8]">Commerce admin</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                clsx(
                  'relative overflow-hidden rounded-xl border px-4 py-3 transition-all duration-200',
                  'flex items-center space-x-3',
                  item.primary && !isActive && 'mb-3 border-[#3a4b63] bg-[#2d3b4f] text-[#eaf1f8]',
                  isActive
                    ? 'border-[#5b8def] bg-[#5b8def] text-white shadow-lg shadow-[#5b8def]/20'
                    : 'border-transparent text-[#c9d5e3] hover:bg-[#2d3b4f] hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className="relative z-10" />
                  <span className="relative z-10 text-sm">{item.label}</span>
                  {isActive && <motion.div layoutId="active-pill" className="absolute inset-0 bg-[#5b8def]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-[18px] border border-[#314155] bg-[#1d2736] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.28)]">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#32445c] text-xs font-semibold text-white">
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#eaf1f8]">{user.username}</p>
                <p className="truncate text-[10px] uppercase tracking-[0.12em] text-[#94a3b8]">{user.role}</p>
              </div>
              <button
                onClick={() => navigate('/reminders')}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2d3b4f] text-[#c9d5e3] transition-all duration-200 hover:bg-[#354861] hover:text-white"
                title="Напоминания"
              >
                <Bell size={16} />
                {remindersCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#1d2736] bg-[#ef4444] px-1 text-[9px] font-semibold text-white">
                    {remindersCount > 9 ? '9+' : remindersCount}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center space-x-2 rounded-lg bg-[#2d3b4f] py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c9d5e3] transition-all duration-200 hover:bg-[#3a2430] hover:text-[#fecdd3]"
            >
              <LogOut size={14} />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
