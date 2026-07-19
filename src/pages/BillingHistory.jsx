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
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Bill Number</th>
                  <th>Date & Time</th>
                  <th>Total Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map(b => {
                  const date = b.createdAt?.toDate ? b.createdAt.toDate().toLocaleString() : 'N/A';
                  return (
                    <tr key={b.id}>
                      <td className="font-semibold">{b.billNumber}</td>
                      <td className="text-muted">{date}</td>
                      <td>{b.totalItems}</td>
                      <td className="font-bold text-success">₹{Number(b.totalAmount).toFixed(2)}</td>
                      <td>
                        <span className="badge badge-success">{b.paymentStatus || 'Paid'}</span>
                      </td>
                      <td>
                        <button className="btn btn-ghost text-sm py-1 px-3">View Details</button>
                      </td>
                    </tr>
                  )
                })}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-8">
                      No bills found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingHistory;
