import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Eye, FileText, Image, File } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Tag } from '@/components/common/Tag';
import { useStore } from '@/store';
import type { Idea } from '@/types';
import { cn } from '@/lib/utils';

interface IdeaCardProps {
  idea: Idea;
  onLike?: () => void;
}

export function IdeaCard({ idea, onLike }: IdeaCardProps) {
  const { getUserById, isFavorite, likeIdea, unlikeIdea, favoriteIdea, unfavoriteIdea } = useStore();
  const author = getUserById(idea.userId);
  const favorite = isFavorite(idea.id);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLike) {
      onLike();
    } else {
      likeIdea(idea.id);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (favorite) {
      unfavoriteIdea(idea.id);
    } else {
      favoriteIdea(idea.id);
    }
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

  return (
    <Link to={`/idea/${idea.id}`}>
      <Card hoverable className="group overflow-hidden">
        {idea.attachments.length > 0 && idea.attachments[0].type === 'image' && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={idea.attachments[0].url}
              alt={idea.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Tag variant={idea.type === 'sell' ? 'primary' : 'secondary'}>
                {idea.type === 'sell' ? '出售' : '找队友'}
              </Tag>
              {idea.status !== 'active' && (
                <Tag variant="warning">
                  {idea.status === 'completed' ? '已完成' : '已关闭'}
                </Tag>
              )}
            </div>
            {idea.budgetMin > 0 && (
              <span className="text-sm font-semibold text-[#FF6B35]">
                ¥{idea.budgetMin}-{idea.budgetMax}
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#2D5BFF] transition-colors">
            {idea.title}
          </h3>

          <p className="text-sm text-gray-500 mb-3 line-clamp-3">
            {idea.description}
          </p>

          <div className="flex items-center gap-2 mb-3">
            {idea.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                {tag}
              </span>
            ))}
          </div>

          {idea.attachments.length > 0 && (
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
              {idea.attachments.slice(0, 3).map((att) => {
                const Icon = getAttachmentIcon(att.type);
                return (
                  <span key={att.id} className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" />
                    {att.name.slice(0, 15)}
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Avatar src={author?.avatar} size="sm" fallback={author?.nickname?.[0]} />
              <div className="text-sm">
                <span className="font-medium text-gray-700">{author?.nickname}</span>
                <span className="text-gray-400 ml-1">{author?.college}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-1 text-sm transition-colors',
                  'hover:text-[#FF6B35]'
                )}
              >
                <Heart className="w-4 h-4" />
                {idea.likes}
              </button>

              <button
                onClick={handleFavorite}
                className={cn(
                  'flex items-center gap-1 text-sm transition-colors',
                  favorite ? 'text-[#FF6B35]' : 'text-gray-400 hover:text-[#FF6B35]'
                )}
              >
                <Heart className={cn('w-4 h-4', favorite && 'fill-[#FF6B35]')} />
              </button>

              <span className="flex items-center gap-1 text-sm text-gray-400">
                <MessageSquare className="w-4 h-4" />
                {idea.favorites}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}