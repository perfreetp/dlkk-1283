import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Idea, Chat, Message, Favorite, Bounty, IdeaFilter } from '@/types';
import { mockUsers, mockIdeas, mockChats, mockBounties } from '@/data/mockData';

interface AppState {
  user: User | null;
  ideas: Idea[];
  bounties: Bounty[];
  chats: Chat[];
  favorites: Favorite[];
  filter: IdeaFilter;
  notifications: number;

  setUser: (user: User | null) => void;
  setFilter: (filter: IdeaFilter) => void;
  addIdea: (idea: Idea) => void;
  updateIdea: (id: string, data: Partial<Idea>) => void;
  likeIdea: (id: string) => void;
  unlikeIdea: (id: string) => void;
  favoriteIdea: (id: string) => void;
  unfavoriteIdea: (id: string) => void;
  addBounty: (bounty: Bounty) => void;
  addChat: (chat: Chat) => void;
  sendMessage: (chatId: string, message: Message) => void;
  markMessagesRead: (chatId: string) => void;
  getFilteredIdeas: () => Idea[];
  getUserById: (id: string) => User | undefined;
  getIdeaById: (id: string) => Idea | undefined;
  getChatById: (id: string) => Chat | undefined;
  getBountyById: (id: string) => Bounty | undefined;
  isFavorite: (ideaId: string) => boolean;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: mockUsers[0],
      ideas: mockIdeas,
      bounties: mockBounties,
      chats: mockChats,
      favorites: [],
      filter: {},
      notifications: 2,

      setUser: (user) => set({ user }),

      setFilter: (filter) => set({ filter }),

      addIdea: (idea) => set((state) => ({ ideas: [idea, ...state.ideas] })),

      updateIdea: (id, data) => set((state) => ({
        ideas: state.ideas.map((idea) =>
          idea.id === id ? { ...idea, ...data, updatedAt: new Date().toISOString() } : idea
        ),
      })),

      likeIdea: (id) => set((state) => ({
        ideas: state.ideas.map((idea) =>
          idea.id === id ? { ...idea, likes: idea.likes + 1 } : idea
        ),
      })),

      unlikeIdea: (id) => set((state) => ({
        ideas: state.ideas.map((idea) =>
          idea.id === id ? { ...idea, likes: idea.likes - 1 } : idea
        ),
      })),

      favoriteIdea: (id) => {
        const state = get();
        if (!state.user) return;
        const favorite: Favorite = {
          id: `fav-${id}`,
          userId: state.user.id,
          ideaId: id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          favorites: [...state.favorites, favorite],
          ideas: state.ideas.map((idea) =>
            idea.id === id ? { ...idea, favorites: idea.favorites + 1 } : idea
          ),
        }));
      },

      unfavoriteIdea: (id) => {
        const state = get();
        if (!state.user) return;
        set((state) => ({
          favorites: state.favorites.filter((fav) => fav.ideaId !== id),
          ideas: state.ideas.map((idea) =>
            idea.id === id ? { ...idea, favorites: idea.favorites - 1 } : idea
          ),
        }));
      },

      addBounty: (bounty) => set((state) => ({ bounties: [bounty, ...state.bounties] })),

      addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),

      sendMessage: (chatId, message) => set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: [...chat.messages, message], lastMessageAt: message.createdAt }
            : chat
        ),
        notifications: state.notifications + 1,
      })),

      markMessagesRead: (chatId) => set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: chat.messages.map((m) => ({ ...m, read: true })) }
            : chat
        ),
      })),

      getFilteredIdeas: () => {
        const { ideas, filter } = get();
        return ideas.filter((idea) => {
          if (filter.college && idea.college !== filter.college) return false;
          if (filter.field && idea.field !== filter.field) return false;
          if (filter.type && idea.type !== filter.type) return false;
          if (filter.budgetMin && idea.budgetMax < filter.budgetMin) return false;
          if (filter.budgetMax && idea.budgetMin > filter.budgetMax) return false;
          if (filter.status && idea.status !== filter.status) return false;
          if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            if (
              !idea.title.toLowerCase().includes(searchLower) &&
              !idea.description.toLowerCase().includes(searchLower) &&
              !idea.tags.some((tag) => tag.toLowerCase().includes(searchLower))
            ) {
              return false;
            }
          }
          return true;
        });
      },

      getUserById: (id) => mockUsers.find((user) => user.id === id),

      getIdeaById: (id) => get().ideas.find((idea) => idea.id === id),

      getChatById: (id) => get().chats.find((chat) => chat.id === id),

      getBountyById: (id) => get().bounties.find((bounty) => bounty.id === id),

      isFavorite: (ideaId) => {
        const { favorites, user } = get();
        return favorites.some((fav) => fav.ideaId === ideaId && fav.userId === user?.id);
      },
    }),
    {
      name: 'idea-trading-storage',
      partialize: (state) => ({
        user: state.user,
        favorites: state.favorites,
      }),
    }
  )
);