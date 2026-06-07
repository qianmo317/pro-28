<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { stockTakeStore } from '$lib/stores/stockTake.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatDateTime, formatNumber } from '$lib/utils/format';
  import { getStatusLabel } from '$lib/utils/helpers';
  import {
    ArrowLeft,
    Plus,
    Trash2,
    CheckCircle,
    AlertTriangle,
    Settings,
    X,
    Package,
    ClipboardList
  } from 'lucide-svelte';

  const stockTakeId = $derived(Number($page.params.id));
  const stockTake = $derived(stockTakeStore.getById(stockTakeId));
  const isEditable = $derived(stockTake?.status === 'draft');
  const threshold = $derived(stockTakeStore.threshold);

  let productSearchQuery = $state('');
  let showProductPicker = $state(false);
  let showThresholdDialog = $state(false);
  let showConfirmDialog = $state(false);
  let tempRatio = $state(10);
  let tempAbsolute = $state(10);

  const availableProducts = $derived(
    stockTake
      ? stockTakeStore.getAvailableProducts(stockTakeId).filter(p => {
          if (!productSearchQuery) return true;
          const q = productSearchQuery.toLowerCase();
          return p.name.toLowerCase().includes(q) ||
                 p.sku.toLowerCase().includes(q) ||
                 p.category.toLowerCase().includes(q);
        })
      : []
  );

  const sortedItems = $derived(
    stockTake
      ? [...stockTake.items].sort((a, b) => {
          if (a.isHighlighted && !b.isHighlighted) return -1;
          if (!a.isHighlighted && b.isHighlighted) return 1;
          return a.productName.localeCompare(b.productName);
        })
      : []
  );

  const hasHighlights = $derived(stockTake?.highlightedCount && stockTake.highlightedCount > 0);

  function handleAddProduct(productId: number) {
    stockTakeStore.addProduct(stockTakeId, productId);
  }

  function handleAddAllProducts() {
    stockTakeStore.addAllProducts(stockTakeId);
    showProductPicker = false;
  }

  function handleRemoveItem(itemId: number) {
    stockTakeStore.removeItem(stockTakeId, itemId);
  }

  function handleActualStockChange(itemId: number, value: string) {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      stockTakeStore.updateActualStock(stockTakeId, itemId, num);
    }
  }

  function handleQuickAdjust(itemId: number, delta: number) {
    const item = stockTake?.items.find(i => i.id === itemId);
    if (item) {
      stockTakeStore.updateActualStock(stockTakeId, itemId, item.actualStock + delta);
    }
  }

  function openThresholdDialog() {
    tempRatio = threshold.ratio * 100;
    tempAbsolute = threshold.absolute;
    showThresholdDialog = true;
  }

  function handleSaveThreshold() {
    stockTakeStore.setThreshold({
      ratio: tempRatio / 100,
      absolute: tempAbsolute
    });
    showThresholdDialog = false;
  }

  function handleConfirmStockTake() {
    stockTakeStore.confirmStockTake(stockTakeId);
    showConfirmDialog = false;
  }

  function formatRatio(ratio: number): string {
    return (ratio * 100).toFixed(1) + '%';
  }

  $effect(() => {
    if (showThresholdDialog) {
      tempRatio = threshold.ratio * 100;
      tempAbsolute = threshold.absolute;
    }
  });
</script>

<svelte:head>
  <title>库存盘点详情 - 进销存管理系统</title>
</svelte:head>

{#if !stockTake}
  <div class="bg-white rounded-xl border border-slate-200 p-12 text-center">
    <ClipboardList class="w-12 h-12 text-slate-300 mx-auto mb-3" />
    <p class="text-slate-400">盘点单不存在</p>
    <button
      onclick={() => goto('/inventory')}
      class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      返回库存管理
    </button>
  </div>
{:else}
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <button
        onclick={() => goto('/inventory')}
        class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        title="返回"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div class="flex-1">
        <h1 class="text-lg font-semibold text-slate-800">{stockTake.title}</h1>
        <p class="text-sm text-slate-500">{stockTake.stockTakeNo}</p>
      </div>
      <StatusBadge status={stockTake.status} />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <p class="text-xs text-slate-500 mb-1">盘点商品</p>
        <p class="text-2xl font-bold text-slate-800">{stockTake.totalItems}</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <p class="text-xs text-slate-500 mb-1">差异总数</p>
        <p class="text-2xl font-bold {stockTake.totalDifference > 0 ? 'text-emerald-600' : stockTake.totalDifference < 0 ? 'text-red-600' : 'text-slate-800'}">
          {stockTake.totalDifference > 0 ? '+' : ''}{stockTake.totalDifference}
        </p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <p class="text-xs text-slate-500 mb-1">需复核商品</p>
        <p class="text-2xl font-bold {hasHighlights ? 'text-red-600' : 'text-slate-800'}">
          {stockTake.highlightedCount}
        </p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <p class="text-xs text-slate-500 mb-1">创建时间</p>
        <p class="text-sm font-medium text-slate-800">{formatDateTime(stockTake.createdAt)}</p>
      </div>
    </div>

    {#if stockTake.status === 'confirmed'}
      <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <CheckCircle class="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm font-medium text-purple-800">此盘点单已确认</p>
            <p class="text-xs text-purple-600 mt-1">
              确认人：{stockTake.confirmedBy} · 确认时间：{formatDateTime(stockTake.confirmedAt!)}
            </p>
          </div>
        </div>
      </div>
    {/if}

    {#if hasHighlights && isEditable}
      <div class="bg-red-50 border border-red-200 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm font-medium text-red-800">发现 {stockTake.highlightedCount} 个商品差异超过阈值</p>
            <p class="text-xs text-red-600 mt-1">
              当前阈值：差异比例 > {formatRatio(threshold.ratio)} 或 绝对差异 > {threshold.absolute}
            </p>
          </div>
        </div>
      </div>
    {/if}

    {#if stockTake.remark}
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <p class="text-xs text-slate-500 mb-1">备注</p>
        <p class="text-sm text-slate-700">{stockTake.remark}</p>
      </div>
    {/if}

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 border-b border-slate-200">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold text-slate-800">盘点明细</h3>
          {#if isEditable}
            <span class="text-xs text-slate-500">
              (阈值：{formatRatio(threshold.ratio)} / {threshold.absolute})
            </span>
          {/if}
        </div>
        <div class="flex items-center gap-2">
          {#if isEditable}
            <button
              onclick={openThresholdDialog}
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Settings class="w-3.5 h-3.5" />
              阈值设置
            </button>
            <button
              onclick={() => showProductPicker = true}
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Plus class="w-4 h-4" />
              添加商品
            </button>
          {/if}
        </div>
      </div>

      {#if sortedItems.length === 0}
        <div class="p-12 text-center">
          <Package class="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p class="text-slate-400">暂无盘点商品</p>
          {#if isEditable}
            <button
              onclick={() => showProductPicker = true}
              class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Plus class="w-4 h-4" />
              添加商品开始盘点
            </button>
          {/if}
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">商品信息</th>
                <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">系统库存</th>
                <th class="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">实际盘点</th>
                <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">差异数量</th>
                <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">差异比例</th>
                {#if isEditable}
                  <th class="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">操作</th>
                {/if}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each sortedItems as item (item.id)}
                <tr class="transition-colors {item.isHighlighted ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'}">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      {#if item.isHighlighted}
                        <AlertTriangle class="w-4 h-4 text-red-500 shrink-0" />
                      {/if}
                      <div>
                        <p class="text-sm font-medium text-slate-800">{item.productName}</p>
                        <p class="text-xs text-slate-500 font-mono">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-right font-medium text-slate-600">
                    {item.systemStock} <span class="text-slate-400 font-normal">{item.unit}</span>
                  </td>
                  <td class="px-4 py-3">
                    {#if isEditable}
                      <div class="flex items-center justify-center gap-1">
                        <button
                          onclick={() => handleQuickAdjust(item.id, -1)}
                          class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.actualStock}
                          oninput={(e) => handleActualStockChange(item.id, (e.target as HTMLInputElement).value)}
                          class="w-20 px-2 py-1.5 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent {item.isHighlighted ? 'border-red-300 focus:ring-red-500' : ''}"
                        />
                        <button
                          onclick={() => handleQuickAdjust(item.id, 1)}
                          class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        >
                          +
                        </button>
                      </div>
                    {:else}
                      <p class="text-sm text-center font-medium text-slate-800">
                        {item.actualStock} <span class="text-slate-400 font-normal">{item.unit}</span>
                      </p>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-sm text-right font-medium {item.difference > 0 ? 'text-emerald-600' : item.difference < 0 ? 'text-red-600' : 'text-slate-600'}">
                    {item.difference > 0 ? '+' : ''}{item.difference}
                  </td>
                  <td class="px-4 py-3 text-sm text-right font-medium {item.differenceRatio > threshold.ratio ? 'text-red-600' : 'text-slate-600'}">
                    {formatRatio(item.differenceRatio)}
                  </td>
                  {#if isEditable}
                    <td class="px-4 py-3 text-center">
                      <button
                        onclick={() => handleRemoveItem(item.id)}
                        class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="移除"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    {#if isEditable && sortedItems.length > 0}
      <div class="flex items-center justify-end gap-3">
        <button
          onclick={() => goto('/inventory')}
          class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          保存草稿
        </button>
        <button
          onclick={() => showConfirmDialog = true}
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
        >
          <CheckCircle class="w-4 h-4" />
          确认盘点结果
        </button>
      </div>
    {/if}
  </div>
{/if}

{#if showProductPicker && stockTake}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" onclick={() => showProductPicker = false}></div>
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 class="text-lg font-semibold text-slate-800">选择商品</h3>
        <button onclick={() => showProductPicker = false} class="text-slate-400 hover:text-slate-600">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="p-4 border-b border-slate-200">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <SearchBar bind:value={productSearchQuery} placeholder="搜索商品名称/SKU/分类..." />
          </div>
          {#if availableProducts.length > 0}
            <button
              onclick={handleAddAllProducts}
              class="px-3 py-1.5 text-sm font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors whitespace-nowrap"
            >
              全部添加
            </button>
          {/if}
        </div>
      </div>
      <div class="flex-1 overflow-y-auto">
        {#if availableProducts.length === 0}
          <div class="p-8 text-center">
            <Package class="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p class="text-sm text-slate-400">
              {productSearchQuery ? '未找到匹配的商品' : '所有商品已添加到盘点单'}
            </p>
          </div>
        {:else}
          <div class="divide-y divide-slate-100">
            {#each availableProducts as product (product.id)}
              <div class="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                <div>
                  <p class="text-sm font-medium text-slate-800">{product.name}</p>
                  <p class="text-xs text-slate-500">
                    <span class="font-mono">{product.sku}</span>
                    <span class="mx-1">·</span>
                    <span>{product.category}</span>
                    <span class="mx-1">·</span>
                    <span>库存: {product.stock} {product.unit}</span>
                  </p>
                </div>
                <button
                  onclick={() => handleAddProduct(product.id)}
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  <Plus class="w-3.5 h-3.5" />
                  添加
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      <div class="p-4 border-t border-slate-200 flex justify-end">
        <button
          onclick={() => showProductPicker = false}
          class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
{/if}

<ConfirmDialog
  bind:open={showThresholdDialog}
  title="差异阈值设置"
  message=""
  confirmText="保存设置"
  onconfirm={handleSaveThreshold}
>
  <div class="space-y-4 mb-4">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1">差异比例阈值 (%)</label>
      <input
        bind:value={tempRatio}
        type="number"
        min="0"
        max="100"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
      <p class="text-xs text-slate-500 mt-1">当差异比例超过此值时，标红提醒复核</p>
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1">绝对差异阈值</label>
      <input
        bind:value={tempAbsolute}
        type="number"
        min="0"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
      <p class="text-xs text-slate-500 mt-1">当绝对差异数量超过此值时，标红提醒复核</p>
    </div>
  </div>
</ConfirmDialog>

<ConfirmDialog
  bind:open={showConfirmDialog}
  title="确认盘点结果"
  message={hasHighlights
    ? `当前有 ${stockTake?.highlightedCount} 个商品差异超过阈值，确认后系统将自动更新库存并生成盘点差异记录。请确保已复核所有标红商品。`
    : '确认后系统将自动更新库存并生成盘点差异记录，此操作不可撤销。'}
  confirmText="确认盘点"
  onconfirm={handleConfirmStockTake}
/>
