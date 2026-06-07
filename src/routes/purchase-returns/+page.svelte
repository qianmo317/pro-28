<script lang="ts">
  import { purchaseReturnStore } from '$lib/stores/purchaseReturns.svelte';
  import { purchaseOrderStore } from '$lib/stores/purchaseOrders.svelte';
  import { productStore } from '$lib/stores/products.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { formatCurrency, formatDateTime } from '$lib/utils/format';
  import { Plus, Check, X, PackageMinus, Eye } from 'lucide-svelte';
  import type { ReturnStatus, PurchaseReturnItem, PurchaseOrder, OrderItem } from '$lib/types';
  import { goto } from '$app/navigation';

  let searchQuery = $state('');
  let statusFilter = $state<ReturnStatus | ''>('');
  let showCreateModal = $state(false);
  let confirmDialog = $state(false);
  let confirmAction = $state<{ id: number; action: string } | null>(null);

  let selectedPurchaseOrderId = $state(0);
  let returnReason = $state('');
  let returnItems = $state<Array<{ productId: number; quantity: number; price: number; selected: boolean; maxQuantity: number }>>([]);

  let currentPage = $state(1);
  const PAGE_SIZE = 10;

  const filteredReturns = $derived(
    purchaseReturnStore.search(searchQuery, statusFilter || undefined)
  );
  const pagedReturns = $derived(filteredReturns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

  const completedPurchaseOrders = $derived(
    purchaseOrderStore.items.filter(o => o.status === 'completed')
  );

  $effect(() => {
    if (selectedPurchaseOrderId > 0) {
      const order = purchaseOrderStore.getById(selectedPurchaseOrderId);
      if (order) {
        const existingReturns = purchaseReturnStore.getByPurchaseOrderId(selectedPurchaseOrderId);
        const returnedQuantities: Record<number, number> = {};
        existingReturns.forEach(r => {
          r.items.forEach(item => {
            returnedQuantities[item.productId] = (returnedQuantities[item.productId] || 0) + item.quantity;
          });
        });

        returnItems = order.items.map(item => {
          const returned = returnedQuantities[item.productId] || 0;
          const remaining = item.quantity - returned;
          return {
            productId: item.productId,
            quantity: 1,
            price: item.price,
            selected: false,
            maxQuantity: Math.max(0, remaining)
          };
        });
      }
    } else {
      returnItems = [];
    }
  });

  function handleApprove(id: number) {
    confirmAction = { id, action: 'approve' };
    confirmDialog = true;
  }

  function handleReject(id: number) {
    confirmAction = { id, action: 'reject' };
    confirmDialog = true;
  }

  function handleComplete(id: number) {
    confirmAction = { id, action: 'complete' };
    confirmDialog = true;
  }

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.action === 'approve') {
      purchaseReturnStore.approve(confirmAction.id);
      toastStore.success('退货单已审核通过，库存已扣减，应付账款已调整');
    } else if (confirmAction.action === 'reject') {
      purchaseReturnStore.reject(confirmAction.id);
      toastStore.success('退货单已拒绝');
    } else if (confirmAction.action === 'complete') {
      purchaseReturnStore.complete(confirmAction.id);
      toastStore.success('退货单已完成');
    }
  }

  function updateReturnItem(index: number, field: string, value: number | boolean) {
    returnItems = returnItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
  }

  function handleCreateReturn() {
    if (!selectedPurchaseOrderId) {
      toastStore.error('请选择原采购单');
      return;
    }
    if (!returnReason.trim()) {
      toastStore.error('请填写退货原因');
      return;
    }

    const selectedItems = returnItems.filter(i => i.selected && i.quantity > 0 && i.quantity <= i.maxQuantity);
    if (selectedItems.length === 0) {
      toastStore.error('请选择至少一个要退货的商品');
      return;
    }

    const order = purchaseOrderStore.getById(selectedPurchaseOrderId)!;
    const items: PurchaseReturnItem[] = selectedItems.map((item, idx) => {
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

    purchaseReturnStore.add({
      purchaseOrderId: selectedPurchaseOrderId,
      purchaseOrderNo: order.orderNo,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      items,
      totalAmount: items.reduce((sum, i) => sum + i.amount, 0),
      reason: returnReason.trim()
    });

    showCreateModal = false;
    selectedPurchaseOrderId = 0;
    returnReason = '';
    returnItems = [];
    toastStore.success('退货单创建成功，等待审核');
  }

  function resetCreateModal() {
    showCreateModal = false;
    selectedPurchaseOrderId = 0;
    returnReason = '';
    returnItems = [];
  }

  const statusTabs = [
    { value: '', label: '全部' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已审核' },
    { value: 'completed', label: '已完成' },
    { value: 'rejected', label: '已拒绝' }
  ];

  function getOrderTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'purchase': '采购入库',
      'sales': '销售出库',
      'purchase-return': '采购退货'
    };
    return map[type] || type;
  }
</script>

<svelte:head>
  <title>采购退货 - 进销存管理系统</title>
</svelte:head>

<PageHeader title="采购退货" subtitle="管理采购退货，跟踪退货审批流程">
  {#snippet actions()}
    <button
      onclick={() => showCreateModal = true}
      class="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
    >
      <Plus class="w-4 h-4" />
      新建退货单
    </button>
  {/snippet}
</PageHeader>

<div class="space-y-4">
  <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
    <div class="flex gap-2 flex-wrap">
      {#each statusTabs as tab}
        <button
          onclick={() => { currentPage = 1; statusFilter = tab.value as ReturnStatus | ''; }}
          class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {statusFilter === tab.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>
    <div class="w-full sm:w-64">
      <SearchBar bind:value={searchQuery} placeholder="搜索退货单号/采购单号/供应商..." onchange={() => currentPage = 1} />
    </div>
  </div>

  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">退货单号</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">原采购单</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">供应商</th>
            <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">退货金额</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">创建时间</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3 w-40">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#if filteredReturns.length === 0}
            <tr><td colspan="7" class="text-center py-12 text-slate-400 text-sm">暂无退货单</td></tr>
          {:else}
            {#each pagedReturns as returnItem (returnItem.id)}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 text-sm font-medium text-brand-600">{returnItem.returnNo}</td>
                <td class="px-4 py-3 text-sm text-slate-600">{returnItem.purchaseOrderNo}</td>
                <td class="px-4 py-3 text-sm text-slate-700">{returnItem.supplierName}</td>
                <td class="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(returnItem.totalAmount)}</td>
                <td class="px-4 py-3 text-sm"><StatusBadge status={returnItem.status} /></td>
                <td class="px-4 py-3 text-sm text-slate-500">{formatDateTime(returnItem.createdAt)}</td>
                <td class="px-4 py-3 text-sm">
                  <div class="flex items-center gap-2">
                    {#if returnItem.status === 'pending'}
                      <button onclick={() => handleApprove(returnItem.id)} class="text-emerald-600 hover:text-emerald-700" title="审核通过"><Check class="w-4 h-4" /></button>
                      <button onclick={() => handleReject(returnItem.id)} class="text-red-600 hover:text-red-700" title="拒绝"><X class="w-4 h-4" /></button>
                    {/if}
                    {#if returnItem.status === 'approved'}
                      <button onclick={() => handleComplete(returnItem.id)} class="text-brand-600 hover:text-brand-700" title="完成退货"><PackageMinus class="w-4 h-4" /></button>
                    {/if}
                    <button onclick={() => goto(`/purchase-returns/${returnItem.id}`)} class="text-slate-400 hover:text-slate-600" title="详情"><Eye class="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
    <Pagination bind:page={currentPage} total={filteredReturns.length} pageSize={PAGE_SIZE} />
  </div>
</div>

<ConfirmDialog
  bind:open={confirmDialog}
  title={confirmAction?.action === 'approve' ? '审核通过退货单' : confirmAction?.action === 'reject' ? '拒绝退货单' : '确认退货完成'}
  message={confirmAction?.action === 'approve' ? '确定审核通过此退货单？库存将自动扣减，应付账款将自动调整。' : confirmAction?.action === 'reject' ? '确定拒绝此退货单？' : '确定此退货已完成？'}
  onconfirm={handleConfirm}
/>

{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10">
    <div class="absolute inset-0 bg-black/50" onclick={resetCreateModal}></div>
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">新建退货单</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">原采购单</label>
            <select
              bind:value={selectedPurchaseOrderId}
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value={0}>请选择已完成的采购单</option>
              {#each completedPurchaseOrders as order}
                <option value={order.id}>{order.orderNo} - {order.supplierName} ({formatCurrency(order.totalAmount)})</option>
              {/each}
            </select>
          </div>

          {#if selectedPurchaseOrderId > 0}
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">退货商品</label>
              {#if returnItems.every(i => i.maxQuantity === 0)}
                <p class="text-sm text-amber-600 p-3 bg-amber-50 rounded-lg">该采购单的商品已全部退货，无可退商品。</p>
              {:else}
                <div class="space-y-2">
                  {#each returnItems as item, i}
                    {#if item.maxQuantity > 0}
                      <div class="flex items-end gap-3 p-3 bg-slate-50 rounded-lg">
                        <div class="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onchange={(e) => updateReturnItem(i, 'selected', (e.target as HTMLInputElement).checked)}
                            class="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                          />
                        </div>
                        <div class="flex-1">
                          <p class="text-sm font-medium text-slate-700">{productStore.getById(item.productId)?.name}</p>
                          <p class="text-xs text-slate-500">可退数量：{item.maxQuantity}，单价：{formatCurrency(item.price)}</p>
                        </div>
                        <div class="w-24">
                          <label class="block text-xs text-slate-500 mb-1">退货数量</label>
                          <input
                            type="number"
                            value={item.quantity}
                            min="1"
                            max={item.maxQuantity}
                            disabled={!item.selected}
                            onchange={(e) => updateReturnItem(i, 'quantity', Math.min(item.maxQuantity, Math.max(1, Number((e.target as HTMLInputElement).value))))}
                            class="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>
                        <div class="w-24">
                          <label class="block text-xs text-slate-500 mb-1">小计</label>
                          <p class="py-1.5 text-sm font-medium text-slate-700">{formatCurrency(item.quantity * item.price)}</p>
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>
          {/if}

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">退货原因</label>
            <textarea
              bind:value={returnReason}
              rows="3"
              placeholder="请详细描述退货原因，如质量问题、商品损坏等..."
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-200">
            <p class="text-sm text-slate-500">
              预计退货金额：<span class="font-bold text-red-600">{formatCurrency(returnItems.filter(i => i.selected).reduce((s, i) => s + i.quantity * i.price, 0))}</span>
            </p>
            <div class="flex gap-3">
              <button onclick={resetCreateModal} class="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
              <button
                onclick={handleCreateReturn}
                disabled={selectedPurchaseOrderId === 0 || returnItems.filter(i => i.selected && i.quantity > 0).length === 0 || !returnReason.trim()}
                class="px-4 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交退货
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
