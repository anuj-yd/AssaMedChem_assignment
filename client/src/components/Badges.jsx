const STATUS_MAP = {
  quotation:  { label: 'Quotation',  cls: 'status-quotation'  },
  confirmed:  { label: 'Confirmed',  cls: 'status-confirmed'  },
  processing: { label: 'Processing', cls: 'status-processing' },
  fulfilled:  { label: 'Fulfilled',  cls: 'status-fulfilled'  },
  cancelled:  { label: 'Cancelled',  cls: 'status-cancelled'  },
};

export function StatusBadge({ status }) {
  const { label, cls } = STATUS_MAP[status] || { label: status, cls: 'badge-muted' };
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function RoleBadge({ role }) {
  return (
    <span className={`badge ${role === 'admin' ? 'badge-violet' : 'badge-cyan'}`}>
      {role}
    </span>
  );
}

export function UnitBadge({ unit }) {
  return <span className="unit-badge">{unit}</span>;
}
