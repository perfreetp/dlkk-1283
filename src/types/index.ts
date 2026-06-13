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

export interface SettlementRecord {
  id: string;
  transactionId: string;
  amount: number;
  sellerId: string;
  buyerId: string;
  settledAt: string;
  method: 'auto' | 'manual';
  stageCompletedAt?: string;
}

export interface Dispute {
  id: string;
  transactionId: string;
  stageId: string;
  initiatorId: string;
  reason: string;
  status: 'pending' | 'processing' | 'resolved' | 'refunded';
  evidence: DisputeEvidence[];
  responses: DisputeResponse[];
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  refundAmount?: number;
}

export interface DisputeEvidence {
  id: string;
  uploadedBy: string;
  type: 'file' | 'text';
  content: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface DisputeResponse {
  id: string;
  userId: string;
  content: string;
  attachments: DisputeEvidence[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  ideaId: string;
  ideaTitle: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  paymentStatus: 'unpaid' | 'escrow' | 'settled';
  stages: Stage[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  reviews: TransactionReview[];
  settlement?: SettlementRecord;
  dispute?: Dispute;
  createdAt: string;
  paidAt?: string;
  escrowAt?: string;
  settledAt?: string;
  completedAt?: string;
  disputedAt?: string;
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  assigneeId?: string;
  notes?: string;
  deliverables: Deliverable[];
  status: 'pending' | 'in_progress' | 'submitted' | 'confirmed' | 'disputed';
  startedAt?: string;
  submittedAt?: string;
  confirmedAt?: string;
}

export interface Deliverable {
  id: string;
  name: string;
  url?: string;
  fileData?: string;
  fileType?: 'image' | 'pdf' | 'document' | 'other';
  fileSize?: number;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
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
  transactionId?: string;
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
  ideaDescription?: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNote?: string;
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