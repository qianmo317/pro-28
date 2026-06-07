import type { Category, CategoryStats } from '$lib/types';
import { categories as initialCategories } from '$lib/data/categories';
import { generateId } from '$lib/utils/helpers';
import { productStore } from './products.svelte';

class CategoryStore {
  items = $state<Category[]>([...initialCategories]);

  getById(id: number): Category | undefined {
    return this.items.find(c => c.id === id);
  }

  getByName(name: string): Category | undefined {
    return this.items.find(c => c.name === name);
  }

  add(category: Omit<Category, 'id' | 'createdAt'>) {
    this.items.push({
      ...category,
      id: generateId(),
      createdAt: new Date().toISOString()
    });
  }

  update(id: number, data: Partial<Omit<Category, 'id' | 'createdAt'>>) {
    const idx = this.items.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.items[idx] = { ...this.items[idx], ...data };
    }
  }

  canRemove(id: number): boolean {
    const category = this.getById(id);
    if (!category) return false;
    const productsInCategory = productStore.items.filter(p => p.category === category.name);
    return productsInCategory.length === 0;
  }

  remove(id: number): boolean {
    if (!this.canRemove(id)) {
      return false;
    }
    const idx = this.items.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.items.splice(idx, 1);
    }
    return true;
  }

  getProductCount(categoryName: string): number {
    return productStore.items.filter(p => p.category === categoryName).length;
  }

  getTotalStockValue(categoryName: string): number {
    return productStore.items
      .filter(p => p.category === categoryName)
      .reduce((sum, p) => sum + p.stock * p.cost, 0);
  }

  getStats(): CategoryStats[] {
    return this.items.map(category => ({
      ...category,
      productCount: this.getProductCount(category.name),
      totalStockValue: this.getTotalStockValue(category.name)
    }));
  }

  search(query: string): CategoryStats[] {
    const q = query.toLowerCase();
    return this.getStats().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  }

  getAllNames(): string[] {
    return this.items.map(c => c.name);
  }
}

export const categoryStore = new CategoryStore();
