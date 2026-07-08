import type { GroupedData, GroupableField } from '@/lib/types/grouping';

const UNASSIGNED_KEY = '__unassigned__';
const UNASSIGNED_LABEL = 'Chưa phân loại';

export function groupItems<T>(items: T[], field: GroupableField<T>): GroupedData<T>[] {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const raw = field.accessor(item) ?? UNASSIGNED_KEY;
    const bucket = map.get(raw);
    if (bucket) bucket.push(item);
    else map.set(raw, [item]);
  }

  const groups: GroupedData<T>[] = [];
  for (const [key, groupItemsList] of map) {
    groups.push({
      key,
      label: key === UNASSIGNED_KEY ? UNASSIGNED_LABEL : (field.labelResolver?.(key) ?? key),
      items: groupItemsList,
    });
  }

  // Sort groups: use orderMap if provided, else alphabetical by label
  // Always push unassigned to the end
  if (field.orderMap) {
    groups.sort((a, b) => {
      if (a.key === UNASSIGNED_KEY) return 1;
      if (b.key === UNASSIGNED_KEY) return -1;
      const oa = field.orderMap![a.key] ?? 999;
      const ob = field.orderMap![b.key] ?? 999;
      return oa - ob;
    });
  } else {
    groups.sort((a, b) => {
      if (a.key === UNASSIGNED_KEY) return 1;
      if (b.key === UNASSIGNED_KEY) return -1;
      return a.label.localeCompare(b.label);
    });
  }

  return groups;
}
