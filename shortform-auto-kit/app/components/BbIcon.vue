<script setup lang="ts">
defineProps<{ name: string; size?: number }>()
</script>

<template>
  <svg class="bb-icon" :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <template v-if="name === 'grid'">
      <rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>
    </template>
    <template v-else-if="name === 'car'">
      <path d="M4 14.5h16l-1.5-5a2 2 0 0 0-1.9-1.4H7.4a2 2 0 0 0-1.9 1.4L4 14.5Z"/><path d="M3 14.5v3.2c0 .7.6 1.3 1.3 1.3h1.2l.7-2h11.6l.7 2h1.2c.7 0 1.3-.6 1.3-1.3v-3.2"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>
    </template>
    <template v-else-if="name === 'image'">
      <rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m5 18 4.5-4.5 3 3 2.5-2.5 4 4"/>
    </template>
    <template v-else-if="name === 'layout'">
      <rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M10 10v10"/>
    </template>
    <template v-else-if="name === 'spark'">
      <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>
    </template>
    <template v-else-if="name === 'check'">
      <circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 8.5"/>
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/>
    </template>
    <template v-else-if="name === 'send'">
      <path d="m3 11 17-7-7 17-2-7-8-3Z"/><path d="m11 14 9-10"/>
    </template>
    <template v-else-if="name === 'palette'">
      <path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4h-1a1.5 1.5 0 0 1 0-3H16a5 5 0 0 0 5-5c0-3.3-4-6-9-6Z"/><circle cx="7.5" cy="10" r="1"/><circle cx="10" cy="6.5" r="1"/><circle cx="15" cy="7" r="1"/>
    </template>
    <template v-else-if="name === 'link'">
      <path d="M9.5 14.5 14.5 9"/><path d="M7.5 17H6a4 4 0 0 1 0-8h4M16.5 7H18a4 4 0 0 1 0 8h-4"/>
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>
    </template>
    <template v-else-if="name === 'shield'">
      <path d="M12 3 4.5 6v5.5c0 4.7 3.2 8.1 7.5 9.5 4.3-1.4 7.5-4.8 7.5-9.5V6L12 3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>
    </template>
  </svg>
</template>

<style scoped>
.bb-icon { stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; flex: none; }
</style>

