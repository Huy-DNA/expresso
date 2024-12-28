# expresso

Recreate a Node.js (actually Deno, but I'll use Deno's Node APIs) web framework, which implements:
* HTTP server:
    - The HTTP API in Node has handled concurrent connections well. The HTTP API also provides us a low-level mechanism to extract request headers, cookies and body. This is incovenient sometimes, for example, an HTTP request body is streamed incrementally and we need to put together the chunks to get the full body. -> We'll provide a higher-level way to extract a full request and access its fields.
    - The HTTP API in Node only handles HTTP at the connection level. The semantics and interpretation of HTTP requests are still not defined, for example, content negotiation, file uploads, request header interpretation, conditional-GET handling. The HTTP server, to be compliant with the HTTP RFC 9110 & RFC 9112, needs to provide some sensible defaults.
    - We also need to handle large file downloads by breaking it into multiple HTTP responses.
* Web framework - After we have an HTTP server with sensible defaults, the web framework should allow users to:
    - Specify routes & handlers.
    - Specify middleware.
    - Parse query string, request body (based on content-type), cookies, so that the users can easily extract these information.
    - Quickly build responses: send cookies, serve static files, render HTML.

I tend to overdesign/over-engineer, so in this project, I'll try to write code right away and only abstract when blocked.

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
    - Avoid following symlinks.
  - Range requests.

- Always read raw data into `Buffer` instead of `string`.

## To do

- Write comprehensive tests.
