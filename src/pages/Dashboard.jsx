import React from 'react';
import { Store, ShoppingCart, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="glass-card flex flex-col items-center p-8 max-w-lg w-full">
        <div className="bg-primary/20 p-6 rounded-full mb-6">
          <Store size={64} className="text-primary" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Sitaram Parlour
        </h1>
        
        <p className="text-muted text-lg mb-8">
          Welcome to your modern Point of Sale system. Manage your inventory and serve customers seamlessly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button 
            onClick={() => navigate('/billing')}
            className="btn btn-primary flex-1 py-4 text-lg"
          >
            <ShoppingCart size={24} />
            Start Billing
          </button>
          
          <button 
            onClick={() => navigate('/products')}
            className="btn btn-ghost border border-border flex-1 py-4 text-lg"
          >
            <Package size={24} />
            Manage Stock
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
