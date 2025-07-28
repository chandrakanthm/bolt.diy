import { getRuntimeBackend } from './config';
import { WebContainerAdapter } from './webcontainer-adapter';
import { WasmerAdapter } from './wasmer-adapter';
import type { RuntimeBackend } from './interface';

export function createRuntime(): RuntimeBackend {
  const backend = getRuntimeBackend();

  switch (backend) {
    case 'wasmer':
      return new WasmerAdapter();
    case 'webcontainer':
    default:
      return new WebContainerAdapter();
  }
}
