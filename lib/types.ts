type UUID = string;
type ISODate = string;

export type PropertyCategory =
  | 'fully-detached-duplex'
  | 'semi-detached-duplex'
  | 'terrace-duplex'
  | 'bungalow'
  | 'apartment'
  | 'penthouse'
  | 'maisonette'
  | 'land';

export type PropertyStatus = 'available' | 'under-offer' | 'sold' | 'let';

export type ListingType = 'sale' | 'rent' | 'shortlet';

export type DocumentType =
  | 'C of O'
  | "Governor's Consent"
  | 'Deed of Assignment'
  | 'Registered Survey'
  | 'Building Approval'
  | 'Excision';

export type Property = {
  id: UUID;
  slug: string;                        // URL-safe, unique
  title: string;
  category: PropertyCategory;
  listingType: ListingType;
  status: PropertyStatus;
  subBrand: 'sales' | 'rent' | 'land';  // Which sub-brand owns this listing
  location: {
    area: string;                      // "Banana Island"
    city: 'Lagos';
    state: string;                     // "Lagos State"
    coordinates?: { lat: number; lng: number };
  };
  price: {
    amount: number;
    currency: 'NGN';
    basis: 'outright' | 'per-annum' | 'per-night' | 'per-plot' | 'per-sqm';
  };
  size: { value: number; unit: 'sqm' | 'plot' | 'acre' };
  bedrooms?: number;
  bathrooms?: number;
  features: string[];                  // ["Swimming pool", "BQ", "24/7 power", ...]
  documents: DocumentType[];
  images: { src: string; alt: string; isPrimary?: boolean; order: number }[];
  description: string;                 // markdown
  nearbyLandmarks?: string[];
  paymentPlans?: { label: string; duration: string; note?: string }[];
  virtualTourUrl?: string;             // Matterport or YouTube
  publishedAt: ISODate;
  updatedAt: ISODate;
};

export type LeadSource = 'website' | 'whatsapp' | 'instagram-dm' | 'referral' | 'google';

export type LeadStatus =
  | 'new'
  | 'qualified'
  | 'inspection-booked'
  | 'negotiating'
  | 'closed-won'
  | 'closed-lost'
  | 'cold';

export type Lead = {
  id: UUID;
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  country?: string;                    // ISO code, "GB" | "US" | "NG" ...
  isDiaspora: boolean;
  source: LeadSource;
  firstSeenAt: ISODate;
  lastContactAt: ISODate;
  status: LeadStatus;
  score: number;                       // 0-100
  budget?: { min?: number; max?: number; currency: 'NGN' | 'USD' | 'GBP' };
  interestedCategories: PropertyCategory[];
  interestedAreas: string[];
  assignedAgentId?: UUID;
  propertiesInterestedIn: UUID[];      // FK -> Property.id
  notes: string;                       // human-edited
  tags: string[];
};

export type ConciergeConversation = {
  id: UUID;
  leadId?: UUID;                       // null until contact info captured
  channel: 'website' | 'whatsapp';
  sessionId: string;
  messages: ConciergeMessage[];
  escalated: boolean;                  // true once handed to human
  escalationReason?: string;
  startedAt: ISODate;
  lastMessageAt: ISODate;
};

export type ConciergeMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: { name: string; input: unknown; output: unknown }[];
  timestamp: ISODate;
};

export type KnowledgeDocument = {
  id: UUID;
  title: string;
  category: 'verification' | 'payment' | 'diaspora' | 'legal' | 'company' | 'faq';
  content: string;                     // markdown, edited by staff
  embedding?: number[];                // pgvector
  updatedAt: ISODate;
  updatedBy: UUID;                     // staff user
};

export type Agent = {
  id: UUID;
  name: string;
  role: 'senior' | 'junior' | 'admin';
  subBrand: 'sales' | 'rent' | 'land' | 'all';
  email: string;
  whatsapp: string;
  calBookingUrl: string;               // Cal.com link
  isActive: boolean;
};

export type InspectionStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export type InspectionRequest = {
  id: UUID;
  propertyId: UUID;                    // FK -> Property.id
  leadId?: UUID;                       // FK -> Lead.id (nullable: captured pre-lead)
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  preferredAt?: ISODate;
  isVirtual: boolean;
  status: InspectionStatus;
  notes?: string;
  calBookingId?: string;               // Cal.com booking reference
  createdAt: ISODate;
  updatedAt: ISODate;
};
