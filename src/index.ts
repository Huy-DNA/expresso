import { ExpressoApp } from "./app.ts";

export default function () {
  return new ExpressoApp();
}

export type { Request } from "./request.ts";
export type { Response } from "./response.ts";
export type { ExpressoApp } from "./app.ts";

if (import.meta.main) {
  (new ExpressoApp()).listen(8000);
}