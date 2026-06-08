<script lang="ts">
  import { salesOrderStore } from '$lib/stores/salesOrders.svelte';
  import { customerStore } from '$lib/stores/customers.svelte';
  import { productStore } from '$lib/stores/products.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { useOrderList } from '$lib/composables/useOrderList';
  import { OrderListBase, OrderCreateModal } from '$lib/components/order';
  import { formatCurrency } from '$lib/utils/format';
  import { getCustomerLevelLabel, getCustomerLevelColor } from '$lib/utils/helpers';
  import { Truck, Tag } from 'lucide-svelte';
  import type { SalesOrder, OrderListConfig, OrderCreateConfig, OrderItem, OrderItemDraft, Product } from '$lib/types';

  let selectedCustomerId = $state(0);
  const selectedCustomer = $derived(customerStore.getById(selectedCustomerId));
  const discountRate = $derived(selectedCustomer ? customerStore.getDiscountRate(selectedCustomerId) : 1);

  const listConfig: OrderListConfig<SalesOrder> = {
    pageTitle: '销售管理',
    pageSubtitle: '管理销售订单，跟踪销售出库',
    createButtonText: '新建销售单',
    searchPlaceholder: '搜索订单号/客户...',
    emptyText: '暂无销售订单',
    approveText: '审核',
    completeText: '出库',
    approveConfirmTitle: '审核销售单',
    approveConfirmMessage: '确定审核此销售单？',
    completeConfirmTitle: '确认出库',
    completeConfirmMessage: '确定将此销售单标记为已出库？库存将自动扣减。',
    approveSuccessMessage: '销售单已审核',
    completeSuccessMessage: '销售单已出库',
    detailRoutePrefix: '/sales',
    columns: [
      { key: 'orderNo', label: '订单号' },
      { key: 'customerName', label: '客户' },
      {
        key: 'customerLevel',
        label: '客户等级',
        renderHtml: (order) => {
          const color = getCustomerLevelColor(order.customerLevel);
          const label = getCustomerLevelLabel(order.customerLevel);
          return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style="background-color: ${color}20; color: ${color}"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>${label}</span>`;
        }
      },
      {
        key: 'originalAmount',
        label: '原价',
        class: 'text-slate-500 line-through',
        render: (order) => formatCurrency(order.originalAmount)
      },
      {
        key: 'discountRate',
        label: '折扣',
        class: 'text-emerald-600 font-medium',
        render: (order) => `${Math.round(order.discountRate * 100)}折`
      },
      {
        key: 'totalAmount',
        label: '实付金额',
        class: 'font-semibold text-slate-800',
        render: (order) => formatCurrency(order.totalAmount)
      },
      { key: 'status', label: '状态' },
      { key: 'createdAt', label: '创建时间' }
    ]
  };

  const listState = useOrderList(salesOrderStore, listConfig);

  const createConfig: OrderCreateConfig<SalesOrder> = {
    modalTitle: '新建销售单',
    partyLabel: '客户',
    partyPlaceholder: '请选择客户',
    getDefaultPrice: (productId: number) => productStore.getById(productId)?.price || 0,
    getPartyOptions: () => customerStore.items.filter(c => c.status === 'active').map(c => ({
      id: c.id,
      label: `${c.name} (${getCustomerLevelLabel(c.level)} · ${Math.round(customerStore.getDiscountRate(c.id) * 100)}折)`
    })),
    validateParty: (partyId: number) => partyId ? null : '请选择客户',
    createOrder: (data: { partyId: number; items: OrderItem[] }) => {
      const customer = customerStore.getById(data.partyId)!;
      salesOrderStore.add({
        customerId: data.partyId,
        customerName: customer.name,
        status: 'pending',
        items: data.items
      });
    },
    successMessage: '销售单创建成功'
  };

  function handlePartyChange(partyId: number) {
    selectedCustomerId = partyId;
  }

  function handleCloseModal() {
    listState.closeCreateModal();
    selectedCustomerId = 0;
  }

  function handleCreate(data: { partyId: number; items: OrderItem[] }) {
    const partyError = createConfig.validateParty(data.partyId);
    if (partyError) {
      toastStore.error(partyError);
      return;
    }
    if (data.items.length === 0) {
      toastStore.error('请添加至少一个商品');
      return;
    }
    createConfig.createOrder(data);
    toastStore.success(createConfig.successMessage);
    handleCloseModal();
  }
</script>

<OrderListBase config={listConfig} state={listState}>
  {#snippet completeIcon()}
    <Truck class="w-4 h-4" />
  {/snippet}

  {#snippet createModal()}
    <OrderCreateModal
      config={createConfig}
      onclose={handleCloseModal}
      initialPartyId={selectedCustomerId}
      onPartyChange={handlePartyChange}
      onCreate={handleCreate}
    >
      {#snippet productOption({ product }: { product: Product })}
        {product.name} (库存: {product.stock})
      {/snippet}

      {#snippet extraHeader()}
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">{createConfig.partyLabel}</label>
          <select
            value={selectedCustomerId}
            onchange={(e) => {
              const val = Number((e.target as HTMLSelectElement).value);
              selectedCustomerId = val;
              handlePartyChange(val);
            }}
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value={0}>{createConfig.partyPlaceholder}</option>
            {#each createConfig.getPartyOptions() as option}
              <option value={option.id}>{option.label}</option>
            {/each}
          </select>
        </div>

        {#if selectedCustomer}
          <div class="bg-gradient-to-r from-brand-50 to-emerald-50 rounded-lg p-4 border border-brand-100 mb-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium" style="background-color: {getCustomerLevelColor(selectedCustomer.level)}20; color: {getCustomerLevelColor(selectedCustomer.level)}">
                  <Tag class="w-4 h-4" />
                  {getCustomerLevelLabel(selectedCustomer.level)}会员
                </span>
                <span class="text-sm text-slate-600">历史累计消费：{formatCurrency(selectedCustomer.totalSpent)}</span>
              </div>
              <div class="text-right">
                <p class="text-xs text-slate-500">享受折扣</p>
                <p class="text-lg font-bold text-emerald-600">{Math.round(discountRate * 100)}折</p>
              </div>
            </div>
          </div>
        {/if}
      {/snippet}

      {#snippet extraFooter({ total, items, partyId }: { total: number; items: OrderItemDraft[]; partyId: number })}
        <div class="space-y-2 pt-3 border-t border-slate-200">
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">商品原价：</span>
            <span class="text-slate-700">{formatCurrency(total)}</span>
          </div>
          {#if selectedCustomer && discountRate < 1}
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">客户折扣（{Math.round(discountRate * 100)}折）：</span>
              <span class="text-emerald-600 font-medium">-{formatCurrency(Math.round((total - total * discountRate) * 100) / 100)}</span>
            </div>
          {/if}
          <div class="flex justify-between pt-2 border-t border-slate-100">
            <span class="font-semibold text-slate-800">实付金额：</span>
            <span class="font-bold text-lg text-brand-600">{formatCurrency(Math.round(total * discountRate * 100) / 100)}</span>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button onclick={handleCloseModal} class="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
            <button onclick={() => {
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
              handleCreate({ partyId, items: orderItems });
            }} class="px-4 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">创建</button>
          </div>
        </div>
      {/snippet}
    </OrderCreateModal>
  {/snippet}
</OrderListBase>
