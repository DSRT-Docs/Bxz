// src/wasm/loader.js
/**
 * loadDSRTWasm(baseUrl)
 * - baseUrl: path where dsrt.wasm (and optional dsrt.js glue) are located, default '/cdn/v1/'
 * Returns: an object with exported functions (or null if failed)
 */
export async function loadDSRTWasm(baseUrl = "/cdn/v1/") {
  try {
    // Try instantiateStreaming first (modern browsers)
    const resp = await fetch(baseUrl + "dsrt.wasm");
    if (!resp.ok) throw new Error("Failed fetching dsrt.wasm");
    const { instance } = await WebAssembly.instantiateStreaming(resp, {});
    return instance.exports;
  } catch (err) {
    // fallback to fetch+instantiate
    try {
      const r = await fetch(baseUrl + "dsrt.wasm");
      const bytes = await r.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(bytes, {});
      return instance.exports;
    } catch (e2) {
      console.warn("WASM load failed:", e2);
      // final fallback: return null so JS fallback can be used
      return null;
    }
  }
}
