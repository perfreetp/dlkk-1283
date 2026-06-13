import { Link, useLocation } from 'react-router-dom';
import { Lightbulb, Target, MessageSquare, User, Star, FileText, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '点子大厅', icon: Lightbulb },
  { path: '/bounty', label: '悬赏需求', icon: Target },
  { path: '/chat', label: '我的消息', icon: MessageSquare },
];

const profileItems = [
  { path: '/my/ideas', label: '我的发布', icon: FileText },
  { path: '/my/favorites', label: '我的收藏', icon: Star },
  { path: '/my/transactions', label: '交易记录', icon: History },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto hidden lg:block">
      <div className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#2D5BFF]/10 text-[#FF6B35] font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'text-[#FF6B35]')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-4 border-t border-gray-100">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            个人中心
          </h3>
          <nav className="space-y-1">
            {profileItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#2D5BFF]/10 text-[#FF6B35] font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', isActive && 'text-[#FF6B35]')} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/profile"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                location.pathname === '/profile'
                  ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#2D5BFF]/10 text-[#FF6B35] font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <User className={cn('w-5 h-5', location.pathname === '/profile' && 'text-[#FF6B35]')} />
              账号设置
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}