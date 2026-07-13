/**
 * Symbolic path segment resolved to the current project UUID immediately before
 * every API request and while creating its TanStack Query key. It is a scope
 * marker, not a cached project ID, so changing projects cannot reuse data from
 * the previous project's cache.
 */
export const ACTIVE_PROJECT_SCOPE = ':active-project';
