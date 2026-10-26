import api from './api';
import { DashboardData, Lead, LeadNote, Booking, Project, Building, Unit, User, Pagination } from '../types';

// ─── Auth ─────────────────────────────────────────────

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data as { token: string; user: User };
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data as { user: User };
  },
};

// ─── Dashboard ────────────────────────────────────────

export const dashboardService = {
  get: async () => {
    const { data } = await api.get('/dashboard');
    return data as DashboardData;
  },
};

// ─── Leads ────────────────────────────────────────────

interface LeadFilters {
  search?: string;
  stage?: string;
  assignedToId?: string;
  source?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const leadService = {
  list: async (filters: LeadFilters = {}) => {
    const { data } = await api.get('/leads', { params: filters });
    return data as { leads: Lead[]; pagination: Pagination };
  },
  get: async (id: string) => {
    const { data } = await api.get(`/leads/${id}`);
    return data as { lead: Lead };
  },
  create: async (lead: Partial<Lead>) => {
    const { data } = await api.post('/leads', lead);
    return data as { lead: Lead };
  },
  update: async (id: string, lead: Partial<Lead>) => {
    const { data } = await api.put(`/leads/${id}`, lead);
    return data as { lead: Lead };
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/leads/${id}`);
    return data;
  },
  addNote: async (id: string, content: string) => {
    const { data } = await api.post(`/leads/${id}/notes`, { content });
    return data as { note: LeadNote };
  },
};

// ─── Properties ───────────────────────────────────────

export const propertyService = {
  // Projects
  listProjects: async (search?: string) => {
    const { data } = await api.get('/properties/projects', { params: { search } });
    return data as { projects: Project[] };
  },
  getProject: async (id: string) => {
    const { data } = await api.get(`/properties/projects/${id}`);
    return data as { project: Project };
  },
  createProject: async (project: Partial<Project>) => {
    const { data } = await api.post('/properties/projects', project);
    return data as { project: Project };
  },
  updateProject: async (id: string, project: Partial<Project>) => {
    const { data } = await api.put(`/properties/projects/${id}`, project);
    return data as { project: Project };
  },

  // Buildings
  listBuildings: async (projectId?: string) => {
    const { data } = await api.get('/properties/buildings', { params: { projectId } });
    return data as { buildings: Building[] };
  },
  createBuilding: async (building: Partial<Building> & { projectId: string }) => {
    const { data } = await api.post('/properties/buildings', building);
    return data as { building: Building };
  },

  // Units
  listUnits: async (filters: Record<string, string> = {}) => {
    const { data } = await api.get('/properties/units', { params: filters });
    return data as { units: Unit[] };
  },
  createUnit: async (unit: Partial<Unit> & { buildingId: string }) => {
    const { data } = await api.post('/properties/units', unit);
    return data as { unit: Unit };
  },
  updateUnit: async (id: string, unit: Partial<Unit>) => {
    const { data } = await api.put(`/properties/units/${id}`, unit);
    return data as { unit: Unit };
  },
};

// ─── Bookings ─────────────────────────────────────────

export const bookingService = {
  list: async (filters: Record<string, string> = {}) => {
    const { data } = await api.get('/bookings', { params: filters });
    return data as { bookings: Booking[]; pagination: Pagination };
  },
  create: async (booking: { leadId: string; unitId: string; amount: number; notes?: string }) => {
    const { data } = await api.post('/bookings', booking);
    return data as { booking: Booking };
  },
  cancel: async (id: string) => {
    const { data } = await api.put(`/bookings/${id}/cancel`);
    return data as { booking: Booking };
  },
};

// ─── Users ────────────────────────────────────────────

export const userService = {
  list: async (filters: Record<string, string> = {}) => {
    const { data } = await api.get('/users', { params: filters });
    return data as { users: User[] };
  },
  create: async (user: { name: string; email: string; password: string; role: string; phone?: string }) => {
    const { data } = await api.post('/users', user);
    return data as { user: User };
  },
  toggleActive: async (id: string) => {
    const { data } = await api.put(`/users/${id}/toggle-active`);
    return data as { user: User };
  },
};
