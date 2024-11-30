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
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  CONNECT = "CONNECT",
  OPTIONS = "OPTIONS",
  TRACE = "TRACE",
  PATCH = "PATCH",
}
