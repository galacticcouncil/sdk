import { fromBase64 } from '@mysten/bcs';

type NumberMode = 'string' | 'number' | 'bigint';
type Options = {
  numbers?: NumberMode;
  decode32As?: 'address' | 'vector<u8>';
};

export function resolveCommandsTyped(
  root: { inputs: any[]; commands: any[] },
  opts: Options = {}
) {
  const inputs = root.inputs ?? [];
  const cmds = root.commands ?? [];
  const numbers: NumberMode = opts.numbers ?? 'string';
  const decode32As = opts.decode32As ?? 'address';

  const emitNum = (v: bigint) =>
    numbers === 'bigint'
      ? (v as any)
      : numbers === 'number'
        ? Number(v)
        : v.toString();

  const pureToTyped = (b64: string) => {
    const b = fromBase64(b64);
    const le = (n: number) => {
      let v = 0n;
      for (let i = 0; i < n; i++) v |= BigInt(b[i]) << (8n * BigInt(i));
      return v;
    };

    if (b.length === 1)
      return { type: 'pure', valueType: 'u8', value: Number(b[0]) };
    if (b.length === 2)
      return { type: 'pure', valueType: 'u16', value: emitNum(le(2)) };
    if (b.length === 4)
      return { type: 'pure', valueType: 'u32', value: Number(le(4)) };
    if (b.length === 8)
      return { type: 'pure', valueType: 'u64', value: emitNum(le(8)) };

    if (b.length === 32 && decode32As === 'address') {
      const hex =
        '0x' + [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
      return { type: 'pure', valueType: 'address', value: hex };
    }
    return { type: 'pure', valueType: 'vector<u8>', value: Array.from(b) };
  };

  const inputToTyped = (idx: number): any => {
    const i = inputs[idx];
    if (!i) return { Input: idx };

    if (i.Pure?.bytes) return pureToTyped(i.Pure.bytes);

    const so = i.Object?.SharedObject;
    if (so) {
      return {
        type: 'object',
        objectType: 'sharedObject',
        objectId: so.objectId,
        initialSharedVersion: String(so.initialSharedVersion),
        mutable: !!so.mutable,
      };
    }

    const oo = i.Object?.ImmOrOwnedObject;
    if (oo) {
      return {
        type: 'object',
        objectType: 'immOrOwnedObject',
        objectId: oo.objectId,
        version: String(oo.version),
        digest: oo.digest ?? undefined,
      };
    }

    return { Input: idx };
  };

  const mapArg = (arg: any): any => {
    if (arg?.GasCoin) return 'GasCoin';
    if (Array.isArray(arg?.NestedResult)) return arg;
    if (typeof arg?.Input === 'number') return inputToTyped(arg.Input);
    return arg;
  };

  return cmds.map((c: any) => {
    if (c.MoveCall) {
      const m = c.MoveCall;
      return {
        MoveCall: {
          ...m,
          arguments: (m.arguments ?? []).map(mapArg),
        },
      };
    }

    if (c.SplitCoins) {
      const s = c.SplitCoins;
      const coinOut = s.coin?.GasCoin ? 'GasCoin' : mapArg(s.coin);
      const amtOut = (s.amounts ?? []).map(mapArg);
      return { SplitCoins: [coinOut, amtOut] };
    }

    if (c.MergeCoins) {
      const m = c.MergeCoins;
      return {
        MergeCoins: {
          ...m,
          destination: mapArg(m.destination),
          sources: (m.sources ?? []).map(mapArg),
        },
      };
    }

    if (c.TransferObjects) {
      const t = c.TransferObjects;
      return {
        TransferObjects: {
          ...t,
          objects: (t.objects ?? []).map(mapArg),
          address: mapArg(t.address),
        },
      };
    }
    return c;
  });
}
