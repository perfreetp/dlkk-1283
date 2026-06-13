import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useStore } from '@/store';

export function HeroSection() {
  const navigate = useNavigate();
  const { user } = useStore();

  return (
    <div className="relative bg-gradient-to-br from-[#FF6B35]/5 via-white to-[#2D5BFF]/5 rounded-2xl p-8 mb-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF6B35]/10 to-[#2D5BFF]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-[#2D5BFF]/10 to-[#FF6B35]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[#FF6B35]" />
          <span className="text-sm font-medium text-[#FF6B35]">校园创意集市</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          发现你的下一个<span className="text-[#2D5BFF]">精彩点子</span>
        </h1>

        <p className="text-gray-600 mb-6 max-w-lg">
          在这里，你可以发布创意、寻找队友、出售方案，让校园里的每一个灵感都能找到它的价值。
        </p>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
            <span>今日新增 <strong className="text-gray-900">12</strong> 个创意</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4 text-[#2D5BFF]" />
            <span>活跃用户 <strong className="text-gray-900">156</strong> 人</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="lg" onClick={() => navigate('/post')}>
            <Plus className="w-5 h-5 mr-2" />
            发布我的创意
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/bounty')}>
            查看悬赏需求
          </Button>
        </div>

        {user && (
          <div className="mt-4 text-sm text-gray-500">
            欢迎回来，<span className="font-medium text-gray-700">{user.nickname}</span>！你的信用分：
            <span className="font-bold text-[#10B981] ml-1">{user.creditScore}</span>
          </div>
        )}
      </div>
    </div>
  );
}