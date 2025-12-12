export async function loadDSRTWasm(baseUrl = "/cdn/v1/") {
  try {
    const glueUrl = baseUrl + "dsrt.js";
    const headResp = await fetch(glueUrl, { method: "HEAD" });
    if (headResp.ok) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = glueUrl;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
      });
      const Module = window.Module || (typeof Module !== "undefined" && Module) || null;
      if (Module) {
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
            setArray: (ptr, arr) => { HEAPF64.set(arr, ptr/8); },
            getArray: (ptr, len) => Array.from(HEAPF64.subarray(ptr/8, ptr/8 + len))
          }
        };
      }
    }
  } catch (e) {
    // continue to raw wasm
  }

  try {
    const wasmResp = await fetch(baseUrl + "dsrt.wasm");
    if (!wasmResp.ok) throw new Error("Failed fetching dsrt.wasm");
    const { instance } = await WebAssembly.instantiateStreaming(wasmResp, {});
    return {
      ready: true,
      mode: "raw",
      exports: instance.exports,
      helpers: { malloc: null, free: null, setArray: null, getArray: null }
    };
  } catch (err) {
    console.warn("WASM load failed:", err);
    return { ready: false, mode: "none", exports: null, helpers: {} };
  }
}
