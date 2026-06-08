import type { CustomerLevel, CustomerLevelConfig } from '$lib/types';

let nextId = 1000;

export function generateId(): number {
  return nextId++;
}

export const CUSTOMER_LEVEL_CONFIGS: CustomerLevelConfig[] = [
  { level: 'bronze', name: '青铜', minSpent: 0, maxSpent: 50000, discountRate: 0.95, color: '#cd7f32' },
  { level: 'silver', name: '白银', minSpent: 50000, maxSpent: 200000, discountRate: 0.90, color: '#c0c0c0' },
  { level: 'gold', name: '黄金', minSpent: 200000, maxSpent: Infinity, discountRate: 0.85, color: '#ffd700' }
];

export function getCustomerLevel(totalSpent: number): CustomerLevel {
  for (let i = CUSTOMER_LEVEL_CONFIGS.length - 1; i >= 0; i--) {
    const config = CUSTOMER_LEVEL_CONFIGS[i];
    if (totalSpent >= config.minSpent) {
      return config.level;
    }
  }
  return 'bronze';
}

export function getCustomerLevelConfig(level: CustomerLevel): CustomerLevelConfig {
  return CUSTOMER_LEVEL_CONFIGS.find(c => c.level === level) || CUSTOMER_LEVEL_CONFIGS[0];
}

export function getDiscountRate(totalSpent: number): number {
  const level = getCustomerLevel(totalSpent);
  return getCustomerLevelConfig(level).discountRate;
}

export function getCustomerLevelLabel(level: CustomerLevel): string {
  return getCustomerLevelConfig(level).name;
}

export function getCustomerLevelColor(level: CustomerLevel): string {
  return getCustomerLevelConfig(level).color;
}

export function generateOrderNo(prefix: string): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${seq}`;
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已审核',
    completed: '已完成',
    cancelled: '已取消',
    rejected: '已拒绝',
    active: '启用',
    inactive: '停用',
    draft: '草稿',
    confirmed: '已确认',
    partial: '部分付款'
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    active: 'bg-emerald-100 text-emerald-800',
    inactive: 'bg-gray-100 text-gray-600',
    draft: 'bg-slate-100 text-slate-800',
    confirmed: 'bg-purple-100 text-purple-800'
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

export function getOrderTypeLabel(type: string): string {
  const map: Record<string, string> = {
    purchase: '采购',
    sales: '销售',
    'purchase-return': '采购退货',
    stocktake: '盘点调整'
  };
  return map[type] || type;
}

export type DateRangePreset = 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}

export function getMonthRange(date: Date = new Date()): DateRange {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function getQuarterRange(date: Date = new Date()): DateRange {
  const year = date.getFullYear();
  const quarter = Math.floor(date.getMonth() / 3);
  const start = new Date(year, quarter * 3, 1);
  const end = new Date(year, quarter * 3 + 3, 0, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function getYearRange(date: Date = new Date()): DateRange {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function isDateInRange(dateStr: string, range: DateRange): boolean {
  const date = new Date(dateStr);
  const start = new Date(range.start);
  const end = new Date(range.end);
  return date >= start && date <= end;
}

export function formatDateForInput(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}
