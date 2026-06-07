<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    value: string | number;
    icon?: Snippet;
    trend?: { value: number; label: string };
    subtext?: Snippet;
    color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  }

  let { title, value, icon, trend, subtext, color = 'blue' }: Props = $props();

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };
  const iconBgMap = {
    blue: 'bg-blue-100',
    green: 'bg-emerald-100',
    amber: 'bg-amber-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100'
  };
</script>

<div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
  <div class="flex items-start justify-between">
    <div>
      <p class="text-sm text-slate-500 font-medium">{title}</p>
      <p class="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {#if subtext}
        <div class="mt-1">{@render subtext()}</div>
      {/if}
      {#if trend}
        <p class="text-xs mt-2 {trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}">
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      {/if}
    </div>
    {#if icon}
      <div class="w-10 h-10 rounded-lg {iconBgMap[color]} flex items-center justify-center">
        {@render icon()}
      </div>
    {/if}
  </div>
</div>
