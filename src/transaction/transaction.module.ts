import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Transaction } from './entities/transaction';
import { Wallet, WalletSchema } from 'src/wallet/schemas/wallet.schema';
import { CurrencyModule } from '../currency/currency.module'; // Import this

@Module({

  imports: [
    // TypeOrmModule.forFeature([Transaction]),
  MongooseModule.forFeature([
    { name: Wallet.name, schema: WalletSchema },
    { name: Transaction.name, schema: TransactionSchema }]),
  CurrencyModule, 
],
controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService], 
})
export class TransactionModule {}
