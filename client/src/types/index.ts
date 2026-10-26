// ─── Enums ────────────────────────────────────────────

export enum Role {
  ADMIN = 'ADMIN',
  SALES_EMPLOYEE = 'SALES_EMPLOYEE',
}

export enum LeadStage {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  SITE_VISIT = 'SITE_VISIT',
  INTERESTED = 'INTERESTED',
  NEGOTIATION = 'NEGOTIATION',
  BOOKED = 'BOOKED',
  LOST = 'LOST',
}

export enum UnitType {
  STUDIO = 'STUDIO',
  ONE_BHK = 'ONE_BHK',
  TWO_BHK = 'TWO_BHK',
  THREE_BHK = 'THREE_BHK',
  FOUR_BHK = 'FOUR_BHK',
  PENTHOUSE = 'PENTHOUSE',
  VILLA = 'VILLA',
  PLOT = 'PLOT',
  COMMERCIAL = 'COMMERCIAL',
}

export enum UnitStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  BOOKED = 'BOOKED',
  SOLD = 'SOLD',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

// ─── Interfaces ───────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  active: boolean;
  createdAt: string;
  _count?: {
    assignedLeads: number;
    bookings: number;
  };
}

export interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  stage: LeadStage;
  source?: string | null;
  budget?: number | null;
  followUpDate?: string | null;
  assignedToId?: string | null;
  assignedTo?: Pick<User, 'id' | 'name' | 'email'> | null;
  createdAt: string;
  updatedAt: string;
  notes?: LeadNote[];
  bookings?: Booking[];
  _count?: {
    notes: number;
    bookings: number;
  };
}

export interface LeadNote {
  id: string;
  content: string;
  leadId: string;
  userId: string;
  user: Pick<User, 'id' | 'name'>;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  buildings?: Building[];
  _count?: {
    buildings: number;
  };
  totalUnits?: number;
  availableUnits?: number;
  bookedUnits?: number;
  soldUnits?: number;
}

export interface Building {
  id: string;
  name: string;
  projectId: string;
  project?: Pick<Project, 'id' | 'name' | 'location'>;
  floors: number;
  createdAt: string;
  updatedAt: string;
  units?: Unit[];
  _count?: {
    units: number;
  };
}

export interface Unit {
  id: string;
  unitNumber: string;
  buildingId: string;
  building?: Building;
  type: UnitType;
  floor: number;
  area: number;
  price: number;
  status: UnitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  leadId: string;
  lead?: Pick<Lead, 'id' | 'name' | 'phone' | 'email'>;
  unitId: string;
  unit?: Unit;
  bookedById: string;
  bookedBy?: Pick<User, 'id' | 'name'>;
  amount: number;
  status: BookingStatus;
  notes?: string | null;
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── API Response Types ───────────────────────────────

export interface DashboardData {
  stats: {
    totalLeads: number;
    totalBookings: number;
    totalRevenue: number;
    totalUnits: number;
    availableUnits: number;
    overdueFollowUps: number;
  };
  leadsByStage: { stage: LeadStage; count: number }[];
  leadsBySource: { source: string; count: number }[];
  bookingStats: { status: BookingStatus; count: number; amount: number }[];
  recentLeads: Lead[];
  recentBookings: Booking[];
  upcomingFollowUps: Lead[];
}

// ─── Helpers ──────────────────────────────────────────

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  [LeadStage.NEW]: 'New',
  [LeadStage.CONTACTED]: 'Contacted',
  [LeadStage.SITE_VISIT]: 'Site Visit',
  [LeadStage.INTERESTED]: 'Interested',
  [LeadStage.NEGOTIATION]: 'Negotiation',
  [LeadStage.BOOKED]: 'Booked',
  [LeadStage.LOST]: 'Lost',
};

export const LEAD_STAGE_COLORS: Record<LeadStage, string> = {
  [LeadStage.NEW]: '#4338CA',
  [LeadStage.CONTACTED]: '#0284C7',
  [LeadStage.SITE_VISIT]: '#7C3AED',
  [LeadStage.INTERESTED]: '#D97706',
  [LeadStage.NEGOTIATION]: '#EA580C',
  [LeadStage.BOOKED]: '#0D9488',
  [LeadStage.LOST]: '#DC2626',
};

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  [UnitType.STUDIO]: 'Studio',
  [UnitType.ONE_BHK]: '1 BHK',
  [UnitType.TWO_BHK]: '2 BHK',
  [UnitType.THREE_BHK]: '3 BHK',
  [UnitType.FOUR_BHK]: '4 BHK',
  [UnitType.PENTHOUSE]: 'Penthouse',
  [UnitType.VILLA]: 'Villa',
  [UnitType.PLOT]: 'Plot',
  [UnitType.COMMERCIAL]: 'Commercial',
};

export const UNIT_STATUS_COLORS: Record<UnitStatus, string> = {
  [UnitStatus.AVAILABLE]: '#0D9488',
  [UnitStatus.RESERVED]: '#D97706',
  [UnitStatus.BOOKED]: '#172554',
  [UnitStatus.SOLD]: '#64748B',
};

export const LEAD_SOURCES = [
  'Website', 'Walk-in', 'Referral', 'MagicBricks', '99acres',
  'Housing.com', 'Facebook Ads', 'Google Ads', 'Other',
];

export const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRelativeTime = (date: string): string => {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(date);
};
