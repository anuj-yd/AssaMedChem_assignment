import { useEffect, useState } from 'react';
import { getOrderStats } from '../../api/orders';
import { getProducts } from '../../api/products';
import { getOrders } from '../../api/orders';
import { formatINR } from '../../utils/currency';
import { StatusBadge } from '../../components/Badges';
import {
  Package, ShoppingBag, Users, TrendingUp,
  AlertTriangle, Clock, ArrowUpRight, BarChart3,
  CheckCircle2, Hourglass
} from 'lucide-react';

function StatsCard({ icon: Icon, label, value, color, trend, sub }) {
  return (
    <div className={`stats-card ${color} animate-up`}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div className={`stats-icon ${color}`}>
          <Icon size={20} color={
            color === 'indigo'  ? 'var(--color-primary-h)' :
            color === 'violet'  ? 'var(--color-secondary-h)' :
            color === 'emerald' ? 'var(--color-success-h)' :
            color === 'cyan'    ? 'var(--color-accent-h)' :
                                  'var(--color-warning-h)'
          } />
        </div>
        {trend != null && (
          <div style={{
            display:'flex', alignItems:'center', gap:3,
            fontSize:'0.7rem', fontWeight:700,
            color: trend >= 0 ? 'var(--color-success-h)' : 'var(--color-danger-h)',
            background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${trend >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            padding:'2px 7px', borderRadius:'var(--radius-full)',
          }}>
            <ArrowUpRight size={10} style={{ transform: trend < 0 ? 'rotate(90deg)' : undefined }} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="stats-label" style={{ marginTop: 12 }}>{label}</div>
      <div className="stats-value">{value}</div>
      {sub && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function OrderStatusRow({ status, data, maxCount }) {
  const pct = maxCount > 0 ? Math.round((data.count / maxCount) * 100) : 0;
  const colors = {
    quotation:  { fill: 'var(--color-warning)',   bg: 'rgba(245,158,11,0.1)' },
    confirmed:  { fill: 'var(--color-primary)',   bg: 'rgba(99,102,241,0.1)' },
    processing: { fill: 'var(--color-accent)',    bg: 'rgba(6,182,212,0.1)' },
    fulfilled:  { fill: 'var(--color-success)',   bg: 'rgba(16,185,129,0.1)' },
    cancelled:  { fill: 'var(--color-text-muted)',bg: 'rgba(100,116,139,0.1)' },
  };
  const c = colors[status] || colors.cancelled;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--color-border)' }}>
      <div style={{ width:100, flexShrink:0 }}>
        <StatusBadge status={status} />
      </div>
      <div style={{ flex:1 }}>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width:`${pct}%`, background: c.fill, boxShadow:`0 0 8px ${c.fill}40` }}
          />
        </div>
      </div>
      <div style={{ textAlign:'right', minWidth:80, flexShrink:0 }}>
        <div style={{ fontSize:'0.875rem', fontWeight:800, color:'var(--text-primary)' }}>
          {data.count}
        </div>
        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>
          {formatINR(data.totalPaise / 100)}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats,        setStats]        = useState(null);
  const [lowStock,     setLowStock]     = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      getOrderStats(),
      getProducts({ limit: 100 }),
      getOrders({ limit: 8 }),
    ]).then(([statsRes, prodsRes, ordersRes]) => {
      setStats(statsRes.data.stats);
      const prods = prodsRes.data.products;
      setLowStock(prods.filter(p =>
        parseFloat(p.stockQty) <= parseFloat(p.lowStockThreshold) && p.isActive
      ));
      setRecentOrders(ordersRes.data.orders);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span className="loading-text">Loading dashboard…</span>
      </div>
    );
  }

  const totalOrders   = stats?.totalOrders ?? 0;
  const totalRevenue  = stats?.totalRevenueInr ?? 0;
  const productCount  = stats?.productCount ?? 0;
  const activeUsers   = stats?.activeUsers ?? 0;
  const pendingOrders = stats?.ordersByStatus?.quotation?.count ?? 0;
  const fulfilledOrders = stats?.ordersByStatus?.fulfilled?.count ?? 0;

  const maxStatusCount = stats?.ordersByStatus
    ? Math.max(...Object.values(stats.ordersByStatus).map(s => s.count), 1)
    : 1;

  return (
    <div className="page-body animate-fade">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Real-time overview of your inventory and orders</p>
        </div>
        <div className="flex gap-sm items-center">
          {pendingOrders > 0 && (
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              background:'rgba(245,158,11,0.1)',
              border:'1px solid rgba(245,158,11,0.25)',
              borderRadius:'var(--radius-full)',
              padding:'5px 12px',
              fontSize:'0.75rem', fontWeight:700,
              color:'var(--color-warning-h)',
            }}>
              <Hourglass size={12} />
              {pendingOrders} pending {pendingOrders === 1 ? 'quotation' : 'quotations'}
            </div>
          )}
          {fulfilledOrders > 0 && (
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              background:'rgba(16,185,129,0.1)',
              border:'1px solid rgba(16,185,129,0.2)',
              borderRadius:'var(--radius-full)',
              padding:'5px 12px',
              fontSize:'0.75rem', fontWeight:700,
              color:'var(--color-success-h)',
            }}>
              <CheckCircle2 size={12} />
              {fulfilledOrders} fulfilled
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4 mb-lg stagger">
        <StatsCard
          icon={Package}
          label="Active Products"
          value={productCount}
          color="indigo"
          sub="in inventory"
        />
        <StatsCard
          icon={ShoppingBag}
          label="Total Orders"
          value={totalOrders}
          color="violet"
          sub={`${pendingOrders} pending review`}
        />
        <StatsCard
          icon={TrendingUp}
          label="Total Revenue"
          value={formatINR(totalRevenue)}
          color="emerald"
          sub="lifetime value"
        />
        <StatsCard
          icon={Users}
          label="Active Sellers"
          value={activeUsers}
          color="cyan"
          sub="registered users"
        />
      </div>

      {/* Orders by Status — full width bar chart */}
      {stats?.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 && (
        <div className="card mb-lg animate-up" style={{ animationDelay:'100ms' }}>
          <div className="section-header mb-md">
            <BarChart3 size={18} color="var(--color-primary-h)" />
            <span className="section-title">Orders by Status</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {Object.entries(stats.ordersByStatus).map(([status, data]) => (
              <OrderStatusRow key={status} status={status} data={data} maxCount={maxStatusCount} />
            ))}
          </div>
        </div>
      )}

      {/* Two-column section */}
      <div className="grid-2">
        {/* Low Stock Alerts */}
        <div className="card animate-up" style={{ animationDelay:'150ms' }}>
          <div className="section-header mb-md">
            <AlertTriangle size={18} color="var(--color-warning-h)" />
            <span className="section-title">Low Stock Alerts</span>
            {lowStock.length > 0 && (
              <span className="badge badge-warning" style={{ marginLeft:'auto' }}>
                {lowStock.length} item{lowStock.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {lowStock.length === 0 ? (
            <div className="empty-state" style={{ padding:'var(--spacing-xl)' }}>
              <div className="empty-state-icon" style={{ width:52, height:52 }}>
                <CheckCircle2 size={22} color="var(--color-success-h)" />
              </div>
              <div className="empty-state-title" style={{ color:'var(--color-success-h)' }}>All stocked up!</div>
              <p className="text-sm text-muted">All products are sufficiently stocked</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {lowStock.slice(0, 7).map((p) => {
                const stock = parseFloat(p.stockQty);
                const threshold = parseFloat(p.lowStockThreshold);
                const isCritical = stock === 0;
                const pct = threshold > 0 ? Math.round((stock / threshold) * 100) : 0;
                return (
                  <div key={p._id} style={{
                    display:'grid',
                    gridTemplateColumns:'1fr auto',
                    gap:12,
                    alignItems:'center',
                    padding:'10px 0',
                    borderBottom:'1px solid var(--color-border)',
                  }}>
                    <div style={{ minWidth:0 }}>
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="mono text-xs text-muted">{p.sku}</div>
                      <div style={{ marginTop:6 }} className="progress-bar">
                        <div
                          className={`progress-fill ${isCritical ? 'warning' : ''}`}
                          style={{
                            width:`${Math.min(pct, 100)}%`,
                            background: isCritical ? 'var(--color-danger)' : 'var(--color-warning)',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{
                        fontSize:'0.875rem', fontWeight:800,
                        color: isCritical ? 'var(--color-danger-h)' : 'var(--color-warning-h)',
                      }}>
                        {stock.toLocaleString('en-IN')}
                        <span style={{ fontWeight:400, fontSize:'0.72rem', marginLeft:3 }}>{p.baseUnit}</span>
                      </div>
                      <div className="text-xs text-muted">
                        / {parseFloat(p.lowStockThreshold).toLocaleString('en-IN')} threshold
                      </div>
                    </div>
                  </div>
                );
              })}
              {lowStock.length > 7 && (
                <div className="text-xs text-muted" style={{ paddingTop:8, textAlign:'center' }}>
                  +{lowStock.length - 7} more products low on stock
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card animate-up" style={{ animationDelay:'200ms' }}>
          <div className="section-header mb-md">
            <Clock size={18} color="var(--color-primary-h)" />
            <span className="section-title">Recent Orders</span>
            {pendingOrders > 0 && (
              <span className="badge badge-warning" style={{ marginLeft:'auto' }}>
                {pendingOrders} pending
              </span>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="empty-state" style={{ padding:'var(--spacing-xl)' }}>
              <div className="empty-state-icon" style={{ width:52, height:52 }}>
                <ShoppingBag size={22} />
              </div>
              <div className="empty-state-title">No orders yet</div>
              <p className="text-sm text-muted">Orders will appear here once sellers place them</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {recentOrders.map((o) => (
                <div key={o._id} style={{
                  display:'grid',
                  gridTemplateColumns:'1fr auto',
                  gap:12,
                  alignItems:'center',
                  padding:'10px 0',
                  borderBottom:'1px solid var(--color-border)',
                }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span className="mono text-sm font-semibold">{o.orderNumber}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="text-xs text-muted truncate">{o.sellerName}</div>
                    <div className="text-xs text-muted">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div className="font-semibold" style={{ color:'var(--color-primary-h)', fontSize:'0.875rem' }}>
                      {formatINR(parseFloat(o.totalAmount) / 100)}
                    </div>
                    <div className="text-xs text-muted">
                      {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
