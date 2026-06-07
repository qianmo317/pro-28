<script lang="ts">
  import { toastStore } from '$lib/stores/toast.svelte';
  import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-svelte';

  const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };
  const colorMap = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  const iconColorMap = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500'
  };
</script>

{#if toastStore.messages.length > 0}
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
    {#each toastStore.messages as msg (msg.id)}
      {@const Icon = iconMap[msg.type]}
      <div class="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg {colorMap[msg.type]} animate-[slideIn_0.3s_ease-out]">
        <Icon class="w-5 h-5 {iconColorMap[msg.type]} shrink-0" />
        <span class="text-sm font-medium flex-1">{msg.message}</span>
        <button onclick={() => toastStore.remove(msg.id)} class="shrink-0 opacity-60 hover:opacity-100">
          <X class="w-4 h-4" />
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
</style>
