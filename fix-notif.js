const fs = require('fs');
const path = 'c:/Users/USER/Desktop/Task Developer/client/src/styles/App.scss';
let c = fs.readFileSync(path, 'utf8');

// Remove old broken notif styles if any
['header-notif-wrap','header-notif-btn','header-notif-dropdown','hnd-header','hnd-list','hnd-empty','hnd-item','hnd-footer','header-search-clear'].forEach(cls => {
  const idx = c.indexOf('.' + cls);
  if (idx !== -1) console.log('Found old:', cls, 'at', idx);
});

const marker = '// ─── Executive Stat Cards';
const idx = c.indexOf(marker);
if (idx === -1) { console.log('Marker not found'); process.exit(1); }

const styles = `
// ─── Notification Panel ───────────────────────────────
.hdr-notif {
  position: relative;
}

.hdr-notif-bell {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #94A3B8;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover, &.open {
    background: rgba(13,148,136,0.15);
    border-color: rgba(13,148,136,0.4);
    color: #2DD4BF;
    box-shadow: 0 0 16px rgba(13,148,136,0.2);
  }

  .hdr-notif-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 19px;
    height: 19px;
    padding: 0 4px;
    border-radius: 9999px;
    background: linear-gradient(135deg, #EF4444, #DC2626);
    border: 2px solid #080E1F;
    box-shadow: 0 0 10px rgba(239,68,68,0.65);
    color: #fff;
    font-size: 0.58rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: $font-family;
    animation: pulse-ring 2s ease-in-out infinite;
  }
}

@keyframes hnp-slide-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.hdr-notif-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 340px;
  background: linear-gradient(160deg, #0D1528 0%, #080E1F 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 18px;
  box-shadow:
    0 32px 64px rgba(0,0,0,0.55),
    0 0 0 1px rgba(255,255,255,0.04) inset,
    0 0 40px rgba(13,148,136,0.08);
  overflow: hidden;
  z-index: 1200;
  animation: hnp-slide-in 0.2s cubic-bezier(0.34,1.56,0.64,1) both;

  // Teal top accent line
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #0D9488, #2DD4BF, #6366F1, transparent);
  }
}

.hnp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.1rem 0.8rem;
  border-bottom: 1px solid rgba(255,255,255,0.07);

  .hnp-head-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hnp-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba(245,158,11,0.15);
    border: 1px solid rgba(245,158,11,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FCD34D;
    flex-shrink: 0;
  }

  .hnp-title {
    font-size: 0.82rem;
    font-weight: 700;
    color: #F1F5F9;
    letter-spacing: -0.01em;
  }

  .hnp-badge {
    font-size: 0.62rem;
    font-weight: 800;
    padding: 3px 9px;
    border-radius: 9999px;
    background: rgba(239,68,68,0.15);
    color: #FCA5A5;
    border: 1px solid rgba(239,68,68,0.3);
    white-space: nowrap;
  }
}

.hnp-body {
  max-height: 300px;
  overflow-y: auto;
  @include custom-scrollbar;
}

.hnp-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 2rem;
  color: #64748B;
  font-size: 0.78rem;

  .hnp-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.1);
    border-top-color: #0D9488;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
}

.hnp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.2rem 1rem;
  gap: 6px;
  text-align: center;

  .hnp-empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(13,148,136,0.12);
    border: 1px solid rgba(13,148,136,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0D9488;
    margin-bottom: 6px;
  }

  p {
    font-size: 0.85rem;
    font-weight: 700;
    color: #F1F5F9;
    margin: 0;
  }

  span {
    font-size: 0.72rem;
    color: #475569;
  }
}

.hnp-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem 1.1rem;
  cursor: pointer;
  transition: background 150ms ease;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  animation: row-in 0.2s ease both;

  &:last-child { border-bottom: none; }

  &:hover {
    background: rgba(255,255,255,0.05);

    .hnp-arrow { color: #2DD4BF; transform: translateX(3px); }
  }
}

.hnp-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}

.hnp-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hnp-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #F1F5F9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hnp-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.67rem;
  color: #64748B;
}

.hnp-date { color: #F59E0B; font-weight: 600; }

.hnp-arrow {
  color: #334155;
  flex-shrink: 0;
  transition: all 150ms ease;
}

.hnp-footer {
  padding: 0.65rem 1.1rem;
  border-top: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.02);

  button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: linear-gradient(135deg, rgba(13,148,136,0.15), rgba(5,150,105,0.1));
    border: 1px solid rgba(13,148,136,0.3);
    border-radius: 10px;
    color: #2DD4BF;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.5rem;
    cursor: pointer;
    font-family: $font-family;
    transition: all 150ms ease;

    &:hover {
      background: linear-gradient(135deg, rgba(13,148,136,0.25), rgba(5,150,105,0.18));
      box-shadow: 0 0 16px rgba(13,148,136,0.2);
    }
  }
}

`;

const result = c.slice(0, idx) + styles + c.slice(idx);
fs.writeFileSync(path, result, 'utf8');
console.log('Done. Length:', result.length);
