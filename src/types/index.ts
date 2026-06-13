export interface User {
  id: string;
  nickname: string;
  avatar: string;
  college: string;
  email: string;
  creditScore: number;
  transactionCount: number;
  reviewCount: number;
  positiveReviews: number;
  badges: Badge[];
  createdAt: string;
}

export interface Idea {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'sell' | 'collaborate';
  tags: string[];
  budgetMin: number;
  budgetMax: number;
  college: string;
  field: string;
  attachments: Attachment[];
  likes: number;
  favorites: number;
  status: 'active' | 'closed' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  ideaId: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'document';
  size: number;
}

export interface Offer {
  id: string;
  ideaId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Transaction {
  id: string;
  ideaId: string;
  ideaTitle: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  stages: Stage[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  reviews: TransactionReview[];
  createdAt: string;
  completedAt?: string;
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  deliverables: string[];
  status: 'pending' | 'submitted' | 'confirmed';
  submittedAt?: string;
  confirmedAt?: string;
}

export interface TransactionReview {
  id: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  dimensions: {
    response: number;
    quality: number;
    communication: number;
  };
  comment: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participantIds: string[];
  ideaId?: string;
  offers: Offer[];
  messages: Message[];
  lastMessageAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'file' | 'system' | 'offer';
  fileUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  transactionId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  dimensions: {
    response: number;
    quality: number;
    communication: number;
  };
  comment: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  ideaId: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
}

export interface Bounty {
  id: string;
  userId: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  field: string;
  attachments: Attachment[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  applicants: BountyApplicant[];
  createdAt: string;
}

export interface BountyApplicant {
  id: string;
  bountyId: string;
  userId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  ideaId: string;
  ideaTitle: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export type IdeaFilter = {
  college?: string;
  field?: string;
  type?: 'sell' | 'collaborate';
  budgetMin?: number;
  budgetMax?: number;
  status?: 'active' | 'closed' | 'completed';
  search?: string;
};