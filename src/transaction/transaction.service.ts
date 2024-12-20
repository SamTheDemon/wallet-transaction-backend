import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction';
import { Wallet } from 'src/wallet/schemas/wallet.schema';
import { CurrencyService } from 'src/currency/currency.service';
// import { SelectQueryBuilder } from 'typeorm';
// import { In,Between } from 'typeorm';


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
    //commented because i switched Transaction from SQL to Mongodb
    // @InjectRepository(Transaction)
    // private readonly transactionRepository: Repository<Transaction>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<Transaction>,
    @InjectModel(Wallet.name) private readonly walletModel: Model<Wallet>,
    private readonly currencyService: CurrencyService, 
  ) {}

  // 1- Creates a new transaction in the system.
  async createTransaction(transactionDto: Partial<Transaction>): Promise<Transaction> {
    const transaction = new this.transactionModel(transactionDto);
    return await transaction.save();
  }

  // 2-Retrieves all transactions associated with the authenticated user, paginated.
  async getTransactionsForUser(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{ transactions: any[]; total: number }> {
    const skip = (page - 1) * limit;

    // Fetch user's wallet numbers
    const wallets = await this.walletModel.find({ user: userId }).select('walletNumber').exec();
    const walletNumbers = wallets.map(wallet => wallet.walletNumber);

    // Build MongoDB query
    const query = {
      $or: [
        { senderWallet: { $in: walletNumbers } },
        { recipientWallet: { $in: walletNumbers } }
      ]
    };

    // Fetch transactions
    const transactions = await this.transactionModel
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Add 'type' field
    const enrichedTransactions = transactions.map(transaction => ({
      ...transaction.toObject(),
      type: walletNumbers.includes(transaction.senderWallet) ? 'Outgoing' : 'Incoming'
    }));

    const total = await this.transactionModel.countDocuments(query);

    return { transactions: enrichedTransactions, total };
  }

  // 3- Retrieves transactions for the authenticated user based on filter options.
  async getFilteredTransactions(options: FilterOptions) {
    const {
      userId,
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

    const skip = (page - 1) * limit;

    // Build MongoDB query
    const query: any = {};

    if (senderWallet) query.senderWallet = senderWallet;
    if (recipientWallet) query.recipientWallet = recipientWallet;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      query.amountSent = {};
      if (minAmount) query.amountSent.$gte = minAmount;
      if (maxAmount) query.amountSent.$lte = maxAmount;
    }

    // Get user's wallets for filtering
    const wallets = await this.walletModel.find({ user: userId }).select('walletNumber');
    const walletNumbers = wallets.map(w => w.walletNumber);

    // Add wallet filter
    query.$or = [
      { senderWallet: { $in: walletNumbers } },
      { recipientWallet: { $in: walletNumbers } }
    ];

    const transactions = await this.transactionModel
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.transactionModel.countDocuments(query);

    return {
      transactions,
      total,
      page,
      limit,
    };
  }
  // 4- Retrieves an overview of transactions for the last 7 days for the authenticated user.
  async getLast7DaysOverview(userId: string) {
    const userWallets = await this.walletModel.find({ user: userId }).exec();
    const userWalletNumbers = userWallets.map(w => w.walletNumber);

    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    const transactions = await this.transactionModel.find({
      $or: [
        { senderWallet: { $in: userWalletNumbers }, timestamp: { $gte: start, $lte: end } },
        { recipientWallet: { $in: userWalletNumbers }, timestamp: { $gte: start, $lte: end } }
      ]
    }).sort({ timestamp: 1 });

    // Initialize daily data structure
    const dailyData = {};
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const dayKey = day.toISOString().split('T')[0];
      dailyData[dayKey] = {
        incoming: { USD: 0, SAR: 0, EUR: 0 },
        expense: { USD: 0, SAR: 0, EUR: 0 },
      };
    }

    // Aggregate transactions
    for (const tx of transactions) {
      const dateKey = tx.timestamp.toISOString().split('T')[0];
      const isUserSender = userWalletNumbers.includes(tx.senderWallet);
      const isUserRecipient = userWalletNumbers.includes(tx.recipientWallet);

      if (isUserSender && isUserRecipient) continue;

      if (isUserRecipient) {
        const amount = Number(tx.amountReceived);
        dailyData[dateKey].incoming[tx.recipientCurrency] += amount;
      } else if (isUserSender) {
        const amount = Number(tx.amountSent);
        dailyData[dateKey].expense[tx.senderCurrency] += amount;
      }
    }

    // Convert to USD
    const sarToUsd = await this.currencyService.getConversionRate('SAR', 'USD');
    const eurToUsd = await this.currencyService.getConversionRate('EUR', 'USD');

    return Object.keys(dailyData).sort().map(date => {
      const dayData = dailyData[date];
      const incomingUSD = 
        dayData.incoming.USD +
        dayData.incoming.SAR * sarToUsd +
        dayData.incoming.EUR * eurToUsd;

      const expenseUSD = 
        dayData.expense.USD +
        dayData.expense.SAR * sarToUsd +
        dayData.expense.EUR * eurToUsd;

      return {
        date,
        incoming: parseFloat(incomingUSD.toFixed(2)),
        expense: parseFloat(expenseUSD.toFixed(2)),
      };
    });
  }
}
