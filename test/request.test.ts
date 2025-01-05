import { expect } from "jsr:@std/expect";

import expresso from "../src/index.ts";
import { HttpMethod } from "../src/types.ts";

async function fetchUrl (url: string, method: HttpMethod = HttpMethod.GET, headers: { [key: string]: string } = {}, body: Blob | null = null): Promise<unknown> {
  return await fetch(new Request(url, { method, headers, body: body })).then((res) => res.text());
}

Deno.test("Request 'originalUrl' is correctly delivered", async () => { 
  const app = expresso();
  app.use((req, res) => res.send(req.originalUrl));
  app.listen(8000);

  expect(await fetchUrl("http://localhost:8000")).toEqual("/");
  expect(await fetchUrl("http://localhost:8000/path")).toEqual("/path");
  expect(await fetchUrl("http://localhost:8000/path?q=1")).toEqual("/path?q=1");
  expect(await fetchUrl("http://localhost:8000/path/?q=1")).toEqual("/path/?q=1");
  expect(await fetchUrl("http://localhost:8000/path?q[0]=1&q[1]=1")).toEqual("/path?q[0]=1&q[1]=1");
  expect(await fetchUrl("http://localhost:8000/path/?q=%20")).toEqual("/path/?q=%20");

  app.close();
});

Deno.test("Request 'path' is correctly delivered", async () => { 
  const app = expresso();
  app.use((req, res) => res.send(req.path));
  app.listen(8000);

  expect(await fetchUrl("http://localhost:8000")).toEqual("/");
  expect(await fetchUrl("http://localhost:8000/path")).toEqual("/path");
  expect(await fetchUrl("http://localhost:8000/path/")).toEqual("/path/");
  expect(await fetchUrl("http://localhost:8000/path?q=1")).toEqual("/path");
  expect(await fetchUrl("http://localhost:8000/path/?q=1")).toEqual("/path/");
  expect(await fetchUrl("http://localhost:8000/path?q[0]=1&q[1]=1")).toEqual("/path");
  expect(await fetchUrl("http://localhost:8000/path/?q=%20")).toEqual("/path/");

  app.close();
});

Deno.test("Request 'params' is correctly delivered", async () => { 
  const app = expresso();
  app.get("/tld", (req, res) => res.send(req.params));
  app.get("/tld/:id", (req, res) => res.send(req.params));
  app.get("/:id", (req, res) => res.send(req.params));
  app.listen(8000);

  expect(await fetchUrl("http://localhost:8000/tld")).toEqual("{}");
  expect(await fetchUrl("http://localhost:8000/tld/3")).toEqual("{\"id\":\"3\"}");
  expect(await fetchUrl("http://localhost:8000/abc")).toEqual("{\"id\":\"abc\"}");

  app.close();
});

Deno.test("Request 'query' is correctly delivered", async () => { 
  const app = expresso();
  app.use((req, res) => res.send(JSON.stringify(req.query)));
  app.listen(8000);

  async function extractQuery (url: string): Promise<object> {
    return await fetchUrl(url).then((res) => JSON.parse(res as string));
  }

  expect(await extractQuery("http://localhost:8000")).toEqual({});
  expect(await extractQuery("http://localhost:8000/path")).toEqual({});
  expect(await extractQuery("http://localhost:8000/path/")).toEqual({});
  expect(await extractQuery("http://localhost:8000/path?q=1")).toEqual({ q: "1" });
  expect(await extractQuery("http://localhost:8000/path/?q=1")).toEqual({ q: "1" });
  expect(await extractQuery("http://localhost:8000/path?q[0]=1&q[1]=1")).toEqual({ q: ["1", "1" ]});
  expect(await extractQuery("http://localhost:8000/path/?q=%20")).toEqual({ q: " " });
  expect(await extractQuery("http://localhost:8000/path/?q[%20]=bar&q[7]=foo&q['2']=3")).toEqual({ q: { " ": "bar", "7": "foo", "'2'": "3" } });

  app.close();
});

Deno.test("Request 'host' is correctly delivered", async () => { 
  const app = expresso();
  app.use((req, res) => res.send(req.host));
  app.listen(8000);

  expect(await fetchUrl("http://localhost:8000")).toEqual("localhost:8000");

  app.close();
});

Deno.test("Request 'ip' is correctly delivered", async () => { 
  const app = expresso();
  app.use((req, res) => res.send(req.ip));
  app.listen(8000);

  expect(await fetchUrl("http://localhost:8000")).toEqual("127.0.0.1");

  app.close();
});

Deno.test("Request 'METHOD' is correctly delivered", async () => { 
  const app = expresso();
  app.use((req, res) => res.send(req.method));
  app.listen(8000);

  expect(await fetchUrl("http://localhost:8000", HttpMethod.GET)).toEqual("GET");
  expect(await fetchUrl("http://localhost:8000", HttpMethod.POST)).toEqual("POST");
  expect(await fetchUrl("http://localhost:8000", HttpMethod.PUT)).toEqual("PUT");
  expect(await fetchUrl("http://localhost:8000", HttpMethod.PATCH)).toEqual("PATCH");
  // expect(await fetchUrl("http://localhost:8000", HttpMethod.HEAD)).toEqual("HEAD");
  expect(await fetchUrl("http://localhost:8000", HttpMethod.OPTIONS)).toEqual("OPTIONS");
  expect(await fetchUrl("http://localhost:8000", HttpMethod.DELETE)).toEqual("DELETE");
  // expect(await fetchUrl("http://localhost:8000", HttpMethod.TRACE)).toEqual("TRACE");

  app.close();
});

Deno.test("Request 'cookies' is correctly delivered", async () => { 
  const app = expresso();
  app.use((req, res) => res.send(req.cookies));
  app.listen(8000);

  async function extractCookie (url: string, cookies: Record<string, string>): Promise<object> {
    return await fetchUrl(url, HttpMethod.GET, cookies).then((res) => JSON.parse(res as string));
  }

  expect(await extractCookie("http://localhost:8000", {})).toEqual({});
  expect(await extractCookie("http://localhost:8000", { "Cookie": "a=3"})).toEqual({ a: "3" });
  expect(await extractCookie("http://localhost:8000", { "CookiE": "a=3"})).toEqual({ a: "3" });
  expect(await extractCookie("http://localhost:8000", { "CooKiE": "a=3;b=2"})).toEqual({ a: "3", b: "2" });
  expect(await extractCookie("http://localhost:8000", { "CooKiE": "a=3;b=\"2"})).toEqual({ a: "3", b: "\"2" });
  expect(await extractCookie("http://localhost:8000", { "CooKiE": "a=3;b=2%3B"})).toEqual({ a: "3", b: "2;" });

  app.close();
});
