import { Queue } from "bullmq";
import { redis } from "../redis/client";

export const deploymentQueue = new Queue(
  "deployment-queue",
  { connection: redis }
);
