<script setup lang="ts">
import type { Vehicle } from '~/types/shortform'

withDefaults(defineProps<{ type?: Vehicle['art']; tone?: 'dark' | 'light' | 'red' | 'silver' }>(), {
  type: 'sedan',
  tone: 'dark'
})
</script>

<template>
  <div class="vehicle-art" :class="[`is-${type}`, `tone-${tone}`]" aria-label="차량 사진 대체 시안">
    <div class="art-grid" />
    <svg viewBox="0 0 360 190" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="carBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="currentColor" stop-opacity=".96"/>
          <stop offset="1" stop-color="currentColor" stop-opacity=".52"/>
        </linearGradient>
      </defs>
      <ellipse cx="180" cy="155" rx="135" ry="15" fill="#0f172a" opacity=".12"/>
      <path class="body" d="M54 131c8-27 26-43 57-48l34-6c21-29 47-45 77-45 36 0 63 18 88 52l18 5c12 3 20 12 22 29l-3 22H53l1-9Z" fill="url(#carBody)"/>
      <path class="roof" d="m151 78 22-28c12-13 27-19 48-19 27 0 49 13 70 51l-140-4Z" fill="#dbeafe" opacity=".86"/>
      <path d="M221 34v45M173 51l48 0M290 82l-69-3" stroke="#93c5fd" stroke-width="3" opacity=".7"/>
      <path d="M62 112c28-8 58-12 91-13h140c22 0 39 5 52 14" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="3"/>
      <circle cx="110" cy="139" r="27" fill="#111827"/><circle cx="110" cy="139" r="13" fill="#cbd5e1"/><circle cx="290" cy="139" r="27" fill="#111827"/><circle cx="290" cy="139" r="13" fill="#cbd5e1"/>
      <path d="M63 118h37M318 108h24" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" opacity=".9"/>
    </svg>
    <span class="art-label">MOCK PHOTO</span>
  </div>
</template>

<style scoped>
.vehicle-art { position: relative; overflow: hidden; min-height: 150px; border-radius: 18px; background: linear-gradient(145deg, #edf2f7, #d8e3ef); color: #18243d; }
.vehicle-art.tone-light { background: linear-gradient(145deg, #f8fafc, #e2e8f0); color: #cbd5e1; }
.vehicle-art.tone-red { background: linear-gradient(145deg, #fff1f2, #fecdd3); color: #c9153b; }
.vehicle-art.tone-silver { background: linear-gradient(145deg, #f1f5f9, #cbd5e1); color: #64748b; }
.vehicle-art svg { width: 100%; height: 100%; min-height: 150px; display: block; transform: translateY(3%); }
.vehicle-art.is-suv .roof { transform: translateY(-10px) scaleY(1.18); transform-origin: center; }
.vehicle-art.is-van .roof { transform: translate(-14px,-16px) scale(1.17,1.22); transform-origin: center; }
.vehicle-art.is-coupe .roof { transform: translate(16px,8px) scale(.86,.82); transform-origin: center; }
.art-grid { position: absolute; inset: 0; opacity: .35; background-image: linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px); background-size: 28px 28px; mask-image: linear-gradient(to bottom, rgba(0,0,0,.55), transparent 75%); }
.art-label { position: absolute; right: 12px; bottom: 10px; font: 700 9px/1 ui-monospace, monospace; letter-spacing: .12em; color: rgba(15,23,42,.44); }
</style>

