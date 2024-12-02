import { ExpressoApp } from "./app.ts";

export default function () {
  return new ExpressoApp();
}

export type { Request } from "./request.ts";
export type { Response } from "./response.ts";
export type { ExpressoApp } from "./app.ts";

if (import.meta.main) {
  const app = new ExpressoApp();
  app.use('/home', (req, res, next) => res.status(200).send('Hello world!').append('header', ['1', '2']).append('header', ['3', '4']).end());
  app.use('/contact', () => {});
  app.listen(8000);
}
