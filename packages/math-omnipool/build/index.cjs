
let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;
let wasm;
const { TextEncoder, TextDecoder } = require(`util`);

let WASM_VECTOR_LEN = 0;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
/**
 * @param {string} asset_reserve
 * @param {string} asset_hub_reserve
 * @param {string} asset_shares
 * @param {string} amount_in
 * @returns {string}
 */
module.exports.calculate_shares = function(asset_reserve, asset_hub_reserve, asset_shares, amount_in) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passStringToWasm0(asset_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(amount_in, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_shares(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        deferred5_0 = ret[0];
        deferred5_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
};

/**
 * @param {string} spot_price
 * @param {string} oracle_price
 * @param {string} min_withdrawal_fee
 * @returns {string}
 */
module.exports.calculate_withdrawal_fee = function(spot_price, oracle_price, min_withdrawal_fee) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(spot_price, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(oracle_price, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(min_withdrawal_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_withdrawal_fee(ptr0, len0, ptr1, len1, ptr2, len2);
        deferred4_0 = ret[0];
        deferred4_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
};

/**
 * @param {string} asset_reserve
 * @param {string} asset_hub_reserve
 * @param {string} asset_shares
 * @param {string} position_amount
 * @param {string} position_shares
 * @param {string} position_price
 * @param {string} shares_to_remove
 * @param {string} withdrawal_fee
 * @returns {string}
 */
module.exports.calculate_liquidity_out = function(asset_reserve, asset_hub_reserve, asset_shares, position_amount, position_shares, position_price, shares_to_remove, withdrawal_fee) {
    let deferred9_0;
    let deferred9_1;
    try {
        const ptr0 = passStringToWasm0(asset_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(position_amount, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(position_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passStringToWasm0(position_price, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len5 = WASM_VECTOR_LEN;
        const ptr6 = passStringToWasm0(shares_to_remove, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len6 = WASM_VECTOR_LEN;
        const ptr7 = passStringToWasm0(withdrawal_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len7 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_liquidity_out(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, ptr7, len7);
        deferred9_0 = ret[0];
        deferred9_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred9_0, deferred9_1, 1);
    }
};

/**
 * @param {string} asset_reserve
 * @param {string} asset_hub_reserve
 * @param {string} asset_shares
 * @param {string} position_amount
 * @param {string} position_shares
 * @param {string} position_price
 * @param {string} shares_to_remove
 * @param {string} withdrawal_fee
 * @returns {string}
 */
module.exports.calculate_liquidity_lrna_out = function(asset_reserve, asset_hub_reserve, asset_shares, position_amount, position_shares, position_price, shares_to_remove, withdrawal_fee) {
    let deferred9_0;
    let deferred9_1;
    try {
        const ptr0 = passStringToWasm0(asset_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(position_amount, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(position_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passStringToWasm0(position_price, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len5 = WASM_VECTOR_LEN;
        const ptr6 = passStringToWasm0(shares_to_remove, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len6 = WASM_VECTOR_LEN;
        const ptr7 = passStringToWasm0(withdrawal_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len7 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_liquidity_lrna_out(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, ptr7, len7);
        deferred9_0 = ret[0];
        deferred9_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred9_0, deferred9_1, 1);
    }
};

/**
 * @param {string} oracle_amount_in
 * @param {string} oracle_amount_out
 * @param {string} oracle_liquidity
 * @param {string} oracle_period
 * @param {string} current_asset_liquidity
 * @param {string} previous_fee
 * @param {string} block_difference
 * @param {string} min_fee
 * @param {string} max_fee
 * @param {string} decay
 * @param {string} amplification
 * @returns {string}
 */
module.exports.recalculate_asset_fee = function(oracle_amount_in, oracle_amount_out, oracle_liquidity, oracle_period, current_asset_liquidity, previous_fee, block_difference, min_fee, max_fee, decay, amplification) {
    let deferred12_0;
    let deferred12_1;
    try {
        const ptr0 = passStringToWasm0(oracle_amount_in, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(oracle_amount_out, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(oracle_liquidity, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(oracle_period, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(current_asset_liquidity, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passStringToWasm0(previous_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len5 = WASM_VECTOR_LEN;
        const ptr6 = passStringToWasm0(block_difference, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len6 = WASM_VECTOR_LEN;
        const ptr7 = passStringToWasm0(min_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len7 = WASM_VECTOR_LEN;
        const ptr8 = passStringToWasm0(max_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len8 = WASM_VECTOR_LEN;
        const ptr9 = passStringToWasm0(decay, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len9 = WASM_VECTOR_LEN;
        const ptr10 = passStringToWasm0(amplification, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len10 = WASM_VECTOR_LEN;
        const ret = wasm.recalculate_asset_fee(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, ptr7, len7, ptr8, len8, ptr9, len9, ptr10, len10);
        deferred12_0 = ret[0];
        deferred12_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred12_0, deferred12_1, 1);
    }
};

/**
 * @param {string} oracle_amount_in
 * @param {string} oracle_amount_out
 * @param {string} oracle_liquidity
 * @param {string} oracle_period
 * @param {string} current_asset_liquidity
 * @param {string} previous_fee
 * @param {string} block_difference
 * @param {string} min_fee
 * @param {string} max_fee
 * @param {string} decay
 * @param {string} amplification
 * @returns {string}
 */
module.exports.recalculate_protocol_fee = function(oracle_amount_in, oracle_amount_out, oracle_liquidity, oracle_period, current_asset_liquidity, previous_fee, block_difference, min_fee, max_fee, decay, amplification) {
    let deferred12_0;
    let deferred12_1;
    try {
        const ptr0 = passStringToWasm0(oracle_amount_in, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(oracle_amount_out, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(oracle_liquidity, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(oracle_period, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(current_asset_liquidity, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passStringToWasm0(previous_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len5 = WASM_VECTOR_LEN;
        const ptr6 = passStringToWasm0(block_difference, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len6 = WASM_VECTOR_LEN;
        const ptr7 = passStringToWasm0(min_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len7 = WASM_VECTOR_LEN;
        const ptr8 = passStringToWasm0(max_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len8 = WASM_VECTOR_LEN;
        const ptr9 = passStringToWasm0(decay, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len9 = WASM_VECTOR_LEN;
        const ptr10 = passStringToWasm0(amplification, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len10 = WASM_VECTOR_LEN;
        const ret = wasm.recalculate_protocol_fee(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, ptr7, len7, ptr8, len8, ptr9, len9, ptr10, len10);
        deferred12_0 = ret[0];
        deferred12_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred12_0, deferred12_1, 1);
    }
};

/**
 * @param {string} asset_in_reserve
 * @param {string} asset_in_hub_reserve
 * @param {string} asset_in_shares
 * @param {string} asset_out_reserve
 * @param {string} asset_out_hub_reserve
 * @param {string} asset_out_shares
 * @param {string} amount_in
 * @param {string} asset_fee
 * @param {string} protocol_fee
 * @param {string} max_slip_fee
 * @returns {string}
 */
module.exports.calculate_out_given_in = function(asset_in_reserve, asset_in_hub_reserve, asset_in_shares, asset_out_reserve, asset_out_hub_reserve, asset_out_shares, amount_in, asset_fee, protocol_fee, max_slip_fee) {
    let deferred11_0;
    let deferred11_1;
    try {
        const ptr0 = passStringToWasm0(asset_in_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_in_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_in_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(asset_out_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(asset_out_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passStringToWasm0(asset_out_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len5 = WASM_VECTOR_LEN;
        const ptr6 = passStringToWasm0(amount_in, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len6 = WASM_VECTOR_LEN;
        const ptr7 = passStringToWasm0(asset_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len7 = WASM_VECTOR_LEN;
        const ptr8 = passStringToWasm0(protocol_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len8 = WASM_VECTOR_LEN;
        const ptr9 = passStringToWasm0(max_slip_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len9 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_out_given_in(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, ptr7, len7, ptr8, len8, ptr9, len9);
        deferred11_0 = ret[0];
        deferred11_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred11_0, deferred11_1, 1);
    }
};

/**
 * @param {string} asset_reserve
 * @param {string} asset_hub_reserve
 * @param {string} asset_shares
 * @param {string} amount_in
 * @param {string} asset_fee
 * @param {string} max_slip_fee
 * @returns {string}
 */
module.exports.calculate_out_given_lrna_in = function(asset_reserve, asset_hub_reserve, asset_shares, amount_in, asset_fee, max_slip_fee) {
    let deferred7_0;
    let deferred7_1;
    try {
        const ptr0 = passStringToWasm0(asset_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(amount_in, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(asset_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passStringToWasm0(max_slip_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len5 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_out_given_lrna_in(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
        deferred7_0 = ret[0];
        deferred7_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
    }
};

/**
 * @param {string} asset_in_reserve
 * @param {string} asset_in_hub_reserve
 * @param {string} asset_in_shares
 * @param {string} asset_out_reserve
 * @param {string} asset_out_hub_reserve
 * @param {string} asset_out_shares
 * @param {string} amount_out
 * @param {string} asset_fee
 * @param {string} protocol_fee
 * @param {string} max_slip_fee
 * @returns {string}
 */
module.exports.calculate_in_given_out = function(asset_in_reserve, asset_in_hub_reserve, asset_in_shares, asset_out_reserve, asset_out_hub_reserve, asset_out_shares, amount_out, asset_fee, protocol_fee, max_slip_fee) {
    let deferred11_0;
    let deferred11_1;
    try {
        const ptr0 = passStringToWasm0(asset_in_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_in_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_in_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(asset_out_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(asset_out_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passStringToWasm0(asset_out_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len5 = WASM_VECTOR_LEN;
        const ptr6 = passStringToWasm0(amount_out, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len6 = WASM_VECTOR_LEN;
        const ptr7 = passStringToWasm0(asset_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len7 = WASM_VECTOR_LEN;
        const ptr8 = passStringToWasm0(protocol_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len8 = WASM_VECTOR_LEN;
        const ptr9 = passStringToWasm0(max_slip_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len9 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_in_given_out(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, ptr7, len7, ptr8, len8, ptr9, len9);
        deferred11_0 = ret[0];
        deferred11_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred11_0, deferred11_1, 1);
    }
};

/**
 * @param {string} asset_reserve
 * @param {string} asset_hub_reserve
 * @param {string} asset_shares
 * @param {string} amount_out
 * @param {string} asset_fee
 * @param {string} max_slip_fee
 * @returns {string}
 */
module.exports.calculate_lrna_in_given_out = function(asset_reserve, asset_hub_reserve, asset_shares, amount_out, asset_fee, max_slip_fee) {
    let deferred7_0;
    let deferred7_1;
    try {
        const ptr0 = passStringToWasm0(asset_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(amount_out, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(asset_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passStringToWasm0(max_slip_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len5 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_lrna_in_given_out(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
        deferred7_0 = ret[0];
        deferred7_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
    }
};

/**
 * @param {string} asset_a_reserve
 * @param {string} asset_a_hub_reserve
 * @param {string} asset_b_reserve
 * @param {string} asset_b_hub_reserve
 * @returns {string}
 */
module.exports.calculate_spot_price = function(asset_a_reserve, asset_a_hub_reserve, asset_b_reserve, asset_b_hub_reserve) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passStringToWasm0(asset_a_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_a_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_b_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(asset_b_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_spot_price(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        deferred5_0 = ret[0];
        deferred5_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
};

/**
 * @param {string} asset_a_reserve
 * @param {string} asset_a_hub_reserve
 * @param {string} asset_b_reserve
 * @param {string} asset_b_hub_reserve
 * @param {string} protocol_fee
 * @param {string} asset_fee
 * @returns {string}
 */
module.exports.calculate_spot_price_with_fee = function(asset_a_reserve, asset_a_hub_reserve, asset_b_reserve, asset_b_hub_reserve, protocol_fee, asset_fee) {
    let deferred7_0;
    let deferred7_1;
    try {
        const ptr0 = passStringToWasm0(asset_a_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_a_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_b_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(asset_b_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(protocol_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passStringToWasm0(asset_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len5 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_spot_price_with_fee(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
        deferred7_0 = ret[0];
        deferred7_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
    }
};

/**
 * @param {string} asset_reserve
 * @param {string} asset_hub_reserve
 * @returns {string}
 */
module.exports.calculate_lrna_spot_price = function(asset_reserve, asset_hub_reserve) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(asset_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_lrna_spot_price(ptr0, len0, ptr1, len1);
        deferred3_0 = ret[0];
        deferred3_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
};

/**
 * @param {string} asset_reserve
 * @param {string} asset_hub_reserve
 * @param {string} asset_fee
 * @returns {string}
 */
module.exports.calculate_lrna_spot_price_with_fee = function(asset_reserve, asset_hub_reserve, asset_fee) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(asset_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_lrna_spot_price_with_fee(ptr0, len0, ptr1, len1, ptr2, len2);
        deferred4_0 = ret[0];
        deferred4_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
};

/**
 * @param {string} asset_reserve
 * @param {string} asset_hub_reserve
 * @param {string} asset_cap
 * @param {string} total_hub_reserve
 * @returns {string}
 */
module.exports.calculate_cap_difference = function(asset_reserve, asset_hub_reserve, asset_cap, total_hub_reserve) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passStringToWasm0(asset_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_cap, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(total_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_cap_difference(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        deferred5_0 = ret[0];
        deferred5_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
};

/**
 * @param {string} asset_hub_reserve
 * @param {string} asset_cap
 * @param {string} hub_added
 * @param {string} total_hub_reserve
 * @returns {boolean}
 */
module.exports.verify_asset_cap = function(asset_hub_reserve, asset_cap, hub_added, total_hub_reserve) {
    const ptr0 = passStringToWasm0(asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(asset_cap, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(hub_added, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passStringToWasm0(total_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len3 = WASM_VECTOR_LEN;
    const ret = wasm.verify_asset_cap(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
    return ret !== 0;
};

/**
 * @param {string} asset_reserve
 * @param {string} asset_hub_reserve
 * @param {string} stable_asset_reserve
 * @param {string} stable_asset_hub_reserve
 * @param {string} tvl_cap
 * @param {string} total_hub_reserve
 * @returns {string}
 */
module.exports.calculate_tvl_cap_difference = function(asset_reserve, asset_hub_reserve, stable_asset_reserve, stable_asset_hub_reserve, tvl_cap, total_hub_reserve) {
    let deferred7_0;
    let deferred7_1;
    try {
        const ptr0 = passStringToWasm0(asset_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(stable_asset_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(stable_asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(tvl_cap, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passStringToWasm0(total_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len5 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_tvl_cap_difference(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
        deferred7_0 = ret[0];
        deferred7_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
    }
};

/**
 * @param {string} asset_reserve
 * @param {string} asset_hub_reserve
 * @param {string} asset_shares
 * @param {string} amount_in
 * @returns {string}
 */
module.exports.calculate_liquidity_hub_in = function(asset_reserve, asset_hub_reserve, asset_shares, amount_in) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passStringToWasm0(asset_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(asset_hub_reserve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(asset_shares, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(amount_in, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_liquidity_hub_in(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        deferred5_0 = ret[0];
        deferred5_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
};

/**
 * @param {number} bits
 * @returns {boolean}
 */
module.exports.is_sell_allowed = function(bits) {
    const ret = wasm.is_sell_allowed(bits);
    return ret !== 0;
};

/**
 * @param {number} bits
 * @returns {boolean}
 */
module.exports.is_buy_allowed = function(bits) {
    const ret = wasm.is_buy_allowed(bits);
    return ret !== 0;
};

/**
 * @param {number} bits
 * @returns {boolean}
 */
module.exports.is_add_liquidity_allowed = function(bits) {
    const ret = wasm.is_add_liquidity_allowed(bits);
    return ret !== 0;
};

/**
 * @param {number} bits
 * @returns {boolean}
 */
module.exports.is_remove_liquidity_allowed = function(bits) {
    const ret = wasm.is_remove_liquidity_allowed(bits);
    return ret !== 0;
};

module.exports.__wbindgen_init_externref_table = function() {
    const table = wasm.__wbindgen_export_0;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
};

const path = require('path').join(__dirname, 'hydra_dx_wasm_bg_nodejs.wasm');
const bytes = require('fs').readFileSync(path);

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
module.exports.__wasm = wasm;

wasm.__wbindgen_start();

