<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.svelte';
  import { Package } from 'lucide-svelte';

  let username = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleLogin() {
    error = '';
    loading = true;
    await new Promise(r => setTimeout(r, 500));
    const success = authStore.login(username, password);
    loading = false;
    if (success) {
      goto('/');
    } else {
      error = '用户名或密码错误';
    }
  }
</script>

<svelte:head>
  <title>登录 - 进销存管理系统</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-600/30">
        <Package class="w-8 h-8 text-white" />
      </div>
      <h1 class="text-3xl font-bold text-white">ERP Lite</h1>
      <p class="text-slate-400 mt-1">进销存管理系统</p>
    </div>

    <div class="bg-white rounded-2xl shadow-2xl p-8">
      <h2 class="text-xl font-semibold text-slate-800 mb-6">登录账户</h2>

      {#if error}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      {/if}

      <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
          <input
            type="text"
            bind:value={username}
            placeholder="请输入用户名"
            class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
          <input
            type="password"
            bind:value={password}
            placeholder="请输入密码"
            class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          class="w-full py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <div class="mt-6 pt-4 border-t border-slate-100">
        <p class="text-xs text-slate-400 text-center">演示账户：admin / admin123</p>
      </div>
    </div>
  </div>
</div>
