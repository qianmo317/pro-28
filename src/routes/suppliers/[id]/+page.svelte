<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { supplierStore } from '$lib/stores/suppliers.svelte';
  import { purchaseOrderStore } from '$lib/stores/purchaseOrders.svelte';
  import { financeStore } from '$lib/stores/finance.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ChartWrapper from '$lib/components/ChartWrapper.svelte';
  import { formatCurrency, formatDateTime, formatDate } from '$lib/utils/format';
  import { getStatusLabel } from '$lib/utils/helpers';
  import { ArrowLeft, Building2, Phone, Mail, MapPin, CreditCard, ShoppingCart, DollarSign, Clock, AlertTriangle, CheckCircle, XCircle, Calendar, TrendingUp, AlertCircle, Star } from 'lucide-svelte';
  import type { OrderStatus } from '$lib/types';

  const supplierId = $derived(Number($page.params.id));
  const supplier = $derived(supplierStore.getById(supplierId));
  const supplierOrders = $derived(purchaseOrderStore.items.filter(o => o.supplierId === supplierId));
  const supplierPayables = $derived(
    financeStore.payables.filter(p =>
      p.relatedId && supplierOrders.some(o => o.id === p.relatedId)
    )
  );

  const totalOrders = $derived(supplierOrders.length);
  const totalPurchased = $derived(
    supplierOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0)
  );
  const totalPayable = $derived(
    supplierPayables.reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0)
  );
  const lastTransaction = $derived(
    supplierOrders.length > 0
      ? supplierOrders.reduce((latest, o) => (o.createdAt > latest.createdAt ? o : latest)).createdAt
      : null
  );

  const orderStatusDistribution = $derived(() => {
    const counts: Record<OrderStatus, number> = { pending: 0, approved: 0, completed: 0, cancelled: 0 };
    supplierOrders.forEach(o => {
      counts[o.status]++;
    });
    return counts;
  });

  const statusChartData = $derived(() => {
    const dist = orderStatusDistribution();
    return {
      labels: ['待审核', '已审核', '已完成', '已取消'],
      datasets: [{
        data: [dist.pending, dist.approved, dist.completed, dist.cancelled],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
        borderWidth: 0
      }]
    };
  });

  const purchaseTrendData = $derived(() => {
    const monthlyData: Record<string, number> = {};
    supplierOrders.forEach(o => {
      if (o.status === 'completed') {
        const month = o.createdAt.substring(0, 7);
        monthlyData[month] = (monthlyData[month] || 0) + o.totalAmount;
      }
    });
    const sortedMonths = Object.keys(monthlyData).sort();
    let cumulative = 0;
    const cumulativeData = sortedMonths.map(month => {
      cumulative += monthlyData[month];
      return cumulative;
    });
    return {
      labels: sortedMonths.map(m => m.replace('-', '年') + '月'),
      datasets: [{
        label: '累计采购金额',
        data: cumulativeData,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4
      }]
    };
  });

  const pendingPayables = $derived(
    supplierPayables
      .filter(p => p.status !== 'completed')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );

  const purchaseFrequency = $derived(() => {
    if (supplierOrders.length === 0) return { avgDays: 0, count: 0 };
    const completedOrders = supplierOrders
      .filter(o => o.status === 'completed')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (completedOrders.length < 2) return { avgDays: 0, count: completedOrders.length };

    let totalDays = 0;
    for (let i = 1; i < completedOrders.length; i++) {
      const prev = new Date(completedOrders[i - 1].createdAt).getTime();
      const curr = new Date(completedOrders[i].createdAt).getTime();
      totalDays += (curr - prev) / (1000 * 60 * 60 * 24);
    }
    return {
      avgDays: Math.round(totalDays / (completedOrders.length - 1)),
      count: completedOrders.length
    };
  });

  function getSettlementDays(settlementMethod: string): number {
    const match = settlementMethod.match(/月结(\d+)天/);
    if (match) return parseInt(match[1]);
    if (settlementMethod === '货到付款') return 0;
    if (settlementMethod === '预付全款') return -1;
    return 30;
  }

  function getDueDate(createdAt: string, settlementMethod: string): string | null {
    const days = getSettlementDays(settlementMethod);
    if (days < 0) return null;
    const date = new Date(createdAt);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  function getDaysUntilDue(dueDate: string | null): number | null {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function getDueStatus(daysUntilDue: number | null): { label: string; color: string; bgColor: string; urgent: boolean } {
    if (daysUntilDue === null) return { label: '已预付', color: 'text-purple-600', bgColor: 'bg-purple-100', urgent: false };
    if (daysUntilDue < 0) return { label: `已逾期${Math.abs(daysUntilDue)}天`, color: 'text-red-600', bgColor: 'bg-red-100', urgent: true };
    if (daysUntilDue <= 7) return { label: `${daysUntilDue}天后到期`, color: 'text-red-600', bgColor: 'bg-red-100', urgent: true };
    if (daysUntilDue <= 15) return { label: `${daysUntilDue}天后到期`, color: 'text-amber-600', bgColor: 'bg-amber-100', urgent: false };
    if (daysUntilDue <= 30) return { label: `${daysUntilDue}天后到期`, color: 'text-blue-600', bgColor: 'bg-blue-100', urgent: false };
    return { label: `${daysUntilDue}天后到期`, color: 'text-slate-600', bgColor: 'bg-slate-100', urgent: false };
  }

  function getStatusDotColor(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-500',
      approved: 'bg-blue-500',
      completed: 'bg-emerald-500',
      cancelled: 'bg-red-500'
    };
    return map[status] || 'bg-gray-500';
  }

  function getPaymentStatusIcon(status: string) {
    if (status === 'completed') return CheckCircle;
    if (status === 'partial') return Clock;
    return AlertTriangle;
  }

  function getPaymentStatusColor(status: string): string {
    const map: Record<string, string> = {
      completed: 'text-emerald-600',
      partial: 'text-amber-600',
      pending: 'text-red-600'
    };
    return map[status] || 'text-gray-600';
  }

  const corePartnerThreshold = 50000;
  const isCorePartner = $derived(totalPurchased >= corePartnerThreshold && supplier?.status === 'active');
</script>

<svelte:head>
  <title>供应商详情 - 进销存管理系统</title>
</svelte:head>

{#if supplier}
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button onclick={() => goto('/suppliers')} class="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft class="w-5 h-5" /></button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-slate-800">{supplier.name}</h1>
            {#if isCorePartner}
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Star class="w-3 h-3" />
                核心合作伙伴
              </span>
            {/if}
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              <Calendar class="w-3 h-3" />
              {supplier.settlementMethod}
            </span>
            <StatusBadge status={supplier.status} />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="累计采购金额" value={formatCurrency(totalPurchased)} color="blue">
        {#snippet icon()}
          <DollarSign class="w-5 h-5" />
        {/snippet}
        {#snippet subtext()}
          <p class="text-xs text-slate-400">
            {#if isCorePartner}
              <span class="text-amber-600">★ 核心供应商</span>
            {:else if totalPurchased > 0}
              距核心供应商还差 {formatCurrency(corePartnerThreshold - totalPurchased)}
            {/if}
          </p>
        {/snippet}
      </StatCard>
      <StatCard title="订单总数" value={totalOrders} color="green">
        {#snippet icon()}
          <ShoppingCart class="w-5 h-5" />
        {/snippet}
        {#snippet subtext()}
          <p class="text-xs text-slate-400">
            已完成 {supplierOrders.filter(o => o.status === 'completed').length} 笔
          </p>
        {/snippet}
      </StatCard>
      <StatCard title="应付账款" value={formatCurrency(totalPayable)} color={totalPayable > 0 ? 'amber' : 'green'}>
        {#snippet icon()}
          <CreditCard class="w-5 h-5" />
        {/snippet}
        {#snippet subtext()}
          <p class="text-xs text-slate-400">
            {pendingPayables.length} 笔未结清
            {#if pendingPayables.some(p => {
              const dueDate = getDueDate(p.createdAt, supplier.settlementMethod);
              const days = getDaysUntilDue(dueDate);
              return days !== null && days <= 7;
            })}
              <span class="text-red-500 ml-1">· 有即将到期款项</span>
            {/if}
          </p>
        {/snippet}
      </StatCard>
      <StatCard title="采购频次" value={purchaseFrequency().count > 0 ? `约${purchaseFrequency().avgDays || '-'}天/次` : '暂无'} color="purple">
        {#snippet icon()}
          <TrendingUp class="w-5 h-5" />
        {/snippet}
        {#snippet subtext()}
          <p class="text-xs text-slate-400">
            最近交易: {lastTransaction ? formatDate(lastTransaction) : '暂无'}
          </p>
        {/snippet}
      </StatCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-4">基本资料</h3>
        <dl class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Building2 class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">联系人</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{supplier.contact}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Phone class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">联系电话</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{supplier.phone}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Mail class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">电子邮箱</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{supplier.email || '-'}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <MapPin class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">联系地址</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{supplier.address || '-'}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Calendar class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">结算方式</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{supplier.settlementMethod}</dd>
            </div>
          </div>
        </dl>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-4">订单状态分布</h3>
        {#if supplierOrders.length > 0}
          <ChartWrapper type="doughnut" data={statusChartData()} height={240} options={{
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 15,
                  usePointStyle: true
                }
              }
            }
          }} />
        {:else}
          <div class="text-center py-12">
            <ShoppingCart class="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p class="text-sm text-slate-600">暂无订单数据</p>
          </div>
        {/if}
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-4">应付账款概要</h3>
        {#if pendingPayables.length > 0}
          <div class="space-y-3">
            {#each pendingPayables.slice(0, 3) as payment}
              {@const dueDate = getDueDate(payment.createdAt, supplier.settlementMethod)}
              {@const daysUntilDue = getDaysUntilDue(dueDate)}
              {@const dueStatus = getDueStatus(daysUntilDue)}
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class={`w-8 h-8 rounded-lg flex items-center justify-center ${dueStatus.urgent ? 'bg-red-100' : payment.status === 'partial' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                    {#if dueStatus.urgent}
                      <AlertCircle class={`w-4 h-4 ${dueStatus.color}`} />
                    {:else if payment.status === 'completed'}
                      <CheckCircle class={`w-4 h-4 ${getPaymentStatusColor(payment.status)}`} />
                    {:else if payment.status === 'partial'}
                      <Clock class={`w-4 h-4 ${getPaymentStatusColor(payment.status)}`} />
                    {:else}
                      <AlertTriangle class={`w-4 h-4 ${getPaymentStatusColor(payment.status)}`} />
                    {/if}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-800">{payment.relatedName}</p>
                    <p class="text-xs text-slate-500">{formatDate(payment.createdAt)}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-red-600">{formatCurrency(payment.totalAmount - payment.paidAmount)}</p>
                  <p class={`text-xs ${dueStatus.color}`}>{dueStatus.label}</p>
                </div>
              </div>
            {/each}
            {#if pendingPayables.length > 3}
              <p class="text-center text-sm text-slate-400">还有 {pendingPayables.length - 3} 笔未结清</p>
            {/if}
          </div>
        {:else}
          <div class="text-center py-8">
            <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle class="w-6 h-6 text-emerald-600" />
            </div>
            <p class="text-sm text-slate-600">所有款项已结清</p>
            <p class="text-xs text-slate-400 mt-1">暂无应付账款</p>
          </div>
        {/if}
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">累计采购趋势</h3>
      {#if supplierOrders.filter(o => o.status === 'completed').length > 0}
        <ChartWrapper type="line" data={purchaseTrendData()} height={280} options={{
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: number) => '¥' + (value / 1000) + 'k'
              }
            }
          }
        }} />
      {:else}
        <div class="text-center py-12">
          <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <TrendingUp class="w-6 h-6 text-slate-400" />
          </div>
          <p class="text-sm text-slate-600">暂无完成的订单</p>
          <p class="text-xs text-slate-400 mt-1">完成订单后将显示采购趋势</p>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200">
          <h3 class="text-sm font-semibold text-slate-800">历史采购订单</h3>
        </div>
        {#if supplierOrders.length > 0}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">订单号</th>
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">日期</th>
                  <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">金额</th>
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each supplierOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as order (order.id)}
                  <tr class="hover:bg-slate-50 transition-colors cursor-pointer" onclick={() => goto(`/purchase/${order.id}`)}>
                    <td class="px-4 py-3 text-sm font-medium text-brand-600">{order.orderNo}</td>
                    <td class="px-4 py-3 text-sm text-slate-600">{formatDate(order.createdAt)}</td>
                    <td class="px-4 py-3 text-sm text-right font-medium text-slate-800">{formatCurrency(order.totalAmount)}</td>
                    <td class="px-4 py-3 text-sm"><StatusBadge status={order.status} /></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="text-center py-12">
            <ShoppingCart class="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p class="text-sm text-slate-600">暂无采购订单</p>
          </div>
        {/if}
      </div>

      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200">
          <h3 class="text-sm font-semibold text-slate-800">最近交易记录</h3>
        </div>
        {#if supplierOrders.length > 0}
          <div class="divide-y divide-slate-100">
            {#each [...supplierOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5) as transaction (transaction.id)}
              <div class="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer" onclick={() => goto(`/purchase/${transaction.id}`)}>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ShoppingCart class="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-800">{transaction.orderNo}</p>
                    <p class="text-xs text-slate-500">{formatDateTime(transaction.createdAt)}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-slate-800">{formatCurrency(transaction.totalAmount)}</p>
                  <div class="flex items-center gap-1 justify-end">
                    <span class={`w-2 h-2 rounded-full ${getStatusDotColor(transaction.status)}`}></span>
                    <span class="text-xs text-slate-500">{getStatusLabel(transaction.status)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-12">
            <Clock class="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p class="text-sm text-slate-600">暂无交易记录</p>
          </div>
        {/if}
      </div>
    </div>

    {#if pendingPayables.length > 0}
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-800">未结清应付账款</h3>
            {#if pendingPayables.some(p => {
              const dueDate = getDueDate(p.createdAt, supplier.settlementMethod);
              const days = getDaysUntilDue(dueDate);
              return days !== null && days <= 7;
            })}
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertTriangle class="w-3 h-3" />
                有即将到期款项
              </span>
            {/if}
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">关联订单</th>
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">创建时间</th>
                <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">应付金额</th>
                <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">已付金额</th>
                <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">待付金额</th>
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">到期时间</th>
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each pendingPayables as payment (payment.id)}
                {@const dueDate = getDueDate(payment.createdAt, supplier.settlementMethod)}
                {@const daysUntilDue = getDaysUntilDue(dueDate)}
                {@const dueStatus = getDueStatus(daysUntilDue)}
                <tr class="hover:bg-slate-50 transition-colors {dueStatus.urgent ? 'bg-red-50/50' : ''}">
                  <td class="px-4 py-3 text-sm font-medium text-brand-600 cursor-pointer" onclick={() => {
                    const order = supplierOrders.find(o => o.id === payment.relatedId);
                    if (order) goto(`/purchase/${order.id}`);
                  }}>{payment.relatedName}</td>
                  <td class="px-4 py-3 text-sm text-slate-600">{formatDateTime(payment.createdAt)}</td>
                  <td class="px-4 py-3 text-sm text-right text-slate-800">{formatCurrency(payment.totalAmount)}</td>
                  <td class="px-4 py-3 text-sm text-right text-emerald-600">{formatCurrency(payment.paidAmount)}</td>
                  <td class="px-4 py-3 text-sm text-right font-semibold text-red-600">{formatCurrency(payment.totalAmount - payment.paidAmount)}</td>
                  <td class="px-4 py-3 text-sm">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {dueStatus.bgColor} {dueStatus.color}">
                      {#if dueStatus.urgent}
                        <AlertCircle class="w-3 h-3" />
                      {/if}
                      {dueDate ? formatDate(dueDate) : '-'}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {
                      payment.status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }">
                      {#if payment.status === 'completed'}
                        <CheckCircle class="w-3 h-3" />
                      {:else if payment.status === 'partial'}
                        <Clock class="w-3 h-3" />
                      {:else}
                        <AlertTriangle class="w-3 h-3" />
                      {/if}
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr class="bg-slate-50">
                <td colspan="4" class="px-4 py-3 text-sm font-semibold text-slate-800 text-right">合计待付</td>
                <td class="px-4 py-3 text-sm font-bold text-red-600 text-right">{formatCurrency(totalPayable)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="text-center py-20">
    <XCircle class="w-16 h-16 text-slate-300 mx-auto mb-4" />
    <p class="text-slate-500">未找到该供应商</p>
    <button onclick={() => goto('/suppliers')} class="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium">返回供应商管理</button>
  </div>
{/if}
