import { History, CheckCircle, Clock, XCircle, DollarSign, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Tag } from '@/components/common/Tag';
import { useStore } from '@/store';
import { mockTransactions } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function TransactionsPage() {
  const { user, getUserById, getIdeaById } = useStore();
  const myTransactions = mockTransactions.filter(
    (tx) => tx.buyerId === user?.id || tx.sellerId === user?.id
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-[#10B981]';
      case 'in_progress':
        return 'text-[#F59E0B]';
      case 'cancelled':
        return 'text-[#EF4444]';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">交易记录</h1>
        <span className="text-sm text-gray-500">共 {myTransactions.length} 笔交易</span>
      </div>

      <div className="space-y-4">
        {myTransactions.map((tx) => {
          const idea = getIdeaById(tx.ideaId);
          const buyer = getUserById(tx.buyerId);
          const seller = getUserById(tx.sellerId);
          const isBuyer = tx.buyerId === user?.id;
          const other = isBuyer ? seller : buyer;
          const StatusIcon = getStatusIcon(tx.status);

          return (
            <Card key={tx.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon className={cn('w-5 h-5', getStatusColor(tx.status))} />
                      <Tag variant={tx.status === 'completed' ? 'success' : tx.status === 'in_progress' ? 'warning' : 'danger'}>
                        {tx.status === 'completed' ? '已完成' : tx.status === 'in_progress' ? '进行中' : '已取消'}
                      </Tag>
                      <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {idea?.title || '未知创意'}
                    </h3>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar src={buyer?.avatar} size="sm" fallback={buyer?.nickname?.[0]} />
                        <span className="text-gray-600">{buyer?.nickname}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="flex items-center gap-2">
                        <Avatar src={seller?.avatar} size="sm" fallback={seller?.nickname?.[0]} />
                        <span className="text-gray-600">{seller?.nickname}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span>交易阶段：</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tx.stages.map((stage, index) => (
                          <div key={stage.id} className="flex items-center gap-1">
                            <div
                              className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                                stage.status === 'confirmed' ? 'bg-[#10B981] text-white' :
                                stage.status === 'submitted' ? 'bg-[#F59E0B] text-white' :
                                'bg-gray-100 text-gray-400'
                              )}
                            >
                              {index + 1}
                            </div>
                            {index < tx.stages.length - 1 && (
                              <div className={cn(
                                'w-4 h-0.5',
                                stage.status === 'confirmed' ? 'bg-[#10B981]' : 'bg-gray-200'
                              )} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-lg font-semibold text-[#FF6B35]">
                      <DollarSign className="w-5 h-5" />
                      {tx.amount}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {isBuyer ? '作为买方' : '作为卖方'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {myTransactions.length === 0 && (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无交易记录</p>
            <p className="text-sm text-gray-400 mt-1">在点子详情页提交报价开始交易</p>
          </div>
        )}
      </div>
    </div>
  );
}