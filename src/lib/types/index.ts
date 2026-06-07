export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'operator' | 'finance';
  avatar: string;
  displayName: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  status: 'active' | 'inactive';
  settlementMethod: string;
}

export interface Customer {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  status: 'active' | 'inactive';
}

export type OrderStatus = 'pending' | 'approved' | 'completed' | 'cancelled';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface PurchaseOrder {
  id: number;
  orderNo: string;
  supplierId: number;
  supplierName: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrder {
  id: number;
  orderNo: string;
  customerId: number;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type InventoryRecordType = 'in' | 'out';

export interface InventoryRecord {
  id: number;
  productId: number;
  productName: string;
  type: InventoryRecordType;
  quantity: number;
  orderId: number;
  orderType: 'purchase' | 'sales';
  createdAt: string;
}

export type PaymentType = 'receivable' | 'payable';

export type PaymentStatus = 'pending' | 'partial' | 'completed';

export interface Payment {
  id: number;
  type: PaymentType;
  relatedId: number;
  relatedType: 'purchase' | 'sales';
  relatedName: string;
  totalAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  method: string;
  createdAt: string;
  paidAt: string | null;
}

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
