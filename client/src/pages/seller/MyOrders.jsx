import { useEffect, useState, useCallback } from 'react';
import { getOrders, cancelOrder } from '../../api/orders';
import { formatINR } from '../../utils/currency';
import { StatusBadge, UnitBadge } from '../../components/Badges';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { Eye, BookOpen, X } from 'lucide-react';

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

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this quotation?')) return;
    try {
      await cancelOrder(id);
      toast.success('Quotation cancelled');
      fetchOrders();
      setDetail(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  return (
    <div className="page-body animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-description">Track your quotations and orders</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="filter-row mb-lg">
        {['', 'quotation','confirmed','processing','fulfilled','cancelled'].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusF === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusF(s)}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={28} /></div>
          <div className="empty-state-title">No orders yet</div>
          <p className="text-sm text-muted">Place a quotation from the catalog to get started</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--spacing-md)' }}>
          {orders.map((o) => (
            <div key={o._id} className="card" style={{ padding:'var(--spacing-md)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span className="mono font-semibold">{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop:4 }}>
                    {new Date(o.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div className="price-display">{formatINR(parseFloat(o.totalAmount) / 100)}</div>
                  <div className="text-xs text-muted">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</div>
                </div>
              </div>

              {/* Items summary */}
              <div style={{ marginTop:12, display:'flex', flexWrap:'wrap', gap:6 }}>
                {o.items.map((item, i) => (
                  <div key={i} style={{ background:'var(--color-bg-3)', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:'0.78rem' }}>
                    {item.productName} — {parseFloat(item.orderedQty)} <span className="unit-badge">{item.orderedUnit}</span>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div className="flex gap-sm">
                <button id={`view-my-order-${o._id}`} className="btn btn-secondary btn-sm" onClick={() => setDetail(o)}>
                  <Eye size={14} /> View Details
                </button>
                {o.status === 'quotation' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleCancel(o._id)}>
                    <X size={14} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`Order ${detail?.orderNumber}`} size="lg">
        {detail && (
          <>
            <div className="modal-body">
              <div className="flex justify-between items-center">
                <StatusBadge status={detail.status} />
                <span className="text-xs text-muted">{new Date(detail.createdAt).toLocaleString('en-IN')}</span>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty Ordered</th>
                      <th>Price / Unit</th>
                      <th>Line Total</th>
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
                          {parseFloat(item.orderedQty).toLocaleString('en-IN')} <UnitBadge unit={item.orderedUnit} />
                        </td>
                        <td>{formatINR(parseFloat(item.pricePerOrderedUnit) / 100)} / {item.orderedUnit}</td>
                        <td className="font-semibold" style={{ color:'var(--color-primary-h)' }}>
                          {formatINR(parseFloat(item.lineTotal) / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, alignItems:'center' }}>
                <span className="text-muted text-sm">Total:</span>
                <span className="total-amount">{formatINR(parseFloat(detail.totalAmount) / 100)}</span>
              </div>

              {detail.notes && (
                <div className="card" style={{ padding:'var(--spacing-md)' }}>
                  <div className="text-xs text-muted mb-md">YOUR NOTES</div>
                  <p className="text-sm">{detail.notes}</p>
                </div>
              )}

              {detail.adminNotes && (
                <div className="card" style={{ padding:'var(--spacing-md)', borderColor:'rgba(99,102,241,0.3)' }}>
                  <div className="text-xs text-muted mb-md">ADMIN NOTES</div>
                  <p className="text-sm">{detail.adminNotes}</p>
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
