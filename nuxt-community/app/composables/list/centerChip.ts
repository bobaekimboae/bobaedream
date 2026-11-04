// 정적 판의 chip.scrollIntoView({ inline:'center', block:'nearest' }) 와 같은 가운데 맞춤을 가로 스크롤 줄 안에서만 한다.
// 정적 판은 innerHTML 로 그린 직후(게시판 넘기기의 transform 을 주기 전) 부르지만, Vue 는 다음 틱에 부르므로
// 그때 scrollIntoView 를 쓰면 transform 된 화면을 따라 .phone(overflow:hidden) 까지 옆으로 밀린다. 그래서 줄만 움직인다.
export function centerChip(chip: Element | null | undefined) {
  if (!chip) return
  let rail = chip.parentElement
  while (rail && !(rail.scrollWidth > rail.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(rail).overflowX))) rail = rail.parentElement
  if (!rail) return
  const cr = chip.getBoundingClientRect(), rr = rail.getBoundingClientRect()
  rail.scrollLeft = rail.scrollLeft + (cr.left - rr.left) - (rr.width - cr.width) / 2
}
