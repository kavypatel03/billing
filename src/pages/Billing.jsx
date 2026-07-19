import React, { useState, useEffect } from 'react';
import { subscribeToProducts, processPayment } from '../services/firebaseService';
import BarcodeScanner from '../components/billing/BarcodeScanner';
import { ShoppingCart, Plus, Trash2, CreditCard } from 'lucide-react';

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [toast, setToast] = useState(null);
  
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
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        setMessage({ type: 'error', text: `Not enough stock for ${product.productName}. Max available: ${product.stock}` });
        return;
      }
      
      setCart(prevCart => prevCart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.price }
          : item
      ));
      showToast(`Added another ${product.productName}`);
    } else {
      if (product.stock < 1) {
        setMessage({ type: 'error', text: `Product ${product.productName} is out of stock.` });
        return;
      }
      
      setCart(prevCart => [...prevCart, {
        productId: product.id,
        productName: product.productName,
        barcode: product.barcode,
        price: product.price,
        quantity: 1,
        subtotal: product.price
      }]);
      showToast(`${product.productName} scanned & added!`);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 2500);
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

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-24 right-4 bg-success text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          {toast}
        </div>
      )}

      <div className="flex flex-col md:grid md:grid-cols-3 gap-6 h-full">
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
              <div className="flex items-center justify-center h-full text-muted p-8 text-center">
                Cart is empty. Scan products to add.
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-2">
                {cart.map(item => (
                  <div key={item.productId} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-bg-surface-hover rounded-lg border border-border gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{item.productName}</div>
                      <div className="text-sm text-muted">₹{item.price.toFixed(2)} x {item.quantity}</div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                      <div className="flex items-center gap-1 bg-bg-color rounded-lg p-1 border border-border">
                        <button 
                          className="w-8 h-8 rounded bg-bg-surface flex items-center justify-center hover:bg-border active:scale-95"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >-</button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button 
                          className="w-8 h-8 rounded bg-bg-surface flex items-center justify-center hover:bg-border active:scale-95"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >+</button>
                      </div>
                      <div className="font-bold text-lg min-w-[80px] text-right">
                        ₹{item.subtotal.toFixed(2)}
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="text-danger p-2 hover:bg-danger/10 rounded-lg active:scale-95"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
