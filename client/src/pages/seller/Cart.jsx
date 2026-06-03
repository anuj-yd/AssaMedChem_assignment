import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../../api/orders';
import { formatINR } from '../../utils/currency';
import { calcLineTotal, CONVERSION_FACTORS, getCompatibleUnits } from '../../utils/units';
import { UnitBadge } from '../../components/Badges';
import toast from 'react-hot-toast';
import { Trash2, ShoppingCart, Send, ArrowLeft } from 'lucide-react';

function loadCart() {
  try { return JSON.parse(sessionStorage.getItem('amc_cart') || '[]'); } catch { return []; }
}
function saveCart(c) { sessionStorage.setItem('amc_cart', JSON.stringify(c)); }
function clearCart() { sessionStorage.removeItem('amc_cart'); }

function CartItem({ item, onUpdate, onRemove }) {
  const lineTotal = calcLineTotal(item.basePricePaise, item.orderedQty, item.orderedUnit);
  const pricePerUnit = (item.basePricePaise * CONVERSION_FACTORS[item.orderedUnit]) / 100;

  return (
    <div className="card" style={{ padding:'var(--spacing-md)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'var(--spacing-md)', alignItems:'start' }}>
        <div>
          <div className="font-semibold">{item.productName}</div>
          <div className="mono text-xs text-muted">{item.productSku}</div>
          <div className="text-xs text-muted mt-md">
            Stored in base unit: <UnitBadge unit={item.baseUnit} />
          </div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={() => onRemove(item.productId)}
          style={{ color:'var(--color-danger)' }}>
          <Trash2 size={16} />
        </button>
      </div>

      <div className="divider" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, alignItems:'end' }}>
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
          />
        </div>

        {/* Unit selector */}
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

        {/* Price display */}
        <div className="form-group">
          <label className="form-label">Price / {item.orderedUnit}</label>
          <div className="form-input" style={{ background:'var(--color-bg-3)', cursor:'default', color:'var(--color-primary-h)', fontWeight:700 }}>
            {formatINR(pricePerUnit)}
          </div>
        </div>
      </div>

      {/* Line total */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8,
        background:'var(--color-bg-3)', borderRadius:'var(--radius-sm)', padding:'8px 12px' }}>
        <span className="text-xs text-muted">
          {parseFloat(item.orderedQty) || 0} {item.orderedUnit} × {formatINR(pricePerUnit)} / {item.orderedUnit}
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
    const next = cart.filter((c) => c.productId !== productId);
    setCart(next);
    saveCart(next);
  };

  const totalINR = cart.reduce((sum, item) => {
    return sum + calcLineTotal(item.basePricePaise, item.orderedQty, item.orderedUnit);
  }, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    for (const item of cart) {
      if (!parseFloat(item.orderedQty) || parseFloat(item.orderedQty) <= 0) {
        return toast.error(`Please enter a valid quantity for ${item.productName}`);
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
            <ArrowLeft size={16} /> Go to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Cart</h1>
          <p className="page-description">{cart.length} item{cart.length !== 1 ? 's' : ''} — review before placing quotation</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/seller/catalog')}>
          <ArrowLeft size={14} /> Back to Catalog
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'var(--spacing-lg)', alignItems:'start' }}>
        {/* Items */}
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--spacing-md)' }}>
          {cart.map((item) => (
            <CartItem key={item.productId} item={item} onUpdate={update} onRemove={remove} />
          ))}

          {/* Notes */}
          <div className="card" style={{ padding:'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea
                id="order-notes"
                className="form-textarea"
                placeholder="Special requirements, delivery notes, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ position:'sticky', top: 80 }}>
          <div className="card">
            <div className="font-semibold mb-md">Order Summary</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {cart.map((item) => {
                const lt = calcLineTotal(item.basePricePaise, item.orderedQty, item.orderedUnit);
                return (
                  <div key={item.productId} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem' }}>
                    <span className="text-muted truncate" style={{ maxWidth:180 }}>
                      {item.productName}
                      <span className="text-xs" style={{ marginLeft:4 }}>
                        ({parseFloat(item.orderedQty) || 0} {item.orderedUnit})
                      </span>
                    </span>
                    <span>{formatINR(lt)}</span>
                  </div>
                );
              })}
            </div>

            <div className="divider" />

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span className="text-muted text-sm">Total Amount</span>
              <span className="total-amount">{formatINR(totalINR)}</span>
            </div>

            <div style={{ marginTop:4, fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'right' }}>
              Prices inclusive of all applicable charges
            </div>

            <button
              id="place-order-btn"
              className="btn btn-primary w-full mt-lg"
              style={{ justifyContent:'center' }}
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? 'Placing Quotation…' : <><Send size={16}/> Place Quotation</>}
            </button>

            <div style={{ marginTop:8, fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'center' }}>
              This will be submitted as a quotation for admin review.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
