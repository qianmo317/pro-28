import type { StockTake, StockTakeItem, StockTakeThreshold, Product } from '$lib/types';
import { generateId, generateOrderNo } from '$lib/utils/helpers';
import { productStore } from './products.svelte';
import { inventoryStore } from './inventory.svelte';
import { authStore } from './auth.svelte';

const DEFAULT_THRESHOLD: StockTakeThreshold = {
  ratio: 0.1,
  absolute: 10
};

class StockTakeStore {
  items = $state<StockTake[]>([]);
  threshold = $state<StockTakeThreshold>({ ...DEFAULT_THRESHOLD });

  setThreshold(threshold: Partial<StockTakeThreshold>) {
    this.threshold = { ...this.threshold, ...threshold };
  }

  calculateDifference(systemStock: number, actualStock: number): { difference: number; differenceRatio: number; isHighlighted: boolean } {
    const difference = actualStock - systemStock;
    const differenceRatio = systemStock > 0 ? Math.abs(difference) / systemStock : 0;
    const isHighlighted =
      differenceRatio > this.threshold.ratio ||
      Math.abs(difference) > this.threshold.absolute;
    return { difference, differenceRatio, isHighlighted };
  }

  createStockTake(title: string, remark: string = ''): StockTake {
    const stockTake: StockTake = {
      id: generateId(),
      stockTakeNo: generateOrderNo('PD'),
      title,
      status: 'draft',
      items: [],
      totalItems: 0,
      totalDifference: 0,
      highlightedCount: 0,
      remark,
      createdAt: new Date().toISOString(),
      confirmedAt: null,
      confirmedBy: null
    };
    this.items.unshift(stockTake);
    return stockTake;
  }

  getById(id: number): StockTake | undefined {
    return this.items.find(s => s.id === id);
  }

  addProduct(stockTakeId: number, productId: number): StockTakeItem | null {
    const stockTake = this.getById(stockTakeId);
    if (!stockTake || stockTake.status !== 'draft') return null;

    const existing = stockTake.items.find(i => i.productId === productId);
    if (existing) return null;

    const product = productStore.getById(productId);
    if (!product) return null;

    const { difference, differenceRatio, isHighlighted } = this.calculateDifference(product.stock, product.stock);

    const item: StockTakeItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unit: product.unit,
      systemStock: product.stock,
      actualStock: product.stock,
      difference,
      differenceRatio,
      isHighlighted
    };

    stockTake.items.push(item);
    this.updateStats(stockTake);
    return item;
  }

  addProducts(stockTakeId: number, productIds: number[]): StockTakeItem[] {
    const added: StockTakeItem[] = [];
    for (const productId of productIds) {
      const item = this.addProduct(stockTakeId, productId);
      if (item) added.push(item);
    }
    return added;
  }

  addAllProducts(stockTakeId: number): StockTakeItem[] {
    const productIds = productStore.items.map(p => p.id);
    return this.addProducts(stockTakeId, productIds);
  }

  removeItem(stockTakeId: number, itemId: number): boolean {
    const stockTake = this.getById(stockTakeId);
    if (!stockTake || stockTake.status !== 'draft') return false;

    const idx = stockTake.items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;

    stockTake.items.splice(idx, 1);
    this.updateStats(stockTake);
    return true;
  }

  updateActualStock(stockTakeId: number, itemId: number, actualStock: number): boolean {
    const stockTake = this.getById(stockTakeId);
    if (!stockTake || stockTake.status !== 'draft') return false;

    const item = stockTake.items.find(i => i.id === itemId);
    if (!item) return false;

    const clampedStock = Math.max(0, actualStock);
    const { difference, differenceRatio, isHighlighted } = this.calculateDifference(item.systemStock, clampedStock);

    item.actualStock = clampedStock;
    item.difference = difference;
    item.differenceRatio = differenceRatio;
    item.isHighlighted = isHighlighted;

    this.updateStats(stockTake);
    return true;
  }

  updateRemark(stockTakeId: number, remark: string): boolean {
    const stockTake = this.getById(stockTakeId);
    if (!stockTake || stockTake.status !== 'draft') return false;

    stockTake.remark = remark;
    return true;
  }

  updateTitle(stockTakeId: number, title: string): boolean {
    const stockTake = this.getById(stockTakeId);
    if (!stockTake || stockTake.status !== 'draft') return false;

    stockTake.title = title;
    return true;
  }

  private updateStats(stockTake: StockTake) {
    stockTake.totalItems = stockTake.items.length;
    stockTake.totalDifference = stockTake.items.reduce((sum, item) => sum + item.difference, 0);
    stockTake.highlightedCount = stockTake.items.filter(i => i.isHighlighted).length;
  }

  confirmStockTake(stockTakeId: number): boolean {
    const stockTake = this.getById(stockTakeId);
    if (!stockTake || stockTake.status !== 'draft') return false;

    for (const item of stockTake.items) {
      if (item.difference !== 0) {
        productStore.updateStock(item.productId, item.difference);

        const type: 'in' | 'out' = item.difference > 0 ? 'in' : 'out';
        const quantity = Math.abs(item.difference);
        const remark = `盘点差异：系统库存 ${item.systemStock}${item.unit}，实际盘点 ${item.actualStock}${item.unit}，差异 ${item.difference > 0 ? '+' : ''}${item.difference}${item.unit}`;

        inventoryStore.addRecord(
          item.productId,
          item.productName,
          type,
          quantity,
          stockTake.id,
          'stocktake',
          remark
        );
      }
    }

    stockTake.status = 'confirmed';
    stockTake.confirmedAt = new Date().toISOString();
    stockTake.confirmedBy = authStore.currentUser?.displayName || '系统';

    return true;
  }

  cancelStockTake(stockTakeId: number): boolean {
    const stockTake = this.getById(stockTakeId);
    if (!stockTake || stockTake.status !== 'draft') return false;

    stockTake.status = 'cancelled';
    return true;
  }

  search(query: string, status?: string): StockTake[] {
    let result = this.items;
    if (status && status !== 'all') {
      result = result.filter(s => s.status === status);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.stockTakeNo.toLowerCase().includes(q)
      );
    }
    return result;
  }

  getAvailableProducts(stockTakeId: number): Product[] {
    const stockTake = this.getById(stockTakeId);
    if (!stockTake) return productStore.items;
    const addedProductIds = new Set(stockTake.items.map(i => i.productId));
    return productStore.items.filter(p => !addedProductIds.has(p.id));
  }
}

export const stockTakeStore = new StockTakeStore();
