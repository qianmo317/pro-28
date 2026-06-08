import type { Product, ProductAlert, AlertUrgency } from '$lib/types';
import { products as initialProducts } from '$lib/data/products';
import { generateId } from '$lib/utils/helpers';
import { toastStore } from './toast.svelte';

const WARNING_DAYS_THRESHOLD = 3;
const CRITICAL_DAYS_THRESHOLD = 7;
const REPLENISHMENT_CHECK_DAYS = 3;

function daysBetween(date1: string | null, date2: Date = new Date()): number {
  if (!date1) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function getUrgency(daysBelowMin: number, hasRecentReplenishment: boolean): AlertUrgency {
  if (hasRecentReplenishment) return 'normal';
  if (daysBelowMin >= CRITICAL_DAYS_THRESHOLD) return 'critical';
  if (daysBelowMin >= WARNING_DAYS_THRESHOLD) return 'warning';
  return 'normal';
}

class ProductStore {
  items = $state<Product[]>([...initialProducts]);

  getById(id: number): Product | undefined {
    return this.items.find(p => p.id === id);
  }

  add(product: Omit<Product, 'id' | 'belowMinSince' | 'lastReplenishmentAt'>) {
    const newProduct: Product = {
      ...product,
      id: generateId(),
      belowMinSince: product.stock <= product.minStock ? new Date().toISOString() : null,
      lastReplenishmentAt: null
    };
    this.items.push(newProduct);
  }

  update(id: number, data: Partial<Product>) {
    const idx = this.items.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.items[idx] = { ...this.items[idx], ...data };
    }
  }

  updateStock(id: number, delta: number) {
    const product = this.items.find(p => p.id === id);
    if (!product) return;

    const oldStock = product.stock;
    const newStock = oldStock + delta;
    product.stock = newStock;

    if (delta > 0) {
      product.lastReplenishmentAt = new Date().toISOString();
      if (newStock > product.minStock) {
        product.belowMinSince = null;
      }
    }

    if (delta < 0) {
      if (oldStock > product.minStock && newStock === product.minStock) {
        toastStore.warning(`【库存预警】${product.name} 库存已降至预警线 ${product.minStock} ${product.unit}，请及时补货！`);
      }

      if (newStock <= product.minStock && !product.belowMinSince) {
        product.belowMinSince = new Date().toISOString();
      }
    }
  }

  getAlertProducts(): Product[] {
    return this.items.filter(p => p.stock <= p.minStock);
  }

  getAlertProductsWithDetails(): ProductAlert[] {
    const now = new Date();
    return this.items
      .filter(p => p.stock <= p.minStock)
      .map(p => {
        const daysBelowMin = daysBetween(p.belowMinSince, now);
        const daysSinceReplenishment = daysBetween(p.lastReplenishmentAt, now);
        const hasRecentReplenishment = p.lastReplenishmentAt !== null && daysSinceReplenishment <= REPLENISHMENT_CHECK_DAYS;
        return {
          ...p,
          daysBelowMin,
          urgency: getUrgency(daysBelowMin, hasRecentReplenishment),
          hasRecentReplenishment
        };
      })
      .sort((a, b) => {
        const urgencyOrder = { critical: 0, warning: 1, normal: 2 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        return b.daysBelowMin - a.daysBelowMin;
      });
  }

  getUrgentAlerts(): ProductAlert[] {
    return this.getAlertProductsWithDetails().filter(a => a.urgency !== 'normal');
  }

  getCriticalAlerts(): ProductAlert[] {
    return this.getAlertProductsWithDetails().filter(a => a.urgency === 'critical');
  }

  getAlertCount(): number {
    return this.getAlertProducts().length;
  }

  getUrgentAlertCount(): number {
    return this.getUrgentAlerts().length;
  }

  getProductAlertDetails(productId: number): ProductAlert | null {
    const product = this.getById(productId);
    if (!product) return null;

    const now = new Date();
    const daysBelowMin = daysBetween(product.belowMinSince, now);
    const daysSinceReplenishment = daysBetween(product.lastReplenishmentAt, now);
    const hasRecentReplenishment = product.lastReplenishmentAt !== null && daysSinceReplenishment <= REPLENISHMENT_CHECK_DAYS;

    return {
      ...product,
      daysBelowMin,
      urgency: product.stock <= product.minStock ? getUrgency(daysBelowMin, hasRecentReplenishment) : 'normal',
      hasRecentReplenishment
    };
  }

  search(query: string): Product[] {
    const q = query.toLowerCase();
    return this.items.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }
}

export const productStore = new ProductStore();
