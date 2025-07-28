import { createRuntime } from '~/lib/runtime/factory';
import { WORK_DIR_NAME } from '~/utils/constants';
import { cleanStackTrace } from '~/utils/stacktrace';
import type { RuntimeInstance } from '~/lib/runtime/interface';

interface RuntimeContext {
  loaded: boolean;
}

export const runtimeContext: RuntimeContext = import.meta.hot?.data.runtimeContext ?? {
  loaded: false,
};

if (import.meta.hot) {
  import.meta.hot.data.runtimeContext = runtimeContext;
}

export let webcontainer: Promise<RuntimeInstance> = new Promise(() => {
  // noop for ssr
});

if (!import.meta.env.SSR) {
  webcontainer =
    import.meta.hot?.data.webcontainer ??
    Promise.resolve()
      .then(() => {
        const runtime = createRuntime();
        return runtime.boot({
          coep: 'credentialless',
          workdirName: WORK_DIR_NAME,
          forwardPreviewErrors: true,
        });
      })
      .then(async (runtimeInstance) => {
        runtimeContext.loaded = true;

        const { workbenchStore } = await import('~/lib/stores/workbench');

        const response = await fetch('/inspector-script.js');
        const inspectorScript = await response.text();

        if (runtimeInstance.setPreviewScript) {
          await runtimeInstance.setPreviewScript(inspectorScript);
        }

        if (runtimeInstance.on) {
          runtimeInstance.on('preview-message', (message: any) => {
            console.log('Runtime preview message:', message);

            if (message.type === 'PREVIEW_UNCAUGHT_EXCEPTION' || message.type === 'PREVIEW_UNHANDLED_REJECTION') {
              const isPromise = message.type === 'PREVIEW_UNHANDLED_REJECTION';
              const title = isPromise ? 'Unhandled Promise Rejection' : 'Uncaught Exception';
              workbenchStore.actionAlert.set({
                type: 'preview',
                title,
                description: 'message' in message ? message.message : 'Unknown error',
                content: `Error occurred at ${message.pathname}${message.search}${message.hash}\nPort: ${message.port}\n\nStack trace:\n${cleanStackTrace(message.stack || '')}`,
                source: 'preview',
              });
            }
          });
        }

        return runtimeInstance;
      });

  if (import.meta.hot) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}
