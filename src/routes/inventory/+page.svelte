<script lang="ts">
  import { productStore } from '$lib/stores/products.svelte';
  import { inventoryStore } from '$lib/stores/inventory.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { formatCurrency, formatDateTime } from '$lib/utils/format';
  import { Package, AlertTriangle, ArrowUpDown } from 'lucide-svelte';

  let activeTab = $state<'list' | 'alerts' | 'records'>('list');
  let searchQuery = $state('');
  let listPage = $state(1);
  let recordsPage = $state(1);
  const PAGE_SIZE = 10;

  const alertProducts = $derived(productStore.getAlertProducts());

  const filteredProducts = $derived(
    searchQuery ? productStore.search(searchQuery) : productStore.items
  );

  const filteredRecords = $derived(
    searchQuery ? inventoryStore.search(searchQuery) : inventoryStore.records
  );

  const pagedProducts = $derived(filteredProducts.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE));
  const pagedRecords = $derived(filteredRecords.slice((recordsPage - 1) * PAGE_SIZE, recordsPage * PAGE_SIZE));

  const tabs = [
    { value: 'list' as const, label: '库存列表', icon: Package },
    { value: 'alerts' as const, label: '库存预警', icon: AlertTriangle },
    { value: 'records' as const, label: '出入库记录', icon: ArrowUpDown }
  ];
</script>

<svelte:head>
  <title>库存管理 - 进销存管理系统</title>
</svelte:head>

<PageHeader title="库存管理" subtitle="查看商品库存，管理库存预警" />

<div class="space-y-4">
  <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
    <div class="flex gap-2 flex-wrap">
      {#each tabs as tab}
        <button
          onclick={() => { activeTab = tab.value; if (tab.value === 'list') listPage = 1; if (tab.value === 'records') recordsPage = 1; }}
          class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {activeTab === tab.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}"
        >
          <tab.icon class="w-4 h-4" />
          {tab.label}
          {#if tab.value === 'alerts' && alertProducts.length > 0}
            <span class="ml-1 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">{alertProducts.length}</span>
          {/if}
        </button>
      {/each}
    </div>
    <div class="w-full sm:w-64">
      <SearchBar bind:value={searchQuery} placeholder="搜索商品/记录..." onchange={() => { listPage = 1; recordsPage = 1; }} />
    </div>
  </div>

  {#if activeTab === 'list'}
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">商品名称</th>
              <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">SKU</th>
              <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">分类</th>
              <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">当前库存</th>
              <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">最低库存</th>
              <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">单位</th>
              <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each pagedProducts as product (product.id)}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 text-sm font-medium text-slate-800">{product.name}</td>
                <td class="px-4 py-3 text-sm text-slate-500 font-mono">{product.sku}</td>
                <td class="px-4 py-3 text-sm text-slate-600">{product.category}</td>
                <td class="px-4 py-3 text-sm text-right font-medium {product.stock <= product.minStock ? 'text-red-600' : 'text-slate-800'}">{product.stock}</td>
                <td class="px-4 py-3 text-sm text-right text-slate-500">{product.minStock}</td>
                <td class="px-4 py-3 text-sm text-slate-600">{product.unit}</td>
                <td class="px-4 py-3 text-sm">
                  {#if product.stock <= product.minStock}
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <AlertTriangle class="w-3 h-3" /> 预警
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">正常</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <Pagination bind:page={listPage} total={filteredProducts.length} pageSize={PAGE_SIZE} />
    </div>
  {:else if activeTab === 'alerts'}
    {#if alertProducts.length === 0}
      <div class="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Package class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p class="text-slate-400">暂无库存预警商品</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each alertProducts as product}
          <div class="bg-white rounded-xl border border-amber-200 p-4 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle class="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-slate-800">{product.name}</p>
                <p class="text-xs text-slate-500">{product.sku} · {product.category}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-red-600">{product.stock} <span class="text-xs font-normal text-slate-500">{product.unit}</span></p>
              <p class="text-xs text-slate-400">最低库存 {product.minStock} {product.unit}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {#if filteredRecords.length === 0}
        <div class="p-12 text-center">
          <ArrowUpDown class="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p class="text-slate-400">暂无出入库记录</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">类型</th>
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">商品</th>
                <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">数量</th>
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">关联订单</th>
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">时间</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each pagedRecords as record (record.id)}
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 text-sm">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {record.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                      {record.type === 'in' ? '入库' : '出库'}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm font-medium text-slate-800">{record.productName}</td>
                  <td class="px-4 py-3 text-sm text-right font-medium {record.type === 'in' ? 'text-emerald-600' : 'text-red-600'}">
                    {record.type === 'in' ? '+' : '-'}{record.quantity}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-600">{record.orderType === 'purchase' ? '采购' : '销售'}单 #{record.orderId}</td>
                  <td class="px-4 py-3 text-sm text-slate-500">{formatDateTime(record.createdAt)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <Pagination bind:page={recordsPage} total={filteredRecords.length} pageSize={PAGE_SIZE} />
      {/if}
    </div>
  {/if}
</div>
