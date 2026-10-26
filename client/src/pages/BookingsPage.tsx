import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { bookingService, leadService, propertyService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { Booking, Lead, Unit, formatCurrency, formatDate } from '../types';
import { MdBookmarkAdded, MdAdd, MdCheckCircle, MdCancel, MdApartment, MdPerson } from 'react-icons/md';
import { Pagination } from '../components/Pagination';

const LIMIT = 10;

export const BookingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const totalPages = Math.ceil(totalBookings / LIMIT);

  // Booking Modal
  const [showModal, setShowModal] = useState(false);
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [bookingForm, setBookingForm] = useState({
    leadId: '',
    unitId: '',
    amount: 0,
    notes: '',
  });

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bookingService.list({ page: String(page), limit: String(LIMIT) });
      setBookings(res.bookings);
      setTotalBookings(res.pagination?.total ?? res.bookings.length);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Load leads and available units when opening booking modal or if URL has params
  const initBookingModal = useCallback(async (initialLeadId?: string, initialUnitId?: string) => {
    try {
      setModalError(null);
      const [leadsRes, unitsRes] = await Promise.all([
        leadService.list({ limit: 100 }),
        propertyService.listUnits({ status: 'AVAILABLE' }),
      ]);
      setLeadsList(leadsRes.leads);
      setAvailableUnits(unitsRes.units);

      const targetLeadId = initialLeadId || leadsRes.leads[0]?.id || '';
      let targetUnitId = initialUnitId || unitsRes.units[0]?.id || '';
      let initialPrice = 0;

      if (targetUnitId) {
        const found = unitsRes.units.find(u => u.id === targetUnitId);
        if (found) {
          initialPrice = found.price;
        } else if (unitsRes.units.length > 0) {
          targetUnitId = unitsRes.units[0].id;
          initialPrice = unitsRes.units[0].price;
        }
      }

      setBookingForm({
        leadId: targetLeadId,
        unitId: targetUnitId,
        amount: initialPrice,
        notes: '',
      });
      setShowModal(true);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Handle URL pre-fill params (?leadId=... or ?unitId=...)
  useEffect(() => {
    const paramLeadId = searchParams.get('leadId');
    const paramUnitId = searchParams.get('unitId');
    if (paramLeadId || paramUnitId) {
      initBookingModal(paramLeadId || undefined, paramUnitId || undefined);
      // Clear query params so closing modal doesn't re-trigger
      setSearchParams({});
    }
  }, [searchParams, initBookingModal, setSearchParams]);

  const handleUnitChange = (unitId: string) => {
    const selected = availableUnits.find(u => u.id === unitId);
    setBookingForm(prev => ({
      ...prev,
      unitId,
      amount: selected ? selected.price : prev.amount,
    }));
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      await bookingService.create({
        leadId: bookingForm.leadId,
        unitId: bookingForm.unitId,
        amount: Number(bookingForm.amount),
        notes: bookingForm.notes || undefined,
      });
      setShowModal(false);
      fetchBookings();
    } catch (err: any) {
      // Highlights double-booking error if another user booked it concurrently
      setModalError(
        err.response?.data?.error ||
        'Booking transaction rejected. The unit might have just been booked by another agent.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The property unit will be released back to AVAILABLE.')) {
      return;
    }
    try {
      await bookingService.cancel(bookingId);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Unit Bookings & Contracts</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Confirmed sales contracts linking customers to verified inventory units
          </p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => initBookingModal()}>
            <MdAdd size={20} />
            <span>Create New Booking</span>
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="data-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading bookings ledger...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <h3>Unable to retrieve bookings</h3>
            <p>{error}</p>
            <button className="btn-secondary" onClick={fetchBookings}>Retry</button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📑</div>
            <h3>No bookings created yet</h3>
            <p>Connect a customer lead with an available unit to close your first deal.</p>
            <button className="btn-primary" onClick={() => initBookingModal()}>
              Create Booking
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer (Lead)</th>
                  <th>Property Unit</th>
                  <th>Contract Price</th>
                  <th>Status</th>
                  <th>Sales Exec</th>
                  <th>Date</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.8rem' }}>
                        #{b.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="cell-primary">{b.lead?.name}</div>
                      <div className="text-muted text-xs">{b.lead?.phone}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MdApartment style={{ color: '#818cf8' }} />
                        <strong>Unit {b.unit?.unitNumber}</strong>
                      </div>
                      <div className="text-muted text-xs">
                        {b.unit?.building?.project?.name}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>
                        {formatCurrency(b.amount)}
                      </strong>
                    </td>
                    <td>
                      <span className={`status-badge ${b.status.toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>{b.bookedBy?.name}</td>
                    <td>{formatDate(b.bookingDate)}</td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {b.status === 'CONFIRMED' && (
                          <button
                            className="btn-danger btn-sm"
                            title="Cancel Booking & Release Unit"
                            onClick={() => handleCancelBooking(b.id)}
                          >
                            <MdCancel /> Cancel
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={totalBookings} limit={LIMIT} onPageChange={setPage} />
      </div>

      {/* Booking Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <form onSubmit={handleCreateBooking}>
          <Modal.Header closeButton>
            <Modal.Title>Complete Property Unit Booking</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && (
              <div style={{ padding: '0.85rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                ⚠️ {modalError}
              </div>
            )}

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Select Customer / Lead *</label>
                <select
                  className="form-select"
                  required
                  value={bookingForm.leadId}
                  onChange={(e) => setBookingForm({ ...bookingForm, leadId: e.target.value })}
                >
                  <option value="">Choose a lead...</option>
                  {leadsList.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.phone}) — {lead.stage}
                    </option>
                  ))}
                </select>
                <div className="form-help">Selected lead stage will automatically update to BOOKED</div>
              </div>

              <div className="form-group">
                <label>Select Available Unit *</label>
                <select
                  className="form-select"
                  required
                  value={bookingForm.unitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                >
                  <option value="">Choose available inventory unit...</option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unitNumber} ({u.building?.project?.name} - {u.type}) — {formatCurrency(u.price)}
                    </option>
                  ))}
                </select>
                <div className="form-help">Unit status will automatically be locked to prevent double-booking</div>
              </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Contract / Booking Amount (INR) *</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={bookingForm.amount}
                  onChange={(e) => setBookingForm({ ...bookingForm, amount: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Special Terms & Notes</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 10% advance received, balance on registration"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div style={{ background: '#F0FDFA', padding: '1rem', borderRadius: '10px', border: '1px solid #CCFBF1', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0D9488', fontWeight: 600, fontSize: '0.85rem' }}>
                <MdCheckCircle /> Atomic Database Transaction Guarantee
              </div>
              <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '4px', margin: 0 }}>
                This booking executes inside a PostgreSQL database transaction. If two sales agents click book simultaneously on the same unit, the first transaction commits and the second is immediately rejected with a collision safeguard alert.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !bookingForm.leadId || !bookingForm.unitId}
            >
              {submitting ? 'Confirming Transaction...' : 'Confirm Booking'}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};
