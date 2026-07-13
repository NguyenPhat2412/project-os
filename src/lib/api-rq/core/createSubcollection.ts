import { createCollection } from './createCollection';
import type { CollectionConfig } from '../types';

export function createSubcollection<T extends object>(
  config: Omit<CollectionConfig<T>, 'path'> & {
    path: (...parentIds: string[]) => string;
  },
) {
  return (...parentIds: string[]) => {
    const resolvedPath = config.path(...parentIds);
    return createCollection<T>({ ...config, path: resolvedPath });
  };
}
