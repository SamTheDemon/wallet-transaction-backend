import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction';

@Module({
  // imports: [
  //   MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
  // ],
  imports: [TypeOrmModule.forFeature([Transaction])], // Register Transaction entity
  providers: [TransactionService],
  controllers: [TransactionController],
  exports: [TransactionService,TypeOrmModule], // Export TransactionService
})
export class TransactionModule {}
