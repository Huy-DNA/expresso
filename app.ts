import http from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { Request } from "./request.ts";
import { Response } from "./response.ts";

async function readRequestBody (req: IncomingMessage) {
  return await new Promise((resolve) => {
    let data = '';
    req.on("data", chunk => data += chunk);
    req.on("end", () => resolve(data));
  });
}

export class ExpressoApp {
  private server: Server;

  constructor () {
    this.server = http.createServer(
      async (_req: IncomingMessage, _res: ServerResponse) => {
        const req = new Request(this, _req);
        (req.body as unknown) = await readRequestBody(_req);
        const res = new Response(this, _res);
        
        (req.res as Response) = res;
        (res.req as Request) = req;

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
