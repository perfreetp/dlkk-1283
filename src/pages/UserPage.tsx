import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, TrendingUp, Users, Award, MessageSquare, CheckCircle, ThumbsUp, Send, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { IdeaCard } from '@/components/idea/IdeaCard';
import { useStore } from '@/store';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function UserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUserById, ideas, transactions, getUserReviewsReceived, getUserReviewsGiven, getCreditTrend } = useStore();

  const [reviewTab, setReviewTab] = useState<'received' | 'given'>('received');

  const user = getUserById(id || '');
  const userIdeas = ideas.filter((idea) => idea.userId === id);

  const reviewsReceived = transactions
    .filter((tx) => tx.buyerId === id || tx.sellerId === id)
    .flatMap((tx) => tx.reviews.filter((r) => r.toUserId === id));

  const reviewsGiven = transactions
    .filter((tx) => tx.buyerId === id || tx.sellerId === id)
    .flatMap((tx) => tx.reviews.filter((r) => r.fromUserId === id));

  const creditTrend = id === useStore.getState().user?.id ? getCreditTrend() : [];

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">用户不存在</p>
        <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
          返回首页
        </Button>
      </div>
    );
  }

  const calculateCredit = () => {
    if (reviewsReceived.length === 0) {
      return { score: 80, positiveRate: 100 };
    }
    const avgRating = reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewsReceived.length;
    const positiveCount = reviewsReceived.filter((r) => r.rating >= 4).length;
    const positiveRate = Math.round((positiveCount / reviewsReceived.length) * 100);
    const baseScore = Math.round(avgRating * 10);
    const transactionBonus = Math.min(user.transactionCount * 2, 20);
    const positiveBonus = Math.round(positiveRate / 10);
    const totalScore = Math.min(100, baseScore + transactionBonus + positiveBonus);
    return { score: totalScore, positiveRate };
  };

  const { score: dynamicScore, positiveRate } = calculateCredit();
  const displayScore = reviewsReceived.length > 0 ? dynamicScore : user.creditScore;

  const getCreditColor = (score: number) => {
    if (score >= 90) return 'text-[#10B981]';
    if (score >= 70) return 'text-[#F59E0B]';
    return 'text-[#EF4444]';
  };

  const getCreditBg = (score: number) => {
    if (score >= 90) return 'from-[#10B981]/20 to-[#10B981]/5';
    if (score >= 70) return 'from-[#F59E0B]/20 to-[#F59E0B]/5';
    return 'from-[#EF4444]/20 to-[#EF4444]/5';
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
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回
      </Button>

      <Card className={cn('overflow-hidden bg-gradient-to-br', getCreditBg(displayScore))}>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar src={user.avatar} size="xl" fallback={user.nickname[0]} />

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{user.nickname}</h1>
              <p className="text-gray-500 mb-4">{user.college} · {user.email}</p>

              <div className="flex items-center gap-4 justify-center md:justify-start">
                <div className="text-center">
                  <div className={cn('text-3xl font-bold', getCreditColor(displayScore))}>
                    {displayScore}
                  </div>
                  <p className="text-xs text-gray-400">信用分</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{user.transactionCount}</div>
                  <p className="text-xs text-gray-400">交易数</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="text-center">
                  <div className="text-xl font-bold text-[#10B981]">{positiveRate}%</div>
                  <p className="text-xs text-gray-400">好评率</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{userIdeas.length}</div>
                  <p className="text-xs text-gray-400">发布数</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {user.badges.map((badge) => (
                <Badge key={badge.id} icon={badge.icon} name={badge.name} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">发布的创意</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userIdeas.slice(0, 4).map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
                {userIdeas.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    暂无发布的创意
                  </div>
                )}
              </div>
              {userIdeas.length > 4 && (
                <div className="mt-4 text-center">
                  <Button variant="ghost" size="sm">
                    查看更多 ({userIdeas.length - 4} 个)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">评价记录</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReviewTab('received')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      reviewTab === 'received'
                        ? 'bg-[#FF6B35] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <ArrowDownRight className="w-3 h-3 inline mr-1" />
                    收到的 ({reviewsReceived.length})
                  </button>
                  <button
                    onClick={() => setReviewTab('given')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      reviewTab === 'given'
                        ? 'bg-[#2D5BFF] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <ArrowUpRight className="w-3 h-3 inline mr-1" />
                    给出的 ({reviewsGiven.length})
                  </button>
                </div>
              </div>

              {reviewTab === 'received' && (
                <div className="space-y-4 animate-fade-in">
                  {reviewsReceived.slice(0, 5).map((review, index) => {
                    const reviewer = getUserById(review.fromUserId);
                    const tx = transactions.find(t => t.reviews.some(r => r.id === review.id));
                    return (
                      <div key={`${review.id}-${index}`} className="p-4 rounded-xl bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar src={reviewer?.avatar} size="sm" fallback={reviewer?.nickname?.[0]} />
                            <span className="font-medium text-gray-900">{reviewer?.nickname}</span>
                            {tx && (
                              <span className="text-xs text-gray-400">交易：{tx.ideaTitle}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'w-4 h-4',
                                  star <= review.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600">{review.comment}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            响应 {review.dimensions.response}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            质量 {review.dimensions.quality}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            沟通 {review.dimensions.communication}
                          </span>
                          <span className="ml-auto">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {reviewsReceived.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      暂无收到的评价
                    </div>
                  )}
                </div>
              )}

              {reviewTab === 'given' && (
                <div className="space-y-4 animate-fade-in">
                  {reviewsGiven.slice(0, 5).map((review, index) => {
                    const reviewee = getUserById(review.toUserId);
                    const tx = transactions.find(t => t.reviews.some(r => r.id === review.id));
                    return (
                      <div key={`${review.id}-${index}`} className="p-4 rounded-xl bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Send className="w-4 h-4 text-[#2D5BFF]" />
                            <span className="font-medium text-gray-900">评价了</span>
                            <Avatar src={reviewee?.avatar} size="sm" fallback={reviewee?.nickname?.[0]} />
                            <span className="font-medium text-gray-900">{reviewee?.nickname}</span>
                            {tx && (
                              <span className="text-xs text-gray-400">交易：{tx.ideaTitle}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'w-4 h-4',
                                  star <= review.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600">{review.comment}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            响应 {review.dimensions.response}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            质量 {review.dimensions.quality}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            沟通 {review.dimensions.communication}
                          </span>
                          <span className="ml-auto">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {reviewsGiven.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      暂无给出的评价
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">信用评分详情</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">基础评分</span>
                  <span className="font-medium text-gray-900">
                    {reviewsReceived.length > 0 
                      ? Math.round(reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewsReceived.length * 10)
                      : 50}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">交易加分</span>
                  <span className="font-medium text-[#10B981]">
                    +{Math.min(user.transactionCount * 2, 20)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">好评率加分</span>
                  <span className="font-medium text-[#10B981]">
                    +{Math.round(positiveRate / 10)}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">总分</span>
                    <span className={cn('text-xl font-bold', getCreditColor(displayScore))}>
                      {displayScore}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {creditTrend.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#10B981]" />
                  信用趋势
                </h3>
                <div className="h-32 flex items-end gap-2">
                  {creditTrend.map((point, index) => {
                    const heightPercent = Math.max(20, (point.score / 100) * 100);
                    const isUp = index > 0 && point.score > creditTrend[index - 1].score;
                    const isDown = index > 0 && point.score < creditTrend[index - 1].score;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className={cn(
                            'w-full rounded-t-lg transition-all',
                            point.score >= 90 ? 'bg-[#10B981]' : 
                            point.score >= 70 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                          )}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-xs text-gray-400">{point.date}</span>
                        <span className={cn(
                          'text-xs font-medium',
                          isUp && 'text-[#10B981]',
                          isDown && 'text-[#EF4444]'
                        )}>
                          {point.score}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {creditTrend.length === 1 && (
                  <p className="text-center text-sm text-gray-500 mt-2">初始信用分 80</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">成就徽章</h3>
              <div className="grid grid-cols-2 gap-3">
                {user.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-3 rounded-xl bg-gradient-to-r from-[#FF6B35]/10 to-[#2D5BFF]/10 text-center"
                  >
                    <span className="text-2xl mb-1 block">{badge.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{badge.name}</span>
                    <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">活跃统计</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-[#10B981]" />
                  <span className="text-sm text-gray-600">本周活跃度</span>
                  <span className="text-sm font-medium text-gray-900">高</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#2D5BFF]" />
                  <span className="text-sm text-gray-600">合作人数</span>
                  <span className="text-sm font-medium text-gray-900">{user.transactionCount}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#FF6B35]" />
                  <span className="text-sm text-gray-600">好评率</span>
                  <span className="text-sm font-medium text-[#10B981]">{positiveRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}