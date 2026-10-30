<script setup lang="ts">
import * as THREE from 'three'
import type { FeatureId } from '~~/shared/features'

const props = defineProps<{ feature: FeatureId }>()
const host = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | undefined
let scene: THREE.Scene | undefined
let camera: THREE.PerspectiveCamera | undefined
let car: THREE.Group | undefined
let effects = new Map<FeatureId, THREE.Object3D>()
let frame = 0
let observer: ResizeObserver | undefined
let startedAt = 0

function material(color: number, metalness = 0.45, roughness = 0.45, opacity = 1) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, transparent: opacity < 1, opacity })
}

function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, position: [number, number, number], rotation?: [number, number, number]) {
  const item = new THREE.Mesh(geometry, mat)
  item.position.set(...position)
  if (rotation) item.rotation.set(...rotation)
  item.castShadow = true
  item.receiveShadow = true
  return item
}

function buildCar() {
  const group = new THREE.Group()
  group.add(mesh(new THREE.BoxGeometry(4.8, 0.65, 2.05), material(0x3478e5, 0.72, 0.32), [0, 1.05, 0]))
  group.add(mesh(new THREE.BoxGeometry(2.65, 0.82, 1.78), material(0x2159ae, 0.62, 0.27), [-0.25, 1.7, 0]))
  group.add(mesh(new THREE.BoxGeometry(2.18, 0.54, 1.7), material(0x101b2b, 0.08, 0.18, 0.82), [-0.18, 1.82, 0]))
  group.add(mesh(new THREE.BoxGeometry(0.22, 0.28, 1.78), material(0x111827, 0.45, 0.38), [2.42, 1.03, 0]))
  const wheelGeometry = new THREE.CylinderGeometry(0.56, 0.56, 0.35, 28)
  const wheelMaterial = material(0x101319, 0.15, 0.8)
  const rimMaterial = material(0xc8d1dc, 0.82, 0.25)
  for (const x of [-1.55, 1.55]) {
    for (const z of [-1.1, 1.1]) {
      group.add(mesh(wheelGeometry, wheelMaterial, [x, 0.72, z], [Math.PI / 2, 0, 0]))
      group.add(mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.37, 12), rimMaterial, [x, 0.72, z], [Math.PI / 2, 0, 0]))
    }
  }
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xd8f5ff, emissive: 0x8edfff, emissiveIntensity: 4 })
  group.add(mesh(new THREE.BoxGeometry(0.18, 0.24, 0.58), lampMat, [2.43, 1.24, -0.62]))
  group.add(mesh(new THREE.BoxGeometry(0.18, 0.24, 0.58), lampMat, [2.43, 1.24, 0.62]))
  return group
}

function addFeatureEffects(target: THREE.Group) {
  const blue = new THREE.MeshBasicMaterial({ color: 0x66c7ff, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false })
  const headlamp = new THREE.Group()
  headlamp.add(mesh(new THREE.ConeGeometry(0.68, 5.2, 32, 1, true), blue, [4.75, 1.18, -0.62], [0, 0, -Math.PI / 2]))
  headlamp.add(mesh(new THREE.ConeGeometry(0.68, 5.2, 32, 1, true), blue, [4.75, 1.18, 0.62], [0, 0, -Math.PI / 2]))
  target.add(headlamp); effects.set('headlamp', headlamp)

  const adas = new THREE.Group()
  const laneMat = new THREE.MeshBasicMaterial({ color: 0x6ce6ff, transparent: true, opacity: 0.75 })
  adas.add(mesh(new THREE.BoxGeometry(5.8, 0.025, 0.045), laneMat, [4.55, 0.04, -1.45], [0, 0, 0]))
  adas.add(mesh(new THREE.BoxGeometry(5.8, 0.025, 0.045), laneMat, [4.55, 0.04, 1.45], [0, 0, 0]))
  adas.add(mesh(new THREE.ConeGeometry(2.4, 6.4, 4, 1, true), new THREE.MeshBasicMaterial({ color: 0x3478e5, transparent: true, opacity: 0.12, side: THREE.DoubleSide, wireframe: true }), [5.2, 0.35, 0], [0, 0, -Math.PI / 2]))
  target.add(adas); effects.set('adas', adas)

  const cameraFx = new THREE.Group()
  for (const radius of [2.7, 3.35, 4.0]) cameraFx.add(mesh(new THREE.TorusGeometry(radius, 0.026, 8, 80), laneMat, [0, 0.08, 0], [Math.PI / 2, 0, 0]))
  target.add(cameraFx); effects.set('camera', cameraFx)

  const seat = new THREE.Group()
  const airMat = new THREE.MeshBasicMaterial({ color: 0x8eefff, transparent: true, opacity: 0.75 })
  for (let i = 0; i < 18; i++) {
    const p = mesh(new THREE.SphereGeometry(0.045 + (i % 3) * 0.016, 10, 10), airMat, [-0.65 + (i % 6) * 0.27, 1.5 + Math.floor(i / 6) * 0.23, -0.38 + (i % 2) * 0.76])
    p.userData.phase = i * 0.37
    seat.add(p)
  }
  target.add(seat); effects.set('seat', seat)

  const roof = new THREE.Group()
  roof.add(mesh(new THREE.BoxGeometry(2.75, 0.06, 1.72), new THREE.MeshPhysicalMaterial({ color: 0x75e9ff, transparent: true, opacity: 0.55, transmission: 0.3, roughness: 0.18, metalness: 0.1 }), [-0.2, 2.16, 0]))
  target.add(roof); effects.set('roof', roof)

  const trunk = new THREE.Group()
  const lid = mesh(new THREE.BoxGeometry(0.12, 0.72, 1.82), material(0x3478e5, 0.7, 0.34), [-2.46, 1.34, 0])
  lid.userData.baseY = lid.position.y
  trunk.add(lid)
  target.add(trunk); effects.set('trunk', trunk)
}

function resize() {
  if (!host.value || !renderer || !camera) return
  const width = Math.max(1, host.value.clientWidth)
  const height = Math.max(1, host.value.clientHeight)
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function updateFeature(feature: FeatureId) {
  effects.forEach((item, key) => { item.visible = key === feature })
}

function animate() {
  if (!renderer || !scene || !camera || !car) return
  const t = (performance.now() - startedAt) / 1000
  car.rotation.y = -0.34 + Math.sin(t * 0.35) * 0.08
  const seat = effects.get('seat')
  seat?.children.forEach((item, i) => { item.position.y = 1.5 + Math.floor(i / 6) * 0.23 + ((t * 0.22 + item.userData.phase) % 0.48) })
  const cameraFx = effects.get('camera')
  if (cameraFx) cameraFx.rotation.y = t * 0.16
  const adas = effects.get('adas')
  if (adas) adas.children.forEach((item, i) => { (item as THREE.Mesh).material && ((item as THREE.Mesh).material as THREE.Material).opacity !== undefined && (((item as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.52 + Math.sin(t * 2.4 + i) * 0.2) })
  const trunk = effects.get('trunk')?.children[0]
  if (trunk) {
    trunk.rotation.z = -Math.sin(t * 0.9) * 0.42
    trunk.position.y = (trunk.userData.baseY as number) + Math.sin(t * 0.9) * 0.25
  }
  renderer.render(scene, camera)
  frame = requestAnimationFrame(animate)
}

onMounted(() => {
  if (!host.value) return
  startedAt = performance.now()
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0c1522)
  scene.fog = new THREE.Fog(0x0c1522, 10, 18)
  camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
  camera.position.set(7.2, 4.3, 7.8)
  camera.lookAt(0.3, 1.05, 0)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  host.value.appendChild(renderer.domElement)

  scene.add(new THREE.HemisphereLight(0x9ecbff, 0x1b2230, 2.4))
  const key = new THREE.DirectionalLight(0xfff4dc, 4.6); key.position.set(4, 8, 5); key.castShadow = true; scene.add(key)
  const rim = new THREE.DirectionalLight(0x4fa7ff, 3.6); rim.position.set(-5, 4, -4); scene.add(rim)
  scene.add(mesh(new THREE.CircleGeometry(7.3, 64), new THREE.MeshStandardMaterial({ color: 0x111c29, roughness: 0.82, metalness: 0.05 }), [0, 0, 0], [-Math.PI / 2, 0, 0]))
  const grid = new THREE.GridHelper(13, 26, 0x2b5c94, 0x223246); grid.position.y = 0.012; scene.add(grid)

  car = buildCar(); addFeatureEffects(car); scene.add(car)
  updateFeature(props.feature)
  observer = new ResizeObserver(resize); observer.observe(host.value)
  resize(); animate()
})

watch(() => props.feature, updateFeature)
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  renderer?.dispose()
  renderer?.domElement.remove()
})
</script>

<template>
  <div ref="host" class="three-vehicle" aria-label="선택한 차량 기능의 3D 시각화" />
</template>
