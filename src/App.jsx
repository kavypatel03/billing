import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Billing from './pages/Billing';
import BillingHistory from './pages/BillingHistory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="billing" element={<Billing />} />
          <Route path="history" element={<BillingHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
