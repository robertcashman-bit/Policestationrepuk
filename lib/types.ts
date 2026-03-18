export interface Representative {
  id: string;
  slug: string;
  name: string;
  phone: string;
  email: string;
  county: string;
  addressCounty?: string;
  postcode?: string;
  stations: string[];
  stationsCovered?: string[];
  availability: string;
  accreditation: string;
  notes: string;
  featured?: boolean;
  featuredLevel?: string;
  featuredUntil?: string | null;
  featuredBadgeText?: string | null;
  whatsappLink?: string;
  websiteUrl?: string;
  dsccPin?: string;
  spotlightNote?: string;
  holidayAvailability?: string[];
  image?: string;
  /** @deprecated Use notes instead */
  bio?: string;
  yearsExperience?: number;
  languages?: string[];
  specialisms?: string[];
}

export interface PoliceStation {
  id: string;
  slug: string;
  name: string;
  stationId?: string;
  address: string;
  postcode?: string;
  county?: string;
  phone?: string;
  custodyPhone?: string;
  custodyPhone2?: string;
  nonEmergencyPhone?: string;
  forceName?: string;
  forceCode?: string;
  category?: string;
  status?: string;
  isCustodyStation?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  custodySuite?: boolean;
}

export interface County {
  name: string;
  slug: string;
  repCount?: number;
  stationCount?: number;
  id?: string;
  region?: string;
}

export interface CountyPageData {
  county: County;
  representatives: Representative[];
  stations: PoliceStation[];
  content: CountyContent;
}

export interface CountyContent {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  sections: ContentSection[];
}

export interface ContentSection {
  heading: string;
  body: string;
}

export interface SearchFilters {
  county?: string;
  station?: string;
  availability?: string;
  accreditation?: string;
  query?: string;
}

export interface WikiArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string;
  difficulty: string;
  tags: string[];
  views: number;
  helpfulCount: number;
  wordCount: number;
  factCheckStatus: string;
  publishedDate: string;
  lastImprovedDate: string | null;
}

export interface LawFirm {
  id: string;
  name: string;
  slug: string;
  sraNumber: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  website: string;
  specialisms: string[];
  county: string;
  region: string;
  sizeCategory: string;
  criminalLawPractice: boolean;
  policeStationWork: boolean;
  dutySolicitorScheme: boolean;
  lastVerified: string | null;
}

export interface LegalUpdate {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  featuredImageUrl: string | null;
  isFeatured: boolean;
  publishedDate: string;
  views: number;
}

export interface FormDocument {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  category: string;
  isFeatured: boolean;
}
