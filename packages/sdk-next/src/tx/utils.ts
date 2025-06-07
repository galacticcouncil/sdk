type NestedEnum = { type: string; value?: NestedEnum } | undefined;

export function enumPath(enumObj: NestedEnum): string {
  const path: string[] = [];
  let current = enumObj;

  while (current && typeof current === 'object' && 'type' in current) {
    path.push(current.type);
    current = current.value;
  }

  return path.join('.');
}
