import { WebContainer } from '@webcontainer/api';
import type { RuntimeBackend, RuntimeInstance, FileSystemAPI, ProcessInstance } from './interface';

class WebContainerFileSystem implements FileSystemAPI {
  constructor(private _webcontainer: WebContainer) {}

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    if (options?.recursive) {
      await this._webcontainer.fs.mkdir(path, { recursive: true });
    } else {
      await this._webcontainer.fs.mkdir(path);
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this._webcontainer.fs.writeFile(path, content);
  }

  async readFile(path: string, encoding?: string): Promise<string> {
    const content = await this._webcontainer.fs.readFile(path, encoding as any);

    if (content instanceof Uint8Array) {
      return new TextDecoder(encoding || 'utf-8').decode(content);
    }

    return content;
  }

  async readdir(path: string): Promise<string[]> {
    return await this._webcontainer.fs.readdir(path);
  }

  async rm(path: string, options?: { recursive?: boolean }): Promise<void> {
    await this._webcontainer.fs.rm(path, options);
  }
}

class WebContainerProcess implements ProcessInstance {
  input: {
    getWriter(): WritableStreamDefaultWriter<string>;
  };
  output: ReadableStream<string>;
  exit: Promise<number>;

  constructor(private _process: any) {
    this.input = _process.input;
    this.output = _process.output;
    this.exit = _process.exit;
  }
}

class WebContainerInstance implements RuntimeInstance {
  fs: FileSystemAPI;
  workdir: string;

  constructor(private _webcontainer: WebContainer) {
    this.fs = new WebContainerFileSystem(_webcontainer);
    this.workdir = _webcontainer.workdir;
  }

  async spawn(command: string, args: string[], options?: any): Promise<ProcessInstance> {
    const process = await this._webcontainer.spawn(command, args, options);
    return new WebContainerProcess(process);
  }

  async setPreviewScript(script: string): Promise<void> {
    if (this._webcontainer.setPreviewScript) {
      await this._webcontainer.setPreviewScript(script);
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (this._webcontainer.on) {
      if (event === 'server-ready' || event === 'port') {
        this._webcontainer.on(event as any, callback as any);
      }
    }
  }
}

export class WebContainerAdapter implements RuntimeBackend {
  async boot(options?: any): Promise<RuntimeInstance> {
    const webcontainer = await WebContainer.boot(options);
    return new WebContainerInstance(webcontainer);
  }
}
