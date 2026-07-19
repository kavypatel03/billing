import React, { useState, useEffect } from 'react';
import { subscribeToProducts, addProduct } from '../services/firebaseService';
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
    const result = await addProduct({
      productName,
      barcode,
      price: Number(price),
      stock: Number(stock)
    });
    
    if (result.success) {
      setProductName('');
      setBarcode('');
      setPrice('');
      setStock('');
    } else {
      alert(result.error);
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

      <div className="grid grid-cols-3 gap-6">
        <div className="glass-card flex flex-col h-fit">
          <h2 className="text-xl mb-4 font-semibold flex items-center gap-2">
            <Plus size={20} className="text-primary" /> Add New Product
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
                  onChange={(e) => setBarcode(e.target.value)} 
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
                  setBarcode(scannedBarcode);
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
                <label className="input-label">Stock Quantity</label>
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
              className="btn btn-primary mt-4" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Save Product'}
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
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Barcode</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.productName}</td>
                      <td className="text-muted font-mono">{p.barcode}</td>
                      <td>₹{Number(p.price).toFixed(2)}</td>
                      <td>{p.stock}</td>
                      <td>
                        {p.stock > 10 ? (
                          <span className="badge badge-success">In Stock</span>
                        ) : p.stock > 0 ? (
                          <span className="badge badge-danger">Low Stock</span>
                        ) : (
                          <span className="badge badge-danger" style={{opacity: 0.5}}>Out of Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-8">
                        No products found. Add some products to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
