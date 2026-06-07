import type { PurchaseOrder } from '$lib/types';

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: 1, orderNo: 'PO20260501001', supplierId: 1, supplierName: '深圳电子科技有限公司', status: 'completed',
    items: [
      { id: 1, productId: 1, productName: '无线蓝牙耳机', quantity: 100, price: 150, amount: 15000 },
      { id: 2, productId: 6, productName: 'USB-C数据线', quantity: 500, price: 8, amount: 4000 }
    ],
    totalAmount: 19000, createdAt: '2026-05-01T09:00:00', updatedAt: '2026-05-02T14:30:00'
  },
  {
    id: 2, orderNo: 'PO20260510002', supplierId: 2, supplierName: '广州办公家具厂', status: 'approved',
    items: [
      { id: 3, productId: 3, productName: '办公椅', quantity: 30, price: 450, amount: 13500 },
      { id: 4, productId: 7, productName: '文件柜', quantity: 10, price: 680, amount: 6800 }
    ],
    totalAmount: 20300, createdAt: '2026-05-10T10:30:00', updatedAt: '2026-05-11T09:00:00'
  },
  {
    id: 3, orderNo: 'PO20260520003', supplierId: 3, supplierName: '杭州耗材供应链', status: 'pending',
    items: [
      { id: 5, productId: 4, productName: 'A4打印纸', quantity: 200, price: 18, amount: 3600 },
      { id: 6, productId: 8, productName: '墨盒(黑色)', quantity: 50, price: 42, amount: 2100 }
    ],
    totalAmount: 5700, createdAt: '2026-05-20T15:00:00', updatedAt: '2026-05-20T15:00:00'
  },
  {
    id: 4, orderNo: 'PO20260601004', supplierId: 1, supplierName: '深圳电子科技有限公司', status: 'completed',
    items: [
      { id: 7, productId: 2, productName: '机械键盘', quantity: 50, price: 230, amount: 11500 },
      { id: 8, productId: 9, productName: '无线鼠标', quantity: 80, price: 55, amount: 4400 }
    ],
    totalAmount: 15900, createdAt: '2026-06-01T08:00:00', updatedAt: '2026-06-02T16:00:00'
  },
  {
    id: 5, orderNo: 'PO20260603005', supplierId: 2, supplierName: '广州办公家具厂', status: 'cancelled',
    items: [
      { id: 9, productId: 10, productName: '白板', quantity: 20, price: 120, amount: 2400 }
    ],
    totalAmount: 2400, createdAt: '2026-06-03T11:00:00', updatedAt: '2026-06-03T14:00:00'
  }
];
