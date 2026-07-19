import { db } from "../firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  runTransaction,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  increment,
  setDoc
} from "firebase/firestore";

// Listen to all products
export const subscribeToProducts = (callback) => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(products);
  }, (error) => {
    console.error("Error subscribing to products: ", error);
  });
};

// Listen to all bills
export const subscribeToBills = (callback) => {
  const q = query(collection(db, "bills"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(bills);
  }, (error) => {
    console.error("Error subscribing to bills: ", error);
  });
};

// Add a single product
export const addProduct = async (productData) => {
  try {
    const docRef = doc(collection(db, "products"));
    // Fire and forget (optimistic UI)
    setDoc(docRef, {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }).catch(err => console.error("Background error adding product:", err));
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding product: ", error);
    return { success: false, error: error.message };
  }
};

// Update a product
export const updateProduct = async (id, data) => {
  try {
    const productRef = doc(db, "products", id);
    updateDoc(productRef, {
      ...data,
      updatedAt: serverTimestamp()
    }).catch(err => console.error("Background error updating product:", err));
    return { success: true };
  } catch (error) {
    console.error("Error updating product: ", error);
    return { success: false, error: error.message };
  }
};

// Delete a product
export const deleteProduct = async (id) => {
  try {
    deleteDoc(doc(db, "products", id)).catch(err => console.error("Background error deleting product:", err));
    return { success: true };
  } catch (error) {
    console.error("Error deleting product: ", error);
    return { success: false, error: error.message };
  }
};

// Process payment (Stock decrease + Bill creation)
export const processPayment = async (cartItems, totalAmount) => {
  try {
    // Step 1: Create the bill
    const billRef = doc(collection(db, "bills"));
    const billData = {
      billNumber: `BILL-${Date.now()}`,
      createdAt: serverTimestamp(),
      totalAmount,
      totalItems: cartItems.reduce((acc, item) => acc + item.quantity, 0),
      paymentStatus: "Paid",
      products: cartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        barcode: item.barcode || '',
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }))
    };
    
    // Fire and forget
    setDoc(billRef, billData).catch(err => console.error("Background error saving bill:", err));

    // Step 2: Decrease stock for each item
    for (const item of cartItems) {
      const productRef = doc(db, "products", item.productId);
      updateDoc(productRef, { 
        stock: increment(-item.quantity),
        updatedAt: serverTimestamp()
      }).catch(err => console.error("Background error updating stock:", err));
    }

    return { success: true, bill: billData };
  } catch (error) {
    console.error("Payment failed: ", error);
    return { success: false, error: error.message };
  }
};
