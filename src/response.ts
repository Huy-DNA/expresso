import type { ServerResponse } from "node:http";
import { Buffer } from "node:buffer";
import { ExpressoApp } from "./app.ts";
import { Request } from "./request.ts";
import { JsonConvertible } from "./types.ts";

export class Response {
  private _res;
  private isEnded: boolean;
  
  readonly req!: Request; // filled inside init()
  readonly app: ExpressoApp;

  private statusCode: number | undefined;  
  private body: Buffer | string | undefined;
  private contentType: string | undefined;
  private get contentLength (): number {
    return this.body ? this.body.length : 0;
  }

  constructor (app: ExpressoApp, _res: ServerResponse) {
    this.app = app;
    this._res = _res;
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
    this._res.writeHead(this.statusCode || 200, { "content-length": this.contentLength, "content-type": this.contentType || 'plain/text' });
    this._res.end(this.body);
  }
}
