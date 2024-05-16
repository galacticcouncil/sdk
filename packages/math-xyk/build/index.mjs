import * as wasm from "./hydra_dx_wasm_bg.wasm";
import { __wbg_set_wasm } from "./hydra_dx_wasm_bg.js";
__wbg_set_wasm(wasm);
export * from "./hydra_dx_wasm_bg.js";
