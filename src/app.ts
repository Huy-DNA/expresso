import http from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { Request } from "./request.ts";
import { Response } from "./response.ts";

export class ExpressoApp {
  private server: Server;

  constructor () {
    this.server = http.createServer(
      async (_req: IncomingMessage, _res: ServerResponse) => {
        const req = new Request(this, _req);
        const res = new Response(this, _res);
        await Promise.all([req.init({ res }), res.init({ req })]);
        
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
