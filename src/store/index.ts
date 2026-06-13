import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Idea, Chat, Message, Favorite, Bounty, IdeaFilter, Transaction, Offer, Report, TransactionReview, Stage, Deliverable, Dispute, DisputeEvidence, DisputeResponse, SettlementRecord } from '@/types';
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
  confirmPayment: (transactionId: string) => void;
  startStage: (transactionId: string, stageId: string) => void;
  updateStageAssignee: (transactionId: string, stageId: string, assigneeId: string) => void;
  updateStageNotes: (transactionId: string, stageId: string, notes: string) => void;
  addDeliverable: (transactionId: string, stageId: string, deliverable: Deliverable) => void;
  addDeliverablesBatch: (transactionId: string, stageId: string, deliverables: Deliverable[]) => void;
  submitStage: (transactionId: string, stageId: string) => void;
  confirmStage: (transactionId: string, stageId: string) => void;
  settleTransaction: (transactionId: string, method: 'auto' | 'manual') => void;
  submitReview: (transactionId: string, review: TransactionReview) => void;
  completeTransaction: (transactionId: string) => void;
  addReport: (report: Report) => void;
  updateUserCredit: (userId: string, reviews: TransactionReview[]) => void;
  createDispute: (transactionId: string, stageId: string, reason: string) => void;
  addDisputeEvidence: (transactionId: string, evidence: DisputeEvidence) => void;
  addDisputeResponse: (transactionId: string, response: DisputeResponse) => void;
  resolveDispute: (transactionId: string, settlementType: 'continue' | 'partial_refund' | 'full_refund', resolution: string, refundAmount?: number) => void;
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
  getUserReviewsReceived: () => TransactionReview[];
  getUserReviewsGiven: () => TransactionReview[];
  calculateCreditScore: (userId: string) => number;
  getCreditTrend: () => { date: string; score: number; rating?: number }[];
}

const defaultStages: Omit<Stage, 'id'>[] = [
  { name: '需求确认', description: '确认合作需求和范围', deliverables: [], status: 'pending' },
  { name: '方案设计', description: '完成初步方案设计', deliverables: [], status: 'pending' },
  { name: '最终交付', description: '完成最终交付物', deliverables: [], status: 'pending' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: { ...mockUsers[0], reviewCount: 0, positiveReviews: 0 },
      ideas: mockIdeas,
      bounties: mockBounties,
      chats: mockChats.map(chat => ({ ...chat, offers: [], transactionId: undefined })),
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

      addChat: (chat) => set((state) => ({ chats: [{ ...chat, offers: [], transactionId: undefined }, ...state.chats] })),

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

        const transactionId = `tx-${Date.now()}`;
        const transaction: Transaction = {
          id: transactionId,
          ideaId: offer.ideaId,
          ideaTitle: idea.title,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          amount: offer.amount,
          paymentStatus: 'unpaid',
          stages: defaultStages.map((s) => ({
            ...s,
            id: `stage-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          })),
          status: 'pending',
          reviews: [],
          createdAt: new Date().toISOString(),
        };

        const systemMessage: Message = {
          id: `msg-${Date.now()}-system`,
          chatId: '',
          senderId: 'system',
          content: `✅ 报价 ¥${offer.amount} 已接受，交易已创建！请买方确认付款以开始交易。`,
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
            const offerInChat = chat.offers.find((o) => o.id === offer.id);
            if (offerInChat) {
              return {
                ...chat,
                transactionId,
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

      confirmPayment: (transactionId) => {
        const escrowAt = new Date().toISOString();
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === transactionId
              ? {
                  ...tx,
                  paymentStatus: 'escrow',
                  status: 'in_progress',
                  paidAt: new Date().toISOString(),
                  escrowAt,
                  stages: tx.stages.map((s, i) =>
                    i === 0 ? { ...s, status: 'in_progress' as const, startedAt: new Date().toISOString() } : s
                  ),
                }
              : tx
          ),
        }));

        const state = get();
        const tx = state.transactions.find(t => t.id === transactionId);
        if (tx) {
          const chat = state.chats.find(c => c.transactionId === transactionId);
          if (chat) {
            const paymentMessage: Message = {
              id: `msg-${Date.now()}-payment`,
              chatId: chat.id,
              senderId: 'system',
              content: `💰 买方已确认付款 ¥${tx.amount}，资金已托管，交易正式开始！`,
              type: 'system',
              read: false,
              createdAt: new Date().toISOString(),
            };
            set((state) => ({
              chats: state.chats.map((c) =>
                c.id === chat.id
                  ? { ...c, messages: [...c.messages, paymentMessage] }
                  : c
              ),
            }));
          }
        }
      },

      startStage: (transactionId, stageId) => set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.id === transactionId
            ? {
                ...tx,
                stages: tx.stages.map((s) =>
                  s.id === stageId
                    ? { ...s, status: 'in_progress' as const, startedAt: new Date().toISOString() }
                    : s
                ),
              }
            : tx
        ),
      })),

      updateStageAssignee: (transactionId, stageId, assigneeId) => set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.id === transactionId
            ? {
                ...tx,
                stages: tx.stages.map((s) =>
                  s.id === stageId ? { ...s, assigneeId } : s
                ),
              }
            : tx
        ),
      })),

      updateStageNotes: (transactionId, stageId, notes) => set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.id === transactionId
            ? {
                ...tx,
                stages: tx.stages.map((s) =>
                  s.id === stageId ? { ...s, notes } : s
                ),
              }
            : tx
        ),
      })),

      addDeliverable: (transactionId: string, stageId: string, deliverable: Deliverable) => set((state) => ({
    transactions: state.transactions.map((tx) =>
      tx.id === transactionId
        ? {
            ...tx,
            stages: tx.stages.map((s) =>
              s.id === stageId
                ? { ...s, deliverables: [...s.deliverables, deliverable] }
                : s
            ),
          }
        : tx
    ),
  })),

  addDeliverablesBatch: (transactionId: string, stageId: string, deliverables: Deliverable[]) => set((state) => ({
    transactions: state.transactions.map((tx) =>
      tx.id === transactionId
        ? {
            ...tx,
            stages: tx.stages.map((s) =>
              s.id === stageId
                ? { ...s, deliverables: [...s.deliverables, ...deliverables] }
                : s
            ),
          }
        : tx
    ),
  })),

      submitStage: (transactionId, stageId) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === transactionId
              ? {
                  ...tx,
                  stages: tx.stages.map((s) =>
                    s.id === stageId
                      ? { ...s, status: 'submitted' as const, submittedAt: new Date().toISOString() }
                      : s
                  ),
                }
              : tx
          ),
        }));

        const state = get();
        const tx = state.transactions.find(t => t.id === transactionId);
        const stage = tx?.stages.find(s => s.id === stageId);
        if (tx && stage) {
          const chat = state.chats.find(c => c.transactionId === transactionId);
          if (chat) {
            const stageMessage: Message = {
              id: `msg-${Date.now()}-stage`,
              chatId: chat.id,
              senderId: 'system',
              content: `📦 阶段「${stage.name}」已提交交付，请买方确认。`,
              type: 'system',
              read: false,
              createdAt: new Date().toISOString(),
            };
            set((state) => ({
              chats: state.chats.map((c) =>
                c.id === chat.id
                  ? { ...c, messages: [...c.messages, stageMessage] }
                  : c
              ),
            }));
          }
        }
      },

      confirmStage: (transactionId, stageId) => {
        set((state) => ({
          transactions: state.transactions.map((tx) => {
            if (tx.id !== transactionId) return tx;
            
            const stageIndex = tx.stages.findIndex((s) => s.id === stageId);
            if (stageIndex === -1) return tx;

            const confirmedAt = new Date().toISOString();
            const updatedStages: Stage[] = tx.stages.map((s, i) => {
              if (i === stageIndex) {
                return { ...s, status: 'confirmed' as const, confirmedAt };
              }
              if (i === stageIndex + 1 && s.status === 'pending') {
                return { ...s, status: 'in_progress' as const, startedAt: new Date().toISOString() };
              }
              return s;
            });

            const allConfirmed = updatedStages.every((s) => s.status === 'confirmed');
            const isLastStage = stageIndex === tx.stages.length - 1;

            if (allConfirmed && isLastStage && tx.paymentStatus === 'escrow') {
              const settlement: SettlementRecord = {
                id: `settlement-${Date.now()}`,
                transactionId: tx.id,
                amount: tx.amount,
                sellerId: tx.sellerId,
                buyerId: tx.buyerId,
                settledAt: new Date().toISOString(),
                method: 'auto',
                stageCompletedAt: confirmedAt,
              };

              const chat = get().chats.find(c => c.transactionId === transactionId);
              if (chat) {
                const settleMessage: Message = {
                  id: `msg-${Date.now()}-settle`,
                  chatId: chat.id,
                  senderId: 'system',
                  content: `🎉 所有阶段已完成，¥${tx.amount} 已自动结算给卖方！`,
                  type: 'system',
                  read: false,
                  createdAt: new Date().toISOString(),
                };
                set((state) => ({
                  chats: state.chats.map((c) =>
                    c.id === chat.id
                      ? { ...c, messages: [...c.messages, settleMessage] }
                      : c
                  ),
                }));
              }

              return {
                ...tx,
                stages: updatedStages,
                status: 'completed' as const,
                paymentStatus: 'settled' as const,
                settlement,
                settledAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
              };
            }

            return {
              ...tx,
              stages: updatedStages,
              status: allConfirmed ? 'completed' as const : tx.status,
              completedAt: allConfirmed ? new Date().toISOString() : undefined,
            };
          }),
        }));
      },

      settleTransaction: (transactionId, method) => {
        const state = get();
        const tx = state.transactions.find(t => t.id === transactionId);
        if (!tx) return;

        const lastStage = tx.stages[tx.stages.length - 1];
        const settlement: SettlementRecord = {
          id: `settlement-${Date.now()}`,
          transactionId: tx.id,
          amount: tx.amount,
          sellerId: tx.sellerId,
          buyerId: tx.buyerId,
          settledAt: new Date().toISOString(),
          method,
          stageCompletedAt: lastStage?.confirmedAt,
        };

        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === transactionId
              ? {
                  ...tx,
                  paymentStatus: 'settled' as const,
                  settlement,
                  settledAt: new Date().toISOString(),
                  status: 'completed' as const,
                  completedAt: new Date().toISOString(),
                }
              : tx
          ),
        }));

        const chat = state.chats.find(c => c.transactionId === transactionId);
        if (chat) {
          const settleMessage: Message = {
            id: `msg-${Date.now()}-settle`,
            chatId: chat.id,
            senderId: 'system',
            content: `🎉 ¥${tx.amount} 已结算给卖方，交易完成！`,
            type: 'system',
            read: false,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            chats: state.chats.map((c) =>
              c.id === chat.id
                ? { ...c, messages: [...c.messages, settleMessage] }
                : c
            ),
          }));
        }
      },

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

        const reviewsForUser = state.transactions
          .filter((tx) => tx.buyerId === review.toUserId || tx.sellerId === review.toUserId)
          .flatMap((tx) => tx.reviews.filter((r) => r.toUserId === review.toUserId));

        get().updateUserCredit(review.toUserId, reviewsForUser);
      },

      completeTransaction: (transactionId) => set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.id === transactionId
            ? { ...tx, status: 'completed' as const, completedAt: new Date().toISOString() }
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

      createDispute: (transactionId, stageId, reason) => {
        const state = get();
        const tx = state.transactions.find(t => t.id === transactionId);
        if (!tx) return;

        const dispute: Dispute = {
          id: `dispute-${Date.now()}`,
          transactionId,
          stageId,
          initiatorId: state.user?.id || '',
          reason,
          status: 'pending',
          evidence: [],
          responses: [],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === transactionId
              ? {
                  ...tx,
                  dispute,
                  status: 'disputed' as const,
                  disputedAt: new Date().toISOString(),
                  stages: tx.stages.map((s) =>
                    s.id === stageId ? { ...s, status: 'disputed' as const } : s
                  ),
                }
              : tx
          ),
        }));

        const chat = state.chats.find(c => c.transactionId === transactionId);
        if (chat) {
          const disputeMessage: Message = {
            id: `msg-${Date.now()}-dispute`,
            chatId: chat.id,
            senderId: 'system',
            content: `⚠️ 争议已发起：${reason}。双方可补充说明和材料。`,
            type: 'system',
            read: false,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            chats: state.chats.map((c) =>
              c.id === chat.id
                ? { ...c, messages: [...c.messages, disputeMessage] }
                : c
            ),
          }));
        }
      },

      addDisputeEvidence: (transactionId, evidence) => set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.id === transactionId && tx.dispute
            ? {
                ...tx,
                dispute: {
                  ...tx.dispute,
                  evidence: [...tx.dispute.evidence, evidence],
                  status: 'processing' as const,
                },
              }
            : tx
        ),
      })),

      addDisputeResponse: (transactionId, response) => set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.id === transactionId && tx.dispute
            ? {
                ...tx,
                dispute: {
                  ...tx.dispute,
                  responses: [...tx.dispute.responses, response],
                  status: 'processing' as const,
                },
              }
            : tx
        ),
      })),

      resolveDispute: (transactionId, settlementType, resolution, refundAmount) => {
    const state = get();
    const tx = state.transactions.find(t => t.id === transactionId);
    if (!tx || !tx.dispute) return;

    const resolvedAt = new Date().toISOString();
    const isRefunded = settlementType === 'partial_refund' || settlementType === 'full_refund';
    const isContinued = settlementType === 'continue';

    const status = isRefunded ? 'refunded' : isContinued ? 'continued' : 'resolved';

    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === transactionId
          ? {
              ...tx,
              dispute: {
                ...tx.dispute!,
                status: status as 'refunded' | 'continued' | 'resolved',
                settlementType,
                resolution,
                refundAmount,
                resolvedAt,
              },
              status: 'completed' as const,
              stages: tx.stages.map((s) =>
                s.status === 'disputed' ? { ...s, status: isContinued ? 'in_progress' as const : 'confirmed' as const } : s
              ),
              paymentStatus: isRefunded ? 'settled' as const : tx.paymentStatus,
              settlement: isRefunded ? {
                id: `settlement-${Date.now()}`,
                transactionId: tx.id,
                amount: refundAmount || tx.amount,
                sellerId: tx.sellerId,
                buyerId: tx.buyerId,
                settledAt: resolvedAt,
                method: 'manual' as const,
                settlementType,
                resolution,
              } : tx.settlement,
              settledAt: isRefunded ? resolvedAt : tx.settledAt,
              completedAt: resolvedAt,
            }
          : tx
      ),
    }));

    const chat = state.chats.find(c => c.transactionId === transactionId);
    if (chat) {
      let settleContent = '';
      switch (settlementType) {
        case 'continue':
          settleContent = `✅ 争议已协商一致：继续交付。${resolution}`;
          break;
        case 'partial_refund':
          settleContent = `✅ 争议已协商一致：部分退款 ¥${refundAmount}。${resolution}`;
          break;
        case 'full_refund':
          settleContent = `✅ 争议已协商一致：全额退款 ¥${tx.amount}。${resolution}`;
          break;
        default:
          settleContent = `✅ 争议已解决：${resolution}`;
      }

      const resolveMessage: Message = {
        id: `msg-${Date.now()}-resolve`,
        chatId: chat.id,
        senderId: 'system',
        content: settleContent,
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chat.id
            ? { ...c, messages: [...c.messages, resolveMessage] }
            : c
        ),
      }));
    }
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

      getUserReviewsReceived: () => {
        const { transactions, user } = get();
        if (!user) return [];
        return transactions
          .filter((tx) => tx.buyerId === user.id || tx.sellerId === user.id)
          .flatMap((tx) => tx.reviews.filter((r) => r.toUserId === user.id));
      },

      getUserReviewsGiven: () => {
        const { transactions, user } = get();
        if (!user) return [];
        return transactions
          .filter((tx) => tx.buyerId === user.id || tx.sellerId === user.id)
          .flatMap((tx) => tx.reviews.filter((r) => r.fromUserId === user.id));
      },

      calculateCreditScore: (userId) => {
        const { transactions } = get();
        const reviews = transactions
          .filter((tx) => tx.buyerId === userId || tx.sellerId === userId)
          .flatMap((tx) => tx.reviews.filter((r) => r.toUserId === userId));
        
        if (reviews.length === 0) return 80;
        
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const baseScore = Math.round(avgRating * 10);
        return Math.min(100, baseScore);
      },

      getCreditTrend: () => {
        const { transactions, user } = get();
        if (!user) return [];

        const userTxs = transactions
          .filter((tx) => tx.buyerId === user.id || tx.sellerId === user.id)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        const trend: { date: string; score: number; rating?: number }[] = [];
        let cumulativeScore = 80;

        userTxs.forEach((tx) => {
          const txReviews = tx.reviews.filter((r) => r.toUserId === user.id);
          if (txReviews.length > 0) {
            const avgRating = txReviews.reduce((sum, r) => sum + r.rating, 0) / txReviews.length;
            if (avgRating === 5) {
              cumulativeScore = Math.min(100, cumulativeScore + 2);
            } else if (avgRating >= 4) {
              cumulativeScore = Math.min(100, Math.round(cumulativeScore * 0.95 + avgRating * 1));
            } else if (avgRating >= 3) {
              cumulativeScore = Math.max(50, Math.round(cumulativeScore * 0.9 + avgRating * 0.5));
            } else {
              cumulativeScore = Math.max(30, Math.round(cumulativeScore * 0.85 + avgRating * 0.3));
            }
          }
          trend.push({
            date: new Date(tx.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
            score: cumulativeScore,
            rating: txReviews.length > 0 ? Math.round(txReviews.reduce((sum, r) => sum + r.rating, 0) / txReviews.length) : undefined,
          });
        });

        return trend.length > 0 ? trend : [{ date: '初始', score: 80 }];
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