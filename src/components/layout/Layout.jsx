import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, ReceiptText, Store } from 'lucide-react';

const Layout = () => {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Store size={28} />
          <span>POS Pro</span>
        </div>
        
        <nav className="flex-col w-full">
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink 
            to="/billing" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <ShoppingCart size={20} />
            Billing (POS)
          </NavLink>
          <NavLink 
            to="/products" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Package size={20} />
            Products
          </NavLink>
          <NavLink 
            to="/history" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <ReceiptText size={20} />
            History
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
