import type { ServerResponse } from "node:http";
import { Buffer } from "node:buffer";
import { ExpressoApp } from "./app.ts";
import { Request } from "./request.ts";
import { JsonConvertible } from "./types.ts";
import { once } from "./utils.ts";

export class Response {
  _res: ServerResponse;
  
  readonly req!: Request;
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
    const header = this.headers[field.toLowerCase()];
    this.headers[field] = header === undefined ? value : `${header},${value}`;
    return this;
  }

  get (field: string): string | string[] | undefined {
    return this.headers[field.toLowerCase()];
  }

  set (field: string, value: string): Response {
    this.headers[field.toLowerCase()] = value;
    return this;
  }

  cookie (
    name: string,
    value: string,
    {
      domain,
      encode = encodeURIComponent,
      expires = 0,
      httpOnly,
      maxAge,
      path = "/",
      secure,
      sameSite,
    }:
    {
      domain?: string;
      encode?: (_: string) => string;
      expires?: Date | 0;
      httpOnly?: boolean;
      maxAge?: number;
      path?: string;
      secure?: boolean;
      sameSite?: "None" | "Lax" | "Strict";
    } = {},
  ): Response {
    let cookies = this._res.getHeader('Set-Cookie') || [];
    if (!Array.isArray(cookies)) cookies = [cookies.toString()];
    const newCookie = `${name}=${encode(value)}; Path=${path} ${domain ? `;Domain=${domain}` : ''} ${httpOnly ? ';HttpOnly' : ''} ${sameSite ? `;SameSite=${sameSite}` : ''} ${secure ? ';Secure' : ''} ${maxAge !== undefined ? `;Max-Age=${maxAge}` : ''} ${expires ? `;Expires=${expires.toUTCString()}` : ''}`;
    cookies.push(newCookie);
    this._res.setHeader('Set-Cookie', cookies);
    return this;
  }

  status (code: number): Response {
    this.statusCode = code;
    return this;
  }

  sendStatus (code: number): Response {
    this.statusCode = code;
    this.body = code.toString();
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

  json (data: JsonConvertible): Response {
    this.body = JSON.stringify(data);
    this.headers["content-type"] = "application/json";
    return this;
  }

  location (path: string): Response {
    if (path === "back") {
      this.headers["location"] = this.req.get("referer")?.at(0) || "/";
    } else {
      this.headers["location"] = path; 
    }
    return this;
  }

  redirect (status: number, path: string): Response;
  redirect (path: string): Response;
  redirect (status: number | string, path?: string): Response {
    if (path !== undefined) {
      this.statusCode = status as number;
      return this.location(path);
    }
    this.statusCode = 302;
    return this.location(status as string);
  }

  end = once(() => {
    this._res.writeHead(this.statusCode || 200, this.headers);
    this._res.end(this.body || '');
  });

  get headersSent (): boolean {
    return this._res.headersSent;
  }

  vary (value: string): Response {
    return this.append('vary', value);
  }
}
