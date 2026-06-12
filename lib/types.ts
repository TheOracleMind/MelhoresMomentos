export type ThemeName = "classic" | "minimal" | "romantic";
export type PageStatus = "draft" | "pending_payment" | "active" | "expired";
export type RelationshipType = "namoro" | "noivado" | "casamento" | "outro";
export type PaymentType = "initial_24h" | "initial_365d" | "renewal_24h" | "renewal_365d";

export type MomentImage = {
  id?: string;
  imageUrl: string;
  signedUrl?: string;
  sortOrder: number;
};

export type Moment = {
  id?: string;
  title: string;
  description: string;
  momentDate: string | null;
  sortOrder: number;
  images: MomentImage[];
};

export type LovePageDraft = {
  id?: string;
  slug: string;
  creatorName: string;
  recipientName: string;
  relationshipType: RelationshipType;
  metAt: string | null;
  relationshipStartedAt: string | null;
  shortMessage: string;
  title: string;
  introMessage: string;
  finalMessage: string;
  mainPhotoUrl: string;
  mainPhotoSignedUrl?: string;
  theme: ThemeName;
  status: PageStatus;
  planType?: PaymentType | null;
  paidAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
  moments: Moment[];
};

export type DbLovePage = {
  id: string;
  user_id: string;
  slug: string;
  creator_name: string;
  recipient_name: string;
  relationship_type: RelationshipType;
  met_at: string | null;
  relationship_started_at: string | null;
  short_message: string | null;
  title: string;
  intro_message: string;
  final_message: string;
  main_photo_url: string | null;
  theme: ThemeName;
  status: PageStatus;
  plan_type: PaymentType | null;
  stripe_customer_id: string | null;
  stripe_checkout_session_id: string | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbMoment = {
  id: string;
  love_page_id: string;
  title: string;
  description: string;
  moment_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  moment_images?: DbMomentImage[];
};

export type DbMomentImage = {
  id: string;
  moment_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};
