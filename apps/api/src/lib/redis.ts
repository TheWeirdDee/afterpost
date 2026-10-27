import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6380";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 2,
  lazyConnect: false,
});
