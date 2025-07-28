export const RUNTIME_BACKEND =
  (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.RUNTIME_BACKEND) || 'webcontainer';

export type RuntimeBackendType = 'webcontainer' | 'wasmer';

export function getRuntimeBackend(): RuntimeBackendType {
  return RUNTIME_BACKEND as RuntimeBackendType;
}
