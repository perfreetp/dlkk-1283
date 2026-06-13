import { Heart, Trash2, AlertCircle } from 'lucide-react';
import { IdeaCard } from '@/components/idea/IdeaCard';
import { useStore } from '@/store';

export default function FavoritesPage() {
  const { favorites, ideas, unfavoriteIdea, user } = useStore();
  const favoriteIdeas = ideas.filter((idea) =>
    favorites.some((fav) => fav.ideaId === idea.id && fav.userId === user?.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">我的收藏</h1>
        <span className="text-sm text-gray-500">共 {favoriteIdeas.length} 个创意</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {favoriteIdeas.map((idea) => (
          <div key={idea.id} className="relative">
            <IdeaCard idea={idea} />
          </div>
        ))}
      </div>

      {favoriteIdeas.length === 0 && (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无收藏的创意</p>
          <p className="text-sm text-gray-400 mt-1">在点子详情页点击收藏按钮添加</p>
        </div>
      )}
    </div>
  );
}