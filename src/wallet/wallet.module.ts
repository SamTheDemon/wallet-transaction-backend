import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { TransactionModule } from '../transaction/transaction.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RealtimeGateway } from '../realtime/realtime.gateway'; // If used

import { RedisModule } from '../redis/redis.module';
import { CurrencyModule } from '../currency/currency.module'; // Import CurrencyModule
import { UserModule } from '../user/user.module'; // Import UserModule


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    TransactionModule, 
    RealtimeModule,
    RedisModule,
    CurrencyModule,
    UserModule, 
  ],
  providers: [WalletService, RealtimeGateway],
  controllers: [WalletController],
  exports: [WalletService]
})
export class WalletModule {}
