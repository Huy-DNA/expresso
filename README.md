# expresso

Recreate a Node.js (actually Deno) web framework. The API mirrors (a subset of) [expressjs](https://expressjs.com/).

## Rationale

- Personal engineering skill issues:
  - Sloppy abstractions.
    - Wrong abstractions.
    - Unnecessary abstraction a.k.a adding to high cognitive load.
    - Abstractions that don't compose a.k.a one-shot abstractions a.k.a abstractions that are there *only* for the sake of deduplicating code a.k.a very inelegent.
  - Unnecessarily complex code.
- The `expressjs` API to me is very elegant:
  - Simple/Straightforward.
  - Streamline:
    ```ts
    res.status(200).send("This is the response");
    ```
  - Composable: You can create complex handlers and register it with `express()`, be it a simple function or a complex `Router`, which is itself a set of registered functions or `Router`s.
    ```ts
    const cRouter = express.Router();
    cRouter.use('/child', ...);

    const pRouter = express.Router();
    pRouter.use('/parent', cRouter);

    const app = express();
    app.use('/app', pRouter);
    ```
    
    After reading the classic SICP book ([my notes](https://github.com/Huy-DNA/sicp)), this property is called `closure` - `expressjs` allows the combination of handlers and the result can itself be combined further.
- I want to play with Node's HTTP API a bit.

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

#### `App.use([path], callback)`

Like `expressjs`'s `app.use`.

- `path`: The path for which the middleware function is invoked; can be any of:
  - A string representing a path.
  - A path pattern string using JS's regex notation (this differ from `express`).
  - An array of combinations of any of the above.
- `callback`: A function of type `(req: Request, res: Response, next: (void) => unknown) => unknown`.

With `path` omitted, `'.*'` is assumed and `callback` is invoked for all `path`.

#### `App.METHOD([path], callback)`

Like `expressjs`'s `app.METHOD`.

`METHOD` is one of the HTTP methods or `all`.

#### `App.listen(port)`

Start the HTTP and listening on port `port`.
