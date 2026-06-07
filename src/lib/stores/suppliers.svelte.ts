import type { Supplier } from '$lib/types';
import { suppliers as initialSuppliers } from '$lib/data/suppliers';
import { generateId } from '$lib/utils/helpers';

class SupplierStore {
  items = $state<Supplier[]>([...initialSuppliers]);

  getById(id: number): Supplier | undefined {
    return this.items.find(s => s.id === id);
  }

  add(supplier: Omit<Supplier, 'id'>) {
    this.items.push({ ...supplier, id: generateId() });
  }

  update(id: number, data: Partial<Supplier>) {
    const idx = this.items.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.items[idx] = { ...this.items[idx], ...data };
    }
  }

  remove(id: number) {
    this.items = this.items.filter(s => s.id !== id);
  }

  search(query: string): Supplier[] {
    if (!query) return this.items;
    const q = query.toLowerCase();
    return this.items.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.contact.toLowerCase().includes(q) ||
      s.phone.includes(q)
    );
  }
}

export const supplierStore = new SupplierStore();
