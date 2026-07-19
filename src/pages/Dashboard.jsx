import React, { useState, useEffect } from 'react';
import { subscribeToProducts, subscribeToBills } from '../services/firebaseService';
import { Package, DollarSign, ReceiptText, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let productsUnsub = null;
    let billsUnsub = null;

    productsUnsub = subscribeToProducts((data) => {
      setProducts(data);
      if (billsUnsub) setLoading(false);
    });

    billsUnsub = subscribeToBills((data) => {
      setBills(data);
      if (productsUnsub) setLoading(false);
    });

    return () => {
      if (productsUnsub) productsUnsub();
      if (billsUnsub) billsUnsub();
    };
  }, []);

  const totalProducts = products.length;
  const totalStock = products.reduce((acc, p) => acc + Number(p.stock || 0), 0);
  
  // Calculate today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysBills = bills.filter(b => {
    if (!b.createdAt) return false;
    // Handle Firestore Timestamp
    const billDate = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return billDate >= today;
  });

  const todaysSales = todaysBills.length;
  const todaysRevenue = todaysBills.reduce((acc, b) => acc + Number(b.totalAmount || 0), 0);

  const lowStockProducts = products.filter(p => Number(p.stock) < 10);
  const recentBills = bills.slice(0, 5);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading Dashboard...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-muted">Real-time store overview</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="glass-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted">
            <span className="font-semibold">Total Products</span>
            <Package size={20} className="text-primary" />
          </div>
          <div className="text-2xl">{totalProducts}</div>
          <div className="text-sm text-muted">Stock: {totalStock} items</div>
        </div>

        <div className="glass-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted">
            <span className="font-semibold">Today's Sales</span>
            <ReceiptText size={20} className="text-success" />
          </div>
          <div className="text-2xl">{todaysSales}</div>
          <div className="text-sm text-muted">Bills generated today</div>
        </div>

        <div className="glass-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted">
            <span className="font-semibold">Today's Revenue</span>
            <DollarSign size={20} className="text-success" />
          </div>
          <div className="text-2xl">₹{todaysRevenue.toFixed(2)}</div>
          <div className="text-sm text-muted">Earnings today</div>
        </div>

        <div className="glass-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted">
            <span className="font-semibold">Low Stock</span>
            <AlertTriangle size={20} className="text-danger" />
          </div>
          <div className="text-2xl text-danger">{lowStockProducts.length}</div>
          <div className="text-sm text-muted">Items running out</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Low Stock List */}
        <div className="glass-card">
          <h2 className="text-xl mb-4">Low Stock Products</h2>
          {lowStockProducts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 border border-border rounded-lg bg-surface">
                  <div>
                    <div className="font-semibold">{p.productName}</div>
                    <div className="text-sm text-muted">{p.barcode}</div>
                  </div>
                  <div className="badge badge-danger">Stock: {p.stock}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted">All stocks are sufficient.</div>
          )}
        </div>

        {/* Recent Bills */}
        <div className="glass-card">
          <h2 className="text-xl mb-4">Recent Bills</h2>
          {recentBills.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentBills.map(b => {
                const date = b.createdAt?.toDate ? b.createdAt.toDate().toLocaleString() : 'N/A';
                return (
                  <div key={b.id} className="flex justify-between items-center p-3 border border-border rounded-lg bg-surface">
                    <div>
                      <div className="font-semibold">{b.billNumber}</div>
                      <div className="text-sm text-muted">{date}</div>
                    </div>
                    <div className="font-bold">₹{b.totalAmount}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-muted">No recent bills found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
