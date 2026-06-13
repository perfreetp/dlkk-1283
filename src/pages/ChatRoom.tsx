import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, CheckCircle, Clock, ChevronRight, Lightbulb, DollarSign, Package, Upload, User, FileText, Edit3, Plus, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { Modal } from '@/components/common/Modal';
import { Textarea } from '@/components/common/Textarea';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import type { Message, Deliverable } from '@/types';

export default function ChatRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getChatById, getUserById, getIdeaById, sendMessage, user, markMessagesRead, acceptOffer, rejectOffer, confirmPayment, updateStageAssignee, updateStageNotes, addDeliverable, submitStage, confirmStage, settleTransaction, transactions } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = getChatById(id || '');
  const otherId = chat?.participantIds.find((pid) => pid !== user?.id);
  const other = otherId ? getUserById(otherId) : null;
  const idea = chat?.ideaId ? getIdeaById(chat.ideaId) : null;
  const transaction = chat?.transactionId 
    ? transactions.find(t => t.id === chat.transactionId)
    : chat?.ideaId 
      ? transactions.find(t => t.ideaId === chat.ideaId && (t.buyerId === user?.id || t.sellerId === user?.id))
      : null;

  const [messageInput, setMessageInput] = useState('');
  const [showStageModal, setShowStageModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [deliverableName, setDeliverableName] = useState('');
  const [deliverableDesc, setDeliverableDesc] = useState('');
  const [stageNotes, setStageNotes] = useState('');
  const [stageAssignee, setStageAssignee] = useState('');

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

  const handleConfirmPayment = () => {
    if (!transaction) return;
    confirmPayment(transaction.id);
  };

  const handleSubmitDeliverable = () => {
    if (!transaction || !selectedStageId || !deliverableName) return;
    
    const deliverable: Deliverable = {
      id: `del-${Date.now()}`,
      name: deliverableName,
      description: deliverableDesc,
      uploadedBy: user?.id || '',
      uploadedAt: new Date().toISOString(),
    };
    
    addDeliverable(transaction.id, selectedStageId, deliverable);
    setDeliverableName('');
    setDeliverableDesc('');
    setShowDeliverableModal(false);
    setSelectedStageId(null);
  };

  const handleSubmitStage = (stageId: string) => {
    if (!transaction) return;
    submitStage(transaction.id, stageId);
  };

  const handleConfirmStage = (stageId: string) => {
    if (!transaction) return;
    confirmStage(transaction.id, stageId);
  };

  const handleSettleTransaction = () => {
    if (!transaction) return;
    settleTransaction(transaction.id);
  };

  const handleUpdateStageNotes = () => {
    if (!transaction || !selectedStageId) return;
    updateStageNotes(transaction.id, selectedStageId, stageNotes);
    setShowStageModal(false);
  };

  const handleUpdateStageAssignee = () => {
    if (!transaction || !selectedStageId) return;
    updateStageAssignee(transaction.id, selectedStageId, stageAssignee);
    setShowStageModal(false);
  };

  const getStageStatus = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { icon: CheckCircle, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' };
      case 'submitted':
        return { icon: Clock, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' };
      case 'in_progress':
        return { icon: Clock, color: 'text-[#2D5BFF]', bg: 'bg-[#2D5BFF]/10' };
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100' };
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'unpaid':
        return '待付款';
      case 'escrow':
        return '已托管';
      case 'settled':
        return '已结算';
      default:
        return '未知';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid':
        return 'text-[#EF4444]';
      case 'escrow':
        return 'text-[#F59E0B]';
      case 'settled':
        return 'text-[#10B981]';
      default:
        return 'text-gray-400';
    }
  };

  const pendingOffers = chat.offers.filter(o => o.sellerId === user?.id && o.status === 'pending');
  const isSeller = user?.id === idea?.userId;
  const isBuyer = user?.id === transaction?.buyerId;

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
          <>
            <Card className={cn(
              transaction.paymentStatus === 'unpaid' && 'border-2 border-[#EF4444]/30',
              transaction.paymentStatus === 'escrow' && 'border-2 border-[#F59E0B]/30',
              transaction.paymentStatus === 'settled' && 'border-2 border-[#10B981]/30'
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#FF6B35]" />
                    资金状态
                  </h3>
                  <Tag variant={
                    transaction.paymentStatus === 'settled' ? 'success' :
                    transaction.paymentStatus === 'escrow' ? 'warning' : 'danger'
                  }>
                    {getPaymentStatusText(transaction.paymentStatus)}
                  </Tag>
                </div>

                <div className="text-center py-4">
                  <p className="text-2xl font-bold text-[#FF6B35]">¥{transaction.amount}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {transaction.paymentStatus === 'unpaid' && '买方尚未确认付款'}
                    {transaction.paymentStatus === 'escrow' && '资金已托管，交易进行中'}
                    {transaction.paymentStatus === 'settled' && '已结算给卖方'}
                  </p>
                </div>

                {transaction.paymentStatus === 'unpaid' && isBuyer && (
                  <Button variant="primary" className="w-full" onClick={handleConfirmPayment}>
                    确认付款
                  </Button>
                )}

                {transaction.paymentStatus === 'escrow' && transaction.stages.every(s => s.status === 'confirmed') && isBuyer && (
                  <Button variant="primary" className="w-full" onClick={handleSettleTransaction}>
                    确认结算
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#2D5BFF]" />
                    交易阶段
                  </h3>
                  <Tag variant={transaction.status === 'completed' ? 'success' : transaction.status === 'in_progress' ? 'warning' : 'default'}>
                    {transaction.status === 'completed' ? '已完成' : transaction.status === 'in_progress' ? '进行中' : '待付款'}
                  </Tag>
                </div>

                <div className="space-y-3">
                  {transaction.stages.map((stage) => {
                    const statusInfo = getStageStatus(stage.status);
                    const assignee = stage.assigneeId ? getUserById(stage.assigneeId) : null;
                    return (
                      <div key={stage.id} className="p-3 rounded-xl bg-gray-50">
                        <div className="flex items-start gap-3">
                          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0', statusInfo.bg)}>
                            <statusInfo.icon className={cn('w-3.5 h-3.5', statusInfo.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={cn('text-sm font-medium', stage.status === 'confirmed' ? 'text-gray-900' : 'text-gray-500')}>
                                {stage.name}
                              </p>
                              <button
                                onClick={() => {
                                  setSelectedStageId(stage.id);
                                  setStageNotes(stage.notes || '');
                                  setStageAssignee(stage.assigneeId || '');
                                  setShowStageModal(true);
                                }}
                                className="p-1 rounded hover:bg-gray-200"
                              >
                                <Edit3 className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>
                            
                            {assignee && (
                              <div className="flex items-center gap-1 mt-1">
                                <User className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{assignee.nickname}</span>
                              </div>
                            )}
                            
                            {stage.notes && (
                              <p className="text-xs text-gray-400 mt-1 truncate">{stage.notes}</p>
                            )}

                            {stage.deliverables.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {stage.deliverables.map((d) => (
                                  <div key={d.id} className="flex items-center gap-1 text-xs text-gray-500">
                                    <FileText className="w-3 h-3" />
                                    {d.name}
                                  </div>
                                ))}
                              </div>
                            )}

                            {stage.status === 'in_progress' && transaction.paymentStatus === 'escrow' && (
                              <div className="mt-2 flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                  setSelectedStageId(stage.id);
                                  setShowDeliverableModal(true);
                                }}>
                                  <Plus className="w-3 h-3 mr-1" />
                                  添加交付物
                                </Button>
                                <Button variant="primary" size="sm" onClick={() => handleSubmitStage(stage.id)}>
                                  提交阶段
                                </Button>
                              </div>
                            )}

                            {stage.status === 'submitted' && isBuyer && (
                              <Button variant="primary" size="sm" className="mt-2" onClick={() => handleConfirmStage(stage.id)}>
                                确认完成
                              </Button>
                            )}

                            {stage.status === 'confirmed' && (
                              <p className="text-xs text-[#10B981] mt-1">已完成 ✓</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
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

      <Modal isOpen={showDeliverableModal} onClose={() => { setShowDeliverableModal(false); setSelectedStageId(null); }} title="添加交付物" size="md">
        <div className="space-y-4">
          <Input
            label="交付物名称"
            placeholder="例如：设计稿、文档、代码"
            value={deliverableName}
            onChange={(e) => setDeliverableName(e.target.value)}
          />
          <Textarea
            label="描述说明"
            placeholder="简要描述交付物内容"
            value={deliverableDesc}
            onChange={(e) => setDeliverableDesc(e.target.value)}
            rows={3}
          />
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { setShowDeliverableModal(false); setSelectedStageId(null); }} className="flex-1">
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmitDeliverable} className="flex-1" disabled={!deliverableName}>
              添加
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showStageModal} onClose={() => { setShowStageModal(false); setSelectedStageId(null); }} title="编辑阶段" size="md">
        {selectedStageId && transaction && (
          <div className="space-y-4">
            <Select
              label="负责人"
              options={[
                { value: '', label: '未分配' },
                { value: transaction.buyerId, label: getUserById(transaction.buyerId)?.nickname || '买方' },
                { value: transaction.sellerId, label: getUserById(transaction.sellerId)?.nickname || '卖方' },
              ]}
              value={stageAssignee}
              onChange={(e) => setStageAssignee(e.target.value)}
            />
            <Textarea
              label="进展备注"
              placeholder="记录当前进展或说明"
              value={stageNotes}
              onChange={(e) => setStageNotes(e.target.value)}
              rows={3}
            />
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => { setShowStageModal(false); setSelectedStageId(null); }} className="flex-1">
                取消
              </Button>
              <Button variant="primary" onClick={() => {
                handleUpdateStageAssignee();
                handleUpdateStageNotes();
              }} className="flex-1">
                保存
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}