import http from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

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

class ExpressoApp {
  private server: Server;

  constructor () {
    this.server = http.createServer(
      (req: IncomingMessage, res: ServerResponse) => {
        const body = "hello world";
        res.writeHead(200, {
          "Content-Type": "text/plain",
          "Content-Length": body.length,
        });
        res.end(body);
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
