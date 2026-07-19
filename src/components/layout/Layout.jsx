import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, ReceiptText, Store } from 'lucide-react';

const Layout = () => {
  return (
    <div className="app-container">
      <main className="main-content">
        <Outlet />
      </main>

      <div className="bottom-island-container">
        <nav className="bottom-island glass">
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={24} />
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink 
            to="/billing" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <ShoppingCart size={24} />
            <span className="nav-label">POS</span>
          </NavLink>
          <NavLink 
            to="/products" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Package size={24} />
            <span className="nav-label">Products</span>
          </NavLink>
          <NavLink 
            to="/history" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <ReceiptText size={24} />
            <span className="nav-label">History</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
