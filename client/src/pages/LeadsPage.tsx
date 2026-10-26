import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { leadService, userService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { Lead, LeadStage, User, LEAD_STAGE_LABELS, LEAD_SOURCES, formatCurrency, formatDate } from '../types';
import { MdSearch, MdAdd, MdFilterList, MdEdit, MdOpenInNew, MdCalendarToday } from 'react-icons/md';
import { Pagination } from '../components/Pagination';

export const LeadsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesUsers, setSalesUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    stage: LeadStage.NEW,
    source: 'Website',
    budget: '',
    followUpDate: '',
    assignedToId: '',
  });

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await leadService.list({
        search: search.trim() || undefined,
        stage: stageFilter || undefined,
        assignedToId: assigneeFilter || undefined,
        source: sourceFilter || undefined,
        page,
        limit: 15,
      });
      setLeads(res.leads);
      setTotalPages(res.pagination.totalPages);
      setTotalLeads(res.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, assigneeFilter, sourceFilter, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (isAdmin) {
      userService.list({ active: 'true' })
        .then(res => setSalesUsers(res.users))
        .catch(console.error);
    }
  }, [isAdmin]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentLeadId(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      stage: LeadStage.NEW,
      source: 'Website',
      budget: '',
      followUpDate: '',
      assignedToId: user?.role === 'SALES_EMPLOYEE' ? user.id : '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setCurrentLeadId(lead.id);
    setFormData({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || '',
      stage: lead.stage,
      source: lead.source || 'Website',
      budget: lead.budget ? lead.budget.toString() : '',
      followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
      assignedToId: lead.assignedToId || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const payload: any = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      stage: formData.stage,
      source: formData.source,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null,
    };

    if (isAdmin && formData.assignedToId) {
      payload.assignedToId = formData.assignedToId;
    }

    try {
      if (isEditing && currentLeadId) {
        await leadService.update(currentLeadId, payload);
      } else {
        await leadService.create(payload);
      }
      setShowModal(false);
      fetchLeads();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Leads & Pipeline Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Showing {totalLeads} total leads across sales stages
          </p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={handleOpenCreateModal}>
            <MdAdd size={20} />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Stage Fast Filters (Kanban-style tabs) */}
      <div className="pipeline-view">
        <button
          className={`pipeline-stage ${stageFilter === '' ? 'active' : ''}`}
          onClick={() => { setStageFilter(''); setPage(1); }}
        >
          All Stages <span className="stage-count">{totalLeads}</span>
        </button>
        {Object.values(LeadStage).map((stage) => (
          <button
            key={stage}
            className={`pipeline-stage ${stageFilter === stage ? 'active' : ''}`}
            onClick={() => { setStageFilter(stage); setPage(1); }}
          >
            {LEAD_STAGE_LABELS[stage]}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="filters-bar">
        <div className="search-input">
          <MdSearch className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search leads by name, phone or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {isAdmin && (
          <div className="filter-select">
            <select
              value={assigneeFilter}
              onChange={(e) => { setAssigneeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Sales Reps</option>
              {salesUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-select">
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Lead Sources</option>
            {LEAD_SOURCES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {(search || stageFilter || assigneeFilter || sourceFilter) && (
          <button
            className="btn-ghost btn-sm"
            onClick={() => {
              setSearch('');
              setStageFilter('');
              setAssigneeFilter('');
              setSourceFilter('');
              setPage(1);
            }}
          >
            <MdFilterList /> Clear Filters
          </button>
        )}
      </div>

      {/* Leads Table */}
      <div className="data-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Fetching leads...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <h3>Failed to load leads</h3>
            <p>{error}</p>
            <button className="btn-secondary" onClick={fetchLeads}>Retry</button>
          </div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No leads found</h3>
            <p>Try modifying your search criteria or create a new lead to get started.</p>
            <button className="btn-primary" onClick={handleOpenCreateModal}>Create Lead</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Contact Info</th>
                  <th>Stage</th>
                  <th>Budget</th>
                  <th>Assigned Rep</th>
                  <th>Follow-up Due</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="cell-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{lead.name}</span>
                        {lead._count && lead._count.notes > 0 && (
                          <span style={{ fontSize: '0.75rem', background: '#334155', padding: '1px 6px', borderRadius: '4px', color: '#94a3b8' }}>
                            📝 {lead._count.notes}
                          </span>
                        )}
                      </div>
                      <div className="text-muted text-xs">Source: {lead.source || 'Direct'}</div>
                    </td>
                    <td>
                      <div>{lead.phone}</div>
                      {lead.email && <div className="text-muted text-xs">{lead.email}</div>}
                    </td>
                    <td>
                      <span className={`stage-badge ${lead.stage.toLowerCase().replace('_', '-')}`}>
                        {LEAD_STAGE_LABELS[lead.stage]}
                      </span>
                    </td>
                    <td>
                      {lead.budget ? (
                        <strong style={{ color: '#0F172A', fontWeight: 700 }}>{formatCurrency(lead.budget)}</strong>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: '#334155', fontWeight: 500 }}>
                        {lead.assignedTo?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      {lead.followUpDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                          <MdCalendarToday size={14} />
                          <span>{formatDate(lead.followUpDate)}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          className="btn-icon"
                          title="Edit Lead"
                          onClick={(e) => handleOpenEditModal(lead, e)}
                        >
                          <MdEdit size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          title="View Details & Notes"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/leads/${lead.id}`);
                          }}
                        >
                          <MdOpenInNew size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} total={totalLeads} limit={15} onPageChange={setPage} />
      </div>

      {/* Create / Edit Lead Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <form onSubmit={handleFormSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditing ? 'Edit Lead Profile' : 'Register New Lead'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && (
              <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Patel"
              />
            </div>

            <div className="dashboard-grid" style={{ gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh@example.com"
                />
              </div>
            </div>

            <div className="dashboard-grid" style={{ gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Pipeline Stage *</label>
                <select
                  className="form-select"
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value as LeadStage })}
                >
                  {Object.values(LeadStage).map((stage) => (
                    <option key={stage} value={stage}>
                      {LEAD_STAGE_LABELS[stage]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Lead Source</label>
                <select
                  className="form-select"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  {LEAD_SOURCES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="dashboard-grid" style={{ gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Budget (INR)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="e.g. 7500000"
                />
              </div>

              <div className="form-group">
                <label>Next Follow-Up Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>
            </div>

            {isAdmin && (
              <div className="form-group">
                <label>Assign to Sales Rep</label>
                <select
                  className="form-select"
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {salesUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Saving...' : isEditing ? 'Update Lead' : 'Create Lead'}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};
