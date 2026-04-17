type NestedEnum = { type: string; value?: unknown };

export function enumPath(enumObj: unknown): string {
  const path: string[] = [];
  let current: unknown = enumObj;

  while (
    current &&
    typeof current === 'object' &&
    'type' in current &&
    typeof (current as NestedEnum).type === 'string'
  ) {
    const node = current as NestedEnum;
    path.push(node.type);
    current = node.value;
  }

  return path.join('.');
}
