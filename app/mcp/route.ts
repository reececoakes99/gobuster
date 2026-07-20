import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const quote = (value: string) => `'${value.replace(/'/g, `'"'"'`)}'`;
const addCommon = (args: string[], wordlist: string, threads?: number, delay?: string) => {
  args.push("-w", quote(wordlist));
  if (threads !== undefined) args.push("-t", String(threads));
  if (delay) args.push("--delay", quote(delay));
};
const result = (args: string[]) => ({
  content: [{
    type: "text" as const,
    text: `Gobuster is a native CLI and cannot execute in Vercel serverless. Run this authorized-security-testing command locally where Gobuster is installed:\n\n${args.join(" ")}`,
  }],
});

const handler = createMcpHandler(
  async (server) => {
    server.tool(
      "gobuster_dir",
      "Generate a Gobuster command to enumerate directories and files on an authorized web target.",
      {
        url: z.string().describe("Authorized target URL"),
        wordlist: z.string().describe("Local wordlist path"),
        extensions: z.string().optional().describe("Comma-separated file extensions"),
        statusCodes: z.string().optional().describe("Comma-separated included HTTP status codes"),
        threads: z.number().int().positive().optional().describe("Concurrent worker count"),
        delay: z.string().optional().describe("Delay between requests, such as 100ms"),
      },
      async ({ url, wordlist, extensions, statusCodes, threads, delay }) => {
        const args = ["gobuster", "dir", "-u", quote(url)];
        addCommon(args, wordlist, threads, delay);
        if (extensions) args.push("-x", quote(extensions));
        if (statusCodes) args.push("-s", quote(statusCodes));
        return result(args);
      },
    );

    server.tool(
      "gobuster_dns",
      "Generate a Gobuster command to discover DNS subdomains for an authorized domain.",
      {
        domain: z.string().describe("Authorized domain to enumerate"),
        wordlist: z.string().describe("Local subdomain wordlist path"),
        resolver: z.string().optional().describe("Custom DNS server, such as 8.8.8.8:53"),
        threads: z.number().int().positive().optional().describe("Concurrent worker count"),
        delay: z.string().optional().describe("Delay between requests"),
      },
      async ({ domain, wordlist, resolver, threads, delay }) => {
        const args = ["gobuster", "dns", "-d", quote(domain)];
        addCommon(args, wordlist, threads, delay);
        if (resolver) args.push("-r", quote(resolver));
        return result(args);
      },
    );

    server.tool(
      "gobuster_vhost",
      "Generate a Gobuster command to discover virtual hosts on an authorized web target.",
      {
        url: z.string().describe("Authorized target URL"),
        wordlist: z.string().describe("Local virtual-host wordlist path"),
        appendDomain: z.boolean().optional().describe("Append the base domain to each word"),
        threads: z.number().int().positive().optional().describe("Concurrent worker count"),
        delay: z.string().optional().describe("Delay between requests"),
      },
      async ({ url, wordlist, appendDomain, threads, delay }) => {
        const args = ["gobuster", "vhost", "-u", quote(url)];
        addCommon(args, wordlist, threads, delay);
        if (appendDomain) args.push("--append-domain");
        return result(args);
      },
    );

    server.tool(
      "gobuster_s3",
      "Generate a Gobuster command to enumerate candidate Amazon S3 bucket names from a local wordlist.",
      {
        wordlist: z.string().describe("Local bucket-name wordlist path"),
        threads: z.number().int().positive().optional().describe("Concurrent worker count"),
        delay: z.string().optional().describe("Delay between requests"),
      },
      async ({ wordlist, threads, delay }) => {
        const args = ["gobuster", "s3"];
        addCommon(args, wordlist, threads, delay);
        return result(args);
      },
    );

    server.tool(
      "gobuster_gcs",
      "Generate a Gobuster command to enumerate candidate Google Cloud Storage bucket names from a local wordlist.",
      {
        wordlist: z.string().describe("Local bucket-name wordlist path"),
        threads: z.number().int().positive().optional().describe("Concurrent worker count"),
        delay: z.string().optional().describe("Delay between requests"),
      },
      async ({ wordlist, threads, delay }) => {
        const args = ["gobuster", "gcs"];
        addCommon(args, wordlist, threads, delay);
        return result(args);
      },
    );

    server.tool(
      "gobuster_tftp",
      "Generate a Gobuster command to discover files on an authorized TFTP server.",
      {
        server: z.string().describe("Authorized TFTP server host or IP"),
        wordlist: z.string().describe("Local filename wordlist path"),
        threads: z.number().int().positive().optional().describe("Concurrent worker count"),
      },
      async ({ server: target, wordlist, threads }) => {
        const args = ["gobuster", "tftp", "-s", quote(target)];
        addCommon(args, wordlist, threads);
        return result(args);
      },
    );

    server.tool(
      "gobuster_fuzz",
      "Generate a Gobuster command for authorized HTTP fuzzing using a URL containing the FUZZ keyword.",
      {
        url: z.string().describe("Authorized target URL containing FUZZ"),
        wordlist: z.string().describe("Local fuzzing wordlist path"),
        method: z.string().optional().describe("HTTP method"),
        body: z.string().optional().describe("Optional request body containing FUZZ"),
        threads: z.number().int().positive().optional().describe("Concurrent worker count"),
        delay: z.string().optional().describe("Delay between requests"),
      },
      async ({ url, wordlist, method, body, threads, delay }) => {
        const args = ["gobuster", "fuzz", "-u", quote(url)];
        addCommon(args, wordlist, threads, delay);
        if (method) args.push("-m", quote(method));
        if (body) args.push("-d", quote(body));
        return result(args);
      },
    );
  },
  {
    capabilities: {
      tools: {
        gobuster_dir: { description: "Generate a Gobuster directory and file enumeration command" },
        gobuster_dns: { description: "Generate a Gobuster DNS subdomain enumeration command" },
        gobuster_vhost: { description: "Generate a Gobuster virtual-host discovery command" },
        gobuster_s3: { description: "Generate a Gobuster Amazon S3 bucket enumeration command" },
        gobuster_gcs: { description: "Generate a Gobuster Google Cloud Storage bucket enumeration command" },
        gobuster_tftp: { description: "Generate a Gobuster TFTP file discovery command" },
        gobuster_fuzz: { description: "Generate a Gobuster HTTP fuzzing command" },
      },
    },
  },
  { basePath: "", verboseLogs: true, maxDuration: 60, disableSse: true },
);

export { handler as GET, handler as POST, handler as DELETE };
