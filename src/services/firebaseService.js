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
  orderBy
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
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
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
    await updateDoc(productRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating product: ", error);
    return { success: false, error: error.message };
  }
};

// Delete a product
export const deleteProduct = async (id) => {
  try {
    await deleteDoc(doc(db, "products", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting product: ", error);
    return { success: false, error: error.message };
  }
};

// Process payment (Stock decrease + Bill creation in transaction)
export const processPayment = async (cartItems, totalAmount) => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const productDocs = [];
      
      // Step 1: Read all product stocks (must read before writing in transaction)
      for (const item of cartItems) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await transaction.get(productRef);
        
        if (!productSnap.exists()) {
          throw new Error(`Product ${item.productName} does not exist!`);
        }
        
        const currentStock = productSnap.data().stock;
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}. Available: ${currentStock}`);
        }
        
        productDocs.push({
          ref: productRef,
          newStock: currentStock - item.quantity
        });
      }

      // Step 2: Write all stock updates
      productDocs.forEach((docData) => {
        transaction.update(docData.ref, { 
          stock: docData.newStock,
          updatedAt: serverTimestamp()
        });
      });

      // Step 3: Create the bill
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
          barcode: item.barcode,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        }))
      };
      
      transaction.set(billRef, billData);
      return billData;
    });

    return { success: true, bill: result };
  } catch (error) {
    console.error("Transaction failed: ", error);
    return { success: false, error: error.message };
  }
};
