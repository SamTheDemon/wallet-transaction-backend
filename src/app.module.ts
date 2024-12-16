import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// delete if not used later on
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { User } from './user/entities/user/user';
import { Wallet } from './wallet/entities/wallet/wallet';
import { MongooseModule } from '@nestjs/mongoose'; 
import { TransactionModule } from './transaction/transaction.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123Aa',
      database: 'wallet_transaction_db',
      entities: [User, Wallet], // Register both entities here
      autoLoadEntities: true,
      synchronize: true,
    }),
    MongooseModule.forRoot('mongodb://localhost:27017/wallet_system'),
    AuthModule,
    UserModule,
    WalletModule,
    TransactionModule,
  ],
})
export class AppModule {}

