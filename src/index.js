// src/index.js
import { loadDSRTWasm } from "./wasm/loader.js";

/**
 * @typedef {Object} DSRTAPI
 * @property {string} version
 * @property {(a:number,b:number)=>Promise<number>} add
 * @property {(ax:number,ay:number,az:number,bx:number,by:number,bz:number)=>Promise<number>} dot3
 * @property {(x:number,y:number,z:number)=>Promise<number>} length3
 */

/**
 * DSRT public object
 * @type {DSRTAPI & { init: (opts?:{baseUrl?:string})=>Promise<any> }}
 */
export const DSRT = {
  version: "1.0.0",
  _wasm: null,

  /**
   * Initialize/load WASM module.
   * @param {{baseUrl?:string}} [options]
   */
  async init(options = {}) {
    if (!this._wasm) {
      const baseUrl = options.baseUrl || "/cdn/v1/";
      this._wasm = await loadDSRTWasm(baseUrl);
      if (this._wasm) {
        // Emscripten may prefix exported names with '_' – but in our C++ we used plain exports.
        // Normalize names if necessary:
        // if (this._wasm._dsrt_add) this._wasm.dsrt_add = this._wasm._dsrt_add;
      }
    }
    return this._wasm;
  },

  /**
   * Add two numbers (may use WASM if available)
   * @param {number} a
   * @param {number} b
   * @returns {Promise<number>}
   */
  async add(a, b) {
    if (!this._wasm) await this.init();
    if (this._wasm && typeof this._wasm.dsrt_add === "function") {
      return this._wasm.dsrt_add(a, b);
    }
    // fallback JS
    return a + b;
  },

  /**
   * dot product 3 (ax,ay,az) · (bx,by,bz)
   * @returns {Promise<number>}
   */
  async dot3(ax, ay, az, bx, by, bz) {
    if (!this._wasm) await this.init();
    if (this._wasm && typeof this._wasm.dsrt_dot3 === "function") {
      return this._wasm.dsrt_dot3(ax, ay, az, bx, by, bz);
    }
    return ax*bx + ay*by + az*bz;
  },

  /**
   * length of vec3
   * @returns {Promise<number>}
   */
  async length3(x, y, z) {
    if (!this._wasm) await this.init();
    if (this._wasm && typeof this._wasm.dsrt_length3 === "function") {
      return this._wasm.dsrt_length3(x, y, z);
    }
    return Math.sqrt(x*x + y*y + z*z);
  }
};

export default DSRT;
