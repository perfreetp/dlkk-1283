import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Flag, MessageSquare, Send, Download, Eye, Image, FileText, File, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { Tag } from '@/components/common/Tag';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { IdeaCard } from '@/components/idea/IdeaCard';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

export default function IdeaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getIdeaById, getUserById, isFavorite, likeIdea, unlikeIdea, favoriteIdea, unfavoriteIdea, addChat, sendMessage, user, ideas } = useStore();

  const idea = getIdeaById(id || '');
  const author = idea ? getUserById(idea.userId) : null;
  const favorite = isFavorite(idea?.id || '');

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [reportReason, setReportReason] = useState('');

  if (!idea || !author) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">创意不存在或已被删除</p>
        <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
          返回首页
        </Button>
      </div>
    );
  }

  const handleLike = () => {
    likeIdea(idea.id);
  };

  const handleFavorite = () => {
    if (favorite) {
      unfavoriteIdea(idea.id);
    } else {
      favoriteIdea(idea.id);
    }
  };

  const handleStartChat = () => {
    const existingChat = useStore.getState().chats.find(
      (c) => c.participantIds.includes(user?.id || '') && c.participantIds.includes(author.id) && c.ideaId === idea.id
    );

    if (existingChat) {
      navigate(`/chat/${existingChat.id}`);
      return;
    }

    const newChat = {
      id: `chat-${Date.now()}`,
      participantIds: [user?.id || '', author.id],
      ideaId: idea.id,
      messages: [],
      lastMessageAt: new Date().toISOString(),
    };
    addChat(newChat);
    navigate(`/chat/${newChat.id}`);
  };

  const handleSubmitOffer = () => {
    if (!offerAmount || !offerMessage) return;

    const systemMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: '',
      senderId: user?.id || '',
      content: `报价 ¥${offerAmount}：${offerMessage}`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    };

    handleStartChat();
    setShowOfferModal(false);
    setOfferAmount('');
    setOfferMessage('');
  };

  const handleReport = () => {
    if (!reportReason) return;
    setShowReportModal(false);
    setReportReason('');
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image;
      case 'pdf':
        return FileText;
      default:
        return File;
    }
  };

  const similarIdeas = ideas
    .filter((i) => i.id !== idea.id && (i.field === idea.field || i.college === idea.college))
    .slice(0, 3);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <div className="flex items-center gap-2">
          <Tag variant={idea.type === 'sell' ? 'primary' : 'secondary'}>
            {idea.type === 'sell' ? '出售' : '找队友'}
          </Tag>
          {idea.status !== 'active' && (
            <Tag variant={idea.status === 'completed' ? 'success' : 'warning'}>
              {idea.status === 'completed' ? '已完成' : '已关闭'}
            </Tag>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            {idea.attachments.length > 0 && idea.attachments[0].type === 'image' && (
              <div className="relative h-64 overflow-hidden">
                <img
                  src={idea.attachments[0].url}
                  alt={idea.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardContent className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{idea.title}</h1>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                <span>{formatDate(idea.createdAt)}</span>
                <span>{idea.college}</span>
                <span>{idea.field}</span>
                {idea.budgetMin > 0 && (
                  <span className="font-semibold text-[#FF6B35]">
                    预算：¥{idea.budgetMin} - ¥{idea.budgetMax}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-6">
                {idea.tags.map((tag) => (
                  <span key={tag} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{idea.description}</p>
              </div>
            </CardContent>
          </Card>

          {idea.attachments.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">附件资料</h3>
                <div className="space-y-3">
                  {idea.attachments.map((att) => {
                    const Icon = getAttachmentIcon(att.type);
                    return (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-700">{att.name}</span>
                          <span className="text-xs text-gray-400">{(att.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {similarIdeas.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">相似创意推荐</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowSimilarModal(true)}>
                    查看更多
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {similarIdeas.map((i) => (
                    <IdeaCard key={i.id} idea={i} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Link to={`/user/${author.id}`} className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
                <Avatar src={author.avatar} size="lg" fallback={author.nickname[0]} />
                <div>
                  <h3 className="font-semibold text-gray-900">{author.nickname}</h3>
                  <p className="text-sm text-gray-500">{author.college}</p>
                </div>
              </Link>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#10B981]">{author.creditScore}</p>
                  <p className="text-xs text-gray-400">信用分</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{author.transactionCount}</p>
                  <p className="text-xs text-gray-400">交易数</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {author.badges.slice(0, 3).map((badge) => (
                  <span key={badge.id} className="text-lg" title={badge.description}>
                    {badge.icon}
                  </span>
                ))}
              </div>

              <Button variant="outline" className="w-full" onClick={handleStartChat}>
                <MessageSquare className="w-4 h-4 mr-2" />
                发起私聊
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">互动数据</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <p className="text-lg font-bold text-gray-900">{idea.likes}</p>
                  <p className="text-xs text-gray-400">点赞</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <p className="text-lg font-bold text-gray-900">{idea.favorites}</p>
                  <p className="text-xs text-gray-400">收藏</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant={favorite ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={handleFavorite}
                >
                  <Heart className={cn('w-4 h-4 mr-2', favorite && 'fill-white')} />
                  {favorite ? '已收藏' : '收藏'}
                </Button>

                <Button variant="ghost" className="w-full" onClick={handleLike}>
                  <Heart className="w-4 h-4 mr-2" />
                  点赞
                </Button>

                <Button variant="ghost" className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  分享
                </Button>

                <Button variant="ghost" className="w-full text-gray-400" onClick={() => setShowReportModal(true)}>
                  <Flag className="w-4 h-4 mr-2" />
                  举报
                </Button>
              </div>
            </CardContent>
          </Card>

          {idea.type === 'sell' && idea.status === 'active' && (
            <Card className="border-2 border-[#FF6B35]/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-[#FF6B35]" />
                  <h3 className="font-semibold text-gray-900">提交报价</h3>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  如果你对这个创意感兴趣，可以提交报价与发布者沟通。
                </p>

                <Button variant="primary" className="w-full" onClick={() => setShowOfferModal(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  提交报价
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showOfferModal} onClose={() => setShowOfferModal(false)} title="提交报价" size="md">
        <div className="space-y-4">
          <Input
            label="报价金额"
            type="number"
            placeholder="请输入你的报价"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
          />
          <Textarea
            label="报价说明"
            placeholder="请简要说明你的报价理由和联系方式"
            value={offerMessage}
            onChange={(e) => setOfferMessage(e.target.value)}
            rows={4}
          />
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setShowOfferModal(false)} className="flex-1">
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmitOffer} className="flex-1">
              提交报价
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="举报内容" size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 text-[#EF4444]">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">举报将提交给管理员审核，请确保举报理由真实有效。</span>
          </div>
          <Textarea
            label="举报理由"
            placeholder="请详细说明举报理由，如抄袭、虚假信息等"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={4}
          />
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setShowReportModal(false)} className="flex-1">
              取消
            </Button>
            <Button variant="danger" onClick={handleReport} className="flex-1">
              提交举报
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showSimilarModal} onClose={() => setShowSimilarModal(false)} title="相似创意" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            以下创意与当前创意在领域或学院上有相似之处，你可以参考或考虑合并。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {similarIdeas.map((i) => (
              <IdeaCard key={i.id} idea={i} />
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}