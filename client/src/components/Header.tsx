import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dataService';
import { Lead, LEAD_STAGE_LABELS, formatDate } from '../types';
import {
  MdMenu, MdLogout, MdNotificationsNone, MdNotificationsActive,
  MdKeyboardArrowDown, MdAlarm, MdArrowForward, MdCheckCircle,
} from 'react-icons/md';

const PAGE_TITLES: Record<string, { label: string; emoji: string }> = {
  '/':           { label: 'Dashboard',  emoji: '📊' },
  '/leads':      { label: 'Leads',      emoji: '👥' },
  '/properties': { label: 'Properties', emoji: '🏢' },
  '/bookings':   { label: 'Bookings',   emoji: '🔑' },
  '/team':       { label: 'Team',       emoji: '🤝' },
};

interface HeaderProps { onToggleSidebar: () => void; }

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Live clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [overdueLeads, setOverdueLeads] = useState<Lead[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    setNotifLoading(true);
    dashboardService.get()
      .then(d => setOverdueLeads(d.upcomingFollowUps || []))
      .catch(() => setOverdueLeads([]))
      .finally(() => setNotifLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = () => {
    setNotifOpen(prev => {
      if (!prev) fetchNotifications(); // opening → refresh
      return !prev;
    });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const page      = PAGE_TITLES[location.pathname] ?? { label: 'EstateFlow', emoji: '🏠' };
  const initials  = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U';
  const isAdmin   = user?.role === 'ADMIN';
  const timeStr   = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr   = time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const count     = overdueLeads.length;

  return (
    <header className="top-header">

      {/* Left */}
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          <MdMenu size={22} />
        </button>
        <div className="header-page-title">
          <span className="header-page-emoji">{page.emoji}</span>
          <span className="header-page-name">{page.label}</span>
        </div>
      </div>

      {/* Right */}
      <div className="header-right">

        {/* Clock */}
        <div className="header-clock">
          <span className="header-clock-time">{timeStr}</span>
          <span className="header-clock-date">{dateStr}</span>
        </div>

        <div className="header-divider" />

        {/* Notification bell + dropdown */}
        <div className="hdr-notif" ref={notifRef}>
          <button
            className={`hdr-notif-bell ${notifOpen ? 'open' : ''}`}
            onClick={() => handleBellClick()}
          >
            {count > 0
              ? <MdNotificationsActive size={21} />
              : <MdNotificationsNone size={21} />
            }
            {count > 0 && (
              <span className="hdr-notif-badge">{count > 9 ? '9+' : count}</span>
            )}
          </button>

          {notifOpen && (
            <div className="hdr-notif-panel">

              {/* Panel header */}
              <div className="hnp-head">
                <div className="hnp-head-left">
                  <span className="hnp-icon"><MdAlarm size={16} /></span>
                  <span className="hnp-title">Follow-up Reminders</span>
                </div>
                {count > 0 && (
                  <span className="hnp-badge">{count} pending</span>
                )}
              </div>

              {/* Panel body */}
              <div className="hnp-body">
                {notifLoading ? (
                  <div className="hnp-loading">
                    <div className="hnp-spinner" />
                    <span>Loading…</span>
                  </div>
                ) : count === 0 ? (
                  <div className="hnp-empty">
                    <div className="hnp-empty-icon">
                      <MdCheckCircle size={32} />
                    </div>
                    <p>All caught up!</p>
                    <span>No pending follow-ups right now</span>
                  </div>
                ) : (
                  overdueLeads.slice(0, 7).map((lead, i) => (
                    <div
                      key={lead.id}
                      className="hnp-item"
                      onClick={() => { navigate(`/leads/${lead.id}`); setNotifOpen(false); }}
                    >
                      <div className="hnp-avatar" style={{ background: `hsl(${i * 55 % 360},55%,40%)` }}>
                        {lead.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="hnp-info">
                        <span className="hnp-name">{lead.name}</span>
                        <span className="hnp-meta">
                          <span className={`hnp-stage stage-dot-${lead.stage.toLowerCase()}`} />
                          {LEAD_STAGE_LABELS[lead.stage]}
                          {lead.followUpDate && (
                            <> · <span className="hnp-date">{formatDate(lead.followUpDate)}</span></>
                          )}
                        </span>
                      </div>
                      <MdArrowForward size={14} className="hnp-arrow" />
                    </div>
                  ))
                )}
              </div>

              {/* Panel footer */}
              {count > 0 && (
                <div className="hnp-footer">
                  <button onClick={() => { navigate('/leads'); setNotifOpen(false); }}>
                    View all leads <MdArrowForward size={13} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="header-divider" />

        {/* User pill */}
        <div className="header-user">
          <div className="header-avatar">{initials}</div>
          <div className="header-user-info">
            <span className="header-user-name">{user?.name}</span>
            <span className={`header-role-pill ${isAdmin ? 'admin' : 'sales'}`}>
              {isAdmin ? '⚡ Admin' : '💼 Sales'}
            </span>
          </div>
          <MdKeyboardArrowDown size={15} className="header-chevron" />
        </div>

        <div className="header-divider" />

        {/* Logout */}
        <button className="header-logout-btn" onClick={logout}>
          <MdLogout size={17} />
          <span>Sign Out</span>
        </button>

      </div>
    </header>
  );
};
