import type { Product } from '$lib/types';
import { products as initialProducts } from '$lib/data/products';
import { generateId } from '$lib/utils/helpers';

class ProductStore {
  items = $state<Product[]>([...initialProducts]);

  getById(id: number): Product | undefined {
    return this.items.find(p => p.id === id);
  }

  add(product: Omit<Product, 'id'>) {
    this.items.push({ ...product, id: generateId() });
  }

  update(id: number, data: Partial<Product>) {
    const idx = this.items.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.items[idx] = { ...this.items[idx], ...data };
    }
  }

  updateStock(id: number, delta: number) {
    const product = this.items.find(p => p.id === id);
    if (product) {
      product.stock += delta;
    }
  }

  getAlertProducts(): Product[] {
    return this.items.filter(p => p.stock <= p.minStock);
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
