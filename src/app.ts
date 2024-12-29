import http from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { Request } from "./request.ts";
import { Response } from "./response.ts";
import { Handler, HttpMethod } from "./types.ts";

class Route {
  private patterns: RegExp[];

  constructor (route: string | string[], options: { asPrefix: boolean; }) { 
    if (typeof route === "string") {
      this.patterns = [pathToRegex(Route.normalizePath(route))];
    } else {
      this.patterns = route.map(Route.normalizePath).map(pathToRegex);
    } 
    
    function pathToRegex (path: string): RegExp {
      return new RegExp(`^${path}${options.asPrefix ? '' : '$'}`);
    }
  }

  match (route: string): boolean {
    return this.patterns.some((pattern) => !!Route.normalizePath(route).match(pattern));
  }

  private static normalizePath (path: string): string {
    if (!path.endsWith('/')) path += '/';
    if (!path.startsWith('/')) path = '/' + path;
    return path;
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
      this.routers.push({ handler: routeOrHandler, route: new Route('.*', { asPrefix: true }), method: '*' });
    }
    return this;
  }

  get (route: string, callback: Handler): this {
    this.routers.push({ route: new Route(route, { asPrefix: false }), method: HttpMethod.GET, handler: callback });
    return this;
  }

  post (route: string, callback: Handler): this {
    this.routers.push({ route: new Route(route, { asPrefix: false }), method: HttpMethod.POST, handler: callback });
    return this;
  }

  head (route: string, callback: Handler): this {
    this.routers.push({ route: new Route(route, { asPrefix: false }), method: HttpMethod.HEAD, handler: callback });
    return this;
  }

  patch (route: string, callback: Handler): this {
    this.routers.push({ route: new Route(route, { asPrefix: false }), method: HttpMethod.PATCH, handler: callback });
    return this;
  }

  put (route: string, callback: Handler): this {
    this.routers.push({ route: new Route(route, { asPrefix: false }), method: HttpMethod.PUT, handler: callback });
    return this;
  }

  options (route: string, callback: Handler): this {
    this.routers.push({ route: new Route(route, { asPrefix: false }), method: HttpMethod.OPTIONS, handler: callback });
    return this;
  }

  delete (route: string, callback: Handler): this {
    this.routers.push({ route: new Route(route, { asPrefix: false }), method: HttpMethod.DELETE, handler: callback });
    return this;
  }

  trace (route: string, callback: Handler): this {
    this.routers.push({ route: new Route(route, { asPrefix: false }), method: HttpMethod.TRACE, handler: callback });
    return this;
  }

  connect (route: string, callback: Handler): this {
    this.routers.push({ route: new Route(route, { asPrefix: false }), method: HttpMethod.CONNECT, handler: callback });
    return this;
  }

  all (route: string, callback: Handler): this {
    this.routers.push({ route: new Route(route, { asPrefix: false }), method: '*', handler: callback });
    return this;
  }

  listen (port: number) {
    console.log(`Expresso server is running on ${port}`);
    this.server.listen(port);
  }
}
