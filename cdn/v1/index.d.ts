// types/index.d.ts
export as namespace DSRT;

export interface Vec3Like { x: number; y: number; z: number; }

export class Vector3 {
  constructor(x?: number, y?: number, z?: number);
  x: number; y: number; z: number;
  length(): Promise<number>;
  dot(other: Vector3): Promise<number>;
  cross(other: Vector3): Promise<Vector3>;
  normalize(): Promise<Vector3>;
  clone(): Vector3;
}

export class Matrix4 {
  constructor(elements?: number[]);
  elements: number[];
  multiply(other: Matrix4): Promise<Matrix4>;
}

export class Engine {
  constructor(config?: any);
  start(): void;
  stop(): void;
  onUpdate(fn: (dt:number)=>void): void;
}

export class App {
  constructor(opts?: any);
  start(): void;
  stop(): void;
  add(obj:any): void;
}

export const DSRT: {
  version: string;
  init(opts?: { baseUrl?: string }): Promise<any>;
  add(a:number,b:number): Promise<number>;
  dot3(ax:number,ay:number,az:number,bx:number,by:number,bz:number): Promise<number>;
  length3(x:number,y:number,z:number): Promise<number>;
};

export default {
  DSRT, Vector3, Matrix4, Engine, App
};
