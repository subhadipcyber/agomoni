export type PaymentMode = 'offline' | 'online';
export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  contactNumber: string;
  address: string;
  email?: string;
  productName: string;
  paymentMode: PaymentMode;
  paymentScreenshot?: string;
  productImage?: string;
  status: OrderStatus;
  adminNotes?: string;
  createdAt: string;
  orderNumber?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline?: string;
  logoUrl?: string;
  qrCodeUrl?: string;
  upiId?: string;
  contactPhone?: string;
  updatedAt: string;
}

export interface OrderFormData {
  customerName: string;
  contactNumber: string;
  address: string;
  email: string;
  productName: string;
  paymentMode: PaymentMode;
  paymentScreenshot: string;
  productImage: string;
}

export interface FormErrors {
  customerName?: string;
  contactNumber?: string;
  address?: string;
  email?: string;
  productName?: string;
  paymentMode?: string;
  paymentScreenshot?: string;
  productImage?: string;
  general?: string;
}
