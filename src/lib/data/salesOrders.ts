import type { SalesOrder } from '$lib/types';
import { getCustomerLevel, getDiscountRate } from '$lib/utils/helpers';
import { customers } from './customers';

function createSalesOrder(
  id: number, orderNo: string, customerId: number, customerName: string,
  status: SalesOrder['status'], items: SalesOrder['items'],
  originalAmount: number, createdAt: string, updatedAt: string
): SalesOrder {
  const customer = customers.find(c => c.id === customerId);
  const totalSpent = customer?.totalSpent || 0;
  const discountRate = getDiscountRate(totalSpent);
  const customerLevel = getCustomerLevel(totalSpent);
  const totalAmount = Math.round(originalAmount * discountRate * 100) / 100;

  const discountedItems = items.map(item => ({
    ...item,
    price: Math.round(item.price * discountRate * 100) / 100,
    amount: Math.round(item.amount * discountRate * 100) / 100
  }));

  return {
    id, orderNo, customerId, customerName, customerLevel, discountRate,
    originalAmount, status, items: discountedItems, totalAmount,
    createdAt, updatedAt
  };
}

export const salesOrders: SalesOrder[] = [
  createSalesOrder(1, 'SO20260502001', 1, '北京星辰科技有限公司', 'completed', [
    { id: 1, productId: 1, productName: '无线蓝牙耳机', quantity: 30, price: 299, amount: 8970 },
    { id: 2, productId: 2, productName: '机械键盘', quantity: 15, price: 459, amount: 6885 }
  ], 15855, '2026-05-02T10:00:00', '2026-05-03T15:00:00'),
  createSalesOrder(2, 'SO20260512002', 2, '成都云帆网络科技', 'approved', [
    { id: 3, productId: 9, productName: '无线鼠标', quantity: 50, price: 129, amount: 6450 },
    { id: 4, productId: 5, productName: '显示器支架', quantity: 30, price: 189, amount: 5670 }
  ], 12120, '2026-05-12T09:30:00', '2026-05-12T14:00:00'),
  createSalesOrder(3, 'SO20260522003', 3, '武汉长江贸易公司', 'pending', [
    { id: 5, productId: 3, productName: '办公椅', quantity: 20, price: 899, amount: 17980 },
    { id: 6, productId: 10, productName: '白板', quantity: 10, price: 259, amount: 2590 }
  ], 20570, '2026-05-22T11:00:00', '2026-05-22T11:00:00'),
  createSalesOrder(4, 'SO20260601004', 1, '北京星辰科技有限公司', 'completed', [
    { id: 7, productId: 6, productName: 'USB-C数据线', quantity: 200, price: 29, amount: 5800 },
    { id: 8, productId: 8, productName: '墨盒(黑色)', quantity: 30, price: 89, amount: 2670 }
  ], 8470, '2026-06-01T14:00:00', '2026-06-02T10:00:00'),
  createSalesOrder(5, 'SO20260603005', 2, '成都云帆网络科技', 'pending', [
    { id: 9, productId: 7, productName: '文件柜', quantity: 5, price: 1299, amount: 6495 }
  ], 6495, '2026-06-03T16:00:00', '2026-06-03T16:00:00')
];
