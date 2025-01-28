# expresso

Recreate a Node.js (actually Deno) web framework. The API mirrors (a subset of) [expressjs](https://expressjs.com/).

## Rationale

- Personal engineering skill issues:
  - Sloppy abstractions.
    - Wrong abstractions.
    - Unnecessary abstraction or high-cognitive-load abstraction.
    - Abstractions that don't compose.
  - Unnecessarily complex code.
- The `expressjs` API to me is very elegant:
  - Simple/Straightforward.
  - Streamline:
    ```ts
    res.status(200).send("This is the response");
    ```
  - Composable: You can create complex handlers and register it with `express()`. The handler can be a simple function or a complex `Router`, which is itself a set of functions or `Router`s.
    ```ts
    const cRouter = express.Router();
    cRouter.use('/child', ...);

    const pRouter = express.Router();
    pRouter.use('/parent', cRouter);

    const app = express();
    app.use('/app', pRouter);
    ```
    
    After reading the classic SICP book ([my notes](https://github.com/Huy-DNA/sicp)), this property is called `closure` - `expressjs` allows the combination of handlers into a complex handler and the resulting handler can itself be combined further with other handlers.
- I want to play with Node's HTTP API a bit.

## Disclaimer

I don't intend to make this `express`-compatible. I can go extra length to do this, which will unlock the following things:
- Readily available test cases from `express` itself.
- The diverse plugin ecosystem of `express`.

This project is nothing but a toy for self-orientation.

## Why Node's HTTP API is not enough

As far as I know, the HTTP API in Node handles HTTP at mostly the connection level:
  - It can accept and serve concurrent connections well. The serving logic is left to the programmer.
  - It allows us to receive requests and send appropriate responses.
  - It provides us a low-level mechanism to extract request headers, cookies and body.

This is still lackluster (understandable) to be an HTTP-compliant HTTP server & a web framework.

  - In terms of an HTTP-compliant HTTP server, we need:
    - Content negotiation.
    - Conditional-GET handling.
    - Range requests.
    - etc.

    These are mostly left to the programmer in the Node's HTTP API & even in `express` to allow for more flexibility. However, `express` does provide ways to handle these easier.

  - In terms of a Web framework:
    - The HTTP API is primitive:
      - HTTP request body is streamed incrementally and we need to put together the chunks to get the full HTTP body.
      - HTTP cookies need to be manually parsed.
      - etc.
    - Some common functionality is missing:
      - Specifying routes & handlers.
      - Specifying middleware.
      - HTTP request body parsing based on its `Content-Type` header.
      - Quickly build responses: send cookies, serve static files, render HTML.

## Philosophy

Keep it simple. Just write the code first & abstract when needed *or* may abstract in advance but only minimally.

## What is implemented?

I intend to cover the breadth but not much depth:

- Easily extract headers, cookies, querystring, body from a request.
- Easily set headers, cookie, body on a response.
- Register a handler for a route. `Router`s are not supported.
- Serve static files.
- Support templating engines.

## Experience

- Path manipulation is tricky. Common operations I perform on a path:
  - Equality check:
    - Handle paths that can come in with or without the `/`.
    - Handle `..` and `.`
  - Ancestor/Descendant directory check:
    - Either the ancestor/descendant path can come in with or without `/`.

  -> May worth creating a `Path` abstraction to:
    - Normalize paths: Remove `..`, `.` and standardize whether to include trailing `/`.
    - Perform equality check.
    - Perform ancestor/descendant check.
- Serving static files takes some considerations and I may miss something:
  - Security issues:
    - Scope serving requests to some folder only: Be careful of relative paths, etc. This can lead to arbitrary files in the filesystem being sent.
    - Consider dotfiles - `static-serve` ignores these by default.
    - Avoid following symlinks (or just following but avoid allowing users to upload symlink). I just follow symlinks in this project.
  - Range requests.

- Always read raw data into `Buffer` instead of `string`.

## API reference

I don't want to create noise on jsr for this hobby project so if you wanna test this, please replace `'expresso'` with the path you clone it into in your project.

```ts
import expresso from 'expresso';
```

### App

```ts
import expresso from 'expresso';

const app = expresso();
```

#### `App.use([path]: string | string[], callback: Handler): App`

Like `expressjs`'s `app.use`.

- `path`: The path for which the middleware function is invoked; can be any of:
  - A string representing a path.
  - A path pattern string using an extension of JS's regex notation (this differs from `express`).
  - An array of combinations of any of the above.
- `callback`: A function of type `(req: Request, res: Response, next: (void) => unknown) => unknown`.

The path pattern strings can also contain the `:param` pattern, which is equivalent to: `(?<param>[^/]+)`.

With `path` omitted, `'.*'` is assumed and `callback` is invoked for all `path`.

#### `App.METHOD([path]: string | string[], callback: Handler): App`

Like `expressjs`'s `app.METHOD`.

`METHOD` is one of the HTTP methods or `all`.

#### `App.listen(port)`

Start the HTTP and listening on port `port`.

#### `App.close()`

Close the HTTP server.

### Request

#### `Request.body`

The request's body. By default, this is `undefined` - you need to use the `body-parser` plugin.

```ts
import { bodyParser } from 'expresso'
app.use([path], bodyParser.raw);  // `req.body` will return the raw content of the request's body.
app.use([path], bodyParser.json);  // `req.body` will return the content as json of the request's body.
app.use([path], bodyParser.urlencoded); // `req.body` will return the content of the request's body as urlencoded string.
```

#### `Request.cookies`

The request's cookies, which is an key-value object mapping cookie's name to the cookie's value.

#### `Request.host`

The value of the request's `Host` header. If the `Host` header is missing, this field is set to `""`.

#### `Request.method`

The method of the request.

#### `Request.originalUrl`

The full URL of the request.

#### `Request.path`

The requested path of the request, omitting the query string.

```ts
"/path?qs=q" // -> "/path"
"/path" // -> "/path"
```

#### `Request.params`

The path parameters of the matched route.

```ts
"/path/:id" // -> { id: "..." }
```

#### `Request.query`

The query string of the request, parsed using the `qs` package.

```ts
"/path?qs=q" // { qs: "q" }
"/path?qs[0]=q1&qs[1]=q2" // { qs: [ "q1", "q2" ] }
```

#### `Request.ip`

The IP address of the client.

### `Response`

#### `Response.append(field: string, values: string | string[]): Response`

Set the header `field` to a header value or an array of header values. If the header already exists, the header value is appended instead of being overridden.

#### `Response.get(field: string): string | string[] | undefined`

Get the value of the header `field`.

#### `Response.set(field, value: string): Response`

Set the header `field` to `value`.

#### `Response.cookie(name: string, value: string, options: object): Response`

Set a cookie `name` to `value` along with some options. The `options` object has the following optional fields:

- `domain?: string`: The `Domain` property of the cookie.
- `encode?: (_: string) => string`: Encode the cookie's value.
- `expires?: Date | 0`: The `Expires` property of the cookie.
- `httpOnly?: boolean`: The `HttpOnly` property of the cookie.
- `maxAge?: number`: The `Max-Age` property of the cookie.
- `path?: string`: The `Path` property of the cookie.
- `secure?: boolean`: The `Secure` property of the cookie.
- `sameSite?: "None" | "Lax" | "Strict"`: The `Same-Site` property of the cookie.

#### `Response.status(code: number): Response`

Set the response's status code.

#### `Response.sendStatus(code: number): Response`

Set the response's status code and the body also to `code`.

#### `Response.send(data: Buffer | string | JsonConvertible): Response`

- If `data` is a `Buffer`:
  - Set the response's body to `data`.
  - Set the `Content-Type` header to `application/octet-stream`.
  - Set the `Content-Length` header to `data`'s length.
- If `data` is a `String`:
  - Set the response's body to `data`.
  - Set the `Content-Type` header to `text/html`.
  - Set the `Content-Length` header to `data`'s length.
- If `data` is a `JsonConvertible` value:
  - Set the response's body to `data`.
  - Set the `Content-Type` header to `application/json`.
  - Set the `Content-Length` header to `data`'s length.

#### `Response.raw(data: Buffer | string): Response`

Like `Response.send` but do not set `Content-Type`.

#### `Response.json(data: JsonConvertible): Response`

Set the response's body to `data` and set the `Content-Type` header to `application/json`.

#### `Response.location(path: string): Response`

Set the `Location` header to `path`.

If `path` is `"back"`, set `Location` to the corresponding `Request`'s `Referer` header.

#### `Response.redirect([status]: number, path: string): Response`

Set the status code to `status` (by default 302) and set the `Location` header to `path`.

#### `Response.headersSent(): object`

Return the headers sent on this response.

#### `Response.vary(value: string): Response`

Append `value` to the `Vary` header.

#### `Reponse.type(value: string): Response`

Set the `Content-Type` header to `value`.
