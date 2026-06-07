<script lang="ts">
  import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-svelte';

  interface Props {
    total: number;
    pageSize?: number;
    page?: number;
    onchange?: (page: number) => void;
  }

  let { total, pageSize = 10, page = $bindable(1), onchange }: Props = $props();

  let totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));

  let pages = $derived.by(() => {
    const t = totalPages;
    const c = page;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    if (c <= 3) return [1, 2, 3, 4, '...' as const, t];
    if (c >= t - 2) return [1, '...' as const, t - 3, t - 2, t - 1, t];
    return [1, '...' as const, c - 1, c, c + 1, '...' as const, t];
  });

  function goTo(p: number) {
    if (p < 1 || p > totalPages || p === page) return;
    page = p;
    onchange?.(p);
  }
</script>

{#if totalPages > 1}
  <div class="flex items-center justify-between px-4 py-3 border-t border-slate-200">
    <p class="text-sm text-slate-500">
      共 <span class="font-medium text-slate-700">{total}</span> 条，
      第 <span class="font-medium text-slate-700">{page}</span> / {totalPages} 页
    </p>
    <div class="flex items-center gap-1">
      <button
        onclick={() => goTo(1)}
        disabled={page === 1}
        class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronsLeft class="w-4 h-4" />
      </button>
      <button
        onclick={() => goTo(page - 1)}
        disabled={page === 1}
        class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
      {#each pages as p}
        {#if p === '...'}
          <span class="px-2 py-1 text-sm text-slate-400">…</span>
        {:else}
          <button
            onclick={() => goTo(p)}
            class="min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors {page === p ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}"
          >
            {p}
          </button>
        {/if}
      {/each}
      <button
        onclick={() => goTo(page + 1)}
        disabled={page === totalPages}
        class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
      <button
        onclick={() => goTo(totalPages)}
        disabled={page === totalPages}
        class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronsRight class="w-4 h-4" />
      </button>
    </div>
  </div>
{/if}
