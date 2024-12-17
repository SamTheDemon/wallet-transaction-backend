import { Module } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule], // Import RedisModule
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
