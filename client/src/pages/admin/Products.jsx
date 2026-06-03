import { useEffect, useState, useCallback } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../../api/products';
import { formatINR } from '../../utils/currency';
import { ALL_UNITS, getCompatibleUnits } from '../../utils/units';
import { UnitBadge } from '../../components/Badges';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Package, Filter, RefreshCw } from 'lucide-react';

const EMPTY_FORM = {
  name:'', sku:'', description:'', category:'',
  baseUnit:'g', basePricePerUnit:'', stockQty:'0', lowStockThreshold:'0', isActive: true,
};

function StockBar({ qty, threshold }) {
  const q = parseFloat(qty);
  const t = parseFloat(threshold);
  if (t <= 0) return null;
  const pct = Math.min((q / t) * 100, 100);
  const color = q === 0 ? 'var(--color-danger)' : q <= t ? 'var(--color-warning)' : 'var(--color-success)';
  return (
    <div title={`${q.toLocaleString('en-IN')} / ${t.toLocaleString('en-IN')}`}>
      <div className="progress-bar" style={{ marginTop: 4 }}>
        <div className="progress-fill" style={{ width:`${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [modal,      setModal]      = useState({ open: false, mode: 'create', product: null });
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search)    params.search   = search;
      if (catFilter) params.category = catFilter;
      const { data } = await getProducts(params);
      setProducts(data.products);
      setTotal(data.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, catFilter, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { getCategories().then(({ data }) => setCategories(data.categories)); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'create', product: null }); };
  const openEdit   = (p) => {
    setForm({
      name: p.name, sku: p.sku, description: p.description || '',
      category: p.category || '', baseUnit: p.baseUnit,
      basePricePerUnit: (parseFloat(p.basePricePerUnit) / 100).toString(),
      stockQty:         parseFloat(p.stockQty).toString(),
      lowStockThreshold:parseFloat(p.lowStockThreshold).toString(),
      isActive: p.isActive,
    });
    setModal({ open: true, mode: 'edit', product: p });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await createProduct(form);
        toast.success('Product created successfully');
      } else {
        await updateProduct(modal.product._id, form);
        toast.success('Product updated successfully');
      }
      setModal({ open: false });
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate "${name}"?`)) return;
    try {
      await deleteProduct(id);
      toast.success('Product deactivated');
      fetchProducts();
    } catch { toast.error('Failed to deactivate'); }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const priceInINR = parseFloat(form.basePricePerUnit) || 0;
  const totalPages = Math.ceil(total / 15);

  return (
    <div className="page-body animate-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-description">
            {total} product{total !== 1 ? 's' : ''} in inventory
          </p>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-secondary btn-sm" onClick={fetchProducts} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button id="create-product-btn" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-lg" style={{ padding:'var(--spacing-md)' }}>
        <div className="filter-row">
          <div className="search-bar" style={{ flex:1, maxWidth:380 }}>
            <Search size={15} />
            <input
              className="form-input"
              placeholder="Search by name, SKU, category…"
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
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Base Unit</th>
              <th>Price / Unit</th>
              <th>Stock Level</th>
              <th>Status</th>
              <th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign:'center', padding:48 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                    <div className="spinner" />
                    <span className="text-sm text-muted">Loading products…</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Package size={24} /></div>
                    <div className="empty-state-title">No products found</div>
                    <p className="text-sm text-muted">
                      {search || catFilter ? 'Try adjusting your search or filters' : 'Click "Add Product" to get started'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : products.map((p) => {
              const pricePaise = parseFloat(p.basePricePerUnit);
              const priceInr   = pricePaise / 100;
              const stock      = parseFloat(p.stockQty);
              const threshold  = parseFloat(p.lowStockThreshold);
              const stockStatus = stock === 0 ? 'critical' : stock <= threshold ? 'low' : 'good';
              return (
                <tr key={p._id}>
                  <td>
                    <div className="font-semibold" style={{ letterSpacing:'-0.01em' }}>{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-muted" style={{ marginTop:2, lineHeight:1.4 }}>
                        {p.description.slice(0, 55)}{p.description.length > 55 ? '…' : ''}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="mono text-xs" style={{
                      background:'var(--color-surface-3)',
                      padding:'2px 6px',
                      borderRadius:'var(--radius-xs)',
                      border:'1px solid var(--color-border)',
                    }}>{p.sku}</span>
                  </td>
                  <td>
                    {p.category
                      ? <span className="badge badge-muted">{p.category}</span>
                      : <span className="text-muted">—</span>
                    }
                  </td>
                  <td><UnitBadge unit={p.baseUnit} /></td>
                  <td>
                    <div className="font-semibold" style={{ color:'var(--color-primary-h)', letterSpacing:'-0.01em' }}>
                      {formatINR(priceInr)}
                    </div>
                    <div className="text-xs text-muted">per {p.baseUnit}</div>
                  </td>
                  <td style={{ minWidth:130 }}>
                    <div className="flex items-center gap-2">
                      <span className={`stock-dot ${stockStatus}`} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="text-sm">
                          {stock.toLocaleString('en-IN')} <span className="text-muted">{p.baseUnit}</span>
                        </div>
                        <StockBar qty={stock} threshold={threshold} />
                      </div>
                    </div>
                  </td>
                  <td>
                    {p.isActive
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-muted">Inactive</span>
                    }
                  </td>
                  <td>
                    <div className="flex gap-2" style={{ justifyContent:'flex-end' }}>
                      <button
                        id={`edit-${p._id}`}
                        className="btn btn-ghost btn-icon"
                        onClick={() => openEdit(p)}
                        title="Edit product"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        id={`delete-${p._id}`}
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleDelete(p._id, p.name)}
                        title="Deactivate"
                        style={{ color:'var(--color-danger-h)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-md">
          <span className="text-sm text-muted">
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-sm">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >← Prev</button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >Next →</button>
          </div>
        </div>
      )}

      {/* Product Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === 'create' ? '➕ Add New Product' : `✏️ Edit: ${modal.product?.name}`}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {/* Row 1: Name + SKU */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Product Name <span className="form-required">*</span>
                </label>
                <input
                  className="form-input"
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Sodium Chloride"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  SKU <span className="form-required">*</span>
                </label>
                <input
                  className="form-input"
                  required
                  value={form.sku}
                  onChange={set('sku')}
                  placeholder="e.g. NaCl-001"
                  disabled={modal.mode === 'edit'}
                  style={modal.mode === 'edit' ? { opacity:0.6 } : {}}
                />
                {modal.mode === 'edit' && (
                  <div className="form-hint">SKU cannot be changed after creation</div>
                )}
              </div>
            </div>

            {/* Row 2: Category + Base Unit */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  className="form-input"
                  list="categories-list"
                  value={form.category}
                  onChange={set('category')}
                  placeholder="e.g. Inorganic Salts"
                />
                <datalist id="categories-list">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Base Unit <span className="form-required">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.baseUnit}
                  onChange={set('baseUnit')}
                  disabled={modal.mode === 'edit'}
                  required
                >
                  {ALL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                {modal.mode === 'edit' && (
                  <div className="form-hint">Base unit is fixed after creation</div>
                )}
              </div>
            </div>

            {/* Row 3: Price + Stock */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Price per {form.baseUnit} (₹ INR) <span className="form-required">*</span>
                </label>
                <div className="input-group">
                  <span className="input-addon">₹</span>
                  <input
                    className="form-input"
                    type="number"
                    step="0.000001"
                    min="0"
                    required
                    value={form.basePricePerUnit}
                    onChange={set('basePricePerUnit')}
                    placeholder="0.00"
                  />
                </div>
                {priceInINR > 0 && (
                  <div className="form-hint" style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:6 }}>
                    {getCompatibleUnits(form.baseUnit).map((u) => {
                      const factor = u === 'kg' || u === 'L' ? 1000 : 1;
                      return (
                        <span key={u} style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <UnitBadge unit={u} />
                          <span style={{ color:'var(--color-primary-h)', fontWeight:700 }}>
                            ₹{(priceInINR * factor).toLocaleString('en-IN', { maximumFractionDigits:4 })}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Stock ({form.baseUnit})</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.000001"
                  min="0"
                  value={form.stockQty}
                  onChange={set('stockQty')}
                />
              </div>
            </div>

            {/* Row 4: Low Stock Threshold + Active Toggle */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Low Stock Threshold ({form.baseUnit})</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.000001"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={set('lowStockThreshold')}
                />
                <div className="form-hint">Trigger alert when stock falls below this value</div>
              </div>
              <div className="form-group">
                <label className="form-label">Visibility</label>
                <label style={{
                  display:'flex', alignItems:'center', gap:12,
                  cursor:'pointer', paddingTop:10,
                  background:'var(--color-surface-2)',
                  borderRadius:'var(--radius-md)',
                  padding:'12px 14px',
                  border:'1px solid var(--color-border-2)',
                  transition:'all var(--transition-fast)',
                }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={set('isActive')}
                    style={{ width:16, height:16, accentColor:'var(--color-primary)' }}
                  />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: form.isActive ? 'var(--color-success-h)' : 'var(--text-muted)' }}>
                      {form.isActive ? '✓ Active' : '✗ Inactive'}
                    </div>
                    <div className="text-xs text-muted">
                      {form.isActive ? 'Visible to sellers' : 'Hidden from sellers'}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={form.description}
                onChange={set('description')}
                placeholder="Product details, purity grade, specification, storage conditions, etc."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal({ open: false })}>
              Cancel
            </button>
            <button id="save-product-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <><div className="spinner spinner-sm" style={{ borderTopColor:'rgba(255,255,255,0.9)', borderColor:'rgba(255,255,255,0.2)' }} /> Saving…</>
              ) : modal.mode === 'create' ? (
                <><Plus size={15} /> Create Product</>
              ) : (
                <><Pencil size={15} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
