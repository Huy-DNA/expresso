import { expect } from "jsr:@std/expect";

import expresso, { bodyParser } from "../src/index.ts";
import { HttpMethod } from "../src/types.ts";
import { Buffer } from "node:buffer";

async function fetchUrl (url: string, method: HttpMethod = HttpMethod.GET, headers: { [key: string]: string } = {}, body: Blob | null = null): Promise<Response> {
  return await fetch(new Request(url, { method, headers, body: body }));
}

Deno.test("Response `status` works correctly", async () => { 
  const app = expresso();
  app.use("\\d+", (req, res) => res.status(Number.parseInt(req.path.slice(1))));
  app.listen(8000);

  for (const i of [
    200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
    300, 301, 302, 303, 304, 307, 308,
    400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
    500, 401, 502, 503, 504, 505, 506, 507, 508, 510, 511,
  ]) {
    const res = await fetchUrl(`http://localhost:8000/${i}`);
    expect(res.status).toEqual(i);
    expect([null, "0"]).toContainEqual(res.headers.get("Content-Length"));
    expect(await res.text()).toEqual("");
  }

  app.close();
});

Deno.test("Response `sendStatus` works correctly", async () => { 
  const app = expresso();
  app.use("\\d+", (req, res) => res.sendStatus(Number.parseInt(req.path.slice(1))));
  app.listen(8000);

  for (const i of [
    200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
    300, 301, 302, 303, 304, 307, 308,
    400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
    500, 401, 502, 503, 504, 505, 506, 507, 508, 510, 511,
  ]) {
    const res = await fetchUrl(`http://localhost:8000/${i}`);
    expect([null, "0", i.toString().length.toString()]).toContainEqual(res.headers.get("Content-Length"));
    expect(["", i.toString()]).toContainEqual(await res.text());
  }

  app.close();
});

Deno.test("Response headers `set` works correctly", async () => { 
  const app = expresso();
  app.use('/set', (req, res) => {
    const query = req.query;
    for (const header in query) {
      const value = req.query[header];
      const values = Array.isArray(value) ? value : [value];
      for (const v of values) {
        res.set(header, v);
      }
    }
  });
  app.listen(8000);
  
  for (const header of [
    { a: 1, b: 2 },
    { a: ["b", "c", "-", "_"], b2: [2, "a"] },
    { "1": ["b", "c", "-", "_"], "1b": [2, "a"] },
    { "1a-_": ["c"] },
  ]) {
    const query = Object.entries(header)
      .flatMap(([key, value]) => Array.isArray(value)
        ? value.map((v, id) => `${key}[${id}]="${v}"`)
        : `${key}="${value}"`
      ).join("&");
    const res = await fetchUrl(`http://localhost:8000/set?${query}`);
    for (const [key, value] of Object.entries(header)) {
      expect(res.headers.get(key)).toEqual("\"" + (Array.isArray(value) ? value.slice(-1) : value) + "\"");
    }
    expect(await res.text()).toEqual("");
  }

  app.close();
});

Deno.test("Response headers `append` works correctly", async () => { 
  const app = expresso();
  app.use('/append', (req, res) => {
    const query = req.query;
    for (const header in query) {
      const value = req.query[header];
      const values = Array.isArray(value) ? value : [value];
      for (const v of values) {
        res.append(header, v);
      }
    }
  });
  app.listen(8000);
  
  for (const header of [
    { a: 1, b: 2 },
    { a: ["b", "c", "-", "_"], b2: [2, "a"] },
    { "1": ["b", "c", "-", "_"], "1b": [2, "a"] },
    { "1a-_": ["c", 2, "-2"] },
  ]) {
    const query = Object.entries(header)
      .flatMap(([key, value]) => Array.isArray(value)
        ? value.map((v, id) => `${key}[${id}]="${v}"`)
        : `${key}="${value}"`
      ).join("&");
    const res = await fetchUrl(`http://localhost:8000/append?${query}`);
    for (const [key, value] of Object.entries(header)) {
      expect(res.headers.get(key)).toEqual(Array.isArray(value) ? value.map((v) => `"${v.toString()}"`).join(",") : `"${value.toString()}"`)
    }
    expect(await res.text()).toEqual("");
  }

  app.close();
})

Deno.test("Response `cookies` works correctly", async () => { 
  const app = expresso();
  app.use(bodyParser.json());
  app.use('/cookies', (req, res) => {
    const body = req.body as Record<string, { value: string; options: object }>;
    for (const name in body) {
      const { value, options } = body[name];
      (options as any)["expires"] = new Date((options as any)["expires"]);
      res.cookie(name, value, options);
    }
  });
  app.listen(8000);
  
  for (const cookies of [
    {
      a: { value: "1", options: { domain: "", expires: 0, httpOnly: false, maxAge: 0, path: "/", secure: false, sameSite: "Lax" } },
    },
    {
      a: { value: "a-1-2", options: { domain: "example.com", expires: 0, httpOnly: false, maxAge: 0, path: "/", secure: false, sameSite: "Lax" } },
      "a-1": { value: "abcdef", options: { domain: "", expires: 1000, httpOnly: true, maxAge: 10, path: "/path", secure: true, sameSite: "Strict" } },
    },
    {
      "-_a2": { value: "1234321asdgfc", options: { domain: "sub.example.com", expires: 10, httpOnly: true, maxAge: 0, path: "/", secure: false, sameSite: "None" } },
      "_-1": { value: "!", options: { domain: "", expires: Date.now(), httpOnly: true, maxAge: 10, path: "/path", secure: true, sameSite: "Strict" } },
    },
  ]) {
    const res = await fetchUrl(`http://localhost:8000/cookies`, HttpMethod.POST, { "Content-Type": "application/json" }, new Blob([JSON.stringify(cookies)]));
    const resCookies = res.headers.getSetCookie();
    for (let i = 0; i < Object.entries(cookies).length; ++i) {
      const [value, ...options] = resCookies[i].split(";").map((c) => c.trim());
      const entry = Object.entries(cookies)[i];
      expect(value).toEqual(`${entry[0]}=${entry[1].value}`);
    }
    expect(await res.text()).toEqual("");
  }

  app.close();
});

Deno.test("Response `send` works correctly with Buffer", async () => { 
  const app = expresso();
  app.use('/send', (req, res) => {
    res.send(Buffer.from("Hello world!"));
  });
  app.listen(8000);

  const res = await fetchUrl("http://localhost:8000/send");
  expect(res.status).toEqual(200);
  expect(res.headers.get("Content-Type")).toEqual("application/octet-stream");
  expect(res.headers.get("Content-Length")).toEqual("12");
  expect(await res.text()).toEqual("Hello world!");
  
  app.close();
});

Deno.test("Response `send` works correctly with String", async () => { 
  const app = expresso();
  app.use('/send', (req, res) => {
    res.send("Hello world!");
  });
  app.listen(8000);

  const res = await fetchUrl("http://localhost:8000/send");
  expect(res.status).toEqual(200);
  expect(res.headers.get("Content-Type")).toEqual("text/html");
  expect(res.headers.get("Content-Length")).toEqual(null);
  expect(await res.text()).toEqual("Hello world!");
  
  app.close();
});

Deno.test("Response `send` works correctly with JsonConvertible", async () => { 
  const app = expresso();
  app.use('/send', (req, res) => {
    res.send({ message: "Hello world!" });
  });
  app.listen(8000);

  const res = await fetchUrl("http://localhost:8000/send");
  expect(res.status).toEqual(200);
  expect(res.headers.get("Content-Type")).toEqual("application/json");
  expect(res.headers.get("Content-Length")).toEqual(null);
  expect(await res.text()).toEqual("{\"message\":\"Hello world!\"}");
  
  app.close();
});

Deno.test("Response `raw` works correctly", async () => { 
  const app = expresso();
  app.use('/raw', (req, res) => {
    res.raw("Hello world!");
  });
  app.listen(8000);

  const res = await fetchUrl("http://localhost:8000/raw");
  expect(res.status).toEqual(200);
  expect(res.headers.get("Content-Type")).toEqual(null);
  expect(res.headers.get("Content-Length")).toEqual("12");
  expect(await res.text()).toEqual("Hello world!");
  
  app.close();
});

Deno.test("Response `json` works correctly", async () => { 
  const app = expresso();
  app.use('/json', (req, res) => {
    res.json({ message: "Hello world!" });
  });
  app.listen(8000);

  const res = await fetchUrl("http://localhost:8000/json");
  expect(res.status).toEqual(200);
  expect(res.headers.get("Content-Type")).toEqual("application/json");
  expect(res.headers.get("Content-Length")).toEqual(null);
  expect(await res.text()).toEqual("{\"message\":\"Hello world!\"}");
  
  app.close();
});

Deno.test("Response `location` works correctly", async () => { 
  const app = expresso();
  app.use('/location', (req, res) => {
    res.location("/");
  });
  app.listen(8000);

  const res = await fetchUrl("http://localhost:8000/location");
  expect(res.headers.get("Content-Type")).toEqual(null);
  expect(res.headers.get("Content-Length")).toEqual("0");
  expect(res.headers.get("Location")).toEqual("/");
  expect(await res.text()).toEqual("");
  
  app.close();
});

Deno.test("Response `redirect` works correctly", async () => { 
  const app = expresso();
  app.use("/\\d*", (req, res) => {
    const status = Number.parseInt(req.path.slice(1));
    if (Number.isNaN(status)) {
      res.redirect("/redirect");
    } else {
      res.redirect(status, "/redirect");
    }
  });
  app.listen(8000);

  const res = await fetchUrl("http://localhost:8000/300");
  expect(res.status).toEqual(300);
  expect(res.headers.get("Content-Type")).toEqual(null);
  expect(res.headers.get("Content-Length")).toEqual("0");
  expect(res.headers.get("Location")).toEqual("/redirect");
  expect(await res.text()).toEqual("");
  
  app.close();
});

Deno.test("Response `vary` works correctly", async () => { 
  const app = expresso();
  app.use("/vary", (req, res) => {
    res.vary("Language");
  });
  app.listen(8000);

  const res = await fetchUrl("http://localhost:8000/vary");
  expect(res.status).toEqual(200);
  expect(res.headers.get("Content-Type")).toEqual(null);
  expect(res.headers.get("Content-Length")).toEqual("0");
  expect(res.headers.get("Vary")).toEqual("Accept-Encoding, Language");
  expect(await res.text()).toEqual("");
  
  app.close();
});
