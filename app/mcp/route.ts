import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const q = (value: string) => `'${value.replace(/'/g, `'"'"'`)}'`;
const common = (args: string[], wordlist: string, threads?: number, delay?: string) => {
  args.push("-w", q(wordlist));
  if (threads !== undefined) args.push("-t", String(threads));
  if (delay) args.push("--delay", q(delay));
};
const output = (args: string[]) => ({
  content: [{ type: "text" as const, text: `Gobuster is a native CLI and cannot execute in Vercel serverless. Run this command locally only against systems you are authorized to test:\n\n${args.join(" ")}` }],
});
const wordlist = z.string().describe("Local wordlist path");
const threads = z.number().int().positive().optional().describe("Concurrent worker count");
const delay = z.string().optional().describe("Delay between requests, such as 100ms");

const handler = createMcpHandler(
  async (server) => {
    server.tool("gobuster_dir", "Generate a Gobuster command to enumerate directories and files on an authorized web target.", {
      url: z.string().describe("Authorized target URL"), wordlist,
      extensions: z.string().optional().describe("Comma-separated file extensions"),
      statusCodes: z.string().optional().describe("Comma-separated included HTTP status codes"), threads, delay,
    }, async ({ url, wordlist, extensions, statusCodes, threads, delay }) => {
      const args = ["gobuster", "dir", "-u", q(url)]; common(args, wordlist, threads, delay);
      if (extensions) args.push("-x", q(extensions)); if (statusCodes) args.push("-s", q(statusCodes)); return output(args);
    });

    server.tool("gobuster_dns", "Generate a Gobuster command to discover DNS subdomains for an authorized domain.", {
      domain: z.string().describe("Authorized domain"), wordlist,
      resolver: z.string().optional().describe("Custom DNS server, such as 8.8.8.8:53"), threads, delay,
    }, async ({ domain, wordlist, resolver, threads, delay }) => {
      const args = ["gobuster", "dns", "-d", q(domain)]; common(args, wordlist, threads, delay);
      if (resolver) args.push("-r", q(resolver)); return output(args);
    });

    server.tool("gobuster_vhost", "Generate a Gobuster command to discover virtual hosts on an authorized web target.", {
      url: z.string().describe("Authorized target URL"), wordlist,
      appendDomain: z.boolean().optional().describe("Append the base domain to each word"), threads, delay,
    }, async ({ url, wordlist, appendDomain, threads, delay }) => {
      const args = ["gobuster", "vhost", "-u", q(url)]; common(args, wordlist, threads, delay);
      if (appendDomain) args.push("--append-domain"); return output(args);
    });

    server.tool("gobuster_s3", "Generate a Gobuster command to enumerate candidate Amazon S3 bucket names.",
      { wordlist, threads, delay }, async ({ wordlist, threads, delay }) => {
        const args = ["gobuster", "s3"]; common(args, wordlist, threads, delay); return output(args);
      });

    server.tool("gobuster_gcs", "Generate a Gobuster command to enumerate candidate Google Cloud Storage bucket names.",
      { wordlist, threads, delay }, async ({ wordlist, threads, delay }) => {
        const args = ["gobuster", "gcs"]; common(args, wordlist, threads, delay); return output(args);
      });

    server.tool("gobuster_tftp", "Generate a Gobuster command to discover files on an authorized TFTP server.", {
      server: z.string().describe("Authorized TFTP server host or IP"), wordlist, threads,
    }, async ({ server: target, wordlist, threads }) => {
      const args = ["gobuster", "tftp", "-s", q(target)]; common(args, wordlist, threads); return output(args);
    });

    server.tool("gobuster_fuzz", "Generate a Gobuster command for authorized HTTP fuzzing using the FUZZ keyword.", {
      url: z.string().describe("Authorized target URL containing FUZZ"), wordlist,
      method: z.string().optional().describe("HTTP method"), body: z.string().optional().describe("Request body containing FUZZ"), threads, delay,
    }, async ({ url, wordlist, method, body, threads, delay }) => {
      const args = ["gobuster", "fuzz", "-u", q(url)]; common(args, wordlist, threads, delay);
      if (method) args.push("-m", q(method)); if (body) args.push("-d", q(body)); return output(args);
    });
  },
  {
    capabilities: { tools: {
      gobuster_dir: { description: "Generate a Gobuster directory and file enumeration command" },
      gobuster_dns: { description: "Generate a Gobuster DNS subdomain enumeration command" },
      gobuster_vhost: { description: "Generate a Gobuster virtual-host discovery command" },
      gobuster_s3: { description: "Generate a Gobuster Amazon S3 bucket enumeration command" },
      gobuster_gcs: { description: "Generate a Gobuster Google Cloud Storage bucket enumeration command" },
      gobuster_tftp: { description: "Generate a Gobuster TFTP file discovery command" },
      gobuster_fuzz: { description: "Generate a Gobuster HTTP fuzzing command" },
    } },
  } as any,
  { basePath: "", verboseLogs: true, maxDuration: 60, disableSse: true },
);

export { handler as GET, handler as POST, handler as DELETE };
