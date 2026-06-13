import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, Menu, X, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { useStore } from '@/store';

export function Header() {
  const { user, notifications } = useStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      useStore.getState().setFilter({ search: searchQuery });
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#2D5BFF] flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                点子<span className="text-[#FF6B35]">交易</span>
              </span>
            </Link>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索创意、标签、学院..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/20 focus:border-[#2D5BFF] transition-all"
              />
            </div>
          </form>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/post')}
              className="hidden sm:flex"
            >
              <Plus className="w-4 h-4 mr-1" />
              发布创意
            </Button>

            <Link
              to="/chat"
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#FF6B35] text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {notifications}
                </span>
              )}
            </Link>

            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Avatar src={user?.avatar} alt={user?.nickname} size="md" fallback={user?.nickname?.[0]} />
              <span className="hidden lg:block text-sm font-medium text-gray-700">{user?.nickname}</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索创意..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="px-4 py-2 rounded-xl hover:bg-gray-100 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                点子大厅
              </Link>
              <Link to="/bounty" className="px-4 py-2 rounded-xl hover:bg-gray-100 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                悬赏需求
              </Link>
              <Link to="/chat" className="px-4 py-2 rounded-xl hover:bg-gray-100 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                我的消息
              </Link>
              <Button variant="primary" size="sm" onClick={() => { navigate('/post'); setMobileMenuOpen(false); }} className="mt-2">
                <Plus className="w-4 h-4 mr-1" />
                发布创意
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}