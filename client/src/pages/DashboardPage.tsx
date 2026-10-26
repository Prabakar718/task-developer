import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dataService';
import { DashboardData, formatCurrency, formatDate, LEAD_STAGE_COLORS, LEAD_STAGE_LABELS } from '../types';
import {
  MdPeople, MdBookmarkAdded, MdCurrencyRupee, MdApartment,
  MdAlarm, MdCalendarMonth, MdArrowForward, MdTrendingUp,
  MdOpenInNew, MdCheckCircle
} from 'react-icons/md';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardService.get()
      .then(res => setData(res))
      .catch(err => setError(err.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" />
      <p>Crunching pipeline numbers...</p>
    </div>
  );

  if (error || !data) return (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <h3>Unable to load dashboard</h3>
      <p>{error || 'Something went wrong.'}</p>
      <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const { stats, leadsByStage, upcomingFollowUps, recentLeads, recentBookings } = data;

  const kpiCards = [
    {
      label: 'Active Leads',
      value: stats.totalLeads,
      icon: <MdPeople />,
      gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #7C3AED 100%)',
      glow: 'rgba(99,102,241,0.45)',
      trend: '+12% this month',
    },
    {
      label: 'Booking Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: <MdCurrencyRupee />,
      gradient: 'linear-gradient(135deg, #0D9488 0%, #059669 50%, #0F766E 100%)',
      glow: 'rgba(13,148,136,0.45)',
      trend: 'Total contract value',
    },
    {
      label: 'Confirmed Bookings',
      value: stats.totalBookings,
      icon: <MdBookmarkAdded />,
      gradient: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%)',
      glow: 'rgba(14,165,233,0.45)',
      trend: 'Units sold',
    },
    {
      label: 'Units Available',
      value: `${stats.availableUnits}/${stats.totalUnits}`,
      icon: <MdApartment />,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
      glow: 'rgba(245,158,11,0.45)',
      trend: 'Ready for booking',
    },
    {
      label: 'Overdue Follow-ups',
      value: stats.overdueFollowUps,
      icon: <MdAlarm />,
      gradient: 'linear-gradient(135deg, #F43F5E 0%, #EF4444 50%, #DC2626 100%)',
      glow: 'rgba(244,63,94,0.45)',
      trend: 'Needs attention',
    },
  ];

  const conversionRate = stats.totalLeads > 0
    ? Math.round((stats.totalBookings / stats.totalLeads) * 100)
    : 0;

  return (
    <div className="dashboard-page">

      {/* ── Hero Header ── */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-greeting">
            <span className="dash-greeting-badge">
              <MdTrendingUp /> Live Dashboard
            </span>
            <h1>Sales Command Center</h1>
            <p>Real-time pipeline performance, follow-ups & unit inventory at a glance.</p>
          </div>
        </div>
        <div className="dash-hero-right">
          <div className="dash-conversion-ring">
            <svg viewBox="0 0 120 120" className="ring-svg">
              <circle cx="60" cy="60" r="50" className="ring-track" />
              <circle
                cx="60" cy="60" r="50"
                className="ring-fill"
                strokeDasharray={`${conversionRate * 3.14} 314`}
              />
            </svg>
            <div className="ring-label">
              <span className="ring-value">{conversionRate}%</span>
              <span className="ring-text">Conversion</span>
            </div>
          </div>
          <div className="dash-hero-actions">
            <button className="btn-secondary" onClick={() => navigate('/properties')}>
              <MdApartment /> View Inventory
            </button>
            <button className="btn-primary" onClick={() => navigate('/leads')}>
              <MdPeople /> Manage Leads
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        {kpiCards.map((card, i) => (
          <div className="kpi-card" key={i} style={{
            background: card.gradient,
            boxShadow: `0 8px 32px ${card.glow}`,
            animationDelay: `${i * 80}ms`,
          }}>
            <div className="kpi-icon-wrap">
              <span style={{ color: '#fff', fontSize: '1.9rem', display: 'flex', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
                {card.icon}
              </span>
            </div>
            <div className="kpi-body">
              <div className="kpi-value">{card.value}</div>
              <div className="kpi-label">{card.label}</div>
              <div className="kpi-trend">{card.trend}</div>
            </div>
            <div className="kpi-accent" style={{ background: card.gradient, boxShadow: `0 0 20px ${card.glow}` }} />
          </div>
        ))}
      </div>

      {/* ── Pipeline + Follow-ups ── */}
      <div className="dashboard-grid mb-2">

        {/* Pipeline Funnel */}
        <div className="data-card dash-pipeline-card">
          <div className="card-header">
            <h3><MdTrendingUp style={{ color: '#6366F1', marginRight: 6 }} /> Pipeline Funnel</h3>
            <span className="text-muted text-xs">{stats.totalLeads} total leads</span>
          </div>
          <div className="card-body">
            {leadsByStage.length === 0 ? (
              <p className="text-muted text-sm">No leads recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {leadsByStage.map((s, i) => {
                  const pct = stats.totalLeads > 0 ? Math.round((s.count / stats.totalLeads) * 100) : 0;
                  const color = LEAD_STAGE_COLORS[s.stage] || '#6366f1';
                  return (
                    <div key={s.stage} style={{ animationDelay: `${i * 60}ms` }} className="pipeline-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}` }} />
                          <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.82rem' }}>
                            {LEAD_STAGE_LABELS[s.stage]}
                          </span>
                        </div>
                        <span style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 600 }}>
                          {s.count} <span style={{ color: '#94A3B8', fontWeight: 400 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height: '10px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                          borderRadius: '6px',
                          transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
                          boxShadow: `0 0 8px ${color}66`,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Follow-ups */}
        <div className="data-card">
          <div className="card-header">
            <h3><MdCalendarMonth style={{ color: '#F59E0B', marginRight: 6 }} /> Priority Follow-Ups</h3>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/leads')}>View All</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {upcomingFollowUps.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <p style={{ color: '#475569', fontWeight: 600, fontSize: '0.875rem' }}>All caught up!</p>
                <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>No follow-ups due this week.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {upcomingFollowUps.map((lead, i) => (
                  <div
                    key={lead.id}
                    className="followup-row"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="followup-avatar">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span className={`stage-badge ${lead.stage.toLowerCase().replace('_', '-')}`} style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                          {LEAD_STAGE_LABELS[lead.stage]}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: '#F59E0B', fontWeight: 700, fontSize: '0.78rem' }}>
                        {lead.followUpDate ? formatDate(lead.followUpDate) : '—'}
                      </div>
                      <MdOpenInNew size={13} style={{ color: '#94A3B8', marginTop: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Leads + Bookings ── */}
      <div className="dashboard-grid">

        {/* Recent Leads */}
        <div className="data-card">
          <div className="card-header">
            <h3><MdPeople style={{ color: '#6366F1', marginRight: 6 }} /> Recent Leads</h3>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/leads')}>
              All Leads <MdArrowForward />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentLeads.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8' }}>No leads yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentLeads.map((lead, i) => (
                  <div
                    key={lead.id}
                    className="followup-row"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="followup-avatar" style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.82rem' }}>{lead.name}</div>
                      <div style={{ color: '#64748B', fontSize: '0.75rem' }}>{lead.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className={`stage-badge ${lead.stage.toLowerCase().replace('_', '-')}`} style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                        {LEAD_STAGE_LABELS[lead.stage]}
                      </span>
                      {lead.budget && (
                        <div style={{ color: '#0D9488', fontWeight: 700, fontSize: '0.75rem', marginTop: 3 }}>
                          {formatCurrency(lead.budget)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="data-card">
          <div className="card-header">
            <h3><MdCheckCircle style={{ color: '#0D9488', marginRight: 6 }} /> Recent Bookings</h3>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/bookings')}>
              All Bookings <MdArrowForward />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentBookings.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8' }}>No bookings yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentBookings.map((b, i) => (
                  <div key={b.id} className="followup-row" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="followup-avatar" style={{ background: 'linear-gradient(135deg,#0D9488,#059669)' }}>
                      {(b.lead?.name || 'B').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.82rem' }}>
                        {b.lead?.name || 'Customer'}
                      </div>
                      <div style={{ color: '#64748B', fontSize: '0.75rem' }}>
                        Unit {b.unit?.unitNumber} · {b.unit?.building?.project?.name || 'Project'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.82rem' }}>
                        {formatCurrency(b.amount)}
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '0.72rem', marginTop: 2 }}>
                        {formatDate(b.bookingDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
