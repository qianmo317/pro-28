import type { PurchaseOrder, OrderStatus, OrderItem } from '$lib/types';
import { purchaseOrders as initialOrders } from '$lib/data/purchaseOrders';
import { generateId, generateOrderNo } from '$lib/utils/helpers';
import { productStore } from './products.svelte';
import { inventoryStore } from './inventory.svelte';
import { financeStore } from './finance.svelte';

class PurchaseOrderStore {
  items = $state<PurchaseOrder[]>([...initialOrders]);

  getById(id: number): PurchaseOrder | undefined {
    return this.items.find(o => o.id === id);
  }

  add(order: Omit<PurchaseOrder, 'id' | 'orderNo' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newOrder: PurchaseOrder = {
      ...order,
      id: generateId(),
      orderNo: generateOrderNo('PO'),
      createdAt: now,
      updatedAt: now
    };
    this.items.unshift(newOrder);
    return newOrder;
  }

  updateStatus(id: number, status: OrderStatus) {
    const order = this.items.find(o => o.id === id);
    if (!order) return;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (status === 'approved') {
      financeStore.addPayable(order.id, order.supplierName, order.orderNo, order.totalAmount);
    }
    if (status === 'completed') {
      order.items.forEach(item => {
        productStore.updateStock(item.productId, item.quantity);
        inventoryStore.addRecord(item.productId, item.productName, 'in', item.quantity, order.id, 'purchase');
      });
    }
  }

  search(query: string, status?: OrderStatus): PurchaseOrder[] {
    let result = this.items;
    if (status) result = result.filter(o => o.status === status);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(o =>
        o.orderNo.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q)
      );
    }
    return result;
  }
}

export const purchaseOrderStore = new PurchaseOrderStore();
