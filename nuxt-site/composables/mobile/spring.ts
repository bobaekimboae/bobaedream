// motion/react 의 spring 애니메이션을 대신하는 작은 스프링(넉스트 판에는 motion 이 없다).
// 값 하나를 목표로 끌어당긴다. 움직이는 중에 목표를 바꾸면 속도를 이어받는다(motion 과 같음).
// 멈춤 기준은 motion 기본값: px 값 restDelta 0.5 · restSpeed 2, 작은 범위(scale 등)는 0.005 · 0.01.
export type SpringOptions = { stiffness: number; damping: number; mass: number; restDelta?: number; restSpeed?: number };

export class Spring {
  value: number;
  velocity = 0;
  target: number;
  private opts: SpringOptions = { stiffness: 100, damping: 10, mass: 1 };
  private frame: number | null = null;
  private last: number | null = null;
  private onRest: (() => void) | null = null;

  constructor(initial: number, private readonly onUpdate: (value: number) => void) {
    this.value = initial;
    this.target = initial;
  }

  get animating() {
    return this.frame !== null;
  }

  set(value: number) {
    this.stop();
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.onUpdate(value);
  }

  to(target: number, opts: SpringOptions, onRest?: () => void) {
    this.target = target;
    this.opts = opts;
    this.onRest = onRest ?? null;
    if (this.frame === null) {
      this.last = null;
      this.frame = window.requestAnimationFrame(this.step);
    }
  }

  stop() {
    if (this.frame !== null) window.cancelAnimationFrame(this.frame);
    this.frame = null;
    this.last = null;
  }

  private step = (time: number) => {
    const elapsed = this.last === null ? 16 : Math.min(64, time - this.last);
    this.last = time;
    const { stiffness, damping, mass } = this.opts;
    const restDelta = this.opts.restDelta ?? 0.5;
    const restSpeed = this.opts.restSpeed ?? 2;
    // 안정적으로 적분하려고 4ms 이하로 나눠 계산한다.
    const steps = Math.max(1, Math.ceil(elapsed / 4));
    const dt = elapsed / 1000 / steps;
    for (let i = 0; i < steps; i += 1) {
      const accel = (-stiffness * (this.value - this.target) - damping * this.velocity) / mass;
      this.velocity += accel * dt;
      this.value += this.velocity * dt;
    }
    if (Math.abs(this.velocity) < restSpeed && Math.abs(this.target - this.value) < restDelta) {
      this.value = this.target;
      this.velocity = 0;
      this.frame = null;
      this.last = null;
      this.onUpdate(this.value);
      const done = this.onRest;
      this.onRest = null;
      done?.();
      return;
    }
    this.onUpdate(this.value);
    this.frame = window.requestAnimationFrame(this.step);
  };
}
