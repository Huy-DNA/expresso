import type { IncomingHttpHeaders, IncomingMessage } from "node:http";
import * as cookie from "npm:cookie@1.0.2";
import qs from "https://deno.land/x/deno_qs/mod.ts";
import { HttpMethod } from "./types.ts";
import { ExpressoApp } from "./app.ts";
import { Response } from "./response.ts";

export class Request {
  _req: IncomingMessage;

  readonly app: ExpressoApp;
  readonly res?: Response;

  private headers: IncomingHttpHeaders;
  body?: unknown;
  cookies: Record<string, string | undefined>;
  host: string;
  hostname: string;
  ip?: string;
  method: HttpMethod;
  readonly originalUrl: string | undefined;
  path: string;
  query: Record<string, string>;

  constructor (app: ExpressoApp, _req: IncomingMessage) {
    this.app = app;
    this._req = _req;

    const { headers } = _req;
    this.headers = headers;

    this.cookies = !headers.cookie ? {} : cookie.parse(headers.cookie);

    this.host = headers.host || "";
    this.hostname = headers.host || "";

    this.method = _req.method as HttpMethod;

    this.originalUrl = _req.url;
    const url = new URL(`http://expresso.com${_req.url || ''}`);
    this.path = url.pathname;
    this.query = qs.parse(url.search.slice(1));

    this.ip = _req.socket.remoteAddress;
  }

  get (header: string): string | string[] | undefined {
    return this.headers[header.toLowerCase()];
  }
}
