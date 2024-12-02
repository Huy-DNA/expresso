import { Response } from "./index.ts";
import { Request } from "./request.ts";

export type JsonConvertible =
  | string
  | boolean
  | number
  | undefined
  | null
  | JsonArray
  | JsonObject;
interface JsonArray extends Array<JsonConvertible> {}
interface JsonObject extends Record<string, JsonConvertible> {}

export enum HttpMethod {
  GET = "GET",
  HEAD = "HEAD",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  CONNECT = "CONNECT",
  OPTIONS = "OPTIONS",
  TRACE = "TRACE",
  PATCH = "PATCH",
}

export type NextHandler = () => void;

export type Handler = (req: Request & Record<string, unknown>, res: Response, next: NextHandler) => void | Promise<void>;
