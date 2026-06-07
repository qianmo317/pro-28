import type { PurchaseReturn } from '$lib/types';

export const purchaseReturns: PurchaseReturn[] = [
  {
    id: 1,
    returnNo: 'RT20260605001',
    purchaseOrderId: 1,
    purchaseOrderNo: 'PO20260501001',
    supplierId: 1,
    supplierName: '深圳电子科技有限公司',
    status: 'completed',
    items: [
      { id: 1, productId: 1, productName: '无线蓝牙耳机', quantity: 5, price: 150, amount: 750 }
    ],
    totalAmount: 750,
    reason: '部分耳机存在音质问题，经协商退回5个',
    createdAt: '2026-06-05T10:30:00',
    updatedAt: '2026-06-05T14:00:00',
    approvedAt: '2026-06-05T11:00:00',
    completedAt: '2026-06-05T14:00:00'
  },
  {
    id: 2,
    returnNo: 'RT20260606002',
    purchaseOrderId: 4,
    purchaseOrderNo: 'PO20260601004',
    supplierId: 1,
    supplierName: '深圳电子科技有限公司',
    status: 'pending',
    items: [
      { id: 2, productId: 2, productName: '机械键盘', quantity: 3, price: 230, amount: 690 },
      { id: 3, productId: 9, productName: '无线鼠标', quantity: 10, price: 55, amount: 550 }
    ],
    totalAmount: 1240,
    reason: '键盘按键失灵，鼠标外观有划痕',
    createdAt: '2026-06-06T09:15:00',
    updatedAt: '2026-06-06T09:15:00',
    approvedAt: null,
    completedAt: null
  },
  {
    id: 3,
    returnNo: 'RT20260606003',
    purchaseOrderId: 2,
    purchaseOrderNo: 'PO20260510002',
    supplierId: 2,
    supplierName: '广州办公家具厂',
    status: 'approved',
    items: [
      { id: 4, productId: 3, productName: '办公椅', quantity: 2, price: 450, amount: 900 }
    ],
    totalAmount: 900,
    reason: '椅子扶手螺丝松动，存在安全隐患',
    createdAt: '2026-06-06T14:20:00',
    updatedAt: '2026-06-06T15:00:00',
    approvedAt: '2026-06-06T15:00:00',
    completedAt: null
  }
];
