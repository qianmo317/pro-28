import type { SalesOrder } from '$lib/types';

export const salesOrders: SalesOrder[] = [
  {
    id: 1, orderNo: 'SO20260502001', customerId: 1, customerName: '北京星辰科技有限公司', status: 'completed',
    items: [
      { id: 1, productId: 1, productName: '无线蓝牙耳机', quantity: 30, price: 299, amount: 8970 },
      { id: 2, productId: 2, productName: '机械键盘', quantity: 15, price: 459, amount: 6885 }
    ],
    totalAmount: 15855, createdAt: '2026-05-02T10:00:00', updatedAt: '2026-05-03T15:00:00'
  },
  {
    id: 2, orderNo: 'SO20260512002', customerId: 2, customerName: '成都云帆网络科技', status: 'approved',
    items: [
      { id: 3, productId: 9, productName: '无线鼠标', quantity: 50, price: 129, amount: 6450 },
      { id: 4, productId: 5, productName: '显示器支架', quantity: 30, price: 189, amount: 5670 }
    ],
    totalAmount: 12120, createdAt: '2026-05-12T09:30:00', updatedAt: '2026-05-12T14:00:00'
  },
  {
    id: 3, orderNo: 'SO20260522003', customerId: 3, customerName: '武汉长江贸易公司', status: 'pending',
    items: [
      { id: 5, productId: 3, productName: '办公椅', quantity: 20, price: 899, amount: 17980 },
      { id: 6, productId: 10, productName: '白板', quantity: 10, price: 259, amount: 2590 }
    ],
    totalAmount: 20570, createdAt: '2026-05-22T11:00:00', updatedAt: '2026-05-22T11:00:00'
  },
  {
    id: 4, orderNo: 'SO20260601004', customerId: 1, customerName: '北京星辰科技有限公司', status: 'completed',
    items: [
      { id: 7, productId: 6, productName: 'USB-C数据线', quantity: 200, price: 29, amount: 5800 },
      { id: 8, productId: 8, productName: '墨盒(黑色)', quantity: 30, price: 89, amount: 2670 }
    ],
    totalAmount: 8470, createdAt: '2026-06-01T14:00:00', updatedAt: '2026-06-02T10:00:00'
  },
  {
    id: 5, orderNo: 'SO20260603005', customerId: 2, customerName: '成都云帆网络科技', status: 'pending',
    items: [
      { id: 9, productId: 7, productName: '文件柜', quantity: 5, price: 1299, amount: 6495 }
    ],
    totalAmount: 6495, createdAt: '2026-06-03T16:00:00', updatedAt: '2026-06-03T16:00:00'
  }
];
