<script lang="ts">
  import '../app.css';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
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
    FolderOpen
  } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  let sidebarCollapsed = $state(false);
  let mobileMenuOpen = $state(false);

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
