import { loadDSRTWasm } from "./wasm/loader.js";

/**
 * DSRT core public object
 */
export const DSRT = {
  version: "1.0.0",
  _wasmModule: null,
  _helpers: null,

  async init(opts = {}) {
    const base = opts.baseUrl || "/cdn/v1/";
    const r = await loadDSRTWasm(base);
    if (r.ready) {
      this._wasmModule = r.exports;
      this._helpers = r.helpers;
    } else {
      this._wasmModule = null;
      this._helpers = null;
    }
    return r;
  }
};

export class Vector3 {
  constructor(x=0,y=0,z=0){ this.x=x; this.y=y; this.z=z; }
  async length() {
    if (DSRT._wasmModule && typeof DSRT._wasmModule.dsrt_length3 === "function")
      return DSRT._wasmModule.dsrt_length3(this.x,this.y,this.z);
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }
  async dot(other) {
    if (DSRT._wasmModule && typeof DSRT._wasmModule.dsrt_dot3 === "function")
      return DSRT._wasmModule.dsrt_dot3(this.x,this.y,this.z, other.x,other.y,other.z);
    return this.x*other.x + this.y*other.y + this.z*other.z;
  }
  async cross(other) {
    if (DSRT._wasmModule && DSRT._helpers && DSRT._helpers.malloc && DSRT._helpers.setArray) {
      const malloc = DSRT._helpers.malloc, free = DSRT._helpers.free, setArray = DSRT._helpers.setArray, getArray = DSRT._helpers.getArray;
      const outPtr = malloc(8*3);
      if (DSRT._helpers.cwrap) {
        const fn = DSRT._helpers.cwrap("dsrt_cross","void", ["number","number","number","number","number","number","number"]);
        fn(this.x,this.y,this.z, other.x,other.y,other.z, outPtr);
        const arr = getArray(outPtr,3);
        free(outPtr);
        return new Vector3(arr[0],arr[1],arr[2]);
      }
    }
    const cx = this.y * other.z - this.z * other.y;
    const cy = this.z * other.x - this.x * other.z;
    const cz = this.x * other.y - this.y * other.x;
    return new Vector3(cx,cy,cz);
  }
  async normalize() {
    if (DSRT._wasmModule && DSRT._helpers && DSRT._helpers.malloc) {
      const malloc = DSRT._helpers.malloc, free = DSRT._helpers.free, setArray = DSRT._helpers.setArray, getArray = DSRT._helpers.getArray;
      const outPtr = malloc(8*3);
      if (DSRT._helpers.cwrap) {
        const fn = DSRT._helpers.cwrap("dsrt_normalize","void", ["number","number","number","number"]);
        fn(this.x,this.y,this.z,outPtr);
        const arr = getArray(outPtr,3);
        free(outPtr);
        return new Vector3(arr[0],arr[1],arr[2]);
      }
    }
    const len = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
    if (len === 0) return new Vector3(0,0,0);
    return new Vector3(this.x/len,this.y/len,this.z/len);
  }
  clone(){ return new Vector3(this.x,this.y,this.z); }
}

export class Matrix4 {
  constructor(elements=null){
    if (elements && elements.length===16) this.elements = elements.slice(0,16);
    else this.elements = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  }
  async multiply(other) {
    if (DSRT._wasmModule && DSRT._helpers && DSRT._helpers.malloc) {
      const malloc = DSRT._helpers.malloc, free = DSRT._helpers.free, setArray = DSRT._helpers.setArray, getArray = DSRT._helpers.getArray;
      if (DSRT._helpers.cwrap) {
        const aPtr = malloc(8*16), bPtr = malloc(8*16), outPtr = malloc(8*16);
        setArray(aPtr, this.elements);
        setArray(bPtr, other.elements);
        const fn = DSRT._helpers.cwrap("dsrt_mat4_mul","void", ["number","number","number"]);
        fn(aPtr,bPtr,outPtr);
        const res = getArray(outPtr,16);
        free(aPtr); free(bPtr); free(outPtr);
        return new Matrix4(res);
      }
    }
    const a=this.elements, b=other.elements;
    const out = new Array(16).fill(0);
    for (let r=0;r<4;r++){
      for (let c=0;c<4;c++){
        let s=0;
        for (let k=0;k<4;k++) s += a[r*4 + k] * b[k*4 + c];
        out[r*4 + c] = s;
      }
    }
    return new Matrix4(out);
  }
}

export class Engine {
  constructor(config={}) { this.config=config; this.running=false; this._tick=this._tick.bind(this); this._subs=[]; }
  start(){ if(this.running) return; this.running=true; this._last=performance.now(); requestAnimationFrame(this._tick); }
  stop(){ this.running=false; }
  _tick(now){ if(!this.running) return; const dt=(now-this._last)/1000; this._last=now; for(const s of this._subs) s(dt); requestAnimationFrame(this._tick); }
  onUpdate(fn){ this._subs.push(fn); }
}

export class App {
  constructor(opts={}) { this.engine=new Engine(opts.engine||{}); this.scene=[];}
  start(){ this.engine.start(); }
  stop(){ this.engine.stop(); }
  add(obj){ this.scene.push(obj); }
}

const Default = { DSRT, Vector3, Matrix4, Engine, App };
export default Default;
