import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(); // Connect to Redis
  }
// 1- Stores a key-value pair in Redis with a specified time-to-live (TTL).
  async set(key: string, value: any, ttl: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }
// 2- Retrieves a value from Redis by its key and parses it into a usable format.
  async get(key: string): Promise<any> {
    const result = await this.redis.get(key);
    return result ? JSON.parse(result) : null;
  }
}
