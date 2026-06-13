import { History, CheckCircle, Clock, XCircle, DollarSign, ArrowRight, Star, ThumbsUp, Shield, FileText, User, Calendar, Link2, AlertTriangle, Download, Eye, MessageCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Textarea } from '@/components/common/Textarea';
import { useStore } from '@/store';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TransactionReview, Stage, Deliverable } from '@/types';

export default function TransactionsPage() {
  const { user, getUserById, getIdeaById, getUserTransactions, submitReview, transactions, calculateCreditScore } = useStore();
  const myTransactions = getUserTransactions();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<typeof myTransactions[0] | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewResponse, setReviewResponse] = useState(5);
  const [reviewQuality, setReviewQuality] = useState(5);
  const [reviewCommunication, setReviewCommunication] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [selectedDeliverables, setSelectedDeliverables] = useState<Deliverable[]>([]);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedDisputeTx, setSelectedDisputeTx] = useState<typeof myTransactions[0] | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      case 'cancelled':
        return XCircle;
      case 'disputed':
        return AlertTriangle;
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
      case 'disputed':
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

  const getDisputeStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', label: '待处理' };
      case 'processing':
        return { icon: MessageCircle, color: 'text-[#2D5BFF]', bg: 'bg-[#2D5BFF]/10', label: '处理中' };
      case 'resolved':
        return { icon: CheckCircle, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', label: '已解决' };
      case 'refunded':
        return { icon: XCircle, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', label: '已退款' };
      case 'continued':
        return { icon: RefreshCw, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', label: '继续交付' };
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100', label: '未知' };
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
      case 'disputed':
        return { label: '有争议', color: 'bg-[#EF4444] text-white' };
      default:
        return { label: '待开始', color: 'bg-gray-100 text-gray-400' };
    }
  };

  const getSettlementTypeText = (type: string) => {
    switch (type) {
      case 'continue':
        return '继续交付';
      case 'partial_refund':
        return '部分退款';
      case 'full_refund':
        return '全额退款';
      default:
        return type;
    }
  };

  const calculatePositiveRate = (userId: string) => {
    const userTxs = transactions.filter(tx => tx.buyerId === userId || tx.sellerId === userId);
    const reviews = userTxs.flatMap(tx => tx.reviews.filter(r => r.toUserId === userId));
    if (reviews.length === 0) return 100;
    const positiveCount = reviews.filter(r => r.rating >= 4).length;
    return Math.round((positiveCount / reviews.length) * 100);
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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

  const handleViewDeliverables = (deliverables: Deliverable[]) => {
    setSelectedDeliverables(deliverables);
    setShowDeliverableModal(true);
  };

  const handleViewDispute = (tx: typeof myTransactions[0]) => {
    setSelectedDisputeTx(tx);
    setShowDisputeModal(true);
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDeliverables(stage.deliverables);
                  }}
                  className="p-1 rounded hover:bg-gray-200"
                  title="查看交付物"
                >
                  <Eye className="w-3 h-3 text-[#2D5BFF]" />
                </button>
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
                      {d.fileSize && <span className="text-xs text-gray-400">{formatFileSize(d.fileSize)}</span>}
                      {d.fileData && (
                        <a 
                          href={d.fileData} 
                          download={d.name}
                          className="text-xs text-[#2D5BFF] flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          下载
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

          const otherCreditScore = other ? calculateCreditScore(other.id) : 0;
          const otherPositiveRate = other ? calculatePositiveRate(other.id) : 100;

          return (
            <Card key={tx.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon className={cn('w-5 h-5', getStatusColor(tx.status))} />
                      <Tag variant={
                        tx.status === 'completed' ? 'success' : 
                        tx.status === 'disputed' ? 'danger' : 
                        tx.status === 'in_progress' ? 'warning' : 'default'
                      }>
                        {tx.status === 'completed' ? '已完成' : tx.status === 'disputed' ? '争议中' : tx.status === 'in_progress' ? '进行中' : '待付款'}
                      </Tag>
                      <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {tx.ideaTitle || idea?.title || '未知创意'}
                    </h3>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar src={buyer?.avatar} size="sm" fallback={buyer?.nickname?.[0]} />
                        <div>
                          <span className="text-gray-600">{buyer?.nickname}</span>
                          {buyer && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-[#10B981] font-medium">{calculateCreditScore(buyer.id)}</span>
                              <span className="text-gray-400">分</span>
                              <span className="text-gray-300">|</span>
                              <span className="text-[#10B981]">{calculatePositiveRate(buyer.id)}%</span>
                              <span className="text-gray-400">好评</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="flex items-center gap-2">
                        <Avatar src={seller?.avatar} size="sm" fallback={seller?.nickname?.[0]} />
                        <div>
                          <span className="text-gray-600">{seller?.nickname}</span>
                          {seller && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-[#10B981] font-medium">{calculateCreditScore(seller.id)}</span>
                              <span className="text-gray-400">分</span>
                              <span className="text-gray-300">|</span>
                              <span className="text-[#10B981]">{calculatePositiveRate(seller.id)}%</span>
                              <span className="text-gray-400">好评</span>
                            </div>
                          )}
                        </div>
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

                <div className="mb-4">
                  <div className={cn('p-4 rounded-xl', paymentInfo.bg)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <paymentInfo.icon className={cn('w-5 h-5', paymentInfo.color)} />
                        <span className={cn('font-medium', paymentInfo.color)}>{paymentInfo.label}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {tx.paymentStatus === 'settled' && tx.settlement?.method === 'auto' ? '自动结算' : 
                         tx.paymentStatus === 'settled' && tx.settlement?.method === 'manual' ? '手动结算' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-2 rounded-lg bg-white/50">
                        <p className="text-gray-400">创建时间</p>
                        <p className="text-gray-700 font-medium">{formatDate(tx.createdAt)}</p>
                      </div>
                      {tx.paidAt && (
                        <div className="p-2 rounded-lg bg-white/50">
                          <p className="text-gray-400">付款时间</p>
                          <p className="text-gray-700 font-medium">{formatDate(tx.paidAt)}</p>
                        </div>
                      )}
                      {tx.escrowAt && (
                        <div className="p-2 rounded-lg bg-white/50">
                          <p className="text-gray-400">托管时间</p>
                          <p className="text-gray-700 font-medium">{formatDate(tx.escrowAt)}</p>
                        </div>
                      )}
                      {tx.settlement?.stageCompletedAt && (
                        <div className="p-2 rounded-lg bg-white/50">
                          <p className="text-gray-400">交付确认</p>
                          <p className="text-gray-700 font-medium">{formatDate(tx.settlement.stageCompletedAt)}</p>
                        </div>
                      )}
                      {tx.settledAt && (
                        <div className="p-2 rounded-lg bg-white/50">
                          <p className="text-gray-400">结算到账</p>
                          <p className="text-[#10B981] font-medium">{formatDate(tx.settledAt)}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      {tx.paymentStatus === 'unpaid' && '买方尚未确认付款，交易等待开始'}
                      {tx.paymentStatus === 'escrow' && '资金已托管，交易正在进行中'}
                      {tx.paymentStatus === 'settled' && tx.settlement?.settlementType && (
                        <span>处理方式：{getSettlementTypeText(tx.settlement.settlementType)}</span>
                      )}
                      {tx.paymentStatus === 'settled' && !tx.settlement?.settlementType && '交易已完成，资金已结算给卖方'}
                    </div>
                  </div>
                </div>

                {tx.dispute && (
                  <div className="mb-4">
                    <button
                      onClick={() => handleViewDispute(tx)}
                      className={cn('w-full p-3 rounded-xl text-left', getDisputeStatusInfo(tx.dispute.status).bg)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const info = getDisputeStatusInfo(tx.dispute.status);
                            return <info.icon className={cn('w-4 h-4', info.color)} />;
                          })()}
                          <span className={cn('font-medium', getDisputeStatusInfo(tx.dispute.status).color)}>
                            争议：{getDisputeStatusInfo(tx.dispute.status).label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">点击查看详情</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{tx.dispute.reason}</p>
                    </button>
                  </div>
                )}

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

      <Modal isOpen={showDeliverableModal} onClose={() => { setShowDeliverableModal(false); setSelectedDeliverables([]); }} title="交付物详情" size="lg">
        <div className="space-y-3">
          {selectedDeliverables.map((d) => (
            <div key={d.id} className="p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-[#2D5BFF]" />
                <span className="font-medium text-gray-900">{d.name}</span>
                {d.fileSize && <span className="text-xs text-gray-400">{formatFileSize(d.fileSize)}</span>}
              </div>
              {d.description && <p className="text-sm text-gray-500 mb-2">{d.description}</p>}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>上传者：{getUserById(d.uploadedBy)?.nickname}</span>
                <span>时间：{formatDate(d.uploadedAt)}</span>
              </div>
              {d.fileData && d.fileType === 'image' && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  <img src={d.fileData} alt={d.name} className="max-w-full h-auto" />
                </div>
              )}
              {d.fileData && d.fileType !== 'image' && (
                <div className="mt-3">
                  <a 
                    href={d.fileData} 
                    download={d.name}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2D5BFF]/10 text-[#2D5BFF] text-sm hover:bg-[#2D5BFF]/20"
                  >
                    <Download className="w-4 h-4" />
                    下载文件
                  </a>
                </div>
              )}
            </div>
          ))}
          {selectedDeliverables.length === 0 && (
            <p className="text-center text-gray-500 py-4">暂无交付物</p>
          )}
        </div>
      </Modal>

      <Modal isOpen={showDisputeModal} onClose={() => { setShowDisputeModal(false); setSelectedDisputeTx(null); }} title="争议详情" size="lg">
        {selectedDisputeTx?.dispute && (
          <div className="space-y-4">
            <div className={cn('p-4 rounded-xl', getDisputeStatusInfo(selectedDisputeTx.dispute.status).bg)}>
              <div className="flex items-center gap-2">
                {(() => {
                  const info = getDisputeStatusInfo(selectedDisputeTx.dispute.status);
                  return <info.icon className={cn('w-5 h-5', info.color)} />;
                })()}
                <span className={cn('font-medium', getDisputeStatusInfo(selectedDisputeTx.dispute.status).color)}>
                  {getDisputeStatusInfo(selectedDisputeTx.dispute.status).label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                发起时间：{formatDate(selectedDisputeTx.dispute.createdAt)}
              </p>
              {selectedDisputeTx.dispute.resolvedAt && (
                <p className="text-sm text-gray-500">
                  解决时间：{formatDate(selectedDisputeTx.dispute.resolvedAt)}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">异议原因</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{selectedDisputeTx.dispute.reason}</p>
            </div>

            {selectedDisputeTx.dispute.responses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">证据材料与回应</h4>
                <div className="space-y-3">
                  {selectedDisputeTx.dispute.responses.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar src={getUserById(r.userId)?.avatar} size="sm" fallback={getUserById(r.userId)?.nickname?.[0]} />
                        <span className="text-sm font-medium">{getUserById(r.userId)?.nickname}</span>
                        <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                      </div>
                      {r.attachments.map((att) => (
                        <div key={att.id} className="mb-2 last:mb-0">
                          {att.type === 'text' && (
                            <p className="text-sm text-gray-600 bg-white p-2 rounded-lg">{att.content}</p>
                          )}
                          {att.type === 'file' && (
                            <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                              <FileText className="w-4 h-4 text-[#2D5BFF]" />
                              <span className="text-sm flex-1">{att.fileName}</span>
                              {att.fileSize && <span className="text-xs text-gray-400">{formatFileSize(att.fileSize)}</span>}
                              {att.content && att.content.startsWith('data:image') ? (
                                <a href={att.content} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2D5BFF]">预览</a>
                              ) : att.content ? (
                                <a href={att.content} download={att.fileName} className="text-xs text-[#2D5BFF]">下载</a>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDisputeTx.dispute.resolution && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">处理结果</h4>
                <div className="p-4 rounded-xl bg-[#10B981]/10">
                  <p className="text-sm text-gray-700">{selectedDisputeTx.dispute.resolution}</p>
                  {selectedDisputeTx.dispute.settlementType && (
                    <p className="text-sm text-[#2D5BFF] mt-2">
                      处理方式：{getSettlementTypeText(selectedDisputeTx.dispute.settlementType)}
                    </p>
                  )}
                  {selectedDisputeTx.dispute.refundAmount && (
                    <p className="text-sm text-[#EF4444] mt-2">退款金额：¥{selectedDisputeTx.dispute.refundAmount}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}