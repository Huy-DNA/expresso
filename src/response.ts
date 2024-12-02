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
  private headers: {
    'content-type'?: string;
    'content-length'?: string;
    [index: string]: string | undefined;
  };

  constructor (app: ExpressoApp, _res: ServerResponse) {
    this.app = app;
    this._res = _res;
    this.headers = {};
  }

  append (field: string, values: string | string[]): Response {
    const value = Array.isArray(values) ? values.join(',') : values;
    this.headers[field] = value;
    return this;
  }

  status (code: number): Response {
    this.statusCode = code;
    return this;
  }

  send (data: Buffer | string | JsonConvertible): Response {
    if (data instanceof Buffer) {
      this.body = data;
      this.headers["content-type"] = "application/octet-stream";
    } else if (typeof data === "string") {
      this.body = data;
      this.headers["content-type"] = "text/html";
    } else {
      this.body = JSON.stringify(data);
      this.headers["content-type"] = "application/json";
    }
    this.headers["content-length"] = this.body.length.toString();
    return this;
  }

  end = once(() => {
    this._res.writeHead(this.statusCode || 500, this.headers);
    this._res.end(this.body || '');
  });
}
