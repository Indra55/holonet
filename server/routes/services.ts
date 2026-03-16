import { Router, type Request, type Response } from "express";
import pool from "../config/dbConfig";
import { authMiddleware } from "../middleware/authMiddleware";
import { deploymentQueue } from "../queue/deploymentQueue";
import { createGitHubWebhook, deleteGitHubWebhook } from "../services/webhookService";

const router = Router();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "holonet-webhook-secret";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function isValidGitUrl(url: string): boolean {
  return /^(https?:\/\/)?(github\.com|gitlab\.com|bitbucket\.org)\/[\w-]+\/[\w.-]+/.test(url);
}

function isValidSubdomain(subdomain: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(subdomain);
}

router.post("/create_service", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, repo_url, runtime, branch = "main", root_directory = "/", subdomain } = req.body;
    let { build_cmd, start_cmd } = req.body;
    const user_id = req.user?.id;

    if (!name || !repo_url || !runtime || !subdomain) {
      return res.status(400).json({ message: "name, repo_url, runtime and subdomain are required" });
    }
    if (!isValidGitUrl(repo_url)) {
      return res.status(400).json({ message: "Invalid Git URL" });
    }
    if (!isValidSubdomain(subdomain)) {
      return res.status(400).json({
        message: "Invalid subdomain — 3-63 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens",
      });
    }

    const existing = await pool.query("SELECT id FROM services WHERE subdomain = $1", [subdomain]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Subdomain already taken. Please choose another." });
    }

    const validRuntimes = ["node", "python", "go", "static"];
    if (!validRuntimes.includes(runtime)) {
      return res.status(400).json({ message: `Invalid runtime. Must be one of: ${validRuntimes.join(", ")}` });
    }

    if (!build_cmd) {
      if (runtime === "python") build_cmd = "pip install -r requirements.txt";
      else if (runtime === "node") build_cmd = "npm install && npm run build";
      else if (runtime === "go") build_cmd = "go build -o app .";
      else if (runtime === "static") build_cmd = "npm run build";
    }
    if (!start_cmd) {
      if (runtime === "python") start_cmd = "python app.py";
      else if (runtime === "node") start_cmd = "npm start";
      else if (runtime === "go") start_cmd = "./app";
      else if (runtime === "static") start_cmd = "";
    }

    const result = await pool.query(
      `INSERT INTO services(user_id,name,repo_url,build_cmd,start_cmd,runtime,branch,root_directory,subdomain,status,env_vars)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'created','{}')
       RETURNING id,name,subdomain,status,created_at`,
      [user_id, name, repo_url, build_cmd, start_cmd, runtime, branch, root_directory, subdomain]
    );
    const service = result.rows[0];

    try {
      const tokenResult = await pool.query(
        "SELECT github_access_token FROM users WHERE id = $1",
        [user_id]
      );
      const accessToken = tokenResult.rows[0]?.github_access_token;

      if (accessToken) {
        const webhookId = await createGitHubWebhook({
          repoUrl: repo_url,
          accessToken,
          webhookUrl: `${BASE_URL}/api/webhooks/${service.id}`,
          secret: WEBHOOK_SECRET,
        });
        await pool.query("UPDATE services SET github_webhook_id = $1 WHERE id = $2", [webhookId, service.id]);
        service.github_webhook_id = webhookId;
      }
    } catch (webhookErr) {
      console.warn("Webhook registration failed (non-fatal):", webhookErr);
    }

    return res.status(201).json({
      message: "Service created successfully",
      service: {
        id: service.id,
        name: service.name,
        subdomain: service.subdomain,
        status: service.status,
        created_at: service.created_at,
        deploy_url: null,
        webhook_registered: !!service.github_webhook_id,
      },
    });
  } catch (error) {
    console.error("Service creation error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT
        s.id, s.name, s.subdomain, s.runtime, s.branch,
        s.status, s.deploy_url, s.created_at, s.updated_at,
        d.status AS latest_deployment_status,
        d.created_at AS latest_deployment_at
      FROM services s
      LEFT JOIN LATERAL (
        SELECT status, created_at FROM deployments
        WHERE service_id = s.id
        ORDER BY created_at DESC LIMIT 1
      ) d ON true
      WHERE s.user_id = $1
    `;
    const params: any[] = [user_id];

    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);
    return res.json({ services: result.rows });
  } catch (error) {
    console.error("List services error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user?.id;

    const result = await pool.query(
      `SELECT
         s.*,
         d.id AS latest_deployment_id,
         d.status AS latest_deployment_status,
         d.commit_sha, d.commit_message, d.commit_author,
         d.created_at AS latest_deployment_at,
         d.duration_seconds
       FROM services s
       LEFT JOIN LATERAL (
         SELECT * FROM deployments WHERE service_id = s.id ORDER BY created_at DESC LIMIT 1
       ) d ON true
       WHERE s.id = $1 AND s.user_id = $2`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    const row = result.rows[0];
    const service = {
      id: row.id, name: row.name, subdomain: row.subdomain,
      runtime: row.runtime, branch: row.branch, root_directory: row.root_directory,
      repo_url: row.repo_url, build_cmd: row.build_cmd, start_cmd: row.start_cmd,
      status: row.status, deploy_url: row.deploy_url,
      created_at: row.created_at, updated_at: row.updated_at,
      latest_deployment: row.latest_deployment_id ? {
        id: row.latest_deployment_id,
        status: row.latest_deployment_status,
        commit_sha: row.commit_sha,
        commit_message: row.commit_message,
        commit_author: row.commit_author,
        created_at: row.latest_deployment_at,
        duration_seconds: row.duration_seconds,
      } : null,
    };

    return res.json({ service });
  } catch (error) {
    console.error("Get service error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/deploy", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: serviceId } = req.params;
    const user_id = req.user?.id;

    const svcResult = await pool.query(
      "SELECT * FROM services WHERE id = $1 AND user_id = $2",
      [serviceId, user_id]
    );
    if (svcResult.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    const service = svcResult.rows[0];

    const inProgress = await pool.query(
      `SELECT id FROM deployments WHERE service_id = $1 AND status IN ('queued','building','pushing_image','deploying')`,
      [serviceId]
    );
    if (inProgress.rows.length > 0) {
      return res.status(409).json({ message: "A deployment is already in progress for this service" });
    }

    const deployResult = await pool.query(
      `INSERT INTO deployments(service_id, commit_sha, branch, status, trigger_type)
       VALUES($1, '0000000', $2, 'queued', 'manual')
       RETURNING id, created_at`,
      [serviceId, service.branch]
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

    return res.status(202).json({
      message: "Deployment queued",
      deploymentId: deployment.id,
      createdAt: deployment.created_at,
    });
  } catch (error) {
    console.error("Deploy error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/deployments", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: serviceId } = req.params;
    const user_id = req.user?.id;
    const { limit = 10, offset = 0 } = req.query;

    const owns = await pool.query(
      "SELECT id FROM services WHERE id = $1 AND user_id = $2",
      [serviceId, user_id]
    );
    if (owns.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    const result = await pool.query(
      `SELECT id, commit_sha, commit_message, commit_author, branch,
              status, trigger_type, deployed_url, error_message,
              created_at, started_at, completed_at, duration_seconds
       FROM deployments
       WHERE service_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [serviceId, Number(limit), Number(offset)]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM deployments WHERE service_id = $1",
      [serviceId]
    );

    return res.json({ deployments: result.rows, total: Number(countResult.rows[0].count) });
  } catch (error) {
    console.error("Deployment history error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/deployments/:deploymentId/logs", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: serviceId, deploymentId } = req.params;
    const user_id = req.user?.id;

    const result = await pool.query(
      `SELECT d.build_logs, d.status, d.error_message
       FROM deployments d
       JOIN services s ON d.service_id = s.id
       WHERE d.id = $1 AND d.service_id = $2 AND s.user_id = $3`,
      [deploymentId, serviceId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Deployment not found" });
    }

    return res.json({
      logs: result.rows[0].build_logs ?? "",
      status: result.rows[0].status,
      error: result.rows[0].error_message ?? null,
    });
  } catch (error) {
    console.error("Logs error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/env", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: serviceId } = req.params;
    const user_id = req.user?.id;
    const { env_vars } = req.body;

    if (!env_vars || typeof env_vars !== "object" || Array.isArray(env_vars)) {
      return res.status(400).json({ message: "env_vars must be a key-value object" });
    }

    const result = await pool.query(
      `UPDATE services SET env_vars = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, env_vars, updated_at`,
      [JSON.stringify(env_vars), serviceId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    return res.json({ message: "Environment variables updated", service: result.rows[0] });
  } catch (error) {
    console.error("Update env error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: serviceId } = req.params;
    const user_id = req.user?.id;

    const svcResult = await pool.query(
      "SELECT * FROM services WHERE id = $1 AND user_id = $2",
      [serviceId, user_id]
    );
    if (svcResult.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    const service = svcResult.rows[0];

    if (service.github_webhook_id) {
      try {
        const tokenResult = await pool.query(
          "SELECT github_access_token FROM users WHERE id = $1",
          [user_id]
        );
        const accessToken = tokenResult.rows[0]?.github_access_token;
        if (accessToken) {
          await deleteGitHubWebhook(service.repo_url, accessToken, service.github_webhook_id);
        }
      } catch (webhookErr) {
        console.warn("Webhook deletion failed (non-fatal):", webhookErr);
      }
    }

    await pool.query("DELETE FROM services WHERE id = $1", [serviceId]);

    return res.json({ message: "Service deleted" });
  } catch (error) {
    console.error("Delete service error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
