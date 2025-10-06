declare module 'crypto' {
  export function randomUUID(): string;
}

declare module 'express' {
  interface Request {
    headers: { [key: string]: string | string[] | undefined };
    body: any;
  }

  interface Response {
    status(code: number): Response;
    json(obj: any): Response;
    send(text: string): Response;
  }

  interface Application {
    use(middleware: any): Application;
    post(path: string, handler: (req: Request, res: Response) => void): Application;
    get(path: string, handler: (req: Request, res: Response) => void): Application;
    delete(path: string, handler: (req: Request, res: Response) => void): Application;
    listen(port: number, host: string, callback: () => void): void;
  }

  function express(): Application;
  export = express;
  export { Request, Response, Application };
  export function json(): any;
}

declare var process: {
  env: { [key: string]: string | undefined };
  on(event: string, listener: (...args: any[]) => void): void;
  exit(code: number): void;
};
