import fs from "node:fs/promises";
import ms from "npm:ms";
import mime from "npm:mime";
import { Handler, HttpMethod } from "../types.ts";
import { createReadStream, ReadStream, Stats } from "node:fs";
import { Buffer } from "node:buffer";

// Based on `serve-static`: http://expressjs.com/id/resources/middleware/serve-static.html
export interface StaticServeOptions {
  acceptRanges?: boolean;
  cacheControl?: boolean;
  // dotfiles?: 'allow' | 'deny' | 'ignore';
  // etag?: boolean;
  // extensions?: string[] | false;
  fallthrough?: boolean;
  immutable?: boolean;
  // index?: boolean;
  lastModified?: boolean;
  maxAge?: number | string;
  // redirect?: boolean;
  // setHeaders?: (res: Response, path: string, stat: Stats) => Exclude<unknown, Promise<unknown>>;
}

export function serveStatic(
  root: string,
  {
    acceptRanges = true,
    cacheControl = true,
    fallthrough = false,
    immutable = false,
    lastModified = true,
    maxAge = 0,
  }: StaticServeOptions = {},
): Handler {
  function normalizePath (path: string): string {
    // turn absolute path into relative path as we're calling `fs` for reading file-system files
    const relativePath = path.startsWith("/") ? path.slice(1) : path;
    const nonTrailingSlashPath = relativePath.endsWith("/") ? relativePath.slice(0, -1) : relativePath;
    return nonTrailingSlashPath;
  }
  
  function doesReferenceParent (path: string): boolean {
    return path.startsWith("../") || path === ".." || path.includes("/../");
  }

  const normalizedRoot = normalizePath(root);
  if (doesReferenceParent(normalizedRoot)) {
    throw new Error("Static root dir cannot reference parent dir");
  }

  return async (req, res, next) => {
    const filepath = normalizePath(req.path);
    if (filepath !== normalizedRoot && !filepath.startsWith(normalizedRoot + "/")) return next();

    if (![HttpMethod.GET, HttpMethod.HEAD].includes(req.method)) {
      return res.status(404).end();
    }
    
    let fileStat: Stats;
    try {
      fileStat = await fs.lstat(filepath); // Don't follow symlink
    } catch {
      if (fallthrough) return next();
      return res.status(404).send(`File ${filepath} not found`).end();
    }

    if (fileStat.isDirectory()) {
      return res.status(404).send(`File ${filepath} not found`).end();
    }

    const mimeType = mime.getType(filepath) || "plain/text";
    res.type(mimeType);

    if (lastModified) res.set("Last-Modified", formatToGMT(fileStat.mtime));

    const mAge = typeof maxAge === "number" ? maxAge : ms(maxAge);
    const cacheControlHeader = !cacheControl
      ? undefined
      : !mAge
      ? undefined
      : immutable
      ? `max-age=${mAge}, immutable`
      : `max-age=${mAge}`;
    if (cacheControlHeader) res.set("Cache-Control", cacheControlHeader);

    if (acceptRanges) res.set("Accept-Ranges", "bytes");
    const rangeHeader = acceptRanges ? req.get("Range") : undefined;
    if (!rangeHeader) {
      if (req.method === HttpMethod.HEAD) {
        return res.status(200).set(
          "Content-Length",
          fileStat.size.toString(),
        ).end();
      }
      try {
        const fileContent = await fs.readFile(filepath);
        return res.status(200).send(fileContent).end();
      } catch {
        return res.status(500).send(`Internal server error`).end();
      }
    } else {
      const ranges = typeof rangeHeader === "string"
        ? parseRangeHeader(rangeHeader)
        : rangeHeader.flatMap(parseRangeHeader);
      if (ranges.length !== 1) {
        return res.status(416).send("Only a single range is supported").end();
      }
      const { start = 0, end = fileStat.size - 1 } = ranges[0];
      if (start < 0 || end >= fileStat.size) {
        return res.status(416).send("Range out-of-bound").end();
      }

      res.status(206)
         .set(
           "Content-Length",
           (end - start + 1).toString(),
         )
         .set(
           "Content-Range",
           `bytes ${start}-${end}/${fileStat.size}`,
         );

      if (req.method === HttpMethod.HEAD) {
        return res.end();
      }

      const stream = createReadStream(filepath, { start, end });
      try {
        const data = await readStream(stream);
        return res.send(data);
      } catch {
        return res.status(500).send("Internal server error").end();
      }
    }
  };
}

function readStream (stream: ReadStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let data = Buffer.from("");
    stream.on("data", (chunk: Buffer) => {
      data = Buffer.concat([data, chunk]);
    });
    stream.on("end", () => {
      resolve(data);
    });
    stream.on("error", (err) => {
      reject(err);
    });
  });
}

// Parse HTTP Range Request header: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range
function parseRangeHeader(
  range: string,
): { start: number | undefined; end: number | undefined }[] {
  if (!range.startsWith("bytes=")) {
    return [];
  }

  return range.substring(6)
    .split(",")
    .flatMap((range) => {
      const [start, end] = range.split("-").map((
        v,
      ) => (v ? parseInt(v, 10) : undefined));
      if (Number.isNaN(start) || Number.isNaN(end)) return [];
      return { start, end };
    });
}

// Format Date to HTTP Last-Modified Response header format: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified
function formatToGMT(date: Date): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayName = dayNames[date.getUTCDay()];
  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = monthNames[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hour = date.getUTCHours().toString().padStart(2, "0");
  const minute = date.getUTCMinutes().toString().padStart(2, "0");
  const second = date.getUTCSeconds().toString().padStart(2, "0");

  return `${dayName}, ${day} ${month} ${year} ${hour}:${minute}:${second} GMT`;
}
