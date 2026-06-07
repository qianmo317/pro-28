import type { PurchaseReturn, ReturnStatus, PurchaseReturnItem } from '$lib/types';
import { purchaseReturns as initialReturns } from '$lib/data/purchaseReturns';
import { generateId, generateOrderNo } from '$lib/utils/helpers';
import { productStore } from './products.svelte';
import { inventoryStore } from './inventory.svelte';
import { financeStore } from './finance.svelte';

class PurchaseReturnStore {
  items = $state<PurchaseReturn[]>([...initialReturns]);

  getById(id: number): PurchaseReturn | undefined {
    return this.items.find(r => r.id === id);
  }

  getByPurchaseOrderId(purchaseOrderId: number): PurchaseReturn[] {
    return this.items.filter(r => r.purchaseOrderId === purchaseOrderId);
  }

  add(returnData: Omit<PurchaseReturn, 'id' | 'returnNo' | 'createdAt' | 'updatedAt' | 'approvedAt' | 'completedAt' | 'status'>) {
    const now = new Date().toISOString();
    const newReturn: PurchaseReturn = {
      ...returnData,
      id: generateId(),
      returnNo: generateOrderNo('RT'),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      approvedAt: null,
      completedAt: null
    };
    this.items.unshift(newReturn);
    return newReturn;
  }

  updateStatus(id: number, status: ReturnStatus) {
    const returnItem = this.items.find(r => r.id === id);
    if (!returnItem) return;

    const now = new Date().toISOString();
    returnItem.status = status;
    returnItem.updatedAt = now;

    if (status === 'approved') {
      returnItem.approvedAt = now;
      returnItem.items.forEach(item => {
        productStore.updateStock(item.productId, -item.quantity);
        inventoryStore.addRecord(item.productId, item.productName, 'out', item.quantity, returnItem.id, 'purchase-return');
      });
      financeStore.adjustPayableForReturn(
        returnItem.purchaseOrderId,
        returnItem.returnNo,
        returnItem.totalAmount,
        returnItem.reason,
        returnItem.id
      );
    } else if (status === 'completed') {
      returnItem.completedAt = now;
    }
  }

  approve(id: number) {
    this.updateStatus(id, 'approved');
  }

  reject(id: number) {
    const returnItem = this.items.find(r => r.id === id);
    if (!returnItem) return;
    returnItem.status = 'rejected';
    returnItem.updatedAt = new Date().toISOString();
  }

  complete(id: number) {
    this.updateStatus(id, 'completed');
  }

  update(id: number, data: Partial<PurchaseReturn>) {
    const idx = this.items.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.items[idx] = { ...this.items[idx], ...data, updatedAt: new Date().toISOString() };
    }
  }

  delete(id: number) {
    const idx = this.items.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.items.splice(idx, 1);
    }
  }

  search(query: string, status?: ReturnStatus): PurchaseReturn[] {
    let result = this.items;
    if (status) result = result.filter(r => r.status === status);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(r =>
        r.returnNo.toLowerCase().includes(q) ||
        r.purchaseOrderNo.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q)
      );
    }
    return result;
  }
}

export const purchaseReturnStore = new PurchaseReturnStore();
