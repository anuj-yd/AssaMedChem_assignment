import { useEffect, useState, useCallback } from 'react';
import { getOrders, updateOrderStatus } from '../../api/orders';
import { formatINR } from '../../utils/currency';
import { StatusBadge, UnitBadge } from '../../components/Badges';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { Eye, RefreshCw, ClipboardList, Building2, Phone } from 'lucide-react';

const ALL_STATUSES = ['quotation','confirmed','processing','fulfilled','cancelled'];

export default function AdminOrders() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [statusF,  setStatusF]  = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [detail,   setDetail]   = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusF) params.status = statusF;
      const { data } = await getOrders(params);
      setOrders(data.orders);
      setTotal(data.total);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [statusF, page]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchOrders();
    });
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      toast.success(`Status updated → ${newStatus}`);
      fetchOrders();
      if (detail?._id === orderId) setDetail(d => ({ ...d, status: newStatus }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(false); }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="page-body animate-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders & Quotations</h1>
          <p className="page-description">{total} total order{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="card mb-lg" style={{ padding:'var(--spacing-md)' }}>
        <div className="filter-row">
          {['', ...ALL_STATUSES].map(s => (
            <button
              key={s}
              className={`btn btn-sm ${statusF === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setStatusF(s); setPage(1); }}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Orders'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Seller</th>
              <th>Items</th>
              <th>Total (INR)</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign:'center', padding:48 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                    <div className="spinner" />
                    <span className="text-sm text-muted">Loading orders…</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><ClipboardList size={24} /></div>
                    <div className="empty-state-title">No orders found</div>
                    <p className="text-sm text-muted">
                      {statusF ? `No orders with status "${statusF}"` : 'Orders will appear here once sellers place them'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : orders.map((o) => (
              <tr key={o._id}>
                <td>
                  <span className="mono font-semibold" style={{ color:'var(--text-primary)', letterSpacing:'0.02em' }}>
                    {o.orderNumber}
                  </span>
                </td>
                <td>
                  <div className="text-sm font-semibold">{o.sellerName}</div>
                  <div className="text-xs text-muted">{o.sellerEmail}</div>
                </td>
                <td>
                  <span className="badge badge-primary">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span>
                </td>
                <td>
                  <span className="font-semibold" style={{ color:'var(--color-primary-h)', letterSpacing:'-0.01em' }}>
                    {formatINR(parseFloat(o.totalAmount) / 100)}
                  </span>
                </td>
                <td><StatusBadge status={o.status} /></td>
                <td>
                  <div className="text-sm">{new Date(o.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                  <div className="text-xs text-muted">{new Date(o.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</div>
                </td>
                <td>
                  <div className="flex gap-2" style={{ justifyContent:'flex-end', alignItems:'center' }}>
                    <button
                      id={`view-order-${o._id}`}
                      className="btn btn-ghost btn-icon"
                      onClick={() => setDetail(o)}
                      title="View Details"
                    >
                      <Eye size={15} />
                    </button>
                    <select
                      className="form-select btn-sm"
                      style={{ width:140, fontSize:'0.78rem', padding:'5px 32px 5px 10px', cursor:'pointer' }}
                      value={o.status}
                      onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      disabled={updating}
                    >
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-md">
          <span className="text-sm text-muted">Page {page} of {totalPages} · {total} orders</span>
          <div className="flex gap-sm">
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={`📋 Order ${detail?.orderNumber}`}
        size="lg"
      >
        {detail && (
          <>
            <div className="modal-body">
              {/* Seller + Order Info */}
              <div className="grid-2">
                <div className="card" style={{ padding:'var(--spacing-md)', background:'var(--color-surface-2)' }}>
                  <div className="text-xs text-muted mb-sm" style={{ textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>
                    Seller Information
                  </div>
                  <div className="font-semibold">{detail.sellerName}</div>
                  <div className="text-sm text-muted" style={{ marginTop:4 }}>{detail.sellerEmail}</div>
                  {detail.seller?.company && (
                    <div className="flex items-center gap-sm text-sm text-muted" style={{ marginTop:6 }}>
                      <Building2 size={13} /> {detail.seller.company}
                    </div>
                  )}
                  {detail.seller?.phone && (
                    <div className="flex items-center gap-sm text-sm text-muted" style={{ marginTop:4 }}>
                      <Phone size={13} /> {detail.seller.phone}
                    </div>
                  )}
                </div>

                <div className="card" style={{ padding:'var(--spacing-md)', background:'var(--color-surface-2)' }}>
                  <div className="text-xs text-muted mb-sm" style={{ textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>
                    Order Info
                  </div>
                  <div className="flex justify-between items-center" style={{ marginBottom:8 }}>
                    <span className="text-sm text-muted">Status</span>
                    <StatusBadge status={detail.status} />
                  </div>
                  <div className="flex justify-between items-center" style={{ marginBottom:8 }}>
                    <span className="text-sm text-muted">Date</span>
                    <span className="text-sm">{new Date(detail.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center" style={{ marginBottom:8 }}>
                    <span className="text-sm text-muted">Items</span>
                    <span className="badge badge-primary">{detail.items.length}</span>
                  </div>
                  <div className="divider" style={{ margin:'8px 0' }} />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Total</span>
                    <span className="font-semibold" style={{ color:'var(--color-primary-h)', fontSize:'1rem', letterSpacing:'-0.02em' }}>
                      {formatINR(parseFloat(detail.totalAmount) / 100)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="text-xs text-muted mb-sm" style={{ textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>
                  Order Items
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Ordered Qty</th>
                        <th>Base Qty</th>
                        <th>Unit Price</th>
                        <th style={{ textAlign:'right' }}>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((item, i) => (
                        <tr key={i}>
                          <td>
                            <div className="font-semibold text-sm">{item.productName}</div>
                            <div className="mono text-xs text-muted">{item.productSku}</div>
                          </td>
                          <td>
                            <span className="font-semibold">{parseFloat(item.orderedQty).toLocaleString('en-IN')}</span>
                            {' '}<UnitBadge unit={item.orderedUnit} />
                          </td>
                          <td className="text-sm text-muted">
                            {parseFloat(item.baseQty).toLocaleString('en-IN')} {item.baseUnit}
                          </td>
                          <td className="text-sm">
                            {formatINR(parseFloat(item.pricePerOrderedUnit) / 100)} / {item.orderedUnit}
                          </td>
                          <td style={{ textAlign:'right' }}>
                            <span className="font-semibold" style={{ color:'var(--color-primary-h)' }}>
                              {formatINR(parseFloat(item.lineTotal) / 100)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Seller Notes */}
              {detail.notes && (
                <div className="card" style={{ padding:'var(--spacing-md)', background:'var(--color-surface-2)' }}>
                  <div className="text-xs text-muted mb-sm" style={{ textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>
                    Seller Notes
                  </div>
                  <p className="text-sm" style={{ lineHeight:1.6 }}>{detail.notes}</p>
                </div>
              )}

              {/* Update Status */}
              <div className="form-group">
                <label className="form-label">Update Order Status</label>
                <select
                  className="form-select"
                  value={detail.status}
                  onChange={(e) => handleStatusChange(detail._id, e.target.value)}
                  disabled={updating}
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
