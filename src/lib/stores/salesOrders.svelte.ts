import type { SalesOrder, OrderStatus } from '$lib/types';
import { salesOrders as initialOrders } from '$lib/data/salesOrders';
import { generateId, generateOrderNo } from '$lib/utils/helpers';
import { productStore } from './products.svelte';
import { inventoryStore } from './inventory.svelte';
import { financeStore } from './finance.svelte';

class SalesOrderStore {
  items = $state<SalesOrder[]>([...initialOrders]);

  getById(id: number): SalesOrder | undefined {
    return this.items.find(o => o.id === id);
  }

  add(order: Omit<SalesOrder, 'id' | 'orderNo' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newOrder: SalesOrder = {
      ...order,
      id: generateId(),
      orderNo: generateOrderNo('SO'),
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
      financeStore.addReceivable(order.id, order.customerName, order.orderNo, order.totalAmount);
    }
    if (status === 'completed') {
      order.items.forEach(item => {
        productStore.updateStock(item.productId, -item.quantity);
        inventoryStore.addRecord(item.productId, item.productName, 'out', item.quantity, order.id, 'sales');
      });
    }
  }

  search(query: string, status?: OrderStatus): SalesOrder[] {
    let result = this.items;
    if (status) result = result.filter(o => o.status === status);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(o =>
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
      );
    }
    return result;
  }
}

export const salesOrderStore = new SalesOrderStore();
