import http from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

class ExpressoApp {
}

export { type ExpressoApp };

export default function () {
  return new ExpressoApp();
}
