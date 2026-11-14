<script setup lang="ts">
defineProps<{ compact?: boolean }>()
</script>

<template>
  <div class="video-shell" :class="{ compact }">
    <div class="video-top"><span>보배드림</span><b>FACT LOCK</b></div>
    <VehicleArtwork type="sedan" tone="dark" />
    <div class="video-copy">
      <p>2024 제네시스 G80</p>
      <h3>2.5T AWD</h3>
      <div class="video-spec"><span>18,420km</span><span>가솔린</span></div>
    </div>
    <div class="video-price">5,980만원</div>
    <div class="video-progress"><i /></div>
    <div class="video-foot">원본 매물 정보만 사용했습니다</div>
  </div>
</template>

<style scoped>
.video-shell { position: relative; width: min(100%, 272px); aspect-ratio: 9/16; margin: 0 auto; overflow: hidden; border-radius: 26px; background: #0b1020; color:#fff; box-shadow: 0 24px 60px rgba(15,23,42,.25); }
.video-shell.compact { width: 214px; border-radius: 22px; }
.video-shell :deep(.vehicle-art) { border-radius:0; min-height:0; height:41%; margin-top:18%; background:linear-gradient(145deg,#23304b,#0b1020); color:#4f7cff; }
.video-top { position:absolute; z-index:2; top:18px; left:18px; right:18px; display:flex; align-items:center; justify-content:space-between; font-size:11px; }
.video-top span { font-weight:900; letter-spacing:-.04em; }
.video-top b { padding:5px 7px; border:1px solid rgba(255,255,255,.3); border-radius:999px; color:#8fb1ff; font-size:8px; letter-spacing:.07em; }
.video-copy { padding:18px 18px 0; }
.video-copy p { margin:0 0 4px; color:#a8b5cb; font-size:11px; }
.video-copy h3 { margin:0; font-size:23px; letter-spacing:-.05em; }
.video-spec { display:flex; gap:12px; margin-top:11px; color:#d9e1ef; font-size:11px; }
.video-price { position:absolute; left:18px; bottom:66px; font-size:20px; font-weight:900; letter-spacing:-.04em; }
.video-progress { position:absolute; left:18px; right:18px; bottom:49px; height:3px; overflow:hidden; border-radius:3px; background:rgba(255,255,255,.18); }
.video-progress i { display:block; width:68%; height:100%; background:#4f7cff; }
.video-foot { position:absolute; left:18px; right:18px; bottom:21px; color:#8e9aad; font-size:9px; }
</style>

