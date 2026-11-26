<script setup lang="ts">
defineProps<{ tone?: 'neutral' | 'info' | 'good' | 'warning' | 'danger'; label: string }>()
</script>

<template>
  <span class="status-badge" :class="`tone-${tone ?? 'neutral'}`"><i />{{ label }}</span>
</template>

<style scoped>
.status-badge { display: inline-flex; align-items: center; gap: 6px; min-height: 27px; padding: 0 9px; border-radius: 999px; background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 700; white-space: nowrap; }
.status-badge i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.status-badge.tone-info { background:#e8f0ff; color:#2156d7; }
.status-badge.tone-good { background:#e8f8f1; color:#11835a; }
.status-badge.tone-warning { background:#fff5d8; color:#a45f00; }
.status-badge.tone-danger { background:#feecef; color:#c51f42; }
</style>

