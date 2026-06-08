<script lang="ts" generics="T extends import('$lib/types').OrderBase">
  import type { OrderBase, OrderCreateConfig, OrderItemDraft, OrderItem } from '$lib/types';
  import { productStore } from '$lib/stores/products.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { formatCurrency } from '$lib/utils/format';
  import type { Snippet } from 'svelte';

  interface Props {
    config: OrderCreateConfig<T>;
    onclose: () => void;
    extraHeader?: Snippet;
    extraFooter?: Snippet<[{ total: number; items: OrderItemDraft[]; partyId: number }]>;
    productOption?: Snippet<[{ product: import('$lib/types').Product }]>;
    initialItems?: OrderItemDraft[];
    initialPartyId?: number;
    onCreate?: (data: { partyId: number; items: OrderItem[] }) => void;
    onPartyChange?: (partyId: number) => void;
  }

  let {
    config,
    onclose,
    initialItems = [{ productId: 0, quantity: 1, price: 0 }],
    initialPartyId = 0,
    extraHeader,
    extraFooter,
    productOption,
    onCreate,
    onPartyChange
  }: Props = $props();

  let partyId = $state(initialPartyId);
  let items = $state<OrderItemDraft[]>([...initialItems]);

  $effect(() => {
    partyId = initialPartyId;
    items = [...initialItems];
  });

  function addNewItem() {
    items = [...items, { productId: 0, quantity: 1, price: 0 }];
  }

  function removeNewItem(index: number) {
    items = items.filter((_, i) => i !== index);
  }

  function updateNewItem(index: number, field: keyof OrderItemDraft, value: number) {
    items = items.map((item, i) => i === index ? { ...item, [field]: value } : item);
  }

  function handleProductChange(index: number, productId: number) {
    if (productId === 0) {
      updateNewItem(index, 'productId', 0);
      return;
    }
    const defaultPrice = config.getDefaultPrice(productId);
    items = items.map((item, i) =>
      i === index ? { ...item, productId, price: defaultPrice } : item
    );
  }

  const total = $derived(items.reduce((s, i) => s + i.quantity * i.price, 0));

  function handleClose() {
    items = [{ productId: 0, quantity: 1, price: 0 }];
    partyId = 0;
    onclose();
  }

  function handlePartyChangeInternal(newPartyId: number) {
    partyId = newPartyId;
    onPartyChange?.(newPartyId);
  }

  function handleCreate() {
    const orderItems: OrderItem[] = items
      .filter(i => i.productId > 0 && i.quantity > 0)
      .map((item, idx) => {
        const product = productStore.getById(item.productId)!;
        return {
          id: idx + 1,
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: item.price,
          amount: item.quantity * item.price
        };
      });

    if (onCreate) {
      onCreate({ partyId, items: orderItems });
      return;
    }

    const partyError = config.validateParty(partyId);
    if (partyError) {
      toastStore.error(partyError);
      return;
    }

    if (orderItems.length === 0) {
      toastStore.error('请添加至少一个商品');
      return;
    }

    config.createOrder({ partyId, items: orderItems });
    toastStore.success(config.successMessage);
    handleClose();
  }
</script>

<div class="fixed inset-0 z-50 flex items-start justify-center pt-20">
  <div class="absolute inset-0 bg-black/50" onclick={handleClose}></div>
  <div class="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] overflow-y-auto">
    <div class="p-6">
      <h3 class="text-lg font-semibold text-slate-800 mb-4">{config.modalTitle}</h3>

      {#if extraHeader}
        {@render extraHeader()}
      {/if}

      <div class="space-y-4">
        {#if !extraHeader}
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{config.partyLabel}</label>
            <select
              value={partyId}
              onchange={(e) => handlePartyChangeInternal(Number((e.target as HTMLSelectElement).value))}
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value={0}>{config.partyPlaceholder}</option>
              {#each config.getPartyOptions() as option}
                <option value={option.id}>{option.label}</option>
              {/each}
            </select>
          </div>
        {/if}

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-slate-700">商品明细</label>
            <button onclick={addNewItem} class="text-sm text-brand-600 hover:text-brand-700 font-medium">+ 添加商品</button>
          </div>
          <div class="space-y-3">
            {#each items as item, i}
              <div class="flex items-end gap-3 p-3 bg-slate-50 rounded-lg">
                <div class="flex-1">
                  <label class="block text-xs text-slate-500 mb-1">商品</label>
                  <select
                    value={item.productId}
                    onchange={(e) => handleProductChange(i, Number((e.target as HTMLSelectElement).value))}
                    class="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={0}>选择商品</option>
                    {#each productStore.items as product}
                      <option value={product.id}>
                        {#if productOption}
                          {@render productOption({ product })}
                        {:else}
                          {product.name}
                        {/if}
                      </option>
                    {/each}
                  </select>
                </div>
                <div class="w-20">
                  <label class="block text-xs text-slate-500 mb-1">数量</label>
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    onchange={(e) => updateNewItem(i, 'quantity', Number((e.target as HTMLInputElement).value))}
                    class="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div class="w-24">
                  <label class="block text-xs text-slate-500 mb-1">单价</label>
                  <input
                    type="number"
                    value={item.price}
                    min="0"
                    step="0.01"
                    onchange={(e) => updateNewItem(i, 'price', Number((e.target as HTMLInputElement).value))}
                    class="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div class="w-24">
                  <label class="block text-xs text-slate-500 mb-1">小计</label>
                  <p class="py-1.5 text-sm font-medium text-slate-700">{formatCurrency(item.quantity * item.price)}</p>
                </div>
                {#if items.length > 1}
                  <button onclick={() => removeNewItem(i)} class="text-red-400 hover:text-red-600 pb-1.5">&times;</button>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        {#if extraFooter}
          {@render extraFooter({ total, items, partyId })}
        {:else}
          <div class="flex items-center justify-between pt-3 border-t border-slate-200">
            <p class="text-sm text-slate-500">
              合计：<span class="font-bold text-slate-800">{formatCurrency(total)}</span>
            </p>
            <div class="flex gap-3">
              <button onclick={handleClose} class="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
              <button onclick={handleCreate} class="px-4 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">创建</button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
