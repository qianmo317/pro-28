<script lang="ts">
  import { salesOrderStore } from '$lib/stores/salesOrders.svelte';
  import { customerStore } from '$lib/stores/customers.svelte';
  import { productStore } from '$lib/stores/products.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { formatCurrency, formatDateTime } from '$lib/utils/format';
  import { getCustomerLevelLabel, getCustomerLevelColor } from '$lib/utils/helpers';
  import { Plus, Check, Truck, Eye, Tag } from 'lucide-svelte';
  import type { OrderStatus, OrderItem } from '$lib/types';
  import { goto } from '$app/navigation';

  let searchQuery = $state('');
  let statusFilter = $state<OrderStatus | ''>('');
  let showCreateModal = $state(false);
  let confirmDialog = $state(false);
  let confirmAction = $state<{ id: number; action: string } | null>(null);

  let newCustomerId = $state(0);
  let newItems = $state<Array<{ productId: number; quantity: number; price: number }>>([{ productId: 0, quantity: 1, price: 0 }]);
  let currentPage = $state(1);
  const PAGE_SIZE = 10;

  const filteredOrders = $derived(salesOrderStore.search(searchQuery, statusFilter || undefined));
  const pagedOrders = $derived(filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

  const selectedCustomer = $derived(customerStore.getById(newCustomerId));
  const discountRate = $derived(selectedCustomer ? customerStore.getDiscountRate(newCustomerId) : 1);
  const originalTotal = $derived(newItems.reduce((s, i) => s + i.quantity * i.price, 0));
  const discountedTotal = $derived(Math.round(originalTotal * discountRate * 100) / 100);
  const discountAmount = $derived(Math.round((originalTotal - discountedTotal) * 100) / 100);

  const statusTabs = [
    { value: '', label: '全部' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已审核' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  function handleApprove(id: number) {
    confirmAction = { id, action: 'approve' };
    confirmDialog = true;
  }

  function handleComplete(id: number) {
    confirmAction = { id, action: 'complete' };
    confirmDialog = true;
  }

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.action === 'approve') {
      salesOrderStore.updateStatus(confirmAction.id, 'approved');
      toastStore.success('销售单已审核');
    } else if (confirmAction.action === 'complete') {
      salesOrderStore.updateStatus(confirmAction.id, 'completed');
      toastStore.success('销售单已出库');
    }
  }

  function addNewItem() {
    newItems = [...newItems, { productId: 0, quantity: 1, price: 0 }];
  }

  function removeNewItem(index: number) {
    newItems = newItems.filter((_, i) => i !== index);
  }

  function updateNewItem(index: number, field: string, value: number) {
    newItems = newItems.map((item, i) => i === index ? { ...item, [field]: value } : item);
  }

  function handleProductChange(index: number, productId: number) {
    const product = productStore.getById(productId);
    if (product) {
      newItems = newItems.map((item, i) =>
        i === index ? { ...item, productId, price: product.price } : item
      );
    }
  }

  function handleCreateOrder() {
    if (!newCustomerId) {
      toastStore.error('请选择客户');
      return;
    }
    const items = newItems
      .filter(i => i.productId > 0 && i.quantity > 0)
      .map((item) => {
        const product = productStore.getById(item.productId)!;
        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: item.price,
          amount: item.quantity * item.price
        };
      });
    if (items.length === 0) {
      toastStore.error('请添加至少一个商品');
      return;
    }
    const customer = customerStore.getById(newCustomerId)!;
    salesOrderStore.add({
      customerId: newCustomerId,
      customerName: customer.name,
      status: 'pending',
      items
    });
    showCreateModal = false;
    newCustomerId = 0;
    newItems = [{ productId: 0, quantity: 1, price: 0 }];
    toastStore.success('销售单创建成功');
  }
</script>

<svelte:head>
  <title>销售管理 - 进销存管理系统</title>
</svelte:head>

<PageHeader title="销售管理" subtitle="管理销售订单，跟踪销售出库">
  {#snippet actions()}
    <button
      onclick={() => showCreateModal = true}
      class="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
    >
      <Plus class="w-4 h-4" />
      新建销售单
    </button>
  {/snippet}
</PageHeader>

<div class="space-y-4">
  <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
    <div class="flex gap-2 flex-wrap">
      {#each statusTabs as tab}
        <button
          onclick={() => { currentPage = 1; statusFilter = tab.value as OrderStatus | ''; }}
          class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {statusFilter === tab.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>
    <div class="w-full sm:w-64">
      <SearchBar bind:value={searchQuery} placeholder="搜索订单号/客户..." onchange={() => currentPage = 1} />
    </div>
  </div>

  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">订单号</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">客户</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">客户等级</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">原价</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">折扣</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">实付金额</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">创建时间</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3 w-32">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#if filteredOrders.length === 0}
            <tr><td colspan="9" class="text-center py-12 text-slate-400 text-sm">暂无销售订单</td></tr>
          {:else}
            {#each pagedOrders as order (order.id)}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 text-sm font-medium text-brand-600">{order.orderNo}</td>
                <td class="px-4 py-3 text-sm text-slate-700">{order.customerName}</td>
                <td class="px-4 py-3 text-sm">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style="background-color: {getCustomerLevelColor(order.customerLevel)}20; color: {getCustomerLevelColor(order.customerLevel)}">
                    <Tag class="w-3 h-3" />
                    {getCustomerLevelLabel(order.customerLevel)}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-slate-500 line-through">{formatCurrency(order.originalAmount)}</td>
                <td class="px-4 py-3 text-sm text-emerald-600 font-medium">{Math.round(order.discountRate * 100)}折</td>
                <td class="px-4 py-3 text-sm font-semibold text-slate-800">{formatCurrency(order.totalAmount)}</td>
                <td class="px-4 py-3 text-sm"><StatusBadge status={order.status} /></td>
                <td class="px-4 py-3 text-sm text-slate-500">{formatDateTime(order.createdAt)}</td>
                <td class="px-4 py-3 text-sm">
                  <div class="flex items-center gap-2">
                    {#if order.status === 'pending'}
                      <button onclick={() => handleApprove(order.id)} class="text-brand-600 hover:text-brand-700" title="审核"><Check class="w-4 h-4" /></button>
                    {/if}
                    {#if order.status === 'approved'}
                      <button onclick={() => handleComplete(order.id)} class="text-emerald-600 hover:text-emerald-700" title="出库"><Truck class="w-4 h-4" /></button>
                    {/if}
                    <button onclick={() => goto(`/sales/${order.id}`)} class="text-slate-400 hover:text-slate-600" title="详情"><Eye class="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
    <Pagination bind:page={currentPage} total={filteredOrders.length} pageSize={PAGE_SIZE} />
  </div>
</div>

<ConfirmDialog
  bind:open={confirmDialog}
  title={confirmAction?.action === 'approve' ? '审核销售单' : '确认出库'}
  message={confirmAction?.action === 'approve' ? '确定审核此销售单？' : '确定将此销售单标记为已出库？库存将自动扣减。'}
  onconfirm={handleConfirm}
/>

{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-start justify-center pt-20">
    <div class="absolute inset-0 bg-black/50" onclick={() => showCreateModal = false}></div>
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] overflow-y-auto">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">新建销售单</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">客户</label>
            <select bind:value={newCustomerId} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value={0}>请选择客户</option>
              {#each customerStore.items.filter(c => c.status === 'active') as customer}
                <option value={customer.id}>{customer.name} ({getCustomerLevelLabel(customer.level)} · {Math.round(customerStore.getDiscountRate(customer.id) * 100)}折)</option>
              {/each}
            </select>
          </div>

          {#if selectedCustomer}
            <div class="bg-gradient-to-r from-brand-50 to-emerald-50 rounded-lg p-4 border border-brand-100">
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
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-slate-700">商品明细</label>
              <button onclick={addNewItem} class="text-sm text-brand-600 hover:text-brand-700 font-medium">+ 添加商品</button>
            </div>
            <div class="space-y-3">
              {#each newItems as item, i}
                <div class="flex items-end gap-3 p-3 bg-slate-50 rounded-lg">
                  <div class="flex-1">
                    <label class="block text-xs text-slate-500 mb-1">商品</label>
                    <select value={item.productId} onchange={(e) => handleProductChange(i, Number((e.target as HTMLSelectElement).value))} class="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value={0}>选择商品</option>
                      {#each productStore.items as product}
                        <option value={product.id}>{product.name} (库存: {product.stock})</option>
                      {/each}
                    </select>
                  </div>
                  <div class="w-20">
                    <label class="block text-xs text-slate-500 mb-1">数量</label>
                    <input type="number" value={item.quantity} min="1" onchange={(e) => updateNewItem(i, 'quantity', Number((e.target as HTMLInputElement).value))} class="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div class="w-24">
                    <label class="block text-xs text-slate-500 mb-1">单价</label>
                    <input type="number" value={item.price} min="0" step="0.01" onchange={(e) => updateNewItem(i, 'price', Number((e.target as HTMLInputElement).value))} class="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div class="w-24">
                    <label class="block text-xs text-slate-500 mb-1">小计</label>
                    <p class="py-1.5 text-sm font-medium text-slate-700">{formatCurrency(item.quantity * item.price)}</p>
                  </div>
                  {#if newItems.length > 1}
                    <button onclick={() => removeNewItem(i)} class="text-red-400 hover:text-red-600 pb-1.5">&times;</button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
          <div class="space-y-2 pt-3 border-t border-slate-200">
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">商品原价：</span>
              <span class="text-slate-700">{formatCurrency(originalTotal)}</span>
            </div>
            {#if selectedCustomer && discountRate < 1}
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">客户折扣（{Math.round(discountRate * 100)}折）：</span>
                <span class="text-emerald-600 font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
            {/if}
            <div class="flex justify-between pt-2 border-t border-slate-100">
              <span class="font-semibold text-slate-800">实付金额：</span>
              <span class="font-bold text-lg text-brand-600">{formatCurrency(discountedTotal)}</span>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button onclick={() => showCreateModal = false} class="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
              <button onclick={handleCreateOrder} class="px-4 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">创建</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
