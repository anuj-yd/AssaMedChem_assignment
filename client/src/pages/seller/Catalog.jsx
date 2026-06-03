import { useEffect, useState, useCallback, useContext, createContext } from 'react';
import { getProducts, getCategories } from '../../api/products';
import { formatINR } from '../../utils/currency';
import { getCompatibleUnits, calcLineTotal, CONVERSION_FACTORS } from '../../utils/units';
import { UnitBadge } from '../../components/Badges';
import { Search, Filter, ShoppingCart, Plus, Check, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Cart stored in sessionStorage to persist across tab navigations
function loadCart() {
  try { return JSON.parse(sessionStorage.getItem('amc_cart') || '[]'); } catch { return []; }
}
function saveCart(cart) {
  sessionStorage.setItem('amc_cart', JSON.stringify(cart));
}

function ProductCard({ product, cart, onAddToCart }) {
  const priceInr  = parseFloat(product.basePricePerUnit) / 100;
  const stock     = parseFloat(product.stockQty);
  const threshold = parseFloat(product.lowStockThreshold);
  const stockStatus = stock === 0 ? 'critical' : stock <= threshold ? 'low' : 'good';
  const inCart    = cart.some((c) => c.productId === product._id);
  const compatUnits = getCompatibleUnits(product.baseUnit);

  return (
    <div className="product-card">
      <div className="product-card-header">
        <div style={{ flex:1, minWidth:0 }}>
          <div className="product-name truncate">{product.name}</div>
          <div className="product-sku">{product.sku}</div>
        </div>
        <UnitBadge unit={product.baseUnit} />
      </div>

      {product.category && (
        <div className="product-category">📂 {product.category}</div>
      )}

      {product.description && (
        <div className="text-xs text-muted" style={{ marginBottom: 8, lineHeight: 1.5 }}>
          {product.description.slice(0, 100)}{product.description.length > 100 ? '…' : ''}
        </div>
      )}

      {/* Prices for all compatible units */}
      <div style={{ display:'flex', flexDirection:'column', gap:4, background:'var(--color-bg-3)', borderRadius:'var(--radius-sm)', padding:'10px 12px', marginBottom:8 }}>
        {compatUnits.map((u) => {
          const factor = CONVERSION_FACTORS[u];
          const priceForUnit = priceInr * factor;
          return (
            <div key={u} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <UnitBadge unit={u} />
              <span className="font-semibold" style={{ color: u === product.baseUnit ? 'var(--color-primary-h)' : 'var(--text-secondary)', fontSize:'0.9rem' }}>
                {formatINR(priceForUnit)} / {u}
              </span>
            </div>
          );
        })}
      </div>

      <div className="product-stock">
        <span className={`stock-dot ${stockStatus}`} />
        Stock: {stock.toLocaleString('en-IN')} {product.baseUnit}
        {stockStatus === 'low' && <span style={{ color:'var(--color-warning)', marginLeft:4 }}>· Low</span>}
      </div>

      <button
        id={`add-to-cart-${product._id}`}
        className={`btn w-full mt-md ${inCart ? 'btn-secondary' : 'btn-primary'}`}
        onClick={() => onAddToCart(product)}
        style={{ justifyContent:'center' }}
      >
        {inCart ? <><Check size={15} /> In Cart</> : <><Plus size={15} /> Add to Cart</>}
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
      if (search)    params.search = search;
      if (catFilter) params.category = catFilter;
      const { data } = await getProducts(params);
      setProducts(data.products);
      setTotal(data.total);
    } catch { toast.error('Failed to load catalog'); }
    finally { setLoading(false); }
  }, [search, catFilter, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { getCategories().then(({ data }) => setCategories(data.categories)); }, []);

  const addToCart = (product) => {
    const existing = loadCart();
    if (existing.some((c) => c.productId === product._id)) {
      toast('Already in cart', { icon: '🛒' });
      return;
    }
    const compatUnits = getCompatibleUnits(product.baseUnit);
    const newItem = {
      productId:   product._id,
      productName: product.name,
      productSku:  product.sku,
      baseUnit:    product.baseUnit,
      basePricePaise: parseFloat(product.basePricePerUnit),
      orderedUnit: product.baseUnit,
      orderedQty:  '1',
      compatUnits,
    };
    const newCart = [...existing, newItem];
    saveCart(newCart);
    setCart(newCart);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="page-body animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-description">{total} products available</p>
        </div>
        {cart.length > 0 && (
          <button id="go-to-cart-btn" className="btn btn-primary" onClick={() => navigate('/seller/cart')}>
            <ShoppingCart size={16} />
            Cart ({cart.length})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-row mb-lg">
        <div className="search-bar" style={{ flex:1, maxWidth:400 }}>
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Search products…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="form-select" style={{ width:200 }} value={catFilter}
          onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || catFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setCatFilter(''); setPage(1); }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FlaskConical size={28} /></div>
          <div className="empty-state-title">No products found</div>
          <p className="text-sm text-muted">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} cart={cart} onAddToCart={addToCart} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex justify-end gap-sm mt-lg">
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="text-sm text-muted" style={{ alignSelf:'center' }}>Page {page} of {Math.ceil(total/12)}</span>
          <button className="btn btn-secondary btn-sm" disabled={page * 12 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
