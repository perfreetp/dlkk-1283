import { FileText, Image } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
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