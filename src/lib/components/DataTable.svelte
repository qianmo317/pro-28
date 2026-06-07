<script lang="ts" generics="T extends Record<string, any>">
  import type { Snippet } from 'svelte';

  interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    class?: string;
  }

  interface Props {
    columns: Column[];
    data: T[];
    actions?: Snippet<[T]>;
    emptyText?: string;
    onrowclick?: (item: T) => void;
  }

  let { columns, data, actions, emptyText = '暂无数据', onrowclick }: Props = $props();
</script>

<div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200">
          {#each columns as col}
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3 {col.class || ''}">
              {col.label}
            </th>
          {/each}
          {#if actions}
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3 w-32">操作</th>
          {/if}
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#if data.length === 0}
          <tr>
            <td colspan={columns.length + (actions ? 1 : 0)} class="text-center py-12 text-slate-400 text-sm">
              {emptyText}
            </td>
          </tr>
        {:else}
          {#each data as item (item.id)}
            <tr class="hover:bg-slate-50 transition-colors {onrowclick ? 'cursor-pointer' : ''}" onclick={() => onrowclick?.(item)}>
              {#each columns as col}
                <td class="px-4 py-3 text-sm text-slate-700 {col.class || ''}">
                  {item[col.key] ?? '-'}
                </td>
              {/each}
              {#if actions}
                <td class="px-4 py-3 text-sm">
                  {@render actions(item)}
                </td>
              {/if}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
