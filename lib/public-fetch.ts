import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP } from "node:net";
import { isBookmarkUrl } from "./utils";

const privateAddresses = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 3],
] as const) privateAddresses.addSubnet(address, prefix);
for (const [address, prefix] of [
  ["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20],
] as const) privateAddresses.addSubnet(address, prefix, "ipv6");

const globalIPv6 = new BlockList();
globalIPv6.addSubnet("2000::", 3, "ipv6");

function isPublicAddress(address: string, family: number) {
  if (family === 4) return !privateAddresses.check(address);
  return family === 6 &&
    globalIPv6.check(address, "ipv6") && !privateAddresses.check(address, "ipv6");
}

function urlHost(url: URL) {
  return url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

export function publicHttpUrl(value: string): URL {
  if (value.length > 2048 || !isBookmarkUrl(value)) throw new Error("Enter a valid HTTP or HTTPS URL.");
  const url = new URL(value);
  const host = urlHost(url);
  const family = isIP(host);
  if (url.port || (family ? !isPublicAddress(host, family) :
    !host.includes(".") || /\.(localhost|local|internal|lan|home|arpa|test|invalid|example|onion)$/i.test(host))) {
    throw new Error("Metadata can only be fetched from public websites on standard ports.");
  }
  url.hash = "";
  return url;
}

function resolvePublicAddress(host: string, signal: AbortSignal) {
  const family = isIP(host);
  const addresses = family ? Promise.resolve([{ address: host, family }]) : lookup(host, { all: true });
  return new Promise<{ address: string; family: number }>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.throwIfAborted();
    signal.addEventListener("abort", abort, { once: true });
    addresses.then((records) => {
      if (!records.length || records.some((record) => !isPublicAddress(record.address, record.family))) {
        reject(new Error("Metadata can only be fetched from public websites."));
      } else {
        resolve(records.find((record) => record.family === 4) ?? records[0]);
      }
    }, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

const maxBytes = 1024 * 1024;
const redirectCodes = new Set([301, 302, 303, 307, 308]);

async function requestPublic(url: URL, signal: AbortSignal, kind: "html" | "json") {
  const address = await resolvePublicAddress(urlHost(url), signal);
  const request = url.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise<{ redirect: string } | { text: string }>((resolve, reject) => {
    const incoming = request(url, {
      agent: false,
      signal,
      family: address.family,
      // Connect to the validated IP while keeping the URL host for HTTP and TLS.
      lookup: (_host, _options, callback) => callback(null, address.address, address.family),
      headers: {
        Accept: kind === "html" ? "text/html, application/xhtml+xml" : "application/vnd.github+json",
        "Accept-Encoding": "identity",
        "User-Agent": "Goodfind-Metadata/1.0",
      },
    }, (response) => {
      response.once("error", reject);
      const status = response.statusCode ?? 0;
      const location = response.headers.location;
      if (redirectCodes.has(status) && location) {
        resolve({ redirect: location });
        response.destroy();
        return;
      }
      const contentType = String(response.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
      const supported = kind === "html"
        ? ["text/html", "application/xhtml+xml"].includes(contentType)
        : contentType === "application/json" || contentType.endsWith("+json");
      if (status < 200 || status >= 300 || !supported || (response.headers["content-encoding"] ?? "identity") !== "identity") {
        reject(new Error(status >= 400 ? `Website returned HTTP ${status}.` : "The website did not return readable metadata."));
        response.destroy();
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        if (size + chunk.length > maxBytes) {
          reject(new Error("The website response exceeded the metadata size limit."));
          response.destroy();
          return;
        }
        chunks.push(chunk);
        size += chunk.length;
        if (kind !== "html") return;
        // Only metadata in the document head is needed. Include the preceding
        // bytes when looking for a closing tag split across two chunks.
        const previous = chunks[chunks.length - 2]?.subarray(-12) ?? Buffer.alloc(0);
        if (/<\/head\s*>/i.test(Buffer.concat([previous, chunk]).toString("latin1"))) {
          resolve({ text: Buffer.concat(chunks, size).toString("utf8") });
          response.destroy();
        }
      });
      response.once("end", () => resolve({ text: Buffer.concat(chunks, size).toString("utf8") }));
    });
    incoming.once("error", reject);
    incoming.end();
  });
}

export async function fetchPublicMetadata(input: string, signal: AbortSignal, kind: "html" | "json") {
  let url = publicHttpUrl(input);
  for (let hop = 0; hop <= 4; hop++) {
    const response = await requestPublic(url, signal, kind);
    if ("text" in response) return { text: response.text, url };
    url = publicHttpUrl(new URL(response.redirect, url).href);
  }
  throw new Error("The website redirected too many times.");
}
