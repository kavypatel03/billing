import React, { useState, useEffect } from 'react';
import { subscribeToProducts, processPayment } from '../services/firebaseService';
import BarcodeScanner from '../components/billing/BarcodeScanner';
import { ShoppingCart, Plus, Trash2, CreditCard } from 'lucide-react';

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  
  // Manual entry state
  const [searchBarcode, setSearchBarcode] = useState('');

  useEffect(() => {
    const unsub = subscribeToProducts((data) => {
      setProducts(data);
    });
    return () => unsub();
  }, []);

  const handleScan = (scannedBarcode) => {
    setMessage(null);
    const product = products.find(p => p.barcode === scannedBarcode);
    
    if (!product) {
      setMessage({ type: 'error', text: `Product with barcode ${scannedBarcode} not found.` });
      return;
    }

    addToCart(product);
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Check if adding one more exceeds stock
        if (existingItem.quantity + 1 > product.stock) {
          setMessage({ type: 'error', text: `Not enough stock for ${product.productName}. Max available: ${product.stock}` });
          return prevCart;
        }
        
        return prevCart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      } else {
        if (product.stock < 1) {
          setMessage({ type: 'error', text: `Product ${product.productName} is out of stock.` });
          return prevCart;
        }
        
        return [...prevCart, {
          productId: product.id,
          productName: product.productName,
          barcode: product.barcode,
          price: product.price,
          quantity: 1,
          subtotal: product.price
        }];
      }
    });
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!searchBarcode) return;
    handleScan(searchBarcode);
    setSearchBarcode('');
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
      setMessage({ type: 'error', text: `Not enough stock for ${product.productName}. Max available: ${product.stock}` });
      return;
    }

    setCart(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.price }
        : item
    ));
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const handlePayment = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    setMessage(null);
    
    const result = await processPayment(cart, totalAmount);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Payment Successful! Bill Created: ' + result.bill.billNumber });
      setCart([]);
    } else {
      setMessage({ type: 'error', text: 'Payment Failed: ' + result.error });
    }
    
    setIsProcessing(false);
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Point of Sale (POS)</h1>
          <p className="text-muted">Scan barcodes or add items manually</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 h-full">
        {/* Scanner & Manual Entry */}
        <div className="flex flex-col gap-6">
          <div className="glass-card flex flex-col items-center">
            <h2 className="text-xl mb-4 font-semibold w-full text-center">Barcode Scanner</h2>
            <BarcodeScanner onScan={handleScan} />
          </div>

          <div className="glass-card">
            <h2 className="text-xl mb-4 font-semibold">Manual Entry</h2>
            <form onSubmit={handleManualAdd} className="flex gap-2">
              <input 
                type="text" 
                className="input-field flex-1" 
                placeholder="Enter barcode..." 
                value={searchBarcode}
                onChange={(e) => setSearchBarcode(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <Plus size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Cart */}
        <div className="glass-card col-span-2 flex flex-col h-full">
          <h2 className="text-xl mb-4 font-semibold flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" /> Current Cart
          </h2>
          
          <div className="flex-1 overflow-y-auto mb-4 border border-border rounded-lg bg-surface min-h-[300px]">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted p-8">
                Cart is empty. Scan products to add.
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-surface">
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.productId}>
                      <td className="font-medium">
                        <div>{item.productName}</div>
                        <div className="text-xs text-muted font-mono">{item.barcode}</div>
                      </td>
                      <td>₹{item.price.toFixed(2)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button 
                            className="w-6 h-6 rounded bg-bg-surface-hover flex items-center justify-center hover:bg-border"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >-</button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button 
                            className="w-6 h-6 rounded bg-bg-surface-hover flex items-center justify-center hover:bg-border"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >+</button>
                        </div>
                      </td>
                      <td className="font-semibold">₹{item.subtotal.toFixed(2)}</td>
                      <td>
                        <button 
                          onClick={() => removeFromCart(item.productId)}
                          className="p-2 text-danger hover:bg-danger/10 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold text-success">₹{totalAmount.toFixed(2)}</span>
            </div>
            
            <button 
              className="btn btn-success w-full text-lg py-3"
              onClick={handlePayment}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processing Payment...' : (
                <>
                  <CreditCard size={24} />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
