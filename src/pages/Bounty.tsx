import { Clock, Users, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Tag } from '@/components/common/Tag';
import { useStore } from '@/store';
import type { Bounty } from '@/types';
import { cn } from '@/lib/utils';

interface BountyCardProps {
  bounty: Bounty;
}

function BountyCard({ bounty }: BountyCardProps) {
  const { getUserById } = useStore();
  const author = getUserById(bounty.userId);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysLeft = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const daysLeft = getDaysLeft(bounty.deadline);

  return (
    <Card hoverable className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Tag variant={bounty.status === 'open' ? 'success' : 'warning'}>
            {bounty.status === 'open' ? '招募中' : bounty.status === 'in_progress' ? '进行中' : '已完成'}
          </Tag>
          <div className="flex items-center gap-1 text-sm font-semibold text-[#FF6B35]">
            <DollarSign className="w-4 h-4" />
            ¥{bounty.budgetMin}-{bounty.budgetMax}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {bounty.title}
        </h3>

        <p className="text-sm text-gray-500 mb-3 line-clamp-3">
          {bounty.description}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <Tag variant="default">{bounty.field}</Tag>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Avatar src={author?.avatar} size="sm" fallback={author?.nickname?.[0]} />
            <span className="text-sm font-medium text-gray-700">{author?.nickname}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className={cn(daysLeft <= 3 && 'text-[#EF4444]')}>
                {daysLeft > 0 ? `${daysLeft}天` : '已截止'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {bounty.applicants.length}人申请
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BountyPage() {
  const { bounties, user, addBounty } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">悬赏需求</h1>
          <p className="text-gray-500 mt-1">在这里发布你的需求，寻找合适的合作者</p>
        </div>
        <Link to="/bounty/post">
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#2D5BFF] text-white font-medium hover:opacity-90 transition-opacity">
            发布需求
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bounties.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
        {bounties.length === 0 && (
          <div className="col-span-full text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无悬赏需求</p>
            <Link to="/bounty/post" className="text-[#2D5BFF] hover:underline mt-2 inline-block">
              发布第一个需求
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}