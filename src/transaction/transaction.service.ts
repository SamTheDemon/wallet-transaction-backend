import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// import { Transaction } from './schemas/transaction.schema';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction';
import { SelectQueryBuilder } from 'typeorm';


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
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  // async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
  //   const transaction = new this.transactionModel(data);
  //   return transaction.save();
  // }
  async createTransaction(transactionDto: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.transactionRepository.create(transactionDto);
    return await this.transactionRepository.save(transaction);
  }

  // async getTransactionsForUser(userId: string, page = 1, limit = 10): Promise<{ transactions: Transaction[]; total: number }> {
  //   const skip = (page - 1) * limit;
  
  //   const transactions = await this.transactionModel
  //     .find({ senderWallet: { $regex: userId }, status: 'Success' })
  //     .sort({ timestamp: -1 })
  //     .skip(skip)
  //     .limit(limit)
  //     .exec();
  
  //   const total = await this.transactionModel.countDocuments({ senderWallet: { $regex: userId }, status: 'Success' });
  
  //   return { transactions, total };
  // }
  async getTransactionsForUser(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const skip = (page - 1) * limit;
  
    // Query transactions where senderWallet matches the user's wallets
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { senderWallet: userId, status: 'Success' },
      order: { timestamp: 'DESC' }, // Sort by timestamp descending
      skip,
      take: limit,
    });
  
    return { transactions, total };
  }
  

  // async getFilteredTransactions(options: FilterOptions) {
  //   const { userId, senderWallet, recipientWallet, startDate, endDate, minAmount, maxAmount, status, page, limit } = options;

  //   const filters: any = {
  //     // $or: [{ senderWallet: senderWallet || null }, { recipientWallet: recipientWallet || null }],
  //   };

  //   if (status) filters.status = status;
  //   if (startDate || endDate) {
  //     filters.timestamp = {};
  //     if (startDate) filters.timestamp.$gte = new Date(startDate);
  //     if (endDate) filters.timestamp.$lte = new Date(endDate);
  //   }
  //   if (minAmount || maxAmount) {
  //     filters.amount = {};
  //     if (minAmount) filters.amount.$gte = minAmount;
  //     if (maxAmount) filters.amount.$lte = maxAmount;
  //   }

  //   // Pagination
  //   const skip = (page - 1) * limit;

  //   const transactions = await this.transactionModel
  //     .find(filters)
  //     .skip(skip)
  //     .limit(limit)
  //     .exec();

  //   const total = await this.transactionModel.countDocuments(filters);

  //   return {
  //     transactions,
  //     total,
  //     page,
  //     limit,
  //   };
  // }
  async getFilteredTransactions(options: FilterOptions) {
    const {
      senderWallet,
      recipientWallet,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      status,
      page = 1,
      limit = 10,
    } = options;
  
    const query: SelectQueryBuilder<Transaction> = this.transactionRepository
      .createQueryBuilder('transaction');
  
    // Apply filters dynamically
    if (senderWallet) {
      query.andWhere('transaction.senderWallet = :senderWallet', { senderWallet });
    }
    if (recipientWallet) {
      query.andWhere('transaction.recipientWallet = :recipientWallet', { recipientWallet });
    }
    if (status) {
      query.andWhere('transaction.status = :status', { status });
    }
    if (startDate) {
      query.andWhere('transaction.timestamp >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('transaction.timestamp <= :endDate', { endDate });
    }
    if (minAmount) {
      query.andWhere('transaction.amountSent >= :minAmount', { minAmount });
    }
    if (maxAmount) {
      query.andWhere('transaction.amountSent <= :maxAmount', { maxAmount });
    }
  
    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);
  
    // Execute query
    const [transactions, total] = await query.getManyAndCount();
  
    return {
      transactions,
      total,
      page,
      limit,
    };
  }


}
