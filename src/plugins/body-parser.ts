import qs from "https://deno.land/x/deno_qs@0.0.3/mod.ts";
import { Handler } from "../types.ts";

export const bodyParser = {
  json (): Handler {
    return (req, res, next) => {
      if (req.get('content-type') !== 'application/json') return next();
      try {
        req.body = JSON.parse(req.body as string); 
        next();
      } catch {
        res.status(400).send("Query parser fails to parse JSON").end();
      }
    };
  },
  urlencoded (): Handler {
    return (req, res, next) => {
      if (req.get('content-type') !== 'application/x-www-form-urlencoded') return next();
      try {
        req.body = qs.parse(req.body);
        next();
      } catch {
        res.status(400).send("Query parser fails to parse urlencoded string").end();
      }
    };
  },
};
