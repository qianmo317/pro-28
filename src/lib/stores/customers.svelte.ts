import type { Customer } from '$lib/types';
import { customers as initialCustomers } from '$lib/data/customers';
import { generateId } from '$lib/utils/helpers';

class CustomerStore {
  items = $state<Customer[]>([...initialCustomers]);

  getById(id: number): Customer | undefined {
    return this.items.find(c => c.id === id);
  }

  add(customer: Omit<Customer, 'id'>) {
    this.items.push({ ...customer, id: generateId() });
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
}

export const customerStore = new CustomerStore();
