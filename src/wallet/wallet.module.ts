import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { TransactionModule } from '../transaction/transaction.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RealtimeGateway } from '../realtime/realtime.gateway'; // needs to be enabled on front end
import { RedisModule } from '../redis/redis.module';
import { CurrencyModule } from '../currency/currency.module';
import { UserModule } from '../user/user.module'; 
import { Transaction, TransactionSchema } from 'src/transaction/schemas/transaction.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user/user';
import { CurrencyService } from 'src/currency/currency.service';




@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema },       { name: Transaction.name, schema: TransactionSchema }  
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
