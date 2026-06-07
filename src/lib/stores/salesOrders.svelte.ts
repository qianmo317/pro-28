import type { SalesOrder, OrderStatus, OrderItem } from '$lib/types';
import { salesOrders as initialOrders } from '$lib/data/salesOrders';
import { generateId, generateOrderNo } from '$lib/utils/helpers';
import { productStore } from './products.svelte';
import { inventoryStore } from './inventory.svelte';
import { financeStore } from './finance.svelte';
import { customerStore } from './customers.svelte';

class SalesOrderStore {
  items = $state<SalesOrder[]>([...initialOrders]);

  getById(id: number): SalesOrder | undefined {
    return this.items.find(o => o.id === id);
  }

  add(order: Omit<SalesOrder, 'id' | 'orderNo' | 'createdAt' | 'updatedAt' | 'customerLevel' | 'discountRate' | 'originalAmount' | 'totalAmount' | 'items'> & {
    items: Array<Omit<OrderItem, 'id'>>;
  }) {
    const discountRate = customerStore.getDiscountRate(order.customerId);
    const customerLevel = customerStore.getLevel(order.customerId);

    const discountedItems = order.items.map((item, idx) => ({
      ...item,
      id: idx + 1,
      price: Math.round(item.price * discountRate * 100) / 100,
      amount: Math.round(item.amount * discountRate * 100) / 100
    }));

    const originalAmount = order.items.reduce((sum, i) => sum + i.amount, 0);
    const totalAmount = Math.round(originalAmount * discountRate * 100) / 100;

    const now = new Date().toISOString();
    const newOrder: SalesOrder = {
      ...order,
      items: discountedItems,
      customerLevel,
      discountRate,
      originalAmount,
      totalAmount,
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
      customerStore.addSpent(order.customerId, order.totalAmount);
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
