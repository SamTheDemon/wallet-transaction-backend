import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from './schemas/transaction.schema';

interface FilterOptions {
  userId: string;
  senderWallet?: string;
  recipientWallet?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: string;
  page: number;
  limit: number;
}

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
  

  async getFilteredTransactions(options: FilterOptions) {
    const { userId, senderWallet, recipientWallet, startDate, endDate, minAmount, maxAmount, status, page, limit } = options;

    const filters: any = {
      // $or: [{ senderWallet: senderWallet || null }, { recipientWallet: recipientWallet || null }],
    };

    if (status) filters.status = status;
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) filters.timestamp.$gte = new Date(startDate);
      if (endDate) filters.timestamp.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      filters.amount = {};
      if (minAmount) filters.amount.$gte = minAmount;
      if (maxAmount) filters.amount.$lte = maxAmount;
    }

    // Pagination
    const skip = (page - 1) * limit;

    const transactions = await this.transactionModel
      .find(filters)
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.transactionModel.countDocuments(filters);

    return {
      transactions,
      total,
      page,
      limit,
    };
  }

}
