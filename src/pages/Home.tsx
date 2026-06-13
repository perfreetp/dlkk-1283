import { IdeaCard } from '@/components/idea/IdeaCard';
import { IdeaFilter } from '@/components/idea/IdeaFilter';
import { HeroSection } from '@/components/idea/HeroSection';
import { useStore } from '@/store';

export function IdeaList() {
  const { getFilteredIdeas } = useStore();
  const ideas = getFilteredIdeas();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
      {ideas.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-500">暂无符合条件的创意</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-6">
      <HeroSection />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-72 shrink-0">
          <IdeaFilter />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">创意列表</h2>
            <span className="text-sm text-gray-500">
              共 {useStore.getState().getFilteredIdeas().length} 个创意
            </span>
          </div>
          <IdeaList />
        </div>
      </div>
    </div>
  );
}