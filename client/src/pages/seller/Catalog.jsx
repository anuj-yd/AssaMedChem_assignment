import { useEffect, useState, useCallback } from 'react';
import { getProducts, getCategories } from '../../api/products';
import { formatINR } from '../../utils/currency';
import { getCompatibleUnits, CONVERSION_FACTORS } from '../../utils/units';
import { UnitBadge } from '../../components/Badges';
import { Search, ShoppingCart, Plus, Check, FlaskConical, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function loadCart() {
  try { return JSON.parse(sessionStorage.getItem('amc_cart') || '[]'); } catch { return []; }
}
function saveCart(cart) { sessionStorage.setItem('amc_cart', JSON.stringify(cart)); }

function StockIndicator({ qty, threshold, unit }) {
  const stock = parseFloat(qty);
  const thresh = parseFloat(threshold);
  const status = stock === 0 ? 'critical' : stock <= thresh ? 'low' : 'good';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.78rem' }}>
      <span className={`stock-dot ${status}`} />
      <span style={{ color:'var(--text-secondary)' }}>
        {stock.toLocaleString('en-IN')} <span style={{ color:'var(--text-muted)' }}>{unit}</span>
      </span>
      {status === 'low'      && <span style={{ color:'var(--color-warning-h)', fontWeight:600, fontSize:'0.68rem' }}>Low</span>}
      {status === 'critical' && <span style={{ color:'var(--color-danger-h)',  fontWeight:600, fontSize:'0.68rem' }}>Out of Stock</span>}
    </div>
  );
}

function ProductCard({ product, cart, onAddToCart }) {
  const priceInr    = parseFloat(product.basePricePerUnit) / 100;
  const inCart      = cart.some((c) => c.productId === product._id);
  const compatUnits = getCompatibleUnits(product.baseUnit);
  const stock       = parseFloat(product.stockQty);
  const outOfStock  = stock === 0;

  return (
    <div className="product-card">
      {/* Header */}
      <div className="product-card-header">
        <div style={{ flex:1, minWidth:0 }}>
          <div className="product-name truncate">{product.name}</div>
          <div className="product-sku">{product.sku}</div>
        </div>
        <UnitBadge unit={product.baseUnit} />
      </div>

      {product.category && (
        <div className="product-category">
          <span style={{ opacity:0.6 }}>📂</span> {product.category}
        </div>
      )}

      {product.description && (
        <div className="text-xs text-muted" style={{ marginBottom:10, lineHeight:1.5 }}>
          {product.description.slice(0, 90)}{product.description.length > 90 ? '…' : ''}
        </div>
      )}

      {/* Prices for compatible units */}
      <div style={{
        background:'var(--color-bg-3)',
        borderRadius:'var(--radius-sm)',
        border:'1px solid var(--color-border)',
        padding:'10px 12px',
        marginBottom:10,
        display:'flex',
        flexDirection:'column',
        gap:5,
        flex:1,
      }}>
        {compatUnits.map((u) => {
          const factor = CONVERSION_FACTORS[u];
          const priceForUnit = priceInr * factor;
          const isBase = u === product.baseUnit;
          return (
            <div key={u} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <UnitBadge unit={u} />
              <span style={{
                fontWeight: isBase ? 800 : 600,
                color: isBase ? 'var(--color-primary-h)' : 'var(--text-secondary)',
                fontSize: isBase ? '0.95rem' : '0.85rem',
                letterSpacing:'-0.01em',
              }}>
                {formatINR(priceForUnit)}
                <span style={{ fontSize:'0.65rem', fontWeight:400, color:'var(--text-muted)', marginLeft:2 }}>/{u}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Stock */}
      <StockIndicator qty={product.stockQty} threshold={product.lowStockThreshold} unit={product.baseUnit} />

      {/* Add to Cart Button */}
      <button
        id={`add-to-cart-${product._id}`}
        className={`btn w-full mt-sm ${inCart ? 'btn-secondary' : outOfStock ? 'btn-secondary' : 'btn-primary'}`}
        onClick={() => !outOfStock && onAddToCart(product)}
        disabled={outOfStock}
        style={{ justifyContent:'center', marginTop:10 }}
      >
        {inCart
          ? <><Check size={14} /> In Cart</>
          : outOfStock
            ? 'Out of Stock'
            : <><Plus size={14} /> Add to Cart</>
        }
      </button>
    </div>
  );
}

export default function SellerCatalog() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [cart,       setCart]       = useState(loadCart);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search)    params.search   = search;
      if (catFilter) params.category = catFilter;
      const { data } = await getProducts(params);
      setProducts(data.products);
      setTotal(data.total);
    } catch { toast.error('Failed to load catalog'); }
    finally { setLoading(false); }
  }, [search, catFilter, page]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchProducts();
    });
  }, [fetchProducts]);
  useEffect(() => { getCategories().then(({ data }) => setCategories(data.categories)); }, []);

  const addToCart = (product) => {
    const existing = loadCart();
    if (existing.some((c) => c.productId === product._id)) {
      toast('Already in cart', { icon: '🛒' });
      return;
    }
    const compatUnits = getCompatibleUnits(product.baseUnit);
    const newItem = {
      productId:      product._id,
      productName:    product.name,
      productSku:     product.sku,
      baseUnit:       product.baseUnit,
      basePricePaise: parseFloat(product.basePricePerUnit),
      orderedUnit:    product.baseUnit,
      orderedQty:     '1',
      compatUnits,
    };
    const newCart = [...existing, newItem];
    saveCart(newCart);
    setCart(newCart);
    toast.success(`${product.name} added to cart`);
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="page-body animate-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-description">{total} product{total !== 1 ? 's' : ''} available</p>
        </div>
        {cart.length > 0 && (
          <button
            id="go-to-cart-btn"
            className="btn btn-primary"
            onClick={() => navigate('/seller/cart')}
          >
            <ShoppingCart size={16} />
            View Cart
            <span style={{
              background:'rgba(255,255,255,0.25)',
              borderRadius:'var(--radius-full)',
              padding:'1px 7px',
              fontSize:'0.78rem',
              fontWeight:800,
              marginLeft:2,
            }}>{cart.length}</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-lg" style={{ padding:'var(--spacing-md)' }}>
        <div className="filter-row">
          <div className="search-bar" style={{ flex:1, maxWidth:420 }}>
            <Search size={15} />
            <input
              className="form-input"
              placeholder="Search products by name, SKU, category…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Filter size={14} style={{ color:'var(--text-muted)' }} />
            <select
              className="form-select"
              style={{ width:200 }}
              value={catFilter}
              onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {(search || catFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setCatFilter(''); setPage(1); }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Active filters display */}
        {(search || catFilter) && (
          <div style={{ marginTop:10, display:'flex', gap:6, flexWrap:'wrap' }}>
            {search && (
              <span className="badge badge-primary">
                Search: "{search}"
              </span>
            )}
            {catFilter && (
              <span className="badge badge-cyan">
                Category: {catFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
          <span className="loading-text">Loading products…</span>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FlaskConical size={28} /></div>
          <div className="empty-state-title">No products found</div>
          <p className="text-sm text-muted">
            {search || catFilter
              ? 'Try adjusting your search or clearing filters'
              : 'Products will appear here once added by the admin'
            }
          </p>
          {(search || catFilter) && (
            <button className="btn btn-secondary mt-lg" onClick={() => { setSearch(''); setCatFilter(''); }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="product-grid stagger">
          {products.map((p, i) => (
            <div key={p._id} className="animate-up" style={{ animationDelay:`${i * 40}ms` }}>
              <ProductCard product={p} cart={cart} onAddToCart={addToCart} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-lg">
          <span className="text-sm text-muted">
            Page {page} of {totalPages} · {total} products
          </span>
          <div className="flex gap-sm">
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
