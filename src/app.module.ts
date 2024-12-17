import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// delete if not used later on
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { User } from './user/entities/user/user';
import { MongooseModule } from '@nestjs/mongoose'; 
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';


import { CurrencyModule } from './currency/currency.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123Aa',
      database: 'wallet_transaction_db',
      entities: [User], 
      autoLoadEntities: true,
      synchronize: true,
    }),
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/wallet_system'),
    AuthModule,
    UserModule,
    WalletModule,
    TransactionModule,
    CurrencyModule,
  ],
})
export class AppModule {}
