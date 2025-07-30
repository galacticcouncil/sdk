import * as wasm from "./hydra_dx_wasm_bg.wasm";
export * from "./hydra_dx_wasm_bg.js";
import { __wbg_set_wasm } from "./hydra_dx_wasm_bg.js";
__wbg_set_wasm(wasm);