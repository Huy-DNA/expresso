import type { IncomingMessage } from "node:http";
import * as cookie from "npm:cookie@1.0.2";
import qs from "https://deno.land/x/deno_qs/mod.ts";
import { HttpMethod } from "./types.ts";
import { ExpressoApp } from "./app.ts";
import { Response } from "./response.ts";

export class Request {
  private _req: IncomingMessage;

  readonly app: ExpressoApp;
  readonly res?: Response; // filled outside of the constructor

  readonly body?: unknown; // filled outside of the constructor
  readonly cookies: Readonly<Record<string, string | undefined>>;
  readonly host: string;
  readonly hostname: string;
  readonly ip?: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly query: Readonly<Record<string, string>>;

  constructor (app: ExpressoApp, _req: IncomingMessage) {
    this.app = app;
    this._req = _req;

    const { headers } = _req;

    this.cookies = !headers.cookie ? {} : cookie.parse(headers.cookie);

    this.host = headers.host || "";
    this.hostname = headers.host || "";

    this.method = _req.method as HttpMethod;

    const url = new URL(`http://expresso.com/${headers.host}`);
    this.path = url.pathname;
    this.query = qs.parse(url.search);

    this.ip = _req.socket.remoteAddress;
  }
}
