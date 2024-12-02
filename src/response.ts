import type { ServerResponse } from "node:http";
import { Buffer } from "node:buffer";
import { ExpressoApp } from "./app.ts";
import { Request } from "./request.ts";
import { JsonConvertible } from "./types.ts";
import { once } from "./utils.ts";

export class Response {
  private _res;
  
  readonly req!: Request; // filled inside init()
  readonly app: ExpressoApp;

  private statusCode: number | undefined;  
  private body: Buffer | string | undefined;
  private contentType: string | undefined;

  constructor (app: ExpressoApp, _res: ServerResponse) {
    this.app = app;
    this._res = _res;
  }

  status (code: number): Response {
    this.statusCode = code;
    return this;
  }

  send (data: Buffer | string | JsonConvertible): Response {
    if (data instanceof Buffer) {
      this.body = data;
      this.contentType = "application/octet-stream";
    } else if (typeof data === "string") {
      this.body = data;
      this.contentType = "text/html";
    } else {
      this.body = JSON.stringify(data);
      this.contentType = "application/json";
    }
    return this;
  }

  end = once(() => {
    this._res.writeHead(this.statusCode || 200, { "content-length": this.body?.length || 0, "content-type": this.contentType || 'text/html' });
    this._res.end(this.body || '');
  });
}
