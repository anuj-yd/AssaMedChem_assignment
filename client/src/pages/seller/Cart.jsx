import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../../api/orders';
import { formatINR } from '../../utils/currency';
import { calcLineTotal, CONVERSION_FACTORS } from '../../utils/units';
import { UnitBadge } from '../../components/Badges';
import toast from 'react-hot-toast';
import { Trash2, ShoppingCart, Send, ArrowLeft, Info } from 'lucide-react';

function loadCart() {
  try { return JSON.parse(sessionStorage.getItem('amc_cart') || '[]'); } catch { return []; }
}
function saveCart(c) { sessionStorage.setItem('amc_cart', JSON.stringify(c)); }
function clearCart() { sessionStorage.removeItem('amc_cart'); }

function CartItem({ item, onUpdate, onRemove }) {
  const lineTotal    = calcLineTotal(item.basePricePaise, item.orderedQty, item.orderedUnit);
  const pricePerUnit = (item.basePricePaise * CONVERSION_FACTORS[item.orderedUnit]) / 100;
  const qty          = parseFloat(item.orderedQty) || 0;
  const isValidQty   = qty > 0;

  return (
    <div className="card" style={{
      padding:'var(--spacing-md)',
      border: isValidQty ? undefined : '1px solid rgba(239,68,68,0.3)',
    }}>
      {/* Top row: name + remove */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="font-semibold" style={{ letterSpacing:'-0.01em' }}>{item.productName}</div>
          <div className="mono text-xs text-muted" style={{ marginTop:2 }}>{item.productSku}</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
            <span className="text-xs text-muted">Base unit:</span>
            <UnitBadge unit={item.baseUnit} />
          </div>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => onRemove(item.productId)}
          style={{ color:'var(--color-danger-h)', flexShrink:0 }}
          title="Remove item"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="divider" />

      {/* Controls */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, alignItems:'end', marginTop:10 }}>
        {/* Quantity */}
        <div className="form-group">
          <label className="form-label">Quantity</label>
          <input
            id={`qty-${item.productId}`}
            className="form-input"
            type="number"
            min="0.000001"
            step="any"
            value={item.orderedQty}
            onChange={(e) => onUpdate(item.productId, 'orderedQty', e.target.value)}
            style={!isValidQty ? { borderColor:'var(--color-danger)', boxShadow:'0 0 0 2px rgba(239,68,68,0.15)' } : {}}
          />
          {!isValidQty && <div style={{ fontSize:'0.68rem', color:'var(--color-danger-h)', marginTop:3 }}>Enter a valid quantity</div>}
        </div>

        {/* Unit Selector */}
        <div className="form-group">
          <label className="form-label">Unit</label>
          <select
            id={`unit-${item.productId}`}
            className="form-select"
            value={item.orderedUnit}
            onChange={(e) => onUpdate(item.productId, 'orderedUnit', e.target.value)}
          >
            {item.compatUnits.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Unit Price (display) */}
        <div className="form-group">
          <label className="form-label">Price / {item.orderedUnit}</label>
          <div className="form-input" style={{
            background:'var(--color-bg-3)',
            cursor:'default',
            color:'var(--color-primary-h)',
            fontWeight:800,
            letterSpacing:'-0.01em',
          }}>
            {formatINR(pricePerUnit)}
          </div>
        </div>
      </div>

      {/* Line total */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        marginTop:10,
        background: isValidQty ? 'var(--color-bg-3)' : 'rgba(239,68,68,0.05)',
        borderRadius:'var(--radius-sm)',
        padding:'8px 12px',
        border:`1px solid ${isValidQty ? 'var(--color-border)' : 'rgba(239,68,68,0.2)'}`,
      }}>
        <span className="text-xs text-muted">
          {qty.toLocaleString('en-IN')} {item.orderedUnit} × {formatINR(pricePerUnit)} / {item.orderedUnit}
        </span>
        <span className="price-display">{formatINR(lineTotal)}</span>
      </div>
    </div>
  );
}

export default function SellerCart() {
  const [cart,    setCart]    = useState(loadCart);
  const [notes,   setNotes]   = useState('');
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  const update = (productId, field, value) => {
    const next = cart.map((c) => c.productId === productId ? { ...c, [field]: value } : c);
    setCart(next);
    saveCart(next);
  };

  const remove = (productId) => {
    const item = cart.find(c => c.productId === productId);
    const next = cart.filter((c) => c.productId !== productId);
    setCart(next);
    saveCart(next);
    toast(`${item?.productName || 'Item'} removed`, { icon: '🗑️' });
  };

  const totalINR = cart.reduce((sum, item) =>
    sum + calcLineTotal(item.basePricePaise, item.orderedQty, item.orderedUnit), 0
  );

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    for (const item of cart) {
      if (!parseFloat(item.orderedQty) || parseFloat(item.orderedQty) <= 0) {
        return toast.error(`Enter a valid quantity for ${item.productName}`);
      }
    }

    setPlacing(true);
    try {
      await createOrder({
        items: cart.map((c) => ({
          productId:   c.productId,
          orderedUnit: c.orderedUnit,
          orderedQty:  c.orderedQty,
        })),
        notes,
      });
      clearCart();
      toast.success('Quotation placed successfully! 🎉');
      navigate('/seller/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  /* — Empty state — */
  if (cart.length === 0) {
    return (
      <div className="page-body animate-fade">
        <div className="page-header">
          <h1 className="page-title">My Cart</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon"><ShoppingCart size={28} /></div>
          <div className="empty-state-title">Your cart is empty</div>
          <p className="text-sm text-muted">Browse the catalog and add products to get started</p>
          <button className="btn btn-primary mt-lg" onClick={() => navigate('/seller/catalog')}>
            <ArrowLeft size={15} /> Go to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body animate-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Cart</h1>
          <p className="page-description">
            {cart.length} item{cart.length !== 1 ? 's' : ''} — review quantities before placing quotation
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/seller/catalog')}>
          <ArrowLeft size={14} /> Back to Catalog
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'var(--spacing-lg)', alignItems:'start' }}>
        {/* Items Column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--spacing-md)' }}>
          {cart.map((item) => (
            <CartItem key={item.productId} item={item} onUpdate={update} onRemove={remove} />
          ))}

          {/* Notes */}
          <div className="card" style={{ padding:'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label">
                <Info size={11} /> Order Notes (optional)
              </label>
              <textarea
                id="order-notes"
                className="form-textarea"
                placeholder="Special requirements, delivery preferences, urgency, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ position:'sticky', top:80 }}>
          <div className="card" style={{ background:'var(--color-surface)' }}>
            <div className="font-semibold mb-md" style={{ fontSize:'0.95rem', letterSpacing:'-0.01em' }}>
              Order Summary
            </div>

            {/* Line items */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
              {cart.map((item) => {
                const lt = calcLineTotal(item.basePricePaise, item.orderedQty, item.orderedUnit);
                const qty = parseFloat(item.orderedQty) || 0;
                return (
                  <div key={item.productId} style={{
                    display:'flex', justifyContent:'space-between',
                    alignItems:'flex-start', gap:8,
                    fontSize:'0.8rem',
                  }}>
                    <span className="text-muted truncate" style={{ flex:1, maxWidth:190 }}>
                      {item.productName}
                      <span className="text-xs" style={{ marginLeft:4, color:'var(--text-faint)' }}>
                        ({qty.toLocaleString('en-IN')} {item.orderedUnit})
                      </span>
                    </span>
                    <span style={{ fontWeight:600, flexShrink:0 }}>{formatINR(lt)}</span>
                  </div>
                );
              })}
            </div>

            <div className="divider" />

            {/* Total */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <span className="text-muted text-sm">Subtotal</span>
              <span className="total-amount">{formatINR(totalINR)}</span>
            </div>
            <div style={{ fontSize:'0.68rem', color:'var(--text-faint)', textAlign:'right', marginBottom:16 }}>
              All prices inclusive of applicable charges
            </div>

            {/* Place Order Button */}
            <button
              id="place-order-btn"
              className="btn btn-primary w-full"
              style={{ justifyContent:'center', fontSize:'1rem', padding:'13px' }}
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? (
                <>
                  <div className="spinner spinner-sm" style={{ borderTopColor:'rgba(255,255,255,0.9)', borderColor:'rgba(255,255,255,0.2)' }} />
                  Placing Quotation…
                </>
              ) : (
                <>
                  <Send size={16} /> Place Quotation
                </>
              )}
            </button>

            {/* Note */}
            <div style={{
              marginTop:10, fontSize:'0.68rem', color:'var(--text-muted)',
              textAlign:'center', lineHeight:1.5,
            }}>
              🔒 This will be submitted as a <strong>quotation</strong> for admin review.
              You can cancel it before it's confirmed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
