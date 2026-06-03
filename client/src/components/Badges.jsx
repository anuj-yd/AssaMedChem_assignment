/* ── Status Badges ── */
const STATUS_MAP = {
  quotation:  { label: 'Quotation',  cls: 'status-quotation',  icon: '⏳' },
  confirmed:  { label: 'Confirmed',  cls: 'status-confirmed',  icon: '✓' },
  processing: { label: 'Processing', cls: 'status-processing', icon: '⚙' },
  fulfilled:  { label: 'Fulfilled',  cls: 'status-fulfilled',  icon: '✅' },
  cancelled:  { label: 'Cancelled',  cls: 'status-cancelled',  icon: '✗' },
};

export function StatusBadge({ status }) {
  const { label, cls, icon } = STATUS_MAP[status] || { label: status, cls: 'badge-muted', icon: '·' };
  return (
    <span className={`badge ${cls}`}>
      <span style={{ fontSize:'0.65em', lineHeight:1 }}>{icon}</span>
      {label}
    </span>
  );
}

/* ── Role Badges ── */
export function RoleBadge({ role }) {
  return (
    <span className={`badge ${role === 'admin' ? 'badge-violet' : 'badge-cyan'}`}>
      {role === 'admin' ? '👑' : '🏪'} {role}
    </span>
  );
}

/* ── Unit Badges ── */
export function UnitBadge({ unit }) {
  return <span className="unit-badge">{unit}</span>;
}
