import { History, CheckCircle, Clock, XCircle, DollarSign, ArrowRight, Star, ThumbsUp, Shield, FileText, User, Calendar, Link2 } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Textarea } from '@/components/common/Textarea';
import { useStore } from '@/store';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TransactionReview, Stage } from '@/types';

export default function TransactionsPage() {
  const { user, getUserById, getIdeaById, getUserTransactions, submitReview, transactions } = useStore();
  const myTransactions = getUserTransactions();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<typeof myTransactions[0] | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewResponse, setReviewResponse] = useState(5);
  const [reviewQuality, setReviewQuality] = useState(5);
  const [reviewCommunication, setReviewCommunication] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

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

  const getPaymentStatusInfo = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'unpaid':
        return { label: '待付款', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', icon: DollarSign };
      case 'escrow':
        return { label: '已托管', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', icon: Shield };
      case 'settled':
        return { label: '已结算', color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', icon: CheckCircle };
      default:
        return { label: '未知', color: 'text-gray-400', bg: 'bg-gray-100', icon: Clock };
    }
  };

  const getStageStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: '已完成', color: 'bg-[#10B981] text-white' };
      case 'submitted':
        return { label: '待确认', color: 'bg-[#F59E0B] text-white' };
      case 'in_progress':
        return { label: '进行中', color: 'bg-[#2D5BFF] text-white' };
      default:
        return { label: '待开始', color: 'bg-gray-100 text-gray-400' };
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenReview = (tx: typeof myTransactions[0]) => {
    setSelectedTransaction(tx);
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!selectedTransaction || !user) return;

    const otherUserId = selectedTransaction.buyerId === user.id 
      ? selectedTransaction.sellerId 
      : selectedTransaction.buyerId;

    const hasReviewed = selectedTransaction.reviews.some(
      r => r.fromUserId === user.id && r.toUserId === otherUserId
    );

    if (hasReviewed) {
      setShowReviewModal(false);
      return;
    }

    const review: TransactionReview = {
      id: `review-${Date.now()}`,
      fromUserId: user.id,
      toUserId: otherUserId,
      rating: reviewRating,
      dimensions: {
        response: reviewResponse,
        quality: reviewQuality,
        communication: reviewCommunication,
      },
      comment: reviewComment,
      createdAt: new Date().toISOString(),
    };

    submitReview(selectedTransaction.id, review);
    setShowReviewModal(false);
    setReviewRating(5);
    setReviewResponse(5);
    setReviewQuality(5);
    setReviewCommunication(5);
    setReviewComment('');
    setSelectedTransaction(null);
  };

  const canSubmitReview = (tx: typeof myTransactions[0]) => {
    if (!user || tx.status !== 'completed' || tx.paymentStatus !== 'settled') return false;
    
    const otherUserId = tx.buyerId === user.id ? tx.sellerId : tx.buyerId;
    const hasReviewed = tx.reviews.some(
      r => r.fromUserId === user.id && r.toUserId === otherUserId
    );
    
    return !hasReviewed;
  };

  const StageDetailCard = ({ stage, index, tx }: { stage: Stage; index: number; tx: typeof myTransactions[0] }) => {
    const isExpanded = expandedStage === stage.id;
    const statusInfo = getStageStatusInfo(stage.status);
    const assignee = stage.assigneeId ? getUserById(stage.assigneeId) : null;

    return (
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div 
          className={cn('p-3 cursor-pointer hover:bg-gray-50 transition-colors', isExpanded && 'bg-gray-50')}
          onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium', statusInfo.color)}>
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900">{stage.name}</p>
                <p className="text-xs text-gray-400">{stage.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs px-2 py-1 rounded-full', statusInfo.color)}>
                {statusInfo.label}
              </span>
              {stage.deliverables.length > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {stage.deliverables.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 animate-fade-in">
            {assignee && (
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">负责人：</span>
                <Avatar src={assignee.avatar} size="sm" fallback={assignee.nickname[0]} />
                <span className="text-sm font-medium text-gray-900">{assignee.nickname}</span>
              </div>
            )}

            {stage.notes && (
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-1">进展说明：</p>
                <p className="text-sm text-gray-700 bg-white p-2 rounded-lg">{stage.notes}</p>
              </div>
            )}

            {stage.deliverables.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-2">交付物 ({stage.deliverables.length})：</p>
                <div className="space-y-2">
                  {stage.deliverables.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <FileText className="w-4 h-4 text-[#2D5BFF]" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{d.name}</p>
                        {d.description && <p className="text-xs text-gray-400">{d.description}</p>}
                      </div>
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2D5BFF] flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          查看
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-400">
              {stage.startedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  开始：{formatDate(stage.startedAt)}
                </span>
              )}
              {stage.submittedAt && (
                <span className="flex items-center gap-1">
                  提交：{formatDate(stage.submittedAt)}
                </span>
              )}
              {stage.confirmedAt && (
                <span className="flex items-center gap-1">
                  确认：{formatDate(stage.confirmedAt)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
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
          const paymentInfo = getPaymentStatusInfo(tx.paymentStatus);

          const otherUserId = tx.buyerId === user?.id ? tx.sellerId : tx.buyerId;
          const userReview = tx.reviews.find(r => r.fromUserId === user?.id && r.toUserId === otherUserId);

          return (
            <Card key={tx.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon className={cn('w-5 h-5', getStatusColor(tx.status))} />
                      <Tag variant={tx.status === 'completed' ? 'success' : tx.status === 'in_progress' ? 'warning' : 'danger'}>
                        {tx.status === 'completed' ? '已完成' : tx.status === 'in_progress' ? '进行中' : '已取消'}
                      </Tag>
                      <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {tx.ideaTitle || idea?.title || '未知创意'}
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

                <div className={cn('p-3 rounded-xl mb-4', paymentInfo.bg)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <paymentInfo.icon className={cn('w-5 h-5', paymentInfo.color)} />
                      <span className={cn('font-medium', paymentInfo.color)}>{paymentInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {tx.paidAt && (
                        <span>付款时间：{formatDate(tx.paidAt)}</span>
                      )}
                      {tx.settledAt && (
                        <span>结算时间：{formatDate(tx.settledAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {tx.paymentStatus === 'unpaid' && '买方尚未确认付款，交易等待开始'}
                    {tx.paymentStatus === 'escrow' && '资金已托管，交易正在进行中'}
                    {tx.paymentStatus === 'settled' && '交易已完成，资金已结算给卖方'}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">交易阶段进度</p>
                  <div className="space-y-2">
                    {tx.stages.map((stage, index) => (
                      <StageDetailCard key={stage.id} stage={stage} index={index} tx={tx} />
                    ))}
                  </div>
                </div>

                {tx.reviews.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">评价记录</p>
                    {tx.reviews.map((review) => {
                      const reviewer = getUserById(review.fromUserId);
                      const reviewee = getUserById(review.toUserId);
                      return (
                        <div key={review.id} className="flex items-center gap-2 text-sm">
                          <Avatar src={reviewer?.avatar} size="sm" fallback={reviewer?.nickname?.[0]} />
                          <span className="text-gray-600">{reviewer?.nickname}</span>
                          <span className="text-gray-400">评价</span>
                          <span className="text-gray-600">{reviewee?.nickname}</span>
                          <div className="flex items-center gap-0.5 ml-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'w-3 h-3',
                                  star <= review.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <span className="text-xs text-gray-400 ml-2">{review.comment.slice(0, 20)}...</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {canSubmitReview(tx) && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => handleOpenReview(tx)}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    给对方评分
                  </Button>
                )}

                {userReview && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-[#10B981]">
                    <CheckCircle className="w-4 h-4" />
                    已评价 (评分：{userReview.rating}星)
                  </div>
                )}
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

      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="评价交易" size="md">
        {selectedTransaction && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              请对交易伙伴进行评价，你的评价会影响对方的信用分。
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">总体评分</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        'w-8 h-8',
                        star <= reviewRating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-300'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">响应速度</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewResponse(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        'w-6 h-6',
                        star <= reviewResponse ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-300'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">交付质量</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewQuality(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        'w-6 h-6',
                        star <= reviewQuality ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-300'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">沟通态度</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewCommunication(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        'w-6 h-6',
                        star <= reviewCommunication ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-300'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="评价内容"
              placeholder="请简要描述你的交易体验（选填）"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
            />

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setShowReviewModal(false)} className="flex-1">
                取消
              </Button>
              <Button variant="primary" onClick={handleSubmitReview} className="flex-1">
                提交评价
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}