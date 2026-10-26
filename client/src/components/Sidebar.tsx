import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  MdDashboard,
  MdPeople,
  MdApartment,
  MdBookmarkAdded,
  MdManageAccounts,
  MdLogout
} from 'react-icons/md';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">🏢</div>
          <div className="brand-text">
            <h2>EstateFlow</h2>
            <span>CRM & Booking Engine</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Main Navigation</div>

            {([
              { to: '/dashboard', icon: <MdDashboard />, label: 'Dashboard', delay: '0ms' },
              { to: '/leads', icon: <MdPeople />, label: 'Leads Management', delay: '60ms' },
              { to: '/properties', icon: <MdApartment />, label: 'Properties & Inventory', delay: '120ms' },
              { to: '/bookings', icon: <MdBookmarkAdded />, label: 'Unit Bookings', delay: '180ms' },
            ] as const).map(({ to, icon, label, delay }) => (
              <NavLink
                key={to}
                to={to}
                style={{ animationDelay: delay }}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-icon">{icon}</span>
                <span>{label}</span>
                <span className="nav-active-dot" />
              </NavLink>
            ))}
          </div>

          {user?.role === Role.ADMIN && (
            <div className="nav-section">
              <div className="nav-section-label">Administration</div>
              <NavLink
                to="/users"
                style={{ animationDelay: '240ms' }}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-icon"><MdManageAccounts /></span>
                <span>Team & Roles</span>
                <span className="nav-active-dot" />
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">
                {user?.role === Role.ADMIN ? '👑 Administrator' : '💼 Sales Executive'}
              </div>
            </div>
            <button
              className="btn-icon"
              title="Logout"
              onClick={logout}
              style={{ marginLeft: 'auto' }}
            >
              <MdLogout size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
