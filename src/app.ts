import http from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { Request } from "./request.ts";
import { Response } from "./response.ts";
import { Handler, HttpMethod } from "./types.ts";

class Route {
  private patterns: RegExp[];

  constructor (route: string | string[], options: { asPrefix: boolean; }) { 
    if (typeof route === "string") {
      this.patterns = [pathToRegex(normalizePath(route))];
    } else {
      this.patterns = route.map(normalizePath).map(pathToRegex);
    }
    
    function normalizePath (path: string): string {
      if (path.slice(-1) !== '/') path += '/';
      path = path.replaceAll('*', '.*');
      return path;
    }

    function pathToRegex (path: string): RegExp {
      return new RegExp(`^${path}${options.asPrefix ? '' : '$'}`);
    }
  }

  match (route: string): boolean {
    if (route.slice(-1) !== '/') route += '/';
    return this.patterns.some((pattern) => !!route.match(pattern));
  }
}

export class ExpressoApp {
  private server: Server;
  private routers: { route: Route; method: HttpMethod | '*'; handler: Handler }[];

  constructor () {
    this.routers = [];
    this.server = http.createServer(
      async (_req: IncomingMessage, _res: ServerResponse) => {
        const req = new Request(this, _req);
        const res = new Response(this, _res);
        (req.res as Response) = res;
        (res.req as Request) = req;
        
        let matchedOnce = false;
        for (const router of this.routers) {
          if (!router.route.match(req.path) || ![req.method, '*'].includes(router.method)) continue;
          matchedOnce = true;

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
        
        if (!matchedOnce) {
          res.status(404).send(`Cannot ${req.method} ${req.path}`);
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
      this.routers.push({ route: new Route(routeOrHandler, { asPrefix: true }), method: '*', handler: handler! });
    } else if (Array.isArray(routeOrHandler)) {
      this.routers.push(...routeOrHandler.map((r) => ({ route: new Route(r, { asPrefix: true }), method: '*' as const, handler: handler! })));
    } else {
      this.routers.push({ handler: routeOrHandler, route: new Route('*', { asPrefix: true }), method: '*' });
    }
    return this;
  }

  listen (port: number) {
    console.log(`Expresso server is running on ${port}`);
    this.server.listen(port);
  }
}
