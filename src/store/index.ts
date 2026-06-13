import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Idea, Chat, Message, Favorite, Bounty, IdeaFilter, Transaction, Offer, Report, TransactionReview } from '@/types';
import { mockUsers, mockIdeas, mockChats, mockBounties } from '@/data/mockData';

interface AppState {
  user: User | null;
  ideas: Idea[];
  bounties: Bounty[];
  chats: Chat[];
  favorites: Favorite[];
  transactions: Transaction[];
  reports: Report[];
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
  submitOffer: (chatId: string, offer: Offer) => void;
  acceptOffer: (chatId: string, offerId: string) => void;
  rejectOffer: (chatId: string, offerId: string) => void;
  createTransaction: (offer: Offer) => void;
  submitStageDeliverable: (transactionId: string, stageId: string, deliverable: string) => void;
  confirmStage: (transactionId: string, stageId: string) => void;
  submitReview: (transactionId: string, review: TransactionReview) => void;
  completeTransaction: (transactionId: string) => void;
  addReport: (report: Report) => void;
  updateUserCredit: (userId: string, reviews: TransactionReview[]) => void;
  getFilteredIdeas: () => Idea[];
  getUserById: (id: string) => User | undefined;
  getIdeaById: (id: string) => Idea | undefined;
  getChatById: (id: string) => Chat | undefined;
  getBountyById: (id: string) => Bounty | undefined;
  getTransactionById: (id: string) => Transaction | undefined;
  isFavorite: (ideaId: string) => boolean;
  getUserTransactions: () => Transaction[];
  getUserReports: () => Report[];
  getPendingOffers: () => Offer[];
  calculateCreditScore: (userId: string) => number;
}

const defaultStages = [
  { id: 'stage-1', name: '需求确认', description: '确认合作需求和范围', deliverables: [], status: 'pending' as const },
  { id: 'stage-2', name: '方案设计', description: '完成初步方案设计', deliverables: [], status: 'pending' as const },
  { id: 'stage-3', name: '最终交付', description: '完成最终交付物', deliverables: [], status: 'pending' as const },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: { ...mockUsers[0], reviewCount: 0, positiveReviews: 0 },
      ideas: mockIdeas,
      bounties: mockBounties,
      chats: mockChats.map(chat => ({ ...chat, offers: [] })),
      favorites: [],
      transactions: [],
      reports: [],
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
          id: `fav-${id}-${Date.now()}`,
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

      addChat: (chat) => set((state) => ({ chats: [{ ...chat, offers: [] }, ...state.chats] })),

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

      submitOffer: (chatId, offer) => {
        const state = get();
        const chat = state.chats.find(c => c.id === chatId);
        if (!chat) return;

        const systemMessage: Message = {
          id: `msg-${Date.now()}`,
          chatId,
          senderId: offer.buyerId,
          content: `报价 ¥${offer.amount}：${offer.message}`,
          type: 'offer',
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [...c.messages, systemMessage],
                  offers: [...c.offers, offer],
                  lastMessageAt: new Date().toISOString(),
                }
              : c
          ),
          notifications: state.notifications + 1,
        }));
      },

      acceptOffer: (chatId, offerId) => {
        const state = get();
        const chat = state.chats.find(c => c.id === chatId);
        if (!chat) return;
        
        const offer = chat.offers.find(o => o.id === offerId);
        if (!offer) return;

        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  offers: c.offers.map((o) =>
                    o.id === offerId ? { ...o, status: 'accepted' } : { ...o, status: 'rejected' }
                  ),
                }
              : c
          ),
        }));

        get().createTransaction(offer);
      },

      rejectOffer: (chatId, offerId) => set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                offers: chat.offers.map((o) =>
                  o.id === offerId ? { ...o, status: 'rejected' } : o
                ),
              }
            : chat
        ),
      })),

      createTransaction: (offer) => {
        const state = get();
        const idea = state.ideas.find(i => i.id === offer.ideaId);
        if (!idea) return;

        const transaction: Transaction = {
          id: `tx-${Date.now()}`,
          ideaId: offer.ideaId,
          ideaTitle: idea.title,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          amount: offer.amount,
          stages: defaultStages.map((s, i) => ({
            ...s,
            id: `${s.id}-${Date.now()}`,
            transactionId: `tx-${Date.now()}`,
            status: i === 0 ? 'submitted' : 'pending' as const,
            submittedAt: i === 0 ? new Date().toISOString() : undefined,
          })),
          status: 'in_progress',
          reviews: [],
          createdAt: new Date().toISOString(),
        };

        const systemMessage: Message = {
          id: `msg-${Date.now()}-system`,
          chatId: '',
          senderId: 'system',
          content: `✅ 报价 ¥${offer.amount} 已接受，交易已创建！`,
          type: 'system',
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          transactions: [transaction, ...state.transactions],
          ideas: state.ideas.map((i) =>
            i.id === offer.ideaId ? { ...i, status: 'completed' } : i
          ),
          chats: state.chats.map((chat) => {
            const offerChat = chat.offers.find((o) => o.id === offer.id);
            if (offerChat) {
              return {
                ...chat,
                messages: [...chat.messages, systemMessage],
              };
            }
            return chat;
          }),
        }));

        if (state.user?.id === offer.sellerId || state.user?.id === offer.buyerId) {
          set((state) => ({
            user: state.user ? { ...state.user, transactionCount: state.user.transactionCount + 1 } : null,
          }));
        }
      },

      submitStageDeliverable: (transactionId, stageId, deliverable) => set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.id === transactionId
            ? {
                ...tx,
                stages: tx.stages.map((s) =>
                  s.id === stageId
                    ? {
                        ...s,
                        status: 'submitted' as const,
                        deliverables: [...s.deliverables, deliverable],
                        submittedAt: new Date().toISOString(),
                      }
                    : s
                ),
              }
            : tx
        ),
      })),

      confirmStage: (transactionId, stageId) => set((state) => ({
        transactions: state.transactions.map((tx) => {
          if (tx.id !== transactionId) return tx;
          
          const stageIndex = tx.stages.findIndex((s) => s.id === stageId);
          if (stageIndex === -1) return tx;

          const updatedStages = tx.stages.map((s, i) => {
            if (i === stageIndex) {
              return { ...s, status: 'confirmed' as const, confirmedAt: new Date().toISOString() };
            }
            if (i === stageIndex + 1 && s.status === 'pending') {
              return { ...s, status: 'submitted' as const, submittedAt: new Date().toISOString() };
            }
            return s;
          });

          const allConfirmed = updatedStages.every((s) => s.status === 'confirmed');

          return {
            ...tx,
            stages: updatedStages,
            status: allConfirmed ? 'completed' : tx.status,
            completedAt: allConfirmed ? new Date().toISOString() : undefined,
          };
        }),
      })),

      submitReview: (transactionId, review) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === transactionId
              ? { ...tx, reviews: [...tx.reviews, review] }
              : tx
          ),
        }));

        const state = get();
        const transaction = state.transactions.find((t) => t.id === transactionId);
        if (!transaction) return;

        const allReviewsForSeller = transaction.reviews.filter((r) => r.toUserId === transaction.sellerId);
        const allReviewsForBuyer = transaction.reviews.filter((r) => r.toUserId === transaction.buyerId);

        get().updateUserCredit(transaction.sellerId, allReviewsForSeller);
        get().updateUserCredit(transaction.buyerId, allReviewsForBuyer);
      },

      completeTransaction: (transactionId) => set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.id === transactionId
            ? { ...tx, status: 'completed', completedAt: new Date().toISOString() }
            : tx
        ),
      })),

      addReport: (report) => set((state) => ({ reports: [report, ...state.reports] })),

      updateUserCredit: (userId, reviews) => {
        const state = get();
        const user = state.user;
        if (!user || user.id !== userId) return;

        const reviewCount = reviews.length;
        const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
        const avgRating = reviewCount > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          : 5;
        const baseScore = Math.round(avgRating * 10);
        const transactionBonus = Math.min(user.transactionCount * 2, 20);
        const positiveRatio = reviewCount > 0 ? (positiveReviews / reviewCount) * 10 : 10;
        const creditScore = Math.min(100, Math.round(baseScore + transactionBonus + positiveRatio));

        set((state) => ({
          user: state.user?.id === userId
            ? { ...state.user, creditScore, reviewCount, positiveReviews }
            : state.user,
        }));
      },

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

      getTransactionById: (id) => get().transactions.find((tx) => tx.id === id),

      isFavorite: (ideaId) => {
        const { favorites, user } = get();
        return favorites.some((fav) => fav.ideaId === ideaId && fav.userId === user?.id);
      },

      getUserTransactions: () => {
        const { transactions, user } = get();
        if (!user) return [];
        return transactions.filter((tx) => tx.buyerId === user.id || tx.sellerId === user.id);
      },

      getUserReports: () => {
        const { reports, user } = get();
        if (!user) return [];
        return reports.filter((r) => r.reporterId === user.id);
      },

      getPendingOffers: () => {
        const { chats, user } = get();
        if (!user) return [];
        return chats
          .filter((chat) => chat.participantIds.includes(user.id))
          .flatMap((chat) => chat.offers.filter((o) => o.sellerId === user.id && o.status === 'pending'));
      },

      calculateCreditScore: (userId) => {
        const { transactions } = get();
        const userTxs = transactions.filter((tx) => tx.buyerId === userId || tx.sellerId === userId);
        const reviews = userTxs.flatMap((tx) => tx.reviews.filter((r) => r.toUserId === userId));
        
        if (reviews.length === 0) return 80;
        
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const baseScore = Math.round(avgRating * 10);
        return Math.min(100, baseScore);
      },
    }),
    {
      name: 'idea-trading-storage',
      partialize: (state) => ({
        user: state.user,
        favorites: state.favorites,
        ideas: state.ideas,
        chats: state.chats,
        transactions: state.transactions,
        reports: state.reports,
      }),
    }
  )
);