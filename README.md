# expresso

Recreate a Node.js (actually Deno, but I'll use Deno's Node APIs) web framework, which implements:
* HTTP server:
    - The HTTP API in Node has handled concurrent connections well. The HTTP API also provides us a low-level mechanism to extract request headers, cookies and body. This is incovenient sometimes, for example, an HTTP request body is streamed incrementally and we need to put together the chunks to get the full body. -> We'll provide a higher-level way to extract a full request and access its fields.
    - The HTTP API in Node only handles HTTP at the connection level. The semantics and interpretation of HTTP requests are still not defined, for example, content negotiation, file uploads, request header interpretation, conditional-GET handling. The HTTP server to be compliant with the HTTP RFC 9112, needs to provide some sensible defaults.
    - We also need to handle large file downloads by breaking it into multiple HTTP responses.
* Web framework - After we have an HTTP server with sensible defaults, the web framework should allow users to:
    - Specify routes & handlers.
    - Specify middleware.
    - Parse query string, request body (based on content-type), cookies, so that the users can easily extract these information.
    - Quickly build responses: send cookies, serve static files, render HTML.

I tend to overdesign/over-engineer, so in this project, I'll try to write code right away and only abstract when blocked.

## Progress log

1. The `ExpressoApp` class is created to emulate the usual `app` in `express`, wrapping around `node:http`'s `Server`:
   - Implement `ExpressoApp.listen(port)` method, which is a thin wrapper around `node:http`'s `Server.listen()`.
   - Export a default function that returns an `ExpressoApp`.
2. `HttpMethod` enum.
3. `Request` and `Response` classes for wrapping `node:http`'s respective `IncomingMessage` and `ServerResponse`.
   - `Request` can retrieve basic information about the `IncomingMessage`: `path`, `query`, `host`, `cookies`, `headers`, etc.
   - `Response` can be set content, status codes & sent.
4. `ExpressoApp` allows for registering routes, plugins can now be defined in the form of functions (or closures).
   ```js
    const app = new ExpressoApp();
    app.use('/', (req, res, next) => res.status(200).send('Hello world!').end());
    app.listen(8000);
   ```
   Currently the behavior is as follows, based on what I observe about `express`:
   - If no route matches a request path, `404` is returned with message `Cannot match ${method} ${path}`. This is implemented.
   - If a route matches a request path but the handler does not explictly call `send()` or `end()`, the request hangs (if this is the last matched route or `next` isn't called). This is not implemented as it seems trivial & make my implementation trickier.
5. `Response` can be appended headers, multiple headers with same names are separated by `,`, according to the RFC.
