import http from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { Request } from "./request.ts";
import { Response } from "./response.ts";
import { Handler } from "./types.ts";

function normalizeRoute (route: string): string {
  if (route.slice(-1) === '/') return route.slice(0, -1);
  return route;
}

export class ExpressoApp {
  private server: Server;
  private routers: { route?: string; handler: Handler }[];

  constructor () {
    this.routers = [];
    this.server = http.createServer(
      async (_req: IncomingMessage, _res: ServerResponse) => {
        const req = new Request(this, _req);
        const res = new Response(this, _res);
        (req.res as Response) = res;
        (res.req as Request) = req;
        
        for (const router of this.routers) {
          if (router.route !== undefined && router.route !== req.path) continue;

          let shouldContinue = false;
          // deno-lint-ignore no-inner-declarations
          function next () {
            shouldContinue = true;
          }
          
          const result = router.handler(req as Request & Record<string, unknown>, res, next);
          if (result instanceof Promise) {
            await result;
          }
          
          if (!shouldContinue) break;
        }
        
        if (this.routers.every(({ route }) => route !== undefined && route !== req.path)) {
          res.status(404).send(`Cannot match ${req.method} ${req.path}`);
        }

        /* Implicitly end the response */
        res.end();
      },
    );
  }

  use (route: string, handler: Handler): this;
  use (route: string[], handler: Handler): this;
  use (handler: Handler): this;
  use (routeOrHandler: string | string[] | Handler, handler?: Handler): this {
    if (typeof routeOrHandler === 'string') {
      this.routers.push({ route: normalizeRoute(routeOrHandler), handler: handler! });
    } else if (Array.isArray(routeOrHandler)) {
      this.routers.push(...routeOrHandler.map((r) => ({ route: normalizeRoute(r), handler: handler! })));
    } else {
      this.routers.push({ handler: routeOrHandler });
    }
    return this;
  }

  listen (port: number) {
    console.log(`Expresso server is running on ${port}`);
    this.server.listen(port);
  }
}
