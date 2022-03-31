export interface Position {
  x: number;
  y: number;
}

export interface Item {
  color: string;
  vertexes: Position[];
}

export interface RenderOptions {
  canvas: HTMLCanvasElement;
  fps: number;
  items: Item[];
  onOutBoard: Render["onOutBoard"];
}

export class Render {
  private fps: number;
  private canvas: HTMLCanvasElement;

  private timer: NodeJS.Timer = null as never;
  private items: Item[] = [];

  public onOutBoard: { (item: Item): void };

  public constructor(options: RenderOptions) {
    this.canvas = options.canvas;
    this.fps = options.fps;
    this.items = options.items;
    this.onOutBoard = options.onOutBoard;
  }

  private frame() {
    const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    const { height, width } = this.canvas;

    ctx.clearRect(0, 0, width, height);

    this.items.forEach((item) => {
      const [start, ...vertexes] = item.vertexes;

      ctx.beginPath();
      ctx.moveTo(start.x, height - start.y);
      vertexes.forEach((vertex) => ctx.lineTo(vertex.x, height - vertex.y));
      ctx.closePath();

      ctx.fillStyle = item.color;
      ctx.fill();
    });

    // 出界检测
    this.items.forEach((item) => {
      const isOut = (pos: Position) =>
        pos.x < 0 || pos.x > width || pos.y < 0 || pos.y > height;

      if (item.vertexes.every(isOut)) {
        this.onOutBoard(item);
        // console.log(item)
      }
    });
  }

  public start() {
    this.timer = setInterval(() => this.frame(), 1000 / this.fps);
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
