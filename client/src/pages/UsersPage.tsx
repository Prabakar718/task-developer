import React, { useEffect, useState, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { userService } from '../services/dataService';
import { User, Role, formatDate } from '../types';
import {
  MdManageAccounts,
  MdAdd,
  MdCheckCircle,
  MdBlock,
} from 'react-icons/md';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.SALES_EMPLOYEE,
    phone: '',
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await userService.list();
      setUsers(res.users);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      await userService.create(newUser);
      setShowModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: Role.SALES_EMPLOYEE,
        phone: '',
      });
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create user account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    const action = currentActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }
    try {
      await userService.toggleActive(userId);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || `Failed to ${action} user`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Team & Role Administration</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage sales representatives, administrators, access permissions, and account statuses
          </p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <MdAdd size={20} />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      <div className="data-card">
        <div className="card-header">
          <h3>
            <MdManageAccounts style={{ color: '#6366f1' }} />
            System Users Directory
          </h3>
          <span className="text-muted text-xs">{users.length} registered accounts</span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading team directory...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <h3>Could not load users</h3>
              <p>{error}</p>
              <button className="btn-secondary" onClick={fetchUsers}>Retry</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Active Leads</th>
                  <th>Bookings Closed</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="cell-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: u.role === Role.ADMIN ? '#172554' : '#0D9488',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong>{u.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{u.email}</div>
                      {u.phone && <div className="text-muted text-xs">{u.phone}</div>}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: u.role === Role.ADMIN ? '#EEF2FF' : '#F0FDFA',
                          color: u.role === Role.ADMIN ? '#172554' : '#0D9488',
                          border: u.role === Role.ADMIN ? '1px solid #E0E7FF' : '1px solid #CCFBF1',
                        }}
                      >
                        {u.role === Role.ADMIN ? '👑 Admin' : '💼 Sales Rep'}
                      </span>
                    </td>
                    <td>
                      <strong>{u._count?.assignedLeads || 0}</strong>
                    </td>
                    <td>
                      <strong>{u._count?.bookings || 0}</strong>
                    </td>
                    <td>
                      <span className={`status-badge ${u.active ? 'confirmed' : 'cancelled'}`}>
                        {u.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={u.active ? 'btn-danger btn-sm' : 'btn-success btn-sm'}
                        onClick={() => handleToggleActive(u.id, u.active)}
                      >
                        {u.active ? <><MdBlock /> Deactivate</> : <><MdCheckCircle /> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <form onSubmit={handleCreateUser}>
          <Modal.Header closeButton>
            <Modal.Title>Create New User Account</Modal.Title>
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
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="e.g. Vikram Malhotra"
              />
            </div>

            <div className="form-group">
              <label>Work Email Address *</label>
              <input
                type="email"
                className="form-control"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="vikram@estatecrm.com"
              />
            </div>

            <div className="form-group">
              <label>Initial Password *</label>
              <input
                type="password"
                className="form-control"
                required
                minLength={6}
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Min 6 characters"
              />
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>System Role *</label>
                <select
                  className="form-select"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                >
                  <option value={Role.SALES_EMPLOYEE}>Sales Employee</option>
                  <option value={Role.ADMIN}>Administrator</option>
                </select>
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating User...' : 'Create Account'}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};
