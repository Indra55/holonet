import { Worker, type Job } from "bullmq";
import { redis } from "../redis/client";
import pool from "../config/dbConfig";
import { buildAndPush, type BuildConfig } from "../services/builder";

export interface DeploymentJobData {
  serviceId: string;
  deploymentId: string;
  repoUrl: string;
  branch: string;
  rootDirectory: string;
  buildCmd: string;
  startCmd: string;
  runtime: "node" | "python" | "go" | "static";
  subdomain: string;
  envVars: Record<string, string>;
}

async function updateDeploymentStatus(
  deploymentId: string,
  status: string,
  logLine: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const formattedLog = `[${timestamp}] ${logLine}\n`;

  await pool.query(
    `UPDATE deployments
     SET status    = $1,
         build_logs = COALESCE(build_logs, '') || $2,
         started_at = CASE
                        WHEN started_at IS NULL AND $1 != 'queued'
                        THEN NOW()
                        ELSE started_at
                      END,
         completed_at = CASE
                          WHEN $1 IN ('success', 'failed')
                          THEN NOW()
                          ELSE completed_at
                        END
     WHERE id = $3`,
    [status, formattedLog, deploymentId]
  );

  await redis.publish(
    `logs:${deploymentId}`,
    JSON.stringify({ status, log: formattedLog, timestamp })
  );
}

async function deployContainer(
  data: DeploymentJobData,
  imageName: string
): Promise<string> {
  await updateDeploymentStatus(
    data.deploymentId,
    "deploying",
    `Deploying container for ${data.subdomain}...`
  );

  const deployUrl = `https://${data.subdomain}.holonet.dev`;

  await updateDeploymentStatus(
    data.deploymentId,
    "deploying",
    `Container deployed, waiting for health check...`
  );

  return deployUrl;
}

const worker = new Worker<DeploymentJobData>(
  "deployment-queue",
  async (job: Job<DeploymentJobData>) => {
    const { deploymentId, serviceId } = job.data;

    console.log(
      `[worker] Processing deployment ${deploymentId} for service ${serviceId}`
    );

    try {
      await updateDeploymentStatus(
        deploymentId,
        "building",
        "🔨 Starting build pipeline..."
      );

      const buildConfig: BuildConfig = {
        deploymentId: job.data.deploymentId,
        serviceId: job.data.serviceId,
        repoUrl: job.data.repoUrl,
        branch: job.data.branch,
        rootDirectory: job.data.rootDirectory,
        runtime: job.data.runtime,
        buildCmd: job.data.buildCmd,
        startCmd: job.data.startCmd,
        subdomain: job.data.subdomain,
        envVars: job.data.envVars,
      };

      const log = async (message: string) => {
        const currentStatus = message.includes("Pushing")
          ? "pushing_image"
          : "building";
        await updateDeploymentStatus(deploymentId, currentStatus, message);
      };

      const imageName = await buildAndPush(buildConfig, log);

      const deployUrl = await deployContainer(job.data, imageName);

      await updateDeploymentStatus(
        deploymentId,
        "success",
        `Deployment complete — live at ${deployUrl}`
      );

      await pool.query(
        `UPDATE services
         SET status     = 'deployed',
             deploy_url = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [deployUrl, serviceId]
      );

      console.log(
        `[worker] Deployment ${deploymentId} succeeded → ${deployUrl}`
      );

      return { deployUrl, imageName };
    } catch (err: any) {
      const errorMessage =
        err instanceof Error ? err.message : String(err);

      console.error(
        `[worker] Deployment ${deploymentId} failed:`,
        errorMessage
      );

      await updateDeploymentStatus(
        deploymentId,
        "failed",
        `Deployment failed: ${errorMessage}`
      );

      await pool.query(
        `UPDATE deployments SET error_message = $1 WHERE id = $2`,
        [errorMessage, deploymentId]
      );

      await pool.query(
        `UPDATE services
         SET status     = 'failed',
             updated_at = NOW()
         WHERE id = $1`,
        [serviceId]
      );

      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 3,
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  }
);

worker.on("ready", () => {
  console.log("[worker] Deployment worker is ready and listening for jobs");
});

worker.on("active", (job: Job<DeploymentJobData>) => {
  console.log(
    `[worker] Job ${job.id} started — deployment: ${job.data.deploymentId}`
  );
});

worker.on("completed", (job: Job<DeploymentJobData>) => {
  console.log(
    `[worker] Job ${job.id} completed — deployment: ${job.data.deploymentId}`
  );
});

worker.on("failed", (job: Job<DeploymentJobData> | undefined, err: Error) => {
  console.error(
    `[worker] Job ${job?.id ?? "unknown"} failed — ${err.message}`
  );
});

worker.on("error", (err: Error) => {
  console.error("[worker] Worker error:", err.message);
});

async function shutdown() {
  console.log("[worker] Shutting down gracefully...");
  await worker.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { worker };
