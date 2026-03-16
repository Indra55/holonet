import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import * as path from "path";

export type Runtime = "node" | "python" | "go" | "static";

export interface BuildConfig {
  deploymentId: string;
  serviceId: string;
  repoUrl: string;
  branch: string;
  rootDirectory: string;
  runtime: Runtime;
  buildCmd: string;
  startCmd: string;
  subdomain: string;
  envVars: Record<string, string>;
}

export interface BuildResult {
  imageName: string;
  workDir: string;
}

const ECR_REGISTRY = process.env.ECR_REGISTRY ?? "";
const ECR_REPOSITORY = process.env.ECR_REPOSITORY ?? "holonet";
const AWS_REGION = process.env.AWS_REGION ?? "us-east-1";
const BUILDS_DIR = process.env.BUILDS_DIR ?? "/tmp/builds";

type LogFn = (message: string) => Promise<void>;

function exec(cmd: string, cwd?: string): string {
  return execSync(cmd, {
    cwd,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 300_000,
  }).trim();
}

async function cloneRepo(
  config: BuildConfig,
  log: LogFn
): Promise<string> {
  const workDir = path.join(BUILDS_DIR, config.deploymentId);

  if (existsSync(workDir)) {
    rmSync(workDir, { recursive: true, force: true });
  }
  mkdirSync(workDir, { recursive: true });

  await log(`Cloning ${config.repoUrl} (branch: ${config.branch})...`);

  exec(
    `git clone --branch ${config.branch} --depth 1 ${config.repoUrl} ${workDir}`
  );

  const effectiveDir =
    config.rootDirectory && config.rootDirectory !== "/"
      ? path.join(workDir, config.rootDirectory)
      : workDir;

  if (!existsSync(effectiveDir)) {
    throw new Error(
      `Root directory "${config.rootDirectory}" not found in repository`
    );
  }

  await log(`Repository cloned successfully`);
  return effectiveDir;
}

function generateDockerfile(
  runtime: Runtime,
  buildCmd: string,
  startCmd: string
): string {
  switch (runtime) {
    case "node":
      return `
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
${buildCmd ? `RUN ${buildCmd}` : "RUN npm run build"}

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ${startCmd ? `["sh", "-c", "${startCmd}"]` : `["npm", "start"]`}
`.trim();

    case "python":
      return `
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ${startCmd ? `["sh", "-c", "${startCmd}"]` : `["python", "app.py"]`}
`.trim();

    case "go":
      return `
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
${buildCmd ? `RUN ${buildCmd}` : "RUN CGO_ENABLED=0 go build -o app ."}

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/app .
EXPOSE 8080
CMD ${startCmd ? `["sh", "-c", "${startCmd}"]` : `["./app"]`}
`.trim();

    case "static":
      return `
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
${buildCmd ? `RUN ${buildCmd}` : "RUN npm run build"}

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/build /usr/share/nginx/html 2>/dev/null || true
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`.trim();

    default:
      throw new Error(`Unsupported runtime: ${runtime}`);
  }
}

async function buildDockerImage(
  config: BuildConfig,
  workDir: string,
  log: LogFn
): Promise<string> {
  const imageName = ECR_REGISTRY
    ? `${ECR_REGISTRY}/${ECR_REPOSITORY}:${config.subdomain}-${config.deploymentId.slice(0, 8)}`
    : `holonet/${config.subdomain}:${config.deploymentId.slice(0, 8)}`;

  const dockerfile = generateDockerfile(
    config.runtime,
    config.buildCmd,
    config.startCmd
  );
  writeFileSync(path.join(workDir, "Dockerfile"), dockerfile, "utf-8");

  await log(`Generated Dockerfile for runtime: ${config.runtime}`);
  await log(`Building Docker image: ${imageName}`);

  const buildArgs = Object.entries(config.envVars)
    .map(([key, value]) => `--build-arg ${key}="${value}"`)
    .join(" ");

  exec(`docker build ${buildArgs} -t ${imageName} .`, workDir);

  await log(`Docker image built successfully`);
  return imageName;
}

async function pushToECR(
  imageName: string,
  log: LogFn
): Promise<void> {
  if (!ECR_REGISTRY) {
    await log(`ECR_REGISTRY not configured — skipping push (local-only mode)`);
    return;
  }

  await log(`Authenticating with AWS ECR (${AWS_REGION})...`);

  exec(
    `aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}`
  );

  try {
    exec(
      `aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION}`
    );
  } catch {
    await log(`Creating ECR repository: ${ECR_REPOSITORY}`);
    exec(
      `aws ecr create-repository --repository-name ${ECR_REPOSITORY} --region ${AWS_REGION}`
    );
  }

  await log(`Pushing image to ECR: ${imageName}`);
  exec(`docker push ${imageName}`);

  await log(`Image pushed to ECR successfully`);
}

async function cleanup(
  workDir: string,
  imageName: string,
  log: LogFn
): Promise<void> {
  await log(`🧹 Cleaning up build artifacts...`);

  try {
    rmSync(workDir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`[builder] Failed to remove workDir: ${workDir}`, err);
  }

  if (ECR_REGISTRY) {
    try {
      exec(`docker rmi ${imageName}`);
    } catch (err) {
      console.warn(`[builder] Failed to remove local image: ${imageName}`, err);
    }
  }

  await log(`Cleanup complete`);
}

export async function buildAndPush(
  config: BuildConfig,
  log: LogFn
): Promise<string> {
  let workDir = "";
  let imageName = "";

  try {
    workDir = await cloneRepo(config, log);
    imageName = await buildDockerImage(config, workDir, log);
    await pushToECR(imageName, log);
    return imageName;
  } finally {
    if (workDir || imageName) {
      await cleanup(
        workDir || path.join(BUILDS_DIR, config.deploymentId),
        imageName,
        log
      ).catch((err) =>
        console.error("[builder] Cleanup failed:", err)
      );
    }
  }
}
