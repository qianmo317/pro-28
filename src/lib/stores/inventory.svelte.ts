import type { InventoryRecord, InventoryRecordType } from '$lib/types';
import { generateId } from '$lib/utils/helpers';

class InventoryStore {
  records = $state<InventoryRecord[]>([]);

  addRecord(
    productId: number,
    productName: string,
    type: InventoryRecordType,
    quantity: number,
    orderId: number,
    orderType: 'purchase' | 'sales' | 'purchase-return' | 'stocktake',
    remark?: string
  ) {
    this.records.unshift({
      id: generateId(),
      productId,
      productName,
      type,
      quantity,
      orderId,
      orderType,
      createdAt: new Date().toISOString(),
      remark
    });
  }

  getByProductId(productId: number): InventoryRecord[] {
    return this.records.filter(r => r.productId === productId);
  }

  search(query: string, type?: InventoryRecordType): InventoryRecord[] {
    let result = this.records;
    if (type) result = result.filter(r => r.type === type);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(r => r.productName.toLowerCase().includes(q));
    }
    return result;
  }
}

export const inventoryStore = new InventoryStore();
