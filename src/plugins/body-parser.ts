import qs from "https://deno.land/x/deno_qs@0.0.3/mod.ts";
import { Handler } from "../types.ts";
import { Buffer } from "node:buffer";
import { Request } from "../request.ts";

async function readRequestBody (req: Request): Promise<Buffer> {
  return await new Promise((resolve) => {
    let data = Buffer.from("");
    req._req.on("data", (chunk: Buffer) => data = Buffer.concat([data, chunk]));
    req._req.on("end", () => resolve(data));
  });
}

export const bodyParser = {
  raw (): Handler {
    return async (req, res, next) => {
      req.body = await readRequestBody(req);
      req.body = next();
    };
  },
  text (): Handler {
    return async (req, res, next) => {
      try {
        req.body = (await readRequestBody(req)).toString();
        next();
      } catch {
        res.status(400).send("Query parser fails to parse text").end();
      }
    };
  },
  json (): Handler {
    return async (req, res, next) => {
      if (req.get("content-type") !== "application/json") return next();
      try {
        req.body = JSON.parse((await readRequestBody(req)).toString());
        next();
      } catch {
        res.status(400).send("Query parser fails to parse JSON").end();
      }
    };
  },
  urlencoded(): Handler {
    return async (req, res, next) => {
      if (req.get("content-type") !== "application/x-www-form-urlencoded") {
        return next();
      }
      try {
        req.body = qs.parse((await readRequestBody(req)).toString());
        next();
      } catch {
        res.status(400).send("Query parser fails to parse urlencoded string")
          .end();
      }
    };
  },
};
