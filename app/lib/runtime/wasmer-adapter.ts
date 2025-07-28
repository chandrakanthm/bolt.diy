import { init, Wasmer, Directory, Command } from '@wasmer/sdk';
import type { RuntimeBackend, RuntimeInstance, FileSystemAPI, ProcessInstance } from './interface';

class WasmerFileSystem implements FileSystemAPI {
  constructor(private _directory: Directory) {}

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    try {
      await this._directory.createDir(path);
    } catch (error) {
      if (!options?.recursive) {
        throw error;
      }

      const parts = path.split('/').filter(Boolean);
      let currentPath = '';

      for (const part of parts) {
        currentPath += '/' + part;

        try {
          await this._directory.createDir(currentPath);
        } catch {}
      }
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this._directory.writeFile(path, content);
  }

  async readFile(path: string, encoding?: string): Promise<string> {
    const file = await this._directory.readFile(path);

    if (file instanceof Uint8Array) {
      return new TextDecoder(encoding || 'utf-8').decode(file);
    }

    return file;
  }

  async readdir(path: string): Promise<string[]> {
    const entries = await this._directory.readDir(path);
    return entries.map((entry: any) => entry.name);
  }

  async rm(path: string, _options?: { recursive?: boolean }): Promise<void> {
    try {
      await this.writeFile(path, '');
    } catch (error) {
      console.warn(`Could not remove ${path}:`, error);
    }
  }
}

class WasmerProcess implements ProcessInstance {
  input: {
    getWriter(): WritableStreamDefaultWriter<string>;
  };
  output: ReadableStream<string>;
  exit: Promise<number>;

  constructor(instance: any) {
    const inputStream = new WritableStream({
      write(chunk) {
        if (instance.stdin) {
          instance.stdin.write(chunk);
        }
      },
    });

    this.input = {
      getWriter: () => inputStream.getWriter(),
    };

    this.output = new ReadableStream({
      start(controller) {
        if (instance.stdout) {
          instance.stdout.on('data', (data: string) => {
            controller.enqueue(data);
          });
          instance.stdout.on('end', () => {
            controller.close();
          });
        }
      },
    });

    this.exit = new Promise((resolve) => {
      if (instance.wait) {
        instance.wait().then((exitCode: number) => resolve(exitCode));
      } else {
        resolve(0);
      }
    });
  }
}

class WasmerInstance implements RuntimeInstance {
  fs: FileSystemAPI;
  workdir: string = '/';

  constructor(
    private _wasmer: any,
    private _directory: Directory,
  ) {
    this.fs = new WasmerFileSystem(_directory);
  }

  async spawn(command: string, _args: string[], _options?: any): Promise<ProcessInstance> {
    const cmd = new Command();
    cmd.name = command;

    const instance = await cmd.run();

    return new WasmerProcess(instance);
  }

  async setPreviewScript(_script: string): Promise<void> {
    console.warn('Preview script functionality not available in Wasmer backend');
  }

  on(_event: string, _callback: (...args: any[]) => void): void {
    console.warn(`Event handling for '${_event}' not available in Wasmer backend`);
  }
}

export class WasmerAdapter implements RuntimeBackend {
  async boot(_options?: any): Promise<RuntimeInstance> {
    await init();

    const wasmer = await Wasmer.fromRegistry('python/python');
    const directory = new Directory();

    return new WasmerInstance(wasmer, directory);
  }
}
