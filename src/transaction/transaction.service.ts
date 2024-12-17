import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from './schemas/transaction.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {}

  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const transaction = new this.transactionModel(data);
    return transaction.save();
  }

  async getTransactionsForUser(userId: string, page = 1, limit = 10): Promise<{ transactions: Transaction[]; total: number }> {
    const skip = (page - 1) * limit;
  
    const transactions = await this.transactionModel
      .find({ senderWallet: { $regex: userId }, status: 'Success' })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  
    const total = await this.transactionModel.countDocuments({ senderWallet: { $regex: userId }, status: 'Success' });
  
    return { transactions, total };
  }
  
}
