export function useListingHomeUrl(siteBase: string) {
  const desktop = ref(import.meta.client && window.matchMedia('(min-width:768px)').matches)
  let media: MediaQueryList | undefined
  const update = () => { desktop.value = !!media?.matches }
  onMounted(() => { media=window.matchMedia('(min-width:768px)');update();media.addEventListener('change',update) })
  onBeforeUnmount(() => media?.removeEventListener('change',update))
  return computed(()=>`${siteBase}?qf=guazi&lang=ko${desktop.value?'&pc=1':''}`)
}
