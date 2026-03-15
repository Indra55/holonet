import { Router, type Request, type Response } from "express";
import pool from "../config/dbConfig";
import { deploymentQueue } from "../queue/deploymentQueue";
import { verifyWebhookSignature } from "../services/webhookService";

const router = Router();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "holonet-webhook-secret";

router.post("/:serviceId", async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const event = req.headers["x-github-event"] as string | undefined;

    if (!signature) {
      return res.status(401).json({ message: "Missing X-Hub-Signature-256 header" });
    }
    if (!verifyWebhookSignature(req.body as Buffer, signature, WEBHOOK_SECRET)) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    if (event !== "push") {
      return res.sendStatus(200); 
    }

    const payload = JSON.parse((req.body as Buffer).toString("utf-8"));
    const pushedBranch = (payload.ref as string).replace("refs/heads/", "");
    const commitSha: string = payload.after;
    const commitMessage: string = payload.head_commit?.message ?? "";
    const commitAuthor: string = payload.head_commit?.author?.name ?? "";

    const svcResult = await pool.query(
      "SELECT * FROM services WHERE id = $1",
      [serviceId]
    );
    if (svcResult.rows.length === 0) {
      return res.sendStatus(200); 
    }
    const service = svcResult.rows[0];

    if (service.branch !== pushedBranch) {
      return res.sendStatus(200); 
    }

    const deployResult = await pool.query(
      `INSERT INTO deployments(service_id, commit_sha, commit_message, commit_author, branch, status, trigger_type)
       VALUES($1, $2, $3, $4, $5, 'queued', 'webhook')
       RETURNING id, created_at`,
      [serviceId, commitSha, commitMessage, commitAuthor, pushedBranch]
    );
    const deployment = deployResult.rows[0];

    await pool.query(
      "UPDATE services SET status = 'pending_deployment', updated_at = NOW() WHERE id = $1",
      [serviceId]
    );
    await deploymentQueue.add(
      "deploy",
      {
        serviceId,
        deploymentId: deployment.id,
        repoUrl: service.repo_url,
        branch: service.branch,
        rootDirectory: service.root_directory,
        buildCmd: service.build_cmd,
        startCmd: service.start_cmd,
        runtime: service.runtime,
        subdomain: service.subdomain,
        envVars: service.env_vars ?? {},
      },
      {
        attempts: 2,
        backoff: { type: "fixed", delay: 5000 },
      }
    );

    console.log(`[webhook] Queued deployment ${deployment.id} for service ${serviceId} (commit: ${commitSha.slice(0, 7)})`);
    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook handler error:", error);
    return res.sendStatus(200);
  }
});

export default router;
