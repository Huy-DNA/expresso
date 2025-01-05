import { expect } from "jsr:@std/expect";

import expresso from "../src/index.ts";
import { HttpMethod } from "../src/types.ts";

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
