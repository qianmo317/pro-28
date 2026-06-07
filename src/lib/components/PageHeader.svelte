<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    title: string;
    subtitle?: string;
    children?: Snippet;
    actions?: Snippet;
  }

  let { title, subtitle, children, actions, ...rest }: Props = $props();
</script>

<div {...rest}>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">{title}</h1>
      {#if subtitle}
        <p class="text-sm text-slate-500 mt-1">{subtitle}</p>
      {/if}
    </div>
    {#if actions}
      <div class="flex items-center gap-3">
        {@render actions()}
      </div>
    {/if}
  </div>
  {#if children}
    {@render children()}
  {/if}
</div>
