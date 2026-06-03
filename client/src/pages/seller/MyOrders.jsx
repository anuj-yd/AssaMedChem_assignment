import { useEffect, useState, useCallback } from 'react';
import { getOrders, cancelOrder } from '../../api/orders';
import { formatINR } from '../../utils/currency';
import { StatusBadge, UnitBadge } from '../../components/Badges';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { Eye, BookOpen, X, ShoppingCart, TrendingUp } from 'lucide-react';

const ALL_STATUSES = ['', 'quotation','confirmed','processing','fulfilled','cancelled'];

function OrderCard({ order, onView, onCancel }) {
  const statusColors = {
    quotation:  { border:'rgba(245,158,11,0.25)',  bg:'rgba(245,158,11,0.04)' },
    confirmed:  { border:'rgba(99,102,241,0.25)',  bg:'rgba(99,102,241,0.04)' },
    processing: { border:'rgba(6,182,212,0.25)',   bg:'rgba(6,182,212,0.04)' },
    fulfilled:  { border:'rgba(16,185,129,0.25)',  bg:'rgba(16,185,129,0.04)' },
    cancelled:  { border:'rgba(100,116,139,0.2)',  bg:'transparent' },
  };
  const sc = statusColors[order.status] || {};

  return (
    <div className="card animate-up" style={{
      borderColor: sc.border,
      background: `linear-gradient(var(--color-surface), var(--color-surface)), ${sc.bg}`,
      transition:'all var(--transition-base)',
    }}>
      {/* Top row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span className="mono font-semibold" style={{ fontSize:'0.95rem', letterSpacing:'0.02em' }}>
              {order.orderNumber}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <div className="text-xs text-muted">
            {new Date(order.createdAt).toLocaleString('en-IN', {
              day:'numeric', month:'short', year:'numeric',
              hour:'2-digit', minute:'2-digit'
            })}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className="price-display">{formatINR(parseFloat(order.totalAmount) / 100)}</div>
          <div className="text-xs text-muted" style={{ marginTop:2 }}>
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Item chips */}
      <div style={{ marginTop:12, display:'flex', flexWrap:'wrap', gap:6 }}>
        {order.items.slice(0, 4).map((item, i) => (
          <div key={i} style={{
            background:'var(--color-surface-2)',
            borderRadius:'var(--radius-sm)',
            padding:'4px 10px',
            fontSize:'0.75rem',
            border:'1px solid var(--color-border)',
            display:'flex', alignItems:'center', gap:5,
          }}>
            <span>{item.productName}</span>
            <span style={{ color:'var(--text-muted)' }}>·</span>
            <span style={{ fontWeight:600 }}>{parseFloat(item.orderedQty)}</span>
            <UnitBadge unit={item.orderedUnit} />
          </div>
        ))}
        {order.items.length > 4 && (
          <div style={{
            background:'var(--color-surface-2)',
            borderRadius:'var(--radius-sm)',
            padding:'4px 10px',
            fontSize:'0.75rem',
            border:'1px solid var(--color-border)',
            color:'var(--text-muted)',
          }}>
            +{order.items.length - 4} more
          </div>
        )}
      </div>

      <div className="divider" />

      {/* Actions */}
      <div className="flex gap-sm items-center">
        <button
          id={`view-my-order-${order._id}`}
          className="btn btn-secondary btn-sm"
          onClick={() => onView(order)}
        >
          <Eye size={13} /> View Details
        </button>
        {order.status === 'quotation' && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onCancel(order._id)}
          >
            <X size={13} /> Cancel
          </button>
        )}
        {order.status === 'fulfilled' && (
          <span style={{
            fontSize:'0.72rem', color:'var(--color-success-h)',
            fontWeight:600, display:'flex', alignItems:'center', gap:4,
          }}>
            ✓ Order fulfilled
          </span>
        )}
      </div>
    </div>
  );
}

export default function SellerOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusF, setStatusF] = useState('');
  const [detail,  setDetail]  = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusF) params.status = statusF;
      const { data } = await getOrders(params);
      setOrders(data.orders);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [statusF]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchOrders();
    });
  }, [fetchOrders]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this quotation? This cannot be undone.')) return;
    try {
      await cancelOrder(id);
      toast.success('Quotation cancelled');
      fetchOrders();
      setDetail(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  /* Summary stats */
  const totalValue   = orders.reduce((s, o) => s + parseFloat(o.totalAmount) / 100, 0);
  const pendingCount = orders.filter(o => o.status === 'quotation').length;

  return (
    <div className="page-body animate-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-description">Track your quotations and order status</p>
        </div>
      </div>

      {/* Quick Stats */}
      {!loading && orders.length > 0 && (
        <div className="grid-3 mb-lg stagger">
          <div className="card animate-up" style={{ padding:'var(--spacing-md)', borderTop:'2px solid rgba(99,102,241,0.4)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div className="stats-label">Total Orders</div>
                <div style={{ fontSize:'1.6rem', fontWeight:900, background:'var(--grad-primary)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing:'-0.03em', marginTop:4 }}>
                  {orders.length}
                </div>
              </div>
              <ShoppingCart size={20} style={{ color:'var(--color-primary-h)', opacity:0.7 }} />
            </div>
          </div>
          <div className="card animate-up" style={{ padding:'var(--spacing-md)', borderTop:'2px solid rgba(245,158,11,0.4)', animationDelay:'60ms' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div className="stats-label">Pending Review</div>
                <div style={{ fontSize:'1.6rem', fontWeight:900, color:'var(--color-warning-h)', letterSpacing:'-0.03em', marginTop:4 }}>
                  {pendingCount}
                </div>
              </div>
              <BookOpen size={20} style={{ color:'var(--color-warning-h)', opacity:0.7 }} />
            </div>
          </div>
          <div className="card animate-up" style={{ padding:'var(--spacing-md)', borderTop:'2px solid rgba(16,185,129,0.4)', animationDelay:'120ms' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div className="stats-label">Total Value</div>
                <div style={{ fontSize:'1.2rem', fontWeight:900, color:'var(--color-success-h)', letterSpacing:'-0.02em', marginTop:4 }}>
                  {formatINR(totalValue)}
                </div>
              </div>
              <TrendingUp size={20} style={{ color:'var(--color-success-h)', opacity:0.7 }} />
            </div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="card mb-lg" style={{ padding:'var(--spacing-md)' }}>
        <div className="filter-row flex-wrap">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${statusF === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusF(s)}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Orders'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
          <span className="loading-text">Loading orders…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={28} /></div>
          <div className="empty-state-title">
            {statusF ? `No ${statusF} orders` : 'No orders yet'}
          </div>
          <p className="text-sm text-muted">
            {statusF
              ? 'Try selecting a different status filter'
              : 'Place a quotation from the catalog to get started'
            }
          </p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--spacing-md)' }}>
          {orders.map((o, i) => (
            <div key={o._id} style={{ animationDelay:`${i * 40}ms` }}>
              <OrderCard
                order={o}
                onView={setDetail}
                onCancel={handleCancel}
              />
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={`📋 Order ${detail?.orderNumber}`}
        size="lg"
      >
        {detail && (
          <>
            <div className="modal-body">
              {/* Status + Date */}
              <div style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'12px 16px',
                background:'var(--color-surface-2)',
                borderRadius:'var(--radius-md)',
                border:'1px solid var(--color-border)',
              }}>
                <div>
                  <div className="text-xs text-muted mb-xs">Status</div>
                  <StatusBadge status={detail.status} />
                </div>
                <div style={{ textAlign:'right' }}>
                  <div className="text-xs text-muted mb-xs">Placed on</div>
                  <div className="text-sm">{new Date(detail.createdAt).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div className="text-xs text-muted mb-xs">Total</div>
                  <div className="font-semibold" style={{ color:'var(--color-primary-h)', fontSize:'1.1rem', letterSpacing:'-0.02em' }}>
                    {formatINR(parseFloat(detail.totalAmount) / 100)}
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
                        <th>Qty Ordered</th>
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

              {/* Your notes */}
              {detail.notes && (
                <div className="card" style={{ padding:'var(--spacing-md)', background:'var(--color-surface-2)' }}>
                  <div className="text-xs text-muted mb-xs" style={{ textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>Your Notes</div>
                  <p className="text-sm" style={{ lineHeight:1.6 }}>{detail.notes}</p>
                </div>
              )}

              {/* Admin notes */}
              {detail.adminNotes && (
                <div className="card" style={{
                  padding:'var(--spacing-md)',
                  background:'rgba(99,102,241,0.06)',
                  borderColor:'rgba(99,102,241,0.25)',
                }}>
                  <div className="text-xs mb-xs" style={{
                    textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700,
                    color:'var(--color-primary-h)',
                  }}>Admin Notes</div>
                  <p className="text-sm" style={{ lineHeight:1.6 }}>{detail.adminNotes}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {detail.status === 'quotation' && (
                <button className="btn btn-danger" onClick={() => handleCancel(detail._id)}>
                  <X size={14} /> Cancel Order
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
