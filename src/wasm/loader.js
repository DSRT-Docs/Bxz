// src/wasm/loader.js
/**
 * loadDSRTWasm(baseUrl)
 * - tries to load Emscripten glue (dsrt.js) if present, otherwise loads raw dsrt.wasm
 * - returns an object with:
 *   { ready: true, mode: "emscripten"|"raw", exports: <exports>, helpers: { malloc, free, setArray, getArray } }
 */
export async function loadDSRTWasm(baseUrl = "/cdn/v1/") {
  // try Emscripten-generated glue first
  try {
    // dynamic import if dsrt.js available at baseUrl
    const glueUrl = baseUrl + "dsrt.js";
    // try to fetch glue first (small check) to avoid network error
    const r = await fetch(glueUrl, { method: "HEAD" });
    if (r.ok) {
      // load glue as a script module (Emscripten classic glue is not an ES module)
      // We'll load it by creating script tag so it can set Module in global scope.
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = glueUrl;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
      });
      // Emscripten's Module may be available as `Module` global.
      const Module = window.Module || (typeof Module !== "undefined" && Module) || null;
      if (Module) {
        // ensure cwrap/malloc available
        const cwrap = Module.cwrap ? Module.cwrap.bind(Module) : null;
        const malloc = Module._malloc ? Module._malloc.bind(Module) : null;
        const free = Module._free ? Module._free.bind(Module) : null;
        const HEAPF64 = Module.HEAPF64;
        return {
          ready: true,
          mode: "emscripten",
          exports: Module,
          helpers: {
            cwrap,
            malloc,
            free,
            setArray: (ptr, arr) => {
              HEAPF64.set(arr, ptr/8); // pointer in bytes -> index
            },
            getArray: (ptr, len) => {
              return Array.from(HEAPF64.subarray(ptr/8, ptr/8 + len));
            }
          }
        };
      }
    }
  } catch (e) {
    // ignore and fallback to raw wasm
  }

  // fallback to raw wasm fetch & instantiate
  try {
    const wasmResp = await fetch(baseUrl + "dsrt.wasm");
    if (!wasmResp.ok) throw new Error("Failed to fetch dsrt.wasm");
    const { instance } = await WebAssembly.instantiateStreaming(wasmResp, {});
    return {
      ready: true,
      mode: "raw",
      exports: instance.exports,
      helpers: {
        // raw mode: no malloc/free or HEAP access; pointer-based helpers not available
        malloc: null, free: null, setArray: null, getArray: null
      }
    };
  } catch (err) {
    console.warn("WASM load failed:", err);
    return { ready: false, mode: "none", exports: null, helpers: {} };
  }
}
