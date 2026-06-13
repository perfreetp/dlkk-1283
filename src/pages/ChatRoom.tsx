import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, CheckCircle, Clock, ChevronRight, Lightbulb, DollarSign } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { Modal } from '@/components/common/Modal';
import { Textarea } from '@/components/common/Textarea';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import type { Message, Stage } from '@/types';

export default function ChatRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getChatById, getUserById, getIdeaById, sendMessage, user, markMessagesRead } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = getChatById(id || '');
  const otherId = chat?.participantIds.find((pid) => pid !== user?.id);
  const other = otherId ? getUserById(otherId) : null;
  const idea = chat?.ideaId ? getIdeaById(chat.ideaId) : null;

  const [messageInput, setMessageInput] = useState('');
  const [showStageModal, setShowStageModal] = useState(false);
  const [stages, setStages] = useState<Stage[]>([
    { id: 's1', transactionId: '', name: '需求确认', description: '确认合作需求和范围', deliverables: [], status: 'confirmed' },
    { id: 's2', transactionId: '', name: '方案设计', description: '完成初步方案设计', deliverables: [], status: 'submitted' },
    { id: 's3', transactionId: '', name: '最终交付', description: '完成最终交付物', deliverables: [], status: 'pending' },
  ]);

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

  const handleConfirmStage = (stageId: string) => {
    setStages(stages.map((s) =>
      s.id === stageId ? { ...s, status: 'confirmed', confirmedAt: new Date().toISOString() } : s
    ));
    setShowStageModal(false);
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

      <div className="lg:w-72 shrink-0 space-y-4">
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">交易阶段</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowStageModal(true)}>
                管理
              </Button>
            </div>

            <div className="space-y-3">
              {stages.map((stage, index) => {
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
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

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

      <Modal isOpen={showStageModal} onClose={() => setShowStageModal(false)} title="阶段管理" size="md">
        <div className="space-y-4">
          {stages.map((stage) => {
            const statusInfo = getStageStatus(stage.status);
            return (
              <div key={stage.id} className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <statusInfo.icon className={cn('w-5 h-5', statusInfo.color)} />
                    <span className="font-medium text-gray-900">{stage.name}</span>
                  </div>
                  <Tag variant={stage.status === 'confirmed' ? 'success' : stage.status === 'submitted' ? 'warning' : 'default'}>
                    {stage.status === 'confirmed' ? '已完成' : stage.status === 'submitted' ? '待确认' : '进行中'}
                  </Tag>
                </div>
                <p className="text-sm text-gray-500 mb-3">{stage.description}</p>
                {stage.status === 'submitted' && (
                  <Button variant="primary" size="sm" onClick={() => handleConfirmStage(stage.id)}>
                    确认完成
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}