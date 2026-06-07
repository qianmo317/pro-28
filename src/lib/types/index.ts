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
  belowMinSince: string | null;
  lastReplenishmentAt: string | null;
}

export type AlertUrgency = 'normal' | 'warning' | 'critical';

export interface ProductAlert extends Product {
  daysBelowMin: number;
  urgency: AlertUrgency;
  hasRecentReplenishment: boolean;
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

export type CustomerLevel = 'bronze' | 'silver' | 'gold';

export interface CustomerLevelConfig {
  level: CustomerLevel;
  name: string;
  minSpent: number;
  maxSpent: number;
  discountRate: number;
  color: string;
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
  totalSpent: number;
  level: CustomerLevel;
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
  customerLevel: CustomerLevel;
  discountRate: number;
  originalAmount: number;
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
  orderType: 'purchase' | 'sales' | 'purchase-return' | 'stocktake';
  createdAt: string;
  remark?: string;
}

export interface StockTakeItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unit: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  differenceRatio: number;
  isHighlighted: boolean;
}

export type StockTakeStatus = 'draft' | 'confirmed' | 'cancelled';

export interface StockTake {
  id: number;
  stockTakeNo: string;
  title: string;
  status: StockTakeStatus;
  items: StockTakeItem[];
  totalItems: number;
  totalDifference: number;
  highlightedCount: number;
  remark: string;
  createdAt: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
}

export interface StockTakeThreshold {
  ratio: number;
  absolute: number;
}

export type PaymentType = 'receivable' | 'payable';

export type PaymentStatus = 'pending' | 'partial' | 'completed';

export type PaymentAdjustmentType = 'return';

export interface PaymentAdjustment {
  id: number;
  paymentId: number;
  type: PaymentAdjustmentType;
  amount: number;
  reason: string;
  relatedId: number;
  relatedName: string;
  createdAt: string;
}

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
  adjustments: PaymentAdjustment[];
}

export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface PurchaseReturnItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface PurchaseReturn {
  id: number;
  returnNo: string;
  purchaseOrderId: number;
  purchaseOrderNo: string;
  supplierId: number;
  supplierName: string;
  status: ReturnStatus;
  items: PurchaseReturnItem[];
  totalAmount: number;
  reason: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

export interface CategoryStats {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  productCount: number;
  totalStockValue: number;
}

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
