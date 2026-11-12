import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order, StoreSettings, OrderFormData } from '../types';

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Agomoni Store',
  tagline: 'Exclusive Handcrafted & Curated Collection',
  upiId: 'agomonistore@upi',
  contactPhone: '+91 98765 43210',
  logoUrl: '',
  qrCodeUrl: '',
  updatedAt: new Date().toISOString(),
};

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'store_config';
const ORDERS_COLLECTION = 'orders';

/**
 * Fetch store settings (logo, QR code, store info)
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...(snap.data() as StoreSettings) };
    }
    // If not found, return default settings
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.warn('Failed to load store settings from Firestore, using defaults:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update store settings (logo, QR code, UPI, etc.)
 */
export async function saveStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  try {
    const updated: StoreSettings = {
      ...DEFAULT_SETTINGS,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), updated, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Submit a customer order to Firestore
 */
export async function submitOrder(formData: OrderFormData): Promise<{ orderId: string; orderNumber: string }> {
  // Generate a human-friendly unique order ID
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const orderNumber = `AGM-${dateStr}-${randomSuffix}`;
  const docId = `order_${Date.now()}_${randomSuffix}`;
  const path = `${ORDERS_COLLECTION}/${docId}`;

  const newOrder: Order = {
    id: docId,
    customerName: formData.customerName.trim(),
    contactNumber: formData.contactNumber.trim(),
    address: formData.address.trim(),
    email: formData.email ? formData.email.trim() : '',
    productName: formData.productName.trim(),
    paymentMode: formData.paymentMode,
    paymentScreenshot: formData.paymentMode === 'online' ? formData.paymentScreenshot : '',
    productImage: formData.productImage || '',
    status: 'pending',
    adminNotes: '',
    createdAt: new Date().toISOString(),
    orderNumber,
  };

  try {
    await setDoc(doc(db, ORDERS_COLLECTION, docId), newOrder);
    return { orderId: docId, orderNumber };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Real-time listener for orders in the admin panel
 */
export function subscribeToOrders(
  onOrders: (orders: Order[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = ORDERS_COLLECTION;
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((docSnap) => {
          orders.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) });
        });
        onOrders(orders);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Update order status (pending | completed | cancelled) and notes
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'completed' | 'cancelled',
  adminNotes?: string
): Promise<void> {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    const updatePayload: Record<string, any> = { status };
    if (adminNotes !== undefined) {
      updatePayload.adminNotes = adminNotes;
    }
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete an order
 */
export async function deleteOrder(orderId: string): Promise<void> {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
