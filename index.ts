import http from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import * as cookie from "npm:cookie@1.0.2";
import qs from "https://deno.land/x/deno_qs/mod.ts";
import { Buffer } from "node:buffer";

class Request {
  private req: IncomingMessage;

  readonly app: ExpressoApp;
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

type JsonConvertible = string | boolean | number | undefined | null | JsonArray | JsonObject;
interface JsonArray extends Array<JsonConvertible> {};
interface JsonObject extends Record<string, JsonConvertible> {};

class Response {
  private res;
  private isEnded: boolean;
  
  readonly app: ExpressoApp;

  private statusCode: number | undefined;  
  private body: Buffer | string | undefined;
  private contentType: string | undefined;
  private get contentLength (): number {
    return this.body ? this.body.length : 0;
  }

  constructor (app: ExpressoApp, res: ServerResponse) {
    this.app = app;
    this.res = res;
    this.isEnded = false;
  }

  status (code: number): Response {
    this.statusCode = code;
    return this;
  }

  send (data: Buffer | string | JsonConvertible): Response {
    if (data instanceof Buffer) {
      this.body = data;
      this.contentType = "application/octet-stream";
    } else if (typeof data === 'string') {
      this.body = data;
      this.contentType = "text/html";
    } else {
      this.body = JSON.stringify(data);
      this.contentType = "application/json";
    }
    return this;
  }

  end () {
    if (this.isEnded) return;
    this.isEnded = true;
    this.res.writeHead(this.statusCode || 200, { "content-length": this.contentLength, "content-type": this.contentType || 'plain/text' });
    this.res.end(this.body);
  }
}

export { type Response };

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
        const res = new Response(this, _res);

        res.send(["Hello World", "This is from expresso"]).end();

        /* Implicitly end the response */
        res.end();
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
