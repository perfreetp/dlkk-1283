import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, CheckCircle, Clock, ChevronRight, Lightbulb, DollarSign, Package, Upload } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { Modal } from '@/components/common/Modal';
import { Textarea } from '@/components/common/Textarea';
import { Input } from '@/components/common/Input';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import type { Message, Stage } from '@/types';

export default function ChatRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getChatById, getUserById, getIdeaById, sendMessage, user, markMessagesRead, acceptOffer, rejectOffer, submitStageDeliverable, confirmStage, transactions, getTransactionById } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = getChatById(id || '');
  const otherId = chat?.participantIds.find((pid) => pid !== user?.id);
  const other = otherId ? getUserById(otherId) : null;
  const idea = chat?.ideaId ? getIdeaById(chat.ideaId) : null;
  const transaction = chat?.ideaId 
    ? transactions.find(t => t.ideaId === chat.ideaId && (t.buyerId === user?.id || t.sellerId === user?.id))
    : null;

  const [messageInput, setMessageInput] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [deliverable, setDeliverable] = useState('');

  useEffect(() => {
    if (chat) {
      markMessagesRead(chat.id);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, markMessagesRead]);

  if (!chat || !other) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">聊天不存在</p>
        <Button variant="outline" onClick={() => navigate('/chat')} className="mt-4">
          返回消息列表
        </Button>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: chat.id,
      senderId: user?.id || '',
      content: messageInput,
      type: 'text',
      read: false,
      createdAt: new Date().toISOString(),
    };

    sendMessage(chat.id, newMessage);
    setMessageInput('');
  };

  const handleAcceptOffer = (offerId: string) => {
    acceptOffer(chat.id, offerId);
  };

  const handleRejectOffer = (offerId: string) => {
    rejectOffer(chat.id, offerId);
  };

  const handleSubmitDeliverable = () => {
    if (!transaction || !selectedStageId || !deliverable) return;
    submitStageDeliverable(transaction.id, selectedStageId, deliverable);
    setDeliverable('');
    setShowDeliverableModal(false);
    setSelectedStageId(null);
  };

  const handleConfirmStage = (stageId: string) => {
    if (!transaction) return;
    confirmStage(transaction.id, stageId);
  };

  const getStageStatus = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { icon: CheckCircle, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' };
      case 'submitted':
        return { icon: Clock, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' };
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100' };
    }
  };

  const pendingOffers = chat.offers.filter(o => o.sellerId === user?.id && o.status === 'pending');
  const isSeller = user?.id === idea?.userId;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] lg:flex-row gap-4">
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Link to={`/user/${other.id}`} className="flex items-center gap-2 hover:opacity-80">
              <Avatar src={other.avatar} size="md" fallback={other.nickname[0]} />
              <span className="font-medium text-gray-900">{other.nickname}</span>
            </Link>
          </div>

          {idea && (
            <Link to={`/idea/${idea.id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#2D5BFF]">
              <Lightbulb className="w-4 h-4" />
              {idea.title.slice(0, 20)}...
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chat.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === user?.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Paperclip className="w-5 h-5 text-gray-400" />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="输入消息..."
              className="flex-1 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/20"
            />
            <Button variant="primary" size="sm" onClick={handleSendMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:w-80 shrink-0 space-y-4">
        {idea && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">关联创意</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 line-clamp-2">{idea.title}</p>
                <div className="flex items-center gap-2">
                  <Tag variant={idea.type === 'sell' ? 'primary' : 'secondary'}>
                    {idea.type === 'sell' ? '出售' : '找队友'}
                  </Tag>
                  {idea.budgetMin > 0 && (
                    <span className="text-sm font-semibold text-[#FF6B35]">
                      ¥{idea.budgetMin}-{idea.budgetMax}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {pendingOffers.length > 0 && isSeller && (
          <Card className="border-2 border-[#FF6B35]/30">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#FF6B35]" />
                待处理报价
              </h3>
              <div className="space-y-3">
                {pendingOffers.map((offer) => {
                  const buyer = getUserById(offer.buyerId);
                  return (
                    <div key={offer.id} className="p-3 rounded-xl bg-[#FF6B35]/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar src={buyer?.avatar} size="sm" fallback={buyer?.nickname?.[0]} />
                        <span className="text-sm font-medium">{buyer?.nickname}</span>
                      </div>
                      <p className="text-lg font-bold text-[#FF6B35] mb-1">¥{offer.amount}</p>
                      <p className="text-sm text-gray-500 mb-3">{offer.message}</p>
                      <div className="flex items-center gap-2">
                        <Button variant="primary" size="sm" className="flex-1" onClick={() => handleAcceptOffer(offer.id)}>
                          接受
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleRejectOffer(offer.id)}>
                          拒绝
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {transaction && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#2D5BFF]" />
                  交易阶段
                </h3>
                <Tag variant={transaction.status === 'completed' ? 'success' : transaction.status === 'in_progress' ? 'warning' : 'default'}>
                  {transaction.status === 'completed' ? '已完成' : transaction.status === 'in_progress' ? '进行中' : '已取消'}
                </Tag>
              </div>

              <div className="space-y-3">
                {transaction.stages.map((stage, index) => {
                  const statusInfo = getStageStatus(stage.status);
                  return (
                    <div key={stage.id} className="flex items-start gap-3">
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', statusInfo.bg)}>
                        <statusInfo.icon className={cn('w-3.5 h-3.5', statusInfo.color)} />
                      </div>
                      <div className="flex-1">
                        <p className={cn('text-sm font-medium', stage.status === 'confirmed' ? 'text-gray-900' : 'text-gray-500')}>
                          {stage.name}
                        </p>
                        <p className="text-xs text-gray-400">{stage.description}</p>
                        {stage.status === 'submitted' && (
                          <div className="mt-2">
                            {(user?.id === transaction.buyerId || user?.id === transaction.sellerId) && (
                              <Button variant="primary" size="sm" onClick={() => handleConfirmStage(stage.id)}>
                                确认完成
                              </Button>
                            )}
                          </div>
                        )}
                        {stage.status === 'confirmed' && (
                          <p className="text-xs text-[#10B981] mt-1">已完成 ✓</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {transaction.status === 'in_progress' && (
                <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => {
                  const nextStage = transaction.stages.find(s => s.status === 'submitted' || s.status === 'pending');
                  if (nextStage) {
                    setSelectedStageId(nextStage.id);
                    setShowDeliverableModal(true);
                  }
                }}>
                  <Upload className="w-4 h-4 mr-2" />
                  提交交付物
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">合作者信息</h3>
            <Link to={`/user/${other.id}`} className="flex items-center gap-3 hover:opacity-80">
              <Avatar src={other.avatar} size="lg" fallback={other.nickname[0]} />
              <div>
                <p className="font-medium text-gray-900">{other.nickname}</p>
                <p className="text-sm text-gray-500">{other.college}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm font-semibold text-[#10B981]">{other.creditScore}</span>
                  <span className="text-xs text-gray-400">信用分</span>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={showDeliverableModal} onClose={() => { setShowDeliverableModal(false); setSelectedStageId(null); }} title="提交交付物" size="md">
        <div className="space-y-4">
          <Textarea
            label="交付物说明"
            placeholder="请描述你提交的交付物内容"
            value={deliverable}
            onChange={(e) => setDeliverable(e.target.value)}
            rows={4}
          />
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { setShowDeliverableModal(false); setSelectedStageId(null); }} className="flex-1">
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmitDeliverable} className="flex-1" disabled={!deliverable}>
              提交
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}