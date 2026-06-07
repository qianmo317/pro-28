<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';

  Chart.register(...registerables);

  interface Props {
    type: 'line' | 'bar' | 'pie' | 'doughnut';
    data: any;
    options?: any;
    height?: number;
  }

  let { type, data, options = {}, height = 300 }: Props = $props();
  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  onMount(() => {
    chart = new Chart(canvas, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              font: { family: "'Noto Sans SC', sans-serif", size: 12 },
              color: '#64748b'
            }
          }
        },
        scales: type !== 'pie' && type !== 'doughnut' ? {
          x: {
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: "'Noto Sans SC', sans-serif", size: 11 }, color: '#94a3b8' }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: "'Noto Sans SC', sans-serif", size: 11 }, color: '#94a3b8' }
          }
        } : undefined,
        ...options
      }
    });

    return () => {
      chart?.destroy();
    };
  });
</script>

<div style="height: {height}px;">
  <canvas bind:this={canvas}></canvas>
</div>
