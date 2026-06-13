import { MessageSquare, Send, Paperclip, CheckCircle, Clock, FileText, Image } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const { getUserById } = useStore();
  const sender = getUserById(message.senderId);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (message.type === 'system') {
    return (
      <div className="text-center py-2">
        <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-2', isOwn && 'flex-row-reverse')}>
      <Avatar src={sender?.avatar} size="sm" fallback={sender?.nickname?.[0]} />
      <div className={cn('max-w-[70%]', isOwn && 'text-right')}>
        <div className={cn('rounded-2xl px-4 py-2', isOwn ? 'bg-[#2D5BFF] text-white' : 'bg-gray-100 text-gray-900')}>
          {message.type === 'file' ? (
            <div className="flex items-center gap-2">
              {message.fileUrl?.endsWith('.pdf') ? <FileText className="w-4 h-4" /> : <Image className="w-4 h-4" />}
              <span className="text-sm">{message.content}</span>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <span className={cn('text-xs text-gray-400 mt-1', isOwn && 'text-right')}>
          {formatTime(message.createdAt)}
          {isOwn && message.read && <span className="ml-1">已读</span>}
        </span>
      </div>
    </div>
  );
}

export default function ChatListPage() {
  const { chats, getUserById, user, markMessagesRead } = useStore();

  const formatTime = (date: string) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diff = now.getTime() - msgDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return msgDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return msgDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (chat: typeof chats[0]) => {
    const otherId = chat.participantIds.find((id) => id !== user?.id);
    return getUserById(otherId || '');
  };

  const getUnreadCount = (chat: typeof chats[0]) => {
    return chat.messages.filter((m) => !m.read && m.senderId !== user?.id).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">我的消息</h1>
      </div>

      <div className="space-y-3">
        {chats.map((chat) => {
          const other = getOtherParticipant(chat);
          const unread = getUnreadCount(chat);
          const lastMessage = chat.messages[chat.messages.length - 1];

          return (
            <a
              key={chat.id}
              href={`/chat/${chat.id}`}
              onClick={() => markMessagesRead(chat.id)}
              className="block"
            >
              <Card hoverable className="cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar src={other?.avatar} size="lg" fallback={other?.nickname?.[0]} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{other?.nickname}</span>
                      <span className="text-xs text-gray-400">{formatTime(chat.lastMessageAt)}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {lastMessage?.content || '暂无消息'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="w-5 h-5 bg-[#FF6B35] text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unread}
                    </span>
                  )}
                </CardContent>
              </Card>
            </a>
          );
        })}

        {chats.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无消息</p>
            <p className="text-sm text-gray-400 mt-1">在点子详情页发起私聊开始沟通</p>
          </div>
        )}
      </div>
    </div>
  );
}