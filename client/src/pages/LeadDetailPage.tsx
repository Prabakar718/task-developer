import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadService } from '../services/dataService';
import { Lead, LeadStage, LEAD_STAGE_LABELS, formatCurrency, formatDate, formatDateTime } from '../types';
import {
  MdArrowBack,
  MdPhone,
  MdEmail,
  MdCalendarToday,
  MdSend,
  MdBookmarkAdded,
  MdAccessTime
} from 'react-icons/md';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note form
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Follow-up date update
  const [followUpDateInput, setFollowUpDateInput] = useState('');
  const [updatingFollowUp, setUpdatingFollowUp] = useState(false);

  const fetchLead = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await leadService.get(id);
      setLead(res.lead);
      if (res.lead.followUpDate) {
        setFollowUpDateInput(res.lead.followUpDate.split('T')[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch lead');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleStageChange = async (newStage: LeadStage) => {
    if (!lead) return;
    try {
      const res = await leadService.update(lead.id, { stage: newStage });
      setLead(prev => prev ? { ...prev, stage: res.lead.stage } : null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update stage');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !lead) return;
    try {
      setAddingNote(true);
      setNoteError(null);
      const res = await leadService.addNote(lead.id, noteContent.trim());
      setLead(prev => prev ? {
        ...prev,
        notes: [res.note, ...(prev.notes || [])],
      } : null);
      setNoteContent('');
    } catch (err: any) {
      setNoteError(err.response?.data?.error || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleUpdateFollowUp = async () => {
    if (!lead) return;
    try {
      setUpdatingFollowUp(true);
      const iso = followUpDateInput ? new Date(followUpDateInput).toISOString() : null;
      await leadService.update(lead.id, { followUpDate: iso });
      setLead(prev => prev ? { ...prev, followUpDate: iso } : null);
      alert('Follow-up schedule updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update follow-up date');
    } finally {
      setUpdatingFollowUp(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading lead dossier...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="error-state">
        <h3>Could not load lead</h3>
        <p>{error || 'Record does not exist'}</p>
        <button className="btn-secondary" onClick={() => navigate('/leads')}>
          <MdArrowBack /> Back to Leads
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate('/leads')}>
            <MdArrowBack size={20} />
          </button>
          <div>
            <h1>{lead.name}</h1>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
              <span className={`stage-badge ${lead.stage.toLowerCase().replace('_', '-')}`}>
                {LEAD_STAGE_LABELS[lead.stage]}
              </span>
              <span className="text-muted text-xs">
                Added on {formatDate(lead.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button
            className="btn-primary"
            onClick={() => navigate(`/bookings?leadId=${lead.id}`)}
          >
            <MdBookmarkAdded size={18} />
            <span>Book Property Unit</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid mb-2">
        {/* Left Column: Lead Info & Pipeline Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Contact Details Card */}
          <div className="data-card">
            <div className="card-header">
              <h3>Lead Profile & Requirements</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="btn-icon" style={{ background: '#F1F5F9', color: '#0D9488' }}>
                    <MdPhone />
                  </div>
                  <div>
                    <div className="text-muted text-xs">Phone Number</div>
                    <div style={{ fontWeight: 600, color: '#172554' }}>{lead.phone}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="btn-icon" style={{ background: '#F1F5F9', color: '#172554' }}>
                    <MdEmail />
                  </div>
                  <div>
                    <div className="text-muted text-xs">Email Address</div>
                    <div style={{ color: '#172554' }}>{lead.email || 'Not provided'}</div>
                  </div>
                </div>

                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '10px' }}>
                    <div className="text-muted text-xs">Budget Range</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0D9488', marginTop: '2px' }}>
                      {lead.budget ? formatCurrency(lead.budget) : 'Flexible'}
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '10px' }}>
                    <div className="text-muted text-xs">Acquisition Source</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#172554', marginTop: '2px' }}>
                      {lead.source || 'Website'}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '10px' }}>
                  <div className="text-muted text-xs">Assigned Sales Representative</div>
                  <div style={{ fontWeight: 600, color: '#172554', marginTop: '2px' }}>
                    {lead.assignedTo?.name || 'Unassigned'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Stage Transition Card */}
          <div className="data-card">
            <div className="card-header">
              <h3>Advance Pipeline Stage</h3>
            </div>
            <div className="card-body">
              <p className="text-muted text-xs mb-1">
                Click a stage to transition this lead through your sales pipeline:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.values(LeadStage).map((stage) => {
                  const isActive = lead.stage === stage;
                  return (
                    <button
                      key={stage}
                      className={isActive ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                      onClick={() => handleStageChange(stage)}
                    >
                      {LEAD_STAGE_LABELS[stage]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Follow-up scheduler card */}
          <div className="data-card">
            <div className="card-header">
              <h3>
                <MdCalendarToday style={{ color: '#f59e0b', marginRight: '6px' }} />
                Next Follow-Up Schedule
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="date"
                  className="form-control"
                  value={followUpDateInput}
                  onChange={(e) => setFollowUpDateInput(e.target.value)}
                />
                <button
                  className="btn-primary"
                  onClick={handleUpdateFollowUp}
                  disabled={updatingFollowUp}
                >
                  {updatingFollowUp ? 'Updating...' : 'Save Date'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interaction Notes Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Notes Log */}
          <div className="data-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <h3>Activity & Meeting Notes</h3>
              <span className="text-muted text-xs">
                {lead.notes?.length || 0} entries
              </span>
            </div>

            <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem' }}>
                {noteError && (
                  <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    {noteError}
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <textarea
                    className="form-control"
                    placeholder="Log call notes, site visit feedback, or customer objections..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    required
                    style={{ minHeight: '90px', paddingBottom: '2.5rem' }}
                  />
                  <button
                    type="submit"
                    className="btn-primary btn-sm"
                    disabled={addingNote || !noteContent.trim()}
                    style={{ position: 'absolute', bottom: '8px', right: '8px' }}
                  >
                    <MdSend /> {addingNote ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </form>

              {/* Notes Timeline */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(!lead.notes || lead.notes.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    📝 No notes added yet. Record the first customer interaction above!
                  </div>
                ) : (
                  lead.notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '0.85rem 1rem',
                      }}
                    >
                      <div className="d-flex justify-between align-center mb-1" style={{ marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#172554', fontSize: '0.85rem' }}>
                          {note.user?.name || 'Sales Rep'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '0.72rem' }}>
                          <MdAccessTime size={12} />
                          {formatDateTime(note.createdAt)}
                        </span>
                      </div>
                      <p style={{ color: '#334155', fontSize: '0.875rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {note.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Booking History Table */}
      {lead.bookings && lead.bookings.length > 0 && (
        <div className="data-card">
          <div className="card-header">
            <h3>Connected Unit Bookings</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit Number</th>
                  <th>Project</th>
                  <th>Booking Price</th>
                  <th>Status</th>
                  <th>Booked By</th>
                  <th>Booking Date</th>
                </tr>
              </thead>
              <tbody>
                {lead.bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="cell-primary">{b.unit?.unitNumber}</td>
                    <td>{b.unit?.building?.project?.name}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(b.amount)}</td>
                    <td>
                      <span className={`status-badge ${b.status.toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>{b.bookedBy?.name}</td>
                    <td>{formatDate(b.bookingDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
