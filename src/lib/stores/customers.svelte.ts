import type { Customer, CustomerLevel } from '$lib/types';
import { customers as initialCustomers } from '$lib/data/customers';
import { generateId, getCustomerLevel } from '$lib/utils/helpers';

class CustomerStore {
  items = $state<Customer[]>([...initialCustomers]);

  getById(id: number): Customer | undefined {
    return this.items.find(c => c.id === id);
  }

  add(customer: Omit<Customer, 'id' | 'totalSpent' | 'level'>) {
    this.items.push({
      ...customer,
      id: generateId(),
      totalSpent: 0,
      level: 'bronze'
    });
  }

  update(id: number, data: Partial<Customer>) {
    const idx = this.items.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.items[idx] = { ...this.items[idx], ...data };
    }
  }

  remove(id: number) {
    this.items = this.items.filter(c => c.id !== id);
  }

  search(query: string): Customer[] {
    if (!query) return this.items;
    const q = query.toLowerCase();
    return this.items.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.contact.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }

  addSpent(customerId: number, amount: number) {
    const customer = this.getById(customerId);
    if (customer) {
      customer.totalSpent += amount;
      customer.level = getCustomerLevel(customer.totalSpent);
    }
  }

  getLevel(customerId: number): CustomerLevel {
    const customer = this.getById(customerId);
    return customer?.level || 'bronze';
  }

  getDiscountRate(customerId: number): number {
    const customer = this.getById(customerId);
    if (!customer) return 1;
    const levelConfig = [
      { level: 'bronze', rate: 0.95 },
      { level: 'silver', rate: 0.90 },
      { level: 'gold', rate: 0.85 }
    ];
    return levelConfig.find(c => c.level === customer.level)?.rate || 1;
  }
}

export const customerStore = new CustomerStore();
