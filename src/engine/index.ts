export interface Position {
  x: number;
  y: number;
}
export interface Speed extends Position {}
export interface Direction extends Position {}
export interface Distance extends Position {}

export interface Item {
  center: Position;
  radius: number;
  direction: Direction;
  speed: Speed;
  gravity: number;
  ignoreCollision: boolean;
}

export interface EngineOptions {
  fps: number;
  items: Item[];
  onCollision: Engine["onCollision"];
  onMove: Engine["onMove"];
}

export class Engine {
  private fps: number;

  private timer: NodeJS.Timer = null as never;
  private items: Item[] = [];

  public onCollision: { (items: Item[]): void };
  public onMove: { (item: Item, distance: Distance): void };

  public constructor(options: EngineOptions) {
    this.fps = options.fps;
    this.items = options.items;
    this.onCollision = options.onCollision;
    this.onMove = options.onMove;
  }

  public start() {
    this.timer = setInterval(() => this.frame(), 1000 / this.fps);
  }

  private frame() {
    // 碰撞判定
    this.items.forEach((item) => {
      this.items.forEach((target) => {
        if (item === target) return;
        if (item.ignoreCollision || target.ignoreCollision) return;

        const dx = item.center.x - target.center.x;
        const dy = item.center.y - target.center.y;
        const dr = item.radius + target.radius;

        if (dx * dx + dy * dy < dr * dr) {
          this.onCollision([item, target]);
        }
      });
    });
    // 引力计算，不计算相互吸引，只计算被吸引的目标，即 gravity 为零的目标
    this.items.forEach((item) => {
      if (item.gravity) {
        this.items.forEach((target) => {
          if (item === target || target.gravity) return;

          const dx = item.center.x - target.center.x;
          const dy = item.center.y - target.center.y;
          const dr = Math.pow(dx * dx + dy * dy, 1 / 2);
          const speed = item.gravity / Math.max(dr * dr, 1);
          const factor = speed / dr;

          target.speed.x += dx * factor;
          target.speed.y += dy * factor;
        });
      }
    });
    // 位移计算
    this.items.forEach((item) => {
      item.center.x += item.speed.x;
      item.center.y += item.speed.y;

      this.onMove(item, { ...item.speed });
    });
  }

  public stop() {
    clearInterval(this.timer);
  }

  public addItem(item: Item) {
    this.items.push(item);
  }

  public removeItem(item: Item) {
    this.items = this.items.filter((ele) => ele !== item);
  }
}
