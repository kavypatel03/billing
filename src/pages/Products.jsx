import React, { useState, useEffect } from 'react';
import { subscribeToProducts, addProduct, updateProduct } from '../services/firebaseService';
import { Plus, Package } from 'lucide-react';
import BarcodeScanner from '../components/billing/BarcodeScanner';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [productName, setProductName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [toast, setToast] = useState(null);
  const [existingProduct, setExistingProduct] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const handleBarcodeChange = (newBarcode) => {
    setBarcode(newBarcode);
    const found = products.find(p => p.barcode === newBarcode);
    if (found) {
      setExistingProduct(found);
      setProductName(found.productName);
      setPrice(found.price.toString());
      setStock(''); // Clear stock so they input the quantity to ADD
    } else {
      if (existingProduct) {
        setExistingProduct(null);
        setProductName('');
        setPrice('');
        setStock('');
      }
    }
  };

  useEffect(() => {
    const unsub = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productName || !barcode || !price || !stock) return;
    
    setIsSubmitting(true);
    
    if (existingProduct) {
      // Update existing product stock and details
      const newStockTotal = Number(existingProduct.stock) + Number(stock);
      const result = await updateProduct(existingProduct.id, {
        productName,
        barcode,
        price: Number(price),
        stock: newStockTotal
      });
      
      if (result.success) {
        showToast(`Stock updated for ${productName}!`);
        setProductName('');
        setBarcode('');
        setPrice('');
        setStock('');
        setExistingProduct(null);
      } else {
        alert(result.error);
      }
    } else {
      // Add new product
      const result = await addProduct({
        productName,
        barcode,
        price: Number(price),
        stock: Number(stock)
      });
      
      if (result.success) {
        showToast(`${productName} added to inventory!`);
        setProductName('');
        setBarcode('');
        setPrice('');
        setStock('');
      } else {
        alert(result.error);
      }
    }
    
    setIsSubmitting(false);
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="text-muted">Manage your store products</p>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 right-4 bg-success text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="glass-card flex flex-col h-fit">
          <h2 className="text-xl mb-4 font-semibold flex items-center gap-2">
            <Plus size={20} className={existingProduct ? 'text-success' : 'text-primary'} /> 
            {existingProduct ? 'Update Stock / Details' : 'Add New Product'}
          </h2>
          <form onSubmit={handleAddProduct} className="flex flex-col gap-2">
            <div className="input-group">
              <label className="input-label">Product Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={productName} 
                onChange={(e) => setProductName(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label className="input-label">Barcode</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="input-field flex-1" 
                  value={barcode} 
                  onChange={(e) => handleBarcodeChange(e.target.value)} 
                  required 
                />
                <button 
                  type="button" 
                  className="btn btn-ghost border border-border"
                  onClick={() => setIsScanning(!isScanning)}
                >
                  {isScanning ? 'Cancel' : 'Scan'}
                </button>
              </div>
            </div>
            {isScanning && (
              <div className="mb-4">
                <BarcodeScanner onScan={(scannedBarcode) => {
                  handleBarcodeChange(scannedBarcode);
                  showToast('Barcode scanned successfully!');
                  setIsScanning(false);
                }} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Price (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  className="input-field" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  required 
                />
              </div>
              <div className="input-group">
                <label className="input-label">
                  {existingProduct ? `Add Quantity (Current: ${existingProduct.stock})` : 'Stock Quantity'}
                </label>
                <input 
                  type="number" 
                  min="0"
                  className="input-field" 
                  value={stock} 
                  onChange={(e) => setStock(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <button 
              type="submit" 
              className={`btn mt-4 ${existingProduct ? 'btn-success' : 'btn-primary'}`} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : existingProduct ? 'Update Stock' : 'Save Product'}
            </button>
          </form>
        </div>

        <div className="glass-card col-span-2">
          <h2 className="text-xl mb-4 font-semibold flex items-center gap-2">
            <Package size={20} className="text-primary" /> Product List
          </h2>
          {loading ? (
            <div className="text-muted">Loading products...</div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {products.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted p-8 text-center bg-surface border border-border rounded-lg">
                  No products found. Add some products to get started.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {products.map(p => (
                    <div key={p.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-bg-surface-hover rounded-lg border border-border gap-3 transition-colors hover:bg-border/50">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{p.productName}</div>
                        <div className="text-sm text-muted font-mono">{p.barcode}</div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <div className="text-lg font-medium w-24 sm:text-right">
                          ₹{Number(p.price).toFixed(2)}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-muted text-sm w-16 text-right">Qty: {p.stock}</div>
                          <div className="w-24 text-right">
                            {p.stock > 10 ? (
                              <span className="badge badge-success">In Stock</span>
                            ) : p.stock > 0 ? (
                              <span className="badge badge-danger">Low Stock</span>
                            ) : (
                              <span className="badge badge-danger" style={{opacity: 0.5}}>Out of Stock</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
