import { ExpressoApp } from "./app.ts";
import { bodyParser } from "./plugins/body-parser.ts";
import { cors } from "./plugins/cors.ts";

export default function () {
  return new ExpressoApp();
}

export type { Request } from "./request.ts";
export type { Response } from "./response.ts";
export type { ExpressoApp } from "./app.ts";

if (import.meta.main) {
  const app = new ExpressoApp();
  app.use(cors());
  app.use(bodyParser.json());
  app.use('/home', (req, res, next) => res.status(200).cookie('id1', '1234', {}).cookie('id2', '1234', {}).send('Hello world!').append('header', ['1', '2']).append('header', ['3', '4']).end());
  app.use('/contact', () => {});
  app.listen(8000);
}
