import http from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import * as cookie from "npm:cookie@1.0.2";
import qs from "https://deno.land/x/deno_qs/mod.ts";

class Request {
  private req: IncomingMessage;
  private app: ExpressoApp;
 
  readonly body?: unknown; // filled outside of the contructor
  readonly cookies: Readonly<Record<string, string | undefined>>;
  readonly host: string;
  readonly hostname: string;
  readonly ip?: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly query: Readonly<Record<string, string>>;

  constructor (app: ExpressoApp, req: IncomingMessage) {
    this.app = app;
    this.req = req;

    const { headers } = req;

    this.cookies = !headers.cookie ? {} : cookie.parse(headers.cookie);

    this.host = headers.host || "";
    this.hostname = headers.host || "";

    this.method = req.method as HttpMethod;

    const url = new URL(`http://expresso.com/${headers.host}`);
    this.path = url.pathname;
    this.query = qs.parse(url.search);

    this.ip = req.socket.remoteAddress;
  }
}

export { type Request };

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  CONNECT = "CONNECT",
  OPTIONS = "OPTIONS",
  TRACE = "TRACE",
  PATCH = "PATCH",
}

async function readRequestBody (req: IncomingMessage) {
  return await new Promise((resolve) => {
    let data = '';
    req.on("data", chunk => data += chunk);
    req.on("end", () => resolve(data));
  });
}

class ExpressoApp {
  private server: Server;

  constructor () {
    this.server = http.createServer(
      async (_req: IncomingMessage, _res: ServerResponse) => {
        const req = new Request(this, _req);
        (req.body as unknown) = await readRequestBody(_req);
        const body = "hello world";
        _res.writeHead(200, {
          "Content-Type": "text/plain",
          "Content-Length": body.length,
        });
        _res.end(body);
      },
    );
  }

  listen (port: number) {
    console.log(`Expresso server is running on ${port}`);
    this.server.listen(port);
  }
}

export { type ExpressoApp };

export default function () {
  return new ExpressoApp();
}

if (import.meta.main) {
  (new ExpressoApp()).listen(8000);
}
