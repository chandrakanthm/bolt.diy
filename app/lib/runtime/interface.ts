export interface RuntimeBackend {
  boot(options?: any): Promise<RuntimeInstance>;
}

export interface RuntimeInstance {
  fs: FileSystemAPI;
  spawn(command: string, args: string[], options?: any): Promise<ProcessInstance>;
  setPreviewScript?(script: string): Promise<void>;
  on?(event: string, callback: (...args: any[]) => void): void;
  workdir: string;
}

export interface FileSystemAPI {
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string, encoding?: string): Promise<string>;
  readdir(path: string): Promise<string[]>;
  rm?(path: string, options?: { recursive?: boolean }): Promise<void>;
}

export interface ProcessInstance {
  input: {
    getWriter(): WritableStreamDefaultWriter<string>;
  };
  output: ReadableStream<string>;
  exit: Promise<number>;
}
