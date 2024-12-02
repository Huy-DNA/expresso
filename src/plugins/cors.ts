import type { Handler } from "../types.ts";
import { HttpMethod } from "../types.ts";

// A subset of express's `cors()` plugin. See https://expressjs.com/en/resources/middleware/cors.html.
export interface CorsOption {
  readonly origin?: string | boolean | string[] | '*';
  readonly methods?: HttpMethod[];
  readonly optionsSuccessStatus?: number;
  readonly allowedHeaders?: string[];
  readonly exposedHeaders?: string[];
  readonly credentials?: boolean;
  readonly preflightContinue?: boolean;
}

export function cors ({
  origin = '*',
  methods = [HttpMethod.GET, HttpMethod.HEAD, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.POST, HttpMethod.DELETE],
  preflightContinue = false,
  optionsSuccessStatus = 204,
  credentials,
  exposedHeaders,
  allowedHeaders,
}: CorsOption): Handler {
  return (req, res, next) => {
  };
}
