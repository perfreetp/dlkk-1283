import { FileText, Edit, Trash2, Eye, Heart, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

export default function MyIdeasPage() {
  const { user, ideas, updateIdea } = useStore();
  const myIdeas = ideas.filter((idea) => idea.userId === user?.id);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    updateIdea(id, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">我的发布</h1>
        <span className="text-sm text-gray-500">共 {myIdeas.length} 个创意</span>
      </div>

      <div className="space-y-4">
        {myIdeas.map((idea) => (
          <Card key={idea.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag variant={idea.type === 'sell' ? 'primary' : 'secondary'}>
                      {idea.type === 'sell' ? '出售' : '找队友'}
                    </Tag>
                    <Tag variant={idea.status === 'active' ? 'success' : 'warning'}>
                      {idea.status === 'active' ? '进行中' : idea.status === 'completed' ? '已完成' : '已关闭'}
                    </Tag>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{idea.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{idea.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{formatDate(idea.createdAt)}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {idea.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {idea.favorites}
                    </span>
                    {idea.budgetMin > 0 && (
                      <span className="font-semibold text-[#FF6B35]">
                        ¥{idea.budgetMin}-{idea.budgetMax}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a href={`/idea/${idea.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(idea.id, idea.status)}
                    className={cn(idea.status === 'active' && 'text-[#EF4444]')}
                  >
                    {idea.status === 'active' ? '关闭' : '重新开放'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {myIdeas.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无发布的创意</p>
            <a href="/post" className="text-[#2D5BFF] hover:underline mt-2 inline-block">
              发布第一个创意
            </a>
          </div>
        )}
      </div>
    </div>
  );
}