import type { Product } from '$lib/types';

const now = new Date();
const daysAgo = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const products: Product[] = [
  { id: 1, name: '无线蓝牙耳机', sku: 'BT-001', category: '电子产品', price: 299, cost: 150, stock: 120, minStock: 20, maxStock: 500, unit: '个', belowMinSince: null, lastReplenishmentAt: daysAgo(2) },
  { id: 2, name: '机械键盘', sku: 'KB-002', category: '电子产品', price: 459, cost: 230, stock: 8, minStock: 10, maxStock: 200, unit: '个', belowMinSince: daysAgo(3), lastReplenishmentAt: daysAgo(10) },
  { id: 3, name: '办公椅', sku: 'CH-003', category: '办公家具', price: 899, cost: 450, stock: 35, minStock: 5, maxStock: 100, unit: '把', belowMinSince: null, lastReplenishmentAt: daysAgo(5) },
  { id: 4, name: 'A4打印纸', sku: 'PP-004', category: '办公耗材', price: 35, cost: 18, stock: 3, minStock: 50, maxStock: 1000, unit: '包', belowMinSince: daysAgo(8), lastReplenishmentAt: daysAgo(15) },
  { id: 5, name: '显示器支架', sku: 'MH-005', category: '办公家具', price: 189, cost: 85, stock: 65, minStock: 10, maxStock: 300, unit: '个', belowMinSince: null, lastReplenishmentAt: daysAgo(1) },
  { id: 6, name: 'USB-C数据线', sku: 'CB-006', category: '电子产品', price: 29, cost: 8, stock: 500, minStock: 100, maxStock: 2000, unit: '根', belowMinSince: null, lastReplenishmentAt: daysAgo(3) },
  { id: 7, name: '文件柜', sku: 'FC-007', category: '办公家具', price: 1299, cost: 680, stock: 12, minStock: 3, maxStock: 50, unit: '个', belowMinSince: null, lastReplenishmentAt: daysAgo(7) },
  { id: 8, name: '墨盒(黑色)', sku: 'IK-008', category: '办公耗材', price: 89, cost: 42, stock: 5, minStock: 20, maxStock: 200, unit: '个', belowMinSince: daysAgo(12), lastReplenishmentAt: daysAgo(20) },
  { id: 9, name: '无线鼠标', sku: 'MS-009', category: '电子产品', price: 129, cost: 55, stock: 88, minStock: 15, maxStock: 500, unit: '个', belowMinSince: null, lastReplenishmentAt: daysAgo(4) },
  { id: 10, name: '白板', sku: 'WB-010', category: '办公家具', price: 259, cost: 120, stock: 18, minStock: 5, maxStock: 80, unit: '块', belowMinSince: null, lastReplenishmentAt: daysAgo(6) }
];
