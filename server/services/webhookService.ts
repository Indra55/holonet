import crypto from "crypto";

interface WebhookConfig {
  repoUrl: string;
  accessToken: string;
  webhookUrl: string;
  secret: string;
}

function parseRepo(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/);
  if (!match) throw new Error(`Cannot parse GitHub repo from URL: ${repoUrl}`);
  return { owner: match[1]!, repo: match[2]! };
}

export async function createGitHubWebhook(config: WebhookConfig): Promise<string> {
  const { owner, repo } = parseRepo(config.repoUrl);

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "User-Agent": "Holonet/1.0",
    },
    body: JSON.stringify({
      name: "web",
      active: true,
      events: ["push"],
      config: {
        url: config.webhookUrl,
        content_type: "json",
        secret: config.secret,
        insecure_ssl: "0",
      },
    }),
  });

  const data = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(`GitHub webhook creation failed (${res.status}): ${data.message}`);
  }
  return String(data.id);
}

export async function deleteGitHubWebhook(
  repoUrl: string,
  accessToken: string,
  webhookId: string
): Promise<void> {
  const { owner, repo } = parseRepo(repoUrl);

  await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Holonet/1.0",
    },
  });
}

export function verifyWebhookSignature(
  payload: Buffer | string,
  signature: string,
  secret: string
): boolean {
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
