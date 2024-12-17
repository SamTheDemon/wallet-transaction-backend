import { Module } from '@nestjs/common';
import { Redis } from 'ioredis';

@Module({
  providers: [
    {
      provide: 'REDIS',
      useFactory: () => {
        return new Redis(); // Connects to Redis running on localhost:6379
      },
    },
  ],
  exports: ['REDIS'], // Export REDIS provider
})
export class RedisModule {}
