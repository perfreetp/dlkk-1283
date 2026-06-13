import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, CheckCircle, Clock, ChevronRight, Lightbulb, DollarSign, Package, Upload, User, FileText, Edit3, Plus, Trash2, AlertTriangle, XCircle, Download, Eye, MessageCircle, RefreshCw } from 'lucide-react';
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
import type { Message, Deliverable, DisputeEvidence, DisputeResponse } from '@/types';

interface PendingDeliverable {
  name: string;
  description: string;
  file?: File;
  previewUrl?: string;
}

export default function ChatRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getChatById, getUserById, getIdeaById, sendMessage, user, markMessagesRead, acceptOffer, rejectOffer, confirmPayment, updateStageAssignee, updateStageNotes, addDeliverablesBatch, submitStage, confirmStage, settleTransaction, transactions, createDispute, addDisputeEvidence, addDisputeResponse, resolveDispute } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const disputeFileRef = useRef<HTMLInputElement>(null);

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
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showDisputeDetailModal, setShowDisputeDetailModal] = useState(false);
  const [showDeliverableDetailModal, setShowDeliverableDetailModal] = useState(false);
  const [selectedDeliverables, setSelectedDeliverables] = useState<Deliverable[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [stageNotes, setStageNotes] = useState('');
  const [stageAssignee, setStageAssignee] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeResponseText, setDisputeResponseText] = useState('');
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);
  const [disputeResolution, setDisputeResolution] = useState('');
  const [disputeRefundAmount, setDisputeRefundAmount] = useState('');
  const [disputeSettlementType, setDisputeSettlementType] = useState<'continue' | 'partial_refund' | 'full_refund'>('continue');
  const [pendingDeliverables, setPendingDeliverables] = useState<PendingDeliverable[]>([]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: PendingDeliverable[] = Array.from(files).map(file => ({
      name: file.name,
      description: '',
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setPendingDeliverables([...pendingDeliverables, ...newFiles]);
  };

  const handleRemovePendingDeliverable = (index: number) => {
    const updated = [...pendingDeliverables];
    const removed = updated.splice(index, 1)[0];
    if (removed.previewUrl) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    setPendingDeliverables(updated);
  };

  const handleSubmitDeliverables = async () => {
    if (!transaction || !selectedStageId || pendingDeliverables.length === 0) return;
    
    const deliverables: Deliverable[] = await Promise.all(
      pendingDeliverables.map(async (p, i) => {
        let fileData: string | undefined;
        let fileType: 'image' | 'pdf' | 'document' | 'other' = 'other';
        let fileSize: number | undefined;

        if (p.file) {
          fileSize = p.file.size;
          if (p.file.type.startsWith('image/')) {
            fileType = 'image';
          } else if (p.file.type === 'application/pdf') {
            fileType = 'pdf';
          } else if (p.file.type.includes('document') || p.file.type.includes('word')) {
            fileType = 'document';
          }
          
          fileData = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(p.file!);
          });
        }
        
        return {
          id: `del-${Date.now()}-${i}`,
          name: p.name || p.file?.name || `交付物 ${i + 1}`,
          description: p.description,
          fileData,
          fileType,
          fileSize,
          uploadedBy: user?.id || '',
          uploadedAt: new Date().toISOString(),
        };
      })
    );
    
    addDeliverablesBatch(transaction.id, selectedStageId, deliverables);
    setPendingDeliverables([]);
    setShowDeliverableModal(false);
    setSelectedStageId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    settleTransaction(transaction.id, 'manual');
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

  const handleCreateDispute = () => {
    if (!transaction || !selectedStageId || !disputeReason) return;
    createDispute(transaction.id, selectedStageId, disputeReason);
    setDisputeReason('');
    setSelectedStageId(null);
    setShowDisputeModal(false);
  };

  const handleAddDisputeResponse = async () => {
    if (!transaction || !disputeResponseText) return;

    const attachments: DisputeEvidence[] = [];
    
    for (const file of disputeFiles) {
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      let fileType: 'file' | 'text' = 'file';
      let fileSize: number | undefined = file.size;
      
      attachments.push({
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${attachments.length}`,
        uploadedBy: user?.id || '',
        type: fileType,
        content: fileData,
        fileName: file.name,
        fileSize,
        uploadedAt: new Date().toISOString(),
      });
    }

    if (disputeResponseText) {
      attachments.push({
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-text`,
        uploadedBy: user?.id || '',
        type: 'text',
        content: disputeResponseText,
        uploadedAt: new Date().toISOString(),
      });
    }

    const response: DisputeResponse = {
      id: `resp-${Date.now()}`,
      userId: user?.id || '',
      content: disputeResponseText,
      attachments,
      createdAt: new Date().toISOString(),
    };

    addDisputeResponse(transaction.id, response);
    setDisputeResponseText('');
    setDisputeFiles([]);
    if (disputeFileRef.current) {
      disputeFileRef.current.value = '';
    }
  };

  const handleResolveDispute = () => {
    if (!transaction || !disputeResolution) return;
    const refund = disputeSettlementType === 'partial_refund' ? Number(disputeRefundAmount) : undefined;
    resolveDispute(transaction.id, disputeSettlementType, disputeResolution, refund);
    setDisputeResolution('');
    setDisputeRefundAmount('');
    setDisputeSettlementType('continue');
    setShowDisputeDetailModal(false);
  };

  const handleViewDeliverables = (deliverables: Deliverable[]) => {
    setSelectedDeliverables(deliverables);
    setShowDeliverableDetailModal(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getStageStatus = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { icon: CheckCircle, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', label: '已完成' };
      case 'submitted':
        return { icon: Clock, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', label: '待确认' };
      case 'in_progress':
        return { icon: Clock, color: 'text-[#2D5BFF]', bg: 'bg-[#2D5BFF]/10', label: '进行中' };
      case 'disputed':
        return { icon: AlertTriangle, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', label: '有争议' };
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100', label: '待开始' };
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
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const fileMessage: Message = {
                  id: `msg-${Date.now()}`,
                  chatId: chat.id,
                  senderId: user?.id || '',
                  content: `上传文件：${file.name}`,
                  type: 'file',
                  fileUrl: URL.createObjectURL(file),
                  read: false,
                  createdAt: new Date().toISOString(),
                };
                sendMessage(chat.id, fileMessage);
                e.target.value = '';
              }
            }} />
            <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors" onClick={() => fileInputRef.current?.click()}>
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

                {transaction.settlement && (
                  <div className="mt-3 p-3 rounded-xl bg-[#10B981]/10 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[#10B981] font-medium">
                        {transaction.settlement.method === 'auto' ? '自动结算' : '手动结算'}
                        {transaction.settlement.settlementType && ` - ${getSettlementTypeText(transaction.settlement.settlementType)}`}
                      </p>
                    </div>
                    {transaction.settlement.resolution && (
                      <p className="text-xs text-gray-600 mt-1">{transaction.settlement.resolution}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      时间：{new Date(transaction.settlement.settledAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                )}

                {transaction.dispute && (
                  <button
                    onClick={() => setShowDisputeDetailModal(true)}
                    className="mt-3 w-full p-3 rounded-xl bg-[#EF4444]/10 text-sm text-left hover:bg-[#EF4444]/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                        <span className="text-[#EF4444] font-medium">存在争议</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#EF4444]" />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      {getDisputeStatusInfo(transaction.dispute.status).label}
                    </p>
                  </button>
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
                  <Tag variant={transaction.status === 'completed' ? 'success' : transaction.status === 'disputed' ? 'danger' : transaction.status === 'in_progress' ? 'warning' : 'default'}>
                    {transaction.status === 'completed' ? '已完成' : transaction.status === 'disputed' ? '争议中' : transaction.status === 'in_progress' ? '进行中' : '待付款'}
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
                              <div className="flex items-center gap-1">
                                {stage.deliverables.length > 0 && (
                                  <button
                                    onClick={() => handleViewDeliverables(stage.deliverables)}
                                    className="p-1 rounded hover:bg-gray-200"
                                    title="查看交付物"
                                  >
                                    <Eye className="w-3 h-3 text-[#2D5BFF]" />
                                  </button>
                                )}
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
                              <div className="mt-2 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-[#2D5BFF]" />
                                <span className="text-xs text-[#2D5BFF]">{stage.deliverables.length} 个交付物</span>
                              </div>
                            )}

                            {stage.status === 'in_progress' && transaction.paymentStatus === 'escrow' && (
                              <div className="mt-2 flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                  setSelectedStageId(stage.id);
                                  setPendingDeliverables([]);
                                  setShowDeliverableModal(true);
                                }}>
                                  <Plus className="w-3 h-3 mr-1" />
                                  上传交付物
                                </Button>
                                <Button variant="primary" size="sm" onClick={() => handleSubmitStage(stage.id)}>
                                  提交阶段
                                </Button>
                              </div>
                            )}

                            {stage.status === 'submitted' && isBuyer && (
                              <div className="mt-2 flex items-center gap-2">
                                <Button variant="primary" size="sm" onClick={() => handleConfirmStage(stage.id)}>
                                  确认完成
                                </Button>
                                <Button variant="ghost" size="sm" className="text-[#EF4444]" onClick={() => {
                                  setSelectedStageId(stage.id);
                                  setShowDisputeModal(true);
                                }}>
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  发起异议
                                </Button>
                              </div>
                            )}

                            {stage.status === 'confirmed' && (
                              <p className="text-xs text-[#10B981] mt-1">已完成 ✓</p>
                            )}

                            {stage.status === 'disputed' && (
                              <p className="text-xs text-[#EF4444] mt-1">存在争议</p>
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

      <Modal isOpen={showDeliverableModal} onClose={() => { setShowDeliverableModal(false); setSelectedStageId(null); setPendingDeliverables([]); }} title="上传交付物（可批量）" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择文件（支持多选）</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#2D5BFF] transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="deliverable-files"
                accept="image/*,.pdf,.doc,.docx,.zip,.rar"
                multiple
              />
              <label htmlFor="deliverable-files" className="cursor-pointer">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">点击选择多个文件</p>
                <p className="text-xs text-gray-400 mt-1">支持图片、PDF、文档、压缩包</p>
              </label>
            </div>
          </div>

          {pendingDeliverables.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {pendingDeliverables.map((p, index) => (
                <div key={index} className="p-3 rounded-xl bg-gray-50">
                  <div className="flex items-start gap-2">
                    {p.previewUrl ? (
                      <img src={p.previewUrl} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <FileText className="w-10 h-10 text-[#2D5BFF]" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          placeholder="文件名"
                          value={p.name}
                          onChange={(e) => {
                            const updated = [...pendingDeliverables];
                            updated[index].name = e.target.value;
                            setPendingDeliverables(updated);
                          }}
                          className="flex-1 px-2 py-1 text-sm rounded border border-gray-200"
                        />
                        <button
                          onClick={() => handleRemovePendingDeliverable(index)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-[#EF4444]" />
                        </button>
                      </div>
                      <textarea
                        placeholder="描述说明（选填）"
                        value={p.description}
                        onChange={(e) => {
                          const updated = [...pendingDeliverables];
                          updated[index].description = e.target.value;
                          setPendingDeliverables(updated);
                        }}
                        className="w-full mt-2 px-2 py-1 text-sm rounded border border-gray-200 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { setShowDeliverableModal(false); setSelectedStageId(null); setPendingDeliverables([]); }} className="flex-1">
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmitDeliverables} className="flex-1" disabled={pendingDeliverables.length === 0}>
              提交 {pendingDeliverables.length > 0 ? `(${pendingDeliverables.length}个)` : ''}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeliverableDetailModal} onClose={() => { setShowDeliverableDetailModal(false); setSelectedDeliverables([]); }} title="交付物详情" size="lg">
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
                <span>时间：{new Date(d.uploadedAt).toLocaleString('zh-CN')}</span>
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

      <Modal isOpen={showDisputeModal} onClose={() => { setShowDisputeModal(false); setSelectedStageId(null); setDisputeReason(''); }} title="发起异议" size="md">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-[#EF4444]/10 text-sm text-[#EF4444]">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            发起异议后，交易将暂停，双方可补充说明和材料。
          </div>
          <Textarea
            label="异议原因"
            placeholder="请详细描述你对交付不满意的原因"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={4}
          />
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { setShowDisputeModal(false); setSelectedStageId(null); setDisputeReason(''); }} className="flex-1">
              取消
            </Button>
            <Button variant="primary" onClick={handleCreateDispute} className="flex-1" disabled={!disputeReason}>
              发起异议
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDisputeDetailModal} onClose={() => setShowDisputeDetailModal(false)} title="争议详情" size="lg">
        {transaction?.dispute && (
          <div className="space-y-4">
            <div className={cn('p-4 rounded-xl', getDisputeStatusInfo(transaction.dispute.status).bg)}>
              <div className="flex items-center gap-2">
                {(() => {
                  const info = getDisputeStatusInfo(transaction.dispute.status);
                  return <info.icon className={cn('w-5 h-5', info.color)} />;
                })()}
                <span className={cn('font-medium', getDisputeStatusInfo(transaction.dispute.status).color)}>
                  {getDisputeStatusInfo(transaction.dispute.status).label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                发起时间：{new Date(transaction.dispute.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">异议原因</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{transaction.dispute.reason}</p>
            </div>

            {transaction.dispute.responses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">证据材料与回应</h4>
                <div className="space-y-3">
                  {transaction.dispute.responses.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar src={getUserById(r.userId)?.avatar} size="sm" fallback={getUserById(r.userId)?.nickname?.[0]} />
                        <span className="text-sm font-medium">{getUserById(r.userId)?.nickname}</span>
                        <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString('zh-CN')}</span>
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

            {transaction.dispute.status !== 'resolved' && transaction.dispute.status !== 'refunded' && transaction.dispute.status !== 'continued' && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">补充回应</h4>
                <div className="space-y-3">
                  <Textarea
                    placeholder="补充说明"
                    value={disputeResponseText}
                    onChange={(e) => setDisputeResponseText(e.target.value)}
                    rows={3}
                  />
                  <input
                    type="file"
                    ref={disputeFileRef}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        setDisputeFiles([...disputeFiles, ...Array.from(files)]);
                      }
                    }}
                    className="hidden"
                    id="dispute-files"
                    multiple
                  />
                  <label htmlFor="dispute-files" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm cursor-pointer hover:bg-gray-200">
                    <Upload className="w-4 h-4" />
                    上传材料（可多选）
                  </label>
                  {disputeFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {disputeFiles.map((f, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded">{f.name}</span>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" onClick={handleAddDisputeResponse} disabled={!disputeResponseText && disputeFiles.length === 0}>
                    提交回应
                  </Button>
                </div>
              </div>
            )}

            {transaction.dispute.status !== 'resolved' && transaction.dispute.status !== 'refunded' && transaction.dispute.status !== 'continued' && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">协商处理</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setDisputeSettlementType('continue')}
                      className={cn(
                        'p-3 rounded-xl border-2 text-center transition-all',
                        disputeSettlementType === 'continue' ? 'border-[#10B981] bg-[#10B981]/10' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <RefreshCw className={cn('w-5 h-5 mx-auto mb-1', disputeSettlementType === 'continue' ? 'text-[#10B981]' : 'text-gray-400')} />
                      <span className={cn('text-sm', disputeSettlementType === 'continue' ? 'text-[#10B981] font-medium' : 'text-gray-500')}>继续交付</span>
                    </button>
                    <button
                      onClick={() => setDisputeSettlementType('partial_refund')}
                      className={cn(
                        'p-3 rounded-xl border-2 text-center transition-all',
                        disputeSettlementType === 'partial_refund' ? 'border-[#F59E0B] bg-[#F59E0B]/10' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <DollarSign className={cn('w-5 h-5 mx-auto mb-1', disputeSettlementType === 'partial_refund' ? 'text-[#F59E0B]' : 'text-gray-400')} />
                      <span className={cn('text-sm', disputeSettlementType === 'partial_refund' ? 'text-[#F59E0B] font-medium' : 'text-gray-500')}>部分退款</span>
                    </button>
                    <button
                      onClick={() => setDisputeSettlementType('full_refund')}
                      className={cn(
                        'p-3 rounded-xl border-2 text-center transition-all',
                        disputeSettlementType === 'full_refund' ? 'border-[#EF4444] bg-[#EF4444]/10' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <XCircle className={cn('w-5 h-5 mx-auto mb-1', disputeSettlementType === 'full_refund' ? 'text-[#EF4444]' : 'text-gray-400')} />
                      <span className={cn('text-sm', disputeSettlementType === 'full_refund' ? 'text-[#EF4444] font-medium' : 'text-gray-500')}>全额退款</span>
                    </button>
                  </div>

                  {disputeSettlementType === 'partial_refund' && (
                    <Input
                      type="number"
                      label="退款金额"
                      placeholder={`最高 ¥${transaction.amount}`}
                      value={disputeRefundAmount}
                      onChange={(e) => setDisputeRefundAmount(e.target.value)}
                    />
                  )}

                  <Textarea
                    label="处理说明"
                    placeholder="说明处理结果和原因"
                    value={disputeResolution}
                    onChange={(e) => setDisputeResolution(e.target.value)}
                    rows={2}
                  />

                  <Button variant="primary" onClick={handleResolveDispute} disabled={!disputeResolution}>
                    确认协商结果
                  </Button>
                </div>
              </div>
            )}

            {transaction.dispute.resolution && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">处理结果</h4>
                <div className="p-4 rounded-xl bg-[#10B981]/10">
                  <p className="text-sm text-gray-700">{transaction.dispute.resolution}</p>
                  {transaction.dispute.refundAmount && (
                    <p className="text-sm text-[#EF4444] mt-2">退款金额：¥{transaction.dispute.refundAmount}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    处理时间：{transaction.dispute.resolvedAt && new Date(transaction.dispute.resolvedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}