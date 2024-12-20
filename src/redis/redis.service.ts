import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(); // Connect to Redis
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async get(key: string): Promise<any> {
    const result = await this.redis.get(key);
    return result ? JSON.parse(result) : null;
  }
}
