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
import { Transaction, TransactionSchema } from 'src/transaction/schemas/transaction.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user/user';
import { CurrencyService } from 'src/currency/currency.service';




@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema },       { name: Transaction.name, schema: TransactionSchema }  // Add this line
    ]),
    TransactionModule, 
    RealtimeModule,
    RedisModule,
    CurrencyModule,
    UserModule, 
    
    TypeOrmModule.forFeature([User]),
  ],
  providers: [WalletService, CurrencyService, RealtimeGateway],
  controllers: [WalletController],
  exports: [WalletService]
})
export class WalletModule {}
