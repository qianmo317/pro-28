<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.svelte';
  import { productStore } from '$lib/stores/products.svelte';
  import { salesOrderStore } from '$lib/stores/salesOrders.svelte';
  import { purchaseOrderStore } from '$lib/stores/purchaseOrders.svelte';
  import { financeStore } from '$lib/stores/finance.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import ChartWrapper from '$lib/components/ChartWrapper.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/format';
  import { DollarSign, ShoppingCart, AlertTriangle, FileText, TrendingUp, Package, Plus, AlertCircle } from 'lucide-svelte';
  import type { AlertUrgency } from '$lib/types';

  $effect(() => {
    if (!authStore.isLoggedIn) {
      goto('/login');
    }
  });

  const alertProducts = $derived(productStore.getAlertProductsWithDetails());
  const urgentAlertCount = $derived(productStore.getUrgentAlertCount());
  const criticalAlertCount = $derived(productStore.getCriticalAlerts().length);
  const isAdmin = $derived(authStore.currentUser?.role === 'admin');
  const pendingPayables = $derived(financeStore.pendingPayables);
  const pendingReceivables = $derived(financeStore.pendingReceivables);

  function getUrgencyLabel(urgency: AlertUrgency): string {
    const map = { critical: '严重超期', warning: '超期未处理', normal: '预警' };
    return map[urgency];
  }

  function getUrgencyClass(urgency: AlertUrgency): string {
    if (urgency === 'critical') return 'bg-red-50 border-red-200';
    if (urgency === 'warning') return 'bg-amber-50 border-amber-200';
    return 'bg-slate-50 border-slate-200';
  }

  function getUrgencyBadgeClass(urgency: AlertUrgency): string {
    if (urgency === 'critical') return 'bg-red-100 text-red-700';
    if (urgency === 'warning') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  }

  function handleReplenish(productId: number) {
    goto(`/purchase?productId=${productId}`);
  }

  const todaySales = $derived(
    salesOrderStore.items
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0)
  );

  const todayPurchase = $derived(
    purchaseOrderStore.items
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0)
  );

  const pendingPaymentCount = $derived(
    financeStore.items.filter(p => p.status !== 'completed').length
  );

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const salesChartData = {
    labels: last7Days,
    datasets: [{
      label: '销售额',
      data: [15855, 0, 12120, 0, 20570, 8470, 6495],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const purchaseChartData = {
    labels: last7Days,
    datasets: [{
      label: '采购额',
      data: [19000, 20300, 5700, 0, 15900, 0, 2400],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };
</script>

<svelte:head>
  <title>仪表盘 - 进销存管理系统</title>
</svelte:head>

{#if authStore.isLoggedIn}
  <div class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="销售总额" value={formatCurrency(todaySales)} color="blue">
        {#snippet icon()}<DollarSign class="w-5 h-5" />{/snippet}
      </StatCard>
      <StatCard title="采购总额" value={formatCurrency(todayPurchase)} color="green">
        {#snippet icon()}<ShoppingCart class="w-5 h-5" />{/snippet}
      </StatCard>
      <StatCard title="库存预警" value={alertProducts.length} color={criticalAlertCount > 0 ? "red" : urgentAlertCount > 0 ? "amber" : "amber"}>
        {#snippet icon()}
          {#if criticalAlertCount > 0}
            <AlertCircle class="w-5 h-5" />
          {:else}
            <AlertTriangle class="w-5 h-5" />
          {/if}
        {/snippet}
        {#snippet subtext()}
          {#if urgentAlertCount > 0}
            <span class="text-xs {criticalAlertCount > 0 ? 'text-red-600' : 'text-amber-600'} font-medium">
              {criticalAlertCount > 0 ? `${criticalAlertCount} 个严重超期` : `${urgentAlertCount} 个超期未处理`}
            </span>
          {/if}
        {/snippet}
      </StatCard>
      <StatCard title="待对账" value={pendingPaymentCount} color="red">
        {#snippet icon()}<FileText class="w-5 h-5" />{/snippet}
      </StatCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-800">销售趋势</h3>
          <TrendingUp class="w-4 h-4 text-slate-400" />
        </div>
        <ChartWrapper type="line" data={salesChartData} height={250} />
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-800">采购趋势</h3>
          <ShoppingCart class="w-4 h-4 text-slate-400" />
        </div>
        <ChartWrapper type="line" data={purchaseChartData} height={250} />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-slate-800">库存预警</h3>
            {#if isAdmin && urgentAlertCount > 0}
              <span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                {urgentAlertCount} 个超期未处理
              </span>
            {/if}
          </div>
          <Package class="w-4 h-4 text-slate-400" />
        </div>
        {#if alertProducts.length === 0}
          <p class="text-sm text-slate-400 py-8 text-center">暂无预警商品</p>
        {:else}
          <div class="space-y-3">
            {#each alertProducts as product (product.id)}
              <div class="p-3 rounded-lg border {getUrgencyClass(product.urgency)}">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <p class="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                      <span class="shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded {getUrgencyBadgeClass(product.urgency)}">
                        {getUrgencyLabel(product.urgency)}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 mt-0.5">{product.sku} · {product.category}</p>
                    <div class="flex items-center gap-4 mt-2">
                      <div>
                        <p class="text-xs text-slate-400">当前库存</p>
                        <p class="text-sm font-bold {product.urgency === 'critical' ? 'text-red-600' : product.urgency === 'warning' ? 'text-amber-600' : 'text-slate-700'}">
                          {product.stock} {product.unit}
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-slate-400">最低库存</p>
                        <p class="text-sm font-medium text-slate-600">{product.minStock} {product.unit}</p>
                      </div>
                      {#if product.daysBelowMin > 0}
                        <div>
                          <p class="text-xs text-slate-400">超期天数</p>
                          <p class="text-sm font-bold {product.urgency === 'critical' ? 'text-red-600' : 'text-amber-600'}">
                            {product.daysBelowMin} 天
                          </p>
                        </div>
                      {/if}
                      {#if product.hasRecentReplenishment}
                        <div>
                          <p class="text-xs text-slate-400">补货状态</p>
                          <p class="text-sm font-medium text-emerald-600">近期已补货</p>
                        </div>
                      {/if}
                    </div>
                  </div>
                  <button
                    onclick={() => handleReplenish(product.id)}
                    class="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    补货
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-800">待对账款项</h3>
          <FileText class="w-4 h-4 text-slate-400" />
        </div>
        {#if pendingPayables.length === 0 && pendingReceivables.length === 0}
          <p class="text-sm text-slate-400 py-8 text-center">暂无待对账款项</p>
        {:else}
          <div class="space-y-3">
            {#each pendingPayables.slice(0, 3) as payment}
              <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p class="text-sm font-medium text-slate-800">{payment.relatedName}</p>
                  <p class="text-xs text-slate-500">应付 · {formatDate(payment.createdAt)}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-red-600">{formatCurrency(payment.totalAmount - payment.paidAmount)}</p>
                  <StatusBadge status={payment.status} />
                </div>
              </div>
            {/each}
            {#each pendingReceivables.slice(0, 3) as payment}
              <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <p class="text-sm font-medium text-slate-800">{payment.relatedName}</p>
                  <p class="text-xs text-slate-500">应收 · {formatDate(payment.createdAt)}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-blue-600">{formatCurrency(payment.totalAmount - payment.paidAmount)}</p>
                  <StatusBadge status={payment.status} />
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
