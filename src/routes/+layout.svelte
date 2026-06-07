<script lang="ts">
  import '../app.css';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { productStore } from '$lib/stores/products.svelte';
  import ToastContainer from '$lib/components/ToastContainer.svelte';
  import {
    LayoutDashboard,
    ShoppingCart,
    TrendingUp,
    Package,
    Truck,
    Users,
    FileText,
    BarChart3,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    RefreshCw,
    FolderOpen,
    Bell,
    AlertTriangle,
    AlertCircle,
    Plus
  } from 'lucide-svelte';
  import type { Snippet } from 'svelte';
  import type { ProductAlert, AlertUrgency } from '$lib/types';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  let sidebarCollapsed = $state(false);
  let mobileMenuOpen = $state(false);
  let alertPanelOpen = $state(false);

  const urgentAlerts = $derived(productStore.getUrgentAlerts());
  const criticalAlerts = $derived(productStore.getCriticalAlerts());
  const urgentCount = $derived(urgentAlerts.length);
  const hasCritical = $derived(criticalAlerts.length > 0);

  const navItems = [
    { href: '/', label: '仪表盘', icon: LayoutDashboard },
    { href: '/purchase', label: '采购管理', icon: ShoppingCart },
    { href: '/purchase-returns', label: '采购退货', icon: RefreshCw },
    { href: '/sales', label: '销售管理', icon: TrendingUp },
    { href: '/inventory', label: '库存管理', icon: Package },
    { href: '/categories', label: '商品分类', icon: FolderOpen },
    { href: '/suppliers', label: '供应商管理', icon: Truck },
    { href: '/customers', label: '客户管理', icon: Users },
    { href: '/finance', label: '财务对账', icon: FileText },
    { href: '/reports', label: '报表分析', icon: BarChart3 }
  ];

  function isActive(href: string): boolean {
    const pathname = $page.url.pathname;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  function handleLogout() {
    authStore.logout();
    goto('/login');
  }

  function getUrgencyClass(urgency: AlertUrgency) {
    return urgency === 'critical'
      ? 'bg-red-50 border-red-200 text-red-700'
      : 'bg-amber-50 border-amber-200 text-amber-700';
  }

  function handleReplenish(productId: number) {
    alertPanelOpen = false;
    goto(`/purchase?productId=${productId}`);
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.alert-panel-container')) {
      alertPanelOpen = false;
    }
  }

  $effect(() => {
    if (alertPanelOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

{#if !authStore.isLoggedIn}
  <div class="min-h-screen bg-slate-50">
    {@render children()}
  </div>
{:else}
  <div class="min-h-screen bg-slate-50 flex">
    <aside
      class="hidden lg:flex flex-col bg-sidebar text-white transition-all duration-300 {sidebarCollapsed ? 'w-16' : 'w-60'}"
    >
      <div class="flex items-center {sidebarCollapsed ? 'justify-center' : 'justify-between'} h-16 px-4 border-b border-white/10">
        {#if !sidebarCollapsed}
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Package class="w-4 h-4 text-white" />
            </div>
            <span class="font-bold text-sm">ERP Lite</span>
          </div>
        {/if}
        <button
          onclick={() => sidebarCollapsed = !sidebarCollapsed}
          class="p-1.5 rounded-lg hover:bg-sidebar-hover transition-colors"
        >
          <ChevronLeft class="w-4 h-4 transition-transform {sidebarCollapsed ? 'rotate-180' : ''}" />
        </button>
      </div>

      <nav class="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {#each navItems as item}
          <a
            href={item.href}
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive(item.href) ? 'bg-sidebar-active text-white' : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'} {sidebarCollapsed ? 'justify-center' : ''}"
          >
            <item.icon class="w-5 h-5 shrink-0" />
            {#if !sidebarCollapsed}
              <span>{item.label}</span>
            {/if}
          </a>
        {/each}
      </nav>

      <div class="p-2 border-t border-white/10">
        <button
          onclick={handleLogout}
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-sidebar-hover hover:text-white transition-colors w-full {sidebarCollapsed ? 'justify-center' : ''}"
        >
          <LogOut class="w-5 h-5 shrink-0" />
          {#if !sidebarCollapsed}
            <span>退出登录</span>
          {/if}
        </button>
      </div>
    </aside>

    {#if mobileMenuOpen}
      <div class="lg:hidden fixed inset-0 z-40">
        <div class="absolute inset-0 bg-black/50" onclick={() => mobileMenuOpen = false}></div>
        <aside class="absolute left-0 top-0 bottom-0 w-60 bg-sidebar text-white flex flex-col">
          <div class="flex items-center justify-between h-16 px-4 border-b border-white/10">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Package class="w-4 h-4 text-white" />
              </div>
              <span class="font-bold text-sm">ERP Lite</span>
            </div>
            <button onclick={() => mobileMenuOpen = false} class="p-1.5 rounded-lg hover:bg-sidebar-hover">
              <X class="w-5 h-5" />
            </button>
          </div>
          <nav class="flex-1 py-4 px-2 space-y-1">
            {#each navItems as item}
              <a
                href={item.href}
                onclick={() => mobileMenuOpen = false}
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive(item.href) ? 'bg-sidebar-active text-white' : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'}"
              >
                <item.icon class="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </a>
            {/each}
          </nav>
        </aside>
      </div>
    {/if}

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
        <div class="flex items-center gap-3">
          <button
            onclick={() => mobileMenuOpen = true}
            class="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            <Menu class="w-5 h-5 text-slate-600" />
          </button>
          <h2 class="text-sm font-medium text-slate-600 hidden sm:block">
            {navItems.find(i => isActive(i.href))?.label || '仪表盘'}
          </h2>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative alert-panel-container">
            <button
              onclick={(e) => { e.stopPropagation(); alertPanelOpen = !alertPanelOpen; }}
              class="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="库存预警"
            >
              <Bell class="w-5 h-5 {hasCritical ? 'text-red-500' : urgentCount > 0 ? 'text-amber-500' : 'text-slate-400'}" />
              {#if urgentCount > 0}
                <span class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 {hasCritical ? 'bg-red-500' : 'bg-amber-500'} text-white text-[10px] font-bold rounded-full">
                  {urgentCount > 99 ? '99+' : urgentCount}
                </span>
              {/if}
            </button>

            {#if alertPanelOpen}
              <div class="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div class="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-slate-800">库存预警</h3>
                    {#if urgentCount > 0}
                      <span class="text-xs text-slate-500">{urgentCount} 条待处理</span>
                    {/if}
                  </div>
                </div>
                <div class="max-h-80 overflow-y-auto">
                  {#if urgentAlerts.length === 0}
                    <div class="px-4 py-8 text-center">
                      <Package class="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p class="text-sm text-slate-400">暂无紧急预警</p>
                    </div>
                  {:else}
                    <div class="divide-y divide-slate-100">
                      {#each urgentAlerts as alert (alert.id)}
                        <div class="p-3 hover:bg-slate-50 transition-colors">
                          <div class="flex items-start gap-3">
                            <div class="shrink-0 mt-0.5">
                              {#if alert.urgency === 'critical'}
                                <AlertCircle class="w-4 h-4 text-red-500" />
                              {:else}
                                <AlertTriangle class="w-4 h-4 text-amber-500" />
                              {/if}
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center justify-between gap-2">
                                <p class="text-sm font-medium text-slate-800 truncate">{alert.name}</p>
                                <span class="shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded border {getUrgencyClass(alert.urgency)}">
                                  {alert.urgency === 'critical' ? '严重' : '警告'}
                                </span>
                              </div>
                              <p class="text-xs text-slate-500 mt-0.5">
                                当前库存：<span class="font-medium text-slate-700">{alert.stock} {alert.unit}</span>
                                ／ 最低 {alert.minStock} {alert.unit}
                              </p>
                              <p class="text-xs text-slate-400 mt-0.5">
                                已低于安全库存 {alert.daysBelowMin} 天
                              </p>
                              <button
                                onclick={() => handleReplenish(alert.id)}
                                class="mt-2 flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-600 text-xs font-medium rounded hover:bg-brand-100 transition-colors"
                              >
                                <Plus class="w-3 h-3" />
                                去补货
                              </button>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
                <div class="px-4 py-2.5 bg-slate-50 border-t border-slate-200">
                  <button
                    onclick={() => { alertPanelOpen = false; goto('/'); }}
                    class="w-full text-center text-xs text-brand-600 font-medium hover:text-brand-700"
                  >
                    查看全部预警 →
                  </button>
                </div>
              </div>
            {/if}
          </div>

          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
              <span class="text-brand-700 text-xs font-bold">
                {authStore.currentUser?.displayName?.[0] || 'U'}
              </span>
            </div>
            <div class="hidden sm:block">
              <p class="text-sm font-medium text-slate-700">{authStore.currentUser?.displayName}</p>
              <p class="text-xs text-slate-400">{authStore.currentUser?.role === 'admin' ? '管理员' : authStore.currentUser?.role === 'operator' ? '操作员' : '财务'}</p>
            </div>
          </div>
          <button
            onclick={handleLogout}
            class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
            title="退出登录"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </header>

      <main class="flex-1 p-4 lg:p-6 overflow-y-auto">
        {@render children()}
      </main>
    </div>
  </div>
{/if}

<ToastContainer />
