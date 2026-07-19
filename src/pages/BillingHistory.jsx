import React, { useState, useEffect } from 'react';
import { subscribeToBills } from '../services/firebaseService';
import { ReceiptText, Search } from 'lucide-react';

const BillingHistory = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = subscribeToBills((data) => {
      setBills(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredBills = bills.filter(b => 
    b.billNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Billing History</h1>
          <p className="text-muted">View all past transactions</p>
        </div>
      </div>

      <div className="glass-card mb-6">
        <div className="flex gap-4 items-center">
          <div className="input-group flex-1 mb-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                className="input-field pl-10 w-full" 
                placeholder="Search by Bill Number..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h2 className="text-xl mb-4 font-semibold flex items-center gap-2">
          <ReceiptText size={20} className="text-primary" /> Transactions
        </h2>
        
        {loading ? (
          <div className="text-muted">Loading history...</div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {filteredBills.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted p-8 text-center bg-surface border border-border rounded-lg">
                No bills found.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredBills.map(b => {
                  const date = b.createdAt?.toDate ? b.createdAt.toDate().toLocaleString() : 'N/A';
                  return (
                    <div key={b.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-bg-surface-hover rounded-lg border border-border gap-4 transition-colors hover:bg-border/50">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{b.billNumber}</div>
                        <div className="text-sm text-muted">{date}</div>
                        <div className="text-sm text-muted mt-1">Items: {b.totalItems}</div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                        <div className="flex flex-col sm:items-end">
                          <span className="font-bold text-success text-lg">₹{Number(b.totalAmount).toFixed(2)}</span>
                          <span className="badge badge-success mt-1 self-start sm:self-end">{b.paymentStatus || 'Paid'}</span>
                        </div>
                        <button className="btn btn-ghost text-sm py-2 px-3 border border-border">
                          Details
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingHistory;
