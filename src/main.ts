import * as Render from "./render";
import * as Engine from "./engine";
enum ItemType {
  Bullet = "Bullet",
  Planet = "Planet",
  Ship = "Ship",
}

class Item implements Render.Item, Engine.Item {
  public type: ItemType;
  public color: string;
  public center: Engine.Position;
  public radius: number;
  public direction: Engine.Direction;
  public speed: Engine.Speed;
  public gravity: number;

  public ignoreCollision = false;
  public deathCount = 0;

  public offsetVertexes: Render.Position[];

  public get vertexes(): Render.Position[] {
    const cx = this.center.x;
    const cy = this.center.y;
    const dx = this.direction.x;
    const dy = -this.direction.y;

    return this.offsetVertexes.map(({ x, y }) => ({
      x: x * dx + y * dy + cx,
      y: x * -dy + y * dx + cy,
    }));
  }
  public set vertexes(value: Render.Position[]) {
    value;
  }

  public constructor(
    options: Pick<
      Item,
      | "type"
      | "color"
      | "center"
      | "radius"
      | "direction"
      | "speed"
      | "gravity"
      | "offsetVertexes"
    >
  ) {
    this.type = options.type;
    this.color = options.color;
    this.center = options.center;
    this.radius = options.radius;
    this.direction = options.direction;
    this.speed = options.speed;
    this.gravity = options.gravity;

    this.offsetVertexes = options.offsetVertexes;
  }
}

class Controller {
  public static defaultConfigs = [
    new Map([
      ["KeyW", "accelerate:+1"],
      ["KeyS", "accelerate:-1"],
      ["KeyA", "rotate:+1"],
      ["KeyD", "rotate:-1"],
      ["Space", "shoot"],
    ]),
    new Map([
      ["Numpad8", "accelerate:+1"],
      ["Numpad5", "accelerate:-1"],
      ["Numpad4", "rotate:+1"],
      ["Numpad6", "rotate:-1"],
      ["NumpadDecimal", "shoot"],
    ]),
  ];
  public ship: Item;
  public world: GameWorld;
  public config: Map<string, string>;
  public timers = new Map<string, NodeJS.Timer>([]);

  constructor(options: Pick<Controller, "ship" | "world" | "config">) {
    this.ship = options.ship;
    this.world = options.world;
    this.config = options.config;

    window.addEventListener("keydown", (event) => {
      const action = this.config.get(event.code);
      if (action && this.timers.get(action)) return;
      switch (action) {
        case "accelerate:+1": {
          const incr = 1 / 60;
          this.accelerate(incr);
          const timer = setInterval(() => this.accelerate(incr), 1000 / 60);
          this.timers.set(action, timer);
          break;
        }
        case "accelerate:-1": {
          const incr = -1 / 60;
          this.accelerate(incr);
          const timer = setInterval(() => this.accelerate(incr), 1000 / 60);
          this.timers.set(action, timer);
          break;
        }
        case "rotate:+1": {
          const incr = (Math.PI * 2) / 60;
          this.rotate(incr);
          const timer = setInterval(() => this.rotate(incr), 1000 / 60);
          this.timers.set(action, timer);
          break;
        }
        case "rotate:-1": {
          const incr = -(Math.PI * 2) / 60;
          this.rotate(incr);
          const timer = setInterval(() => this.rotate(incr), 1000 / 60);
          this.timers.set(action, timer);
          break;
        }
        case "shoot": {
          this.shoot();
          const timer = setInterval(() => this.shoot(), 1000 / 3);
          this.timers.set(action, timer);
          break;
        }
      }
    });
    window.addEventListener("keyup", (event) => {
      const action = this.config.get(event.code);
      if (!action) return;
      const timer = this.timers.get(action);
      this.timers.delete(action);
      if (timer) clearInterval(timer);
    });
  }

  public shoot() {
    const bullet = GameWorld.createBullet(this.ship);
    bullet.ignoreCollision = true;
    bullet.gravity = 0.01;
    setTimeout(() => {
      bullet.ignoreCollision = false;
      bullet.gravity = 0;
    }, 1000);
    this.world.addItem(bullet);
  }

  public rotate(increment: number) {
    const cos = Math.cos(-increment);
    const sin = Math.sin(-increment);
    const dx = this.ship.direction.x;
    const dy = this.ship.direction.y;

    this.ship.direction.x = dx * cos + dy * sin;
    this.ship.direction.y = dx * -sin + dy * cos;
  }

  public accelerate(increment: number) {
    const dx = this.ship.direction.x;
    const dy = this.ship.direction.y;
    const sx = this.ship.speed.x;
    const sy = this.ship.speed.y;

    this.ship.speed.x = increment * dx + sx;
    this.ship.speed.y = increment * dy + sy;
  }
}

class GameWorld {
  static createBullet(options: Pick<Item, "center" | "direction" | "speed">) {
    const { center, direction, speed: defaultSpeed } = options;
    const radius = 5;
    const speed = 1;
    const dx = direction.x;
    const dy = direction.y;

    const speedFactor = speed / Math.pow(dx * dx + dy * dy, 1 / 2);

    const item: Item = new Item({
      type: ItemType.Bullet,
      color: "red",
      offsetVertexes: [
        { x: +radius, y: 0 },
        { x: 0, y: +radius },
        { x: -radius, y: 0 },
        { x: 0, y: -radius },
      ],
      center: { ...center },
      radius: radius,
      direction: { ...direction },
      speed: {
        x: dx * (1 + speedFactor) + defaultSpeed.x,
        y: dy * (1 + speedFactor) + defaultSpeed.y,
      },
      gravity: 0,
    });
    return item;
  }

  static createShip(options: Pick<Item, "center" | "direction">) {
    const { center, direction } = options;
    const item: Item = new Item({
      type: ItemType.Ship,
      color: "blue",
      offsetVertexes: [
        { x: +20, y: 0 },
        { x: -10, y: +10 },
        { x: -10, y: -10 },
      ],
      center: { ...center },
      radius: 20,
      direction: { ...direction },
      speed: { x: 0, y: 0 },
      gravity: 0.0001,
    });
    return item;
  }

  static createPlanet(
    options: Pick<Item, "center" | "radius" | "gravity">,
    orbit?: Item
  ) {
    const { center, gravity, radius } = options;
    const planet = new Item({
      type: ItemType.Planet,
      color: "gray",
      offsetVertexes: [
        { x: radius, y: 0 },
        { x: radius * (Math.sqrt(2) / 2), y: radius * (Math.sqrt(2) / 2) },
        { x: 0, y: radius },
        { x: -radius * (Math.sqrt(2) / 2), y: radius * (Math.sqrt(2) / 2) },
        { x: -radius, y: 0 },
        { x: -radius * (Math.sqrt(2) / 2), y: -radius * (Math.sqrt(2) / 2) },
        { x: 0, y: -radius },
        { x: radius * (Math.sqrt(2) / 2), y: -radius * (Math.sqrt(2) / 2) },
      ],
      center: { ...center },
      direction: { x: 1, y: 0 },
      radius: radius,
      gravity: gravity,
      speed: { x: 0, y: 0 },
    });

    // 公转
    if (orbit) {
      const move = () => {
        const deg = -((Math.PI * 2) / (30 * 1000)) * 60;
        const cos = Math.cos(deg);
        const sin = Math.sin(deg);
        const dx = planet.center.x - orbit.center.x;
        const dy = planet.center.y - orbit.center.y;

        planet.center.x = dx * cos + dy * sin + orbit.center.x;
        planet.center.y = dx * -sin + dy * cos + orbit.center.y;
      };

      move();
      setInterval(() => move(), 1000 / 60);
    }
    // 自转
    const rotate = () => {
      const deg = ((Math.PI * 2) / (30 * 1000)) * 60;
      const cos = Math.cos(-deg);
      const sin = Math.sin(-deg);
      const dx = planet.direction.x;
      const dy = planet.direction.y;

      planet.direction.x = dx * cos + dy * sin;
      planet.direction.y = dx * -sin + dy * cos;
    };
    rotate();
    setInterval(() => rotate(), 1000 / 60);
    return planet;
  }

  static resetShip(ship: Item) {
    ship.direction = { x: 0, y: -1 };
    ship.center = { x: window.innerWidth / 2, y: innerHeight - 300 };
    ship.speed = { x: 0, y: 0 };
    ship.ignoreCollision = true;
    ship.deathCount++;
    setTimeout(() => (ship.ignoreCollision = false), 3000);
  }

  public render: Render.Render;
  public engine: Engine.Engine;

  public constructor() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    this.render = new Render.Render({
      canvas: canvas,
      fps: 60,
      items: [],
      onOutBoard: (item) => {
        const { Bullet, Ship } = ItemType;
        const outItem = item as Item;
        const allowRemove = [Bullet].includes(outItem.type);
        if (allowRemove) this.removeItem(outItem);
        if (outItem.type === Ship) GameWorld.resetShip(outItem);
      },
    });
    this.engine = new Engine.Engine({
      fps: 60,
      items: [],
      onCollision: (items) => {
        const { Bullet, Ship } = ItemType;
        const outItems = items as Item[];

        outItems.forEach((item) => {
          const allowRemove = [Bullet].includes(item.type);
          if (allowRemove) this.removeItem(item);

          if (item.type === Ship) GameWorld.resetShip(item);
        });
      },
      onMove: (item, distance) => {
        item;
        distance;
      },
    });
  }

  public start() {
    this.render.start();
    this.engine.start();
  }

  public addItem(item: Item) {
    this.render.addItem(item);
    this.engine.addItem(item);
  }
  public removeItem(item: Item) {
    this.render.removeItem(item);
    this.engine.removeItem(item);
  }
}

// main

const world = new GameWorld();

const shipA = GameWorld.createShip({
  center: { x: 300, y: 300 },
  direction: { x: 0, y: 1 },
});

const shipB = GameWorld.createShip({
  center: { x: window.innerWidth - 300, y: 300 },
  direction: { x: 0, y: 1 },
});

new Controller({
  ship: shipA,
  world,
  config: Controller.defaultConfigs[0],
});

new Controller({
  ship: shipB,
  world,
  config: Controller.defaultConfigs[1],
});

world.addItem(shipA);
world.addItem(shipB);

const earth = GameWorld.createPlanet({
  center: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  gravity: 80 * 10,
  radius: 40,
});

const moon = GameWorld.createPlanet(
  {
    center: { x: window.innerWidth / 2 + 500, y: window.innerHeight / 2 },
    gravity: 10 * 10,
    radius: 10,
  },
  earth
);

world.addItem(earth);
world.addItem(moon);

world.start();

const score = document.createElement("div");
score.style.position = "fixed";
score.style.top = "24px";
score.style.left = "24px";
score.style.fontSize = "18px";

setInterval(() => {
  score.innerHTML = `
  死亡次数统计
  <br/>
  ShipA: ${shipA.deathCount}
  <br/>
  ShipB: ${shipB.deathCount}
  <br/>
  `;
}, 1000 / 60);
document.body.appendChild(score);
