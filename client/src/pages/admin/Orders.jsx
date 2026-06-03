import { useEffect, useState, useCallback } from 'react';
import { getOrders, updateOrderStatus } from '../../api/orders';
import { formatINR } from '../../utils/currency';
import { StatusBadge, UnitBadge } from '../../components/Badges';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { Eye, ChevronDown, Search } from 'lucide-react';

const ALL_STATUSES = ['quotation','confirmed','processing','fulfilled','cancelled'];

export default function AdminOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusF, setStatusF] = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [detail,  setDetail]  = useState(null);
  const [updating,setUpdating]= useState(false);

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

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      toast.success(`Order status updated to "${newStatus}"`);
      fetchOrders();
      if (detail?._id === orderId) setDetail((d) => ({ ...d, status: newStatus }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(false); }
  };

  return (
    <div className="page-body animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders & Quotations</h1>
          <p className="page-description">{total} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row mb-lg">
        <select className="form-select" style={{ width: 200 }} value={statusF}
          onChange={(e) => { setStatusF(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }} /></td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No orders found</td></tr>
            ) : orders.map((o) => (
              <tr key={o._id}>
                <td><span className="mono font-semibold">{o.orderNumber}</span></td>
                <td>
                  <div className="text-sm font-semibold">{o.sellerName}</div>
                  <div className="text-xs text-muted">{o.sellerEmail}</div>
                </td>
                <td><span className="badge badge-primary">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span></td>
                <td>
                  <span className="font-semibold" style={{ color:'var(--color-primary-h)' }}>
                    {formatINR(parseFloat(o.totalAmount) / 100)}
                  </span>
                </td>
                <td><StatusBadge status={o.status} /></td>
                <td className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <div className="flex gap-2">
                    <button id={`view-order-${o._id}`} className="btn btn-ghost btn-icon" onClick={() => setDetail(o)} title="View Details">
                      <Eye size={15} />
                    </button>
                    <select
                      className="form-select btn-sm"
                      style={{ width:130, padding:'5px 8px', fontSize:'0.78rem' }}
                      value={o.status}
                      onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      disabled={updating}
                    >
                      {ALL_STATUSES.map((s) => (
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
      {total > 15 && (
        <div className="flex justify-end gap-sm mt-md">
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="text-sm text-muted" style={{ alignSelf:'center' }}>Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`Order ${detail?.orderNumber}`} size="lg">
        {detail && (
          <>
            <div className="modal-body">
              {/* Header info */}
              <div className="grid-2">
                <div className="card" style={{ padding:'var(--spacing-md)' }}>
                  <div className="text-xs text-muted mb-md">SELLER</div>
                  <div className="font-semibold">{detail.sellerName}</div>
                  <div className="text-sm text-muted">{detail.sellerEmail}</div>
                  {detail.seller?.company && <div className="text-sm text-muted">{detail.seller.company}</div>}
                  {detail.seller?.phone  && <div className="text-sm text-muted">{detail.seller.phone}</div>}
                </div>
                <div className="card" style={{ padding:'var(--spacing-md)' }}>
                  <div className="text-xs text-muted mb-md">ORDER INFO</div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted">Status</span>
                    <StatusBadge status={detail.status} />
                  </div>
                  <div className="flex justify-between mt-md">
                    <span className="text-sm text-muted">Date</span>
                    <span className="text-sm">{new Date(detail.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between mt-md">
                    <span className="text-sm text-muted">Total</span>
                    <span className="font-semibold" style={{ color:'var(--color-primary-h)' }}>
                      {formatINR(parseFloat(detail.totalAmount) / 100)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="text-xs text-muted mb-md" style={{ textTransform:'uppercase', letterSpacing:'0.06em' }}>Order Items</div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Ordered Qty</th>
                        <th>Base Qty (stored)</th>
                        <th>Price / ordered unit</th>
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
                            <span className="font-semibold">{parseFloat(item.orderedQty).toLocaleString('en-IN')}</span>
                            {' '}<UnitBadge unit={item.orderedUnit} />
                          </td>
                          <td>
                            <span className="text-sm text-muted">
                              {parseFloat(item.baseQty).toLocaleString('en-IN')} {item.baseUnit}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm">
                              {formatINR(parseFloat(item.pricePerOrderedUnit) / 100)} / {item.orderedUnit}
                            </span>
                          </td>
                          <td>
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

              {/* Notes */}
              {detail.notes && (
                <div className="card" style={{ padding:'var(--spacing-md)' }}>
                  <div className="text-xs text-muted mb-md">SELLER NOTES</div>
                  <p className="text-sm">{detail.notes}</p>
                </div>
              )}

              {/* Status update */}
              <div className="form-group">
                <label className="form-label">Update Status</label>
                <select className="form-select" value={detail.status}
                  onChange={(e) => handleStatusChange(detail._id, e.target.value)} disabled={updating}>
                  {ALL_STATUSES.map((s) => (
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
