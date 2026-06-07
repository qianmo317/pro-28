<script lang="ts">
  import { X } from 'lucide-svelte';

  interface Props {
    open?: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onconfirm?: () => void;
    oncancel?: () => void;
  }

  let { open = $bindable(false), title = '确认操作', message = '确定要执行此操作吗？', confirmText = '确认', cancelText = '取消', onconfirm, oncancel }: Props = $props();

  function handleConfirm() {
    onconfirm?.();
    open = false;
  }

  function handleCancel() {
    oncancel?.();
    open = false;
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" onclick={handleCancel}></div>
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-800">{title}</h3>
        <button onclick={handleCancel} class="text-slate-400 hover:text-slate-600">
          <X class="w-5 h-5" />
        </button>
      </div>
      <p class="text-slate-600 mb-6">{message}</p>
      <div class="flex justify-end gap-3">
        <button onclick={handleCancel} class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
          {cancelText}
        </button>
        <button onclick={handleConfirm} class="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}
