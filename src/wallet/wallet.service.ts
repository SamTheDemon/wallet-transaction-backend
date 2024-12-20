// wallet.service.ts:
import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model,Connection } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';
import { TransactionService } from '../transaction/transaction.service';

import { CurrencyService } from '../currency/currency.service';
import { User } from '../user/entities/user/user'; 
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { startOfMonth, endOfMonth } from 'date-fns'; 

import { In, Between } from 'typeorm';

import { Transaction } from '../transaction/entities/transaction'; 

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectConnection() private connection: Connection,
    private readonly transactionService: TransactionService,
    private readonly currencyService: CurrencyService,
    @InjectRepository(User) private readonly userRepository: Repository<User>, 
    private readonly dataSource: DataSource, 
    // @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>, 
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,

  ) {}


  // 1- create wallet:
  async createWallet( userId: string, walletDto: { walletNumber: string; initialBalance: number; name?: string; currency?: string },  ): Promise<Wallet> {
    try {
      const { walletNumber, initialBalance, name, currency } = walletDto;
      const newWallet = new this.walletModel({
        walletNumber,
        balance: initialBalance,
        user: userId,
        name: name || walletNumber,
        currency: currency || 'SAR',
      });

      return await newWallet.save();
    } catch (error) {
      if (error.code === 11000 && error.keyPattern.walletNumber) {
        throw new BadRequestException('Wallet number already exists');
      }
      throw error;
    }
  }
  // 2- Get Wallets for a User
  async getWalletsForUser(userId: string): Promise<{ wallets: Wallet[]; totalWallets: number }> {
    const wallets = await this.walletModel.find({ user: userId }).select('-__v').exec();
    const totalWallets = await this.walletModel.countDocuments({ user: userId });
    return { wallets, totalWallets };
  }

  

    // 3. Transfer Money Between Wallets for MongoDB
    async transferMoney(
      userId: string,
      fromWallet: string,
      toWallet: string,
      amount: number,
      fromCurrency: string,
      toCurrency: string,
      recipientName: string,
    ): Promise<{ message: string; details: any }> {
      // Start MongoDB session for transaction
      const session = await this.connection.startSession();
      session.startTransaction();
  
      try {
        // Fetch sender and recipient wallets with session
        const senderWallet = await this.walletModel.findOne(
          { walletNumber: fromWallet, user: userId }
        ).session(session);
        
        const receiverWallet = await this.walletModel.findOne(
          { walletNumber: toWallet }
        ).session(session);
  
        if (!senderWallet || !receiverWallet) {
          throw new BadRequestException('One or both wallets do not exist');
        }
  
        // Validate currencies
        if (senderWallet.currency !== fromCurrency) {
          throw new BadRequestException(`Sender wallet currency mismatch`);
        }
        if (receiverWallet.currency !== toCurrency) {
          throw new BadRequestException(`Recipient wallet currency mismatch`);
        }
  
        // Validate recipient name
        const recipientUser = await this.userRepository.findOne({ 
          where: { id: Number(receiverWallet.user) } 
        });
        if (!recipientUser || recipientUser.name !== recipientName) {
          throw new BadRequestException('Recipient name and wallet number do not match');
        }
  
        // Check sender balance
        if (senderWallet.balance < amount) {
          throw new BadRequestException('Insufficient balance');
        }
  
        // Perform currency conversion
        const conversionRate = await this.currencyService.getConversionRate(
          fromCurrency, 
          toCurrency
        );
        const convertedAmount = amount * conversionRate;
  
        // Create transaction record
        const transaction = await this.transactionModel.create([{
          transactionId: Date.now().toString(),
          senderWallet: fromWallet,
          recipientWallet: toWallet,
          recipientName,
          senderCurrency: fromCurrency,
          recipientCurrency: toCurrency,
          amountSent: amount,
          amountReceived: convertedAmount,
          conversionRate,
          status: 'Pending',
          timestamp: new Date(),
        }], { session });
  
        // Update balances atomically
        await this.walletModel.updateOne(
          { walletNumber: fromWallet },
          { $inc: { balance: -amount } },
          { session }
        );
  
        await this.walletModel.updateOne(
          { walletNumber: toWallet },
          { $inc: { balance: convertedAmount } },
          { session }
        );
  
        // Update transaction status to Success
        await this.transactionModel.updateOne(
          { _id: transaction[0]._id },
          { $set: { status: 'Success' } },
          { session }
        );
  
        // Commit the transaction
        await session.commitTransaction();
  
        return {
          message: 'Transfer successful',
          details: {
            transactionId: transaction[0].transactionId,
            fromWallet: senderWallet.walletNumber,
            toWallet: receiverWallet.walletNumber,
            amount,
            convertedAmount,
            fromCurrency,
            toCurrency,
            conversionRate,
            timestamp: transaction[0].timestamp,
          },
        };
  
      } catch (error) {
        // Rollback the transaction
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
  



  // 3. Transfer Money Between Wallets for SQL
  // async transferMoney(
  //   userId: string,
  //   fromWallet: string,
  //   toWallet: string,
  //   amount: number,
  //   fromCurrency: string,
  //   toCurrency: string,
  //   recipientName: string,
  // ): Promise<{ message: string; details: any }> {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();
  
  //   try {
  //     // Fetch sender and recipient wallets
  //     const senderWallet = await this.walletModel.findOne({ walletNumber: fromWallet, user: userId });
  //     const receiverWallet = await this.walletModel.findOne({ walletNumber: toWallet });
  
  //     if (!senderWallet || !receiverWallet) {
  //       throw new BadRequestException('One or both wallets do not exist');
  //     }
  
  //     // Validate currencies
  //     if (senderWallet.currency !== fromCurrency) {
  //       throw new BadRequestException(`Sender wallet currency mismatch. Expected ${senderWallet.currency}, got ${fromCurrency}`);
  //     }
  //     if (receiverWallet.currency !== toCurrency) {
  //       throw new BadRequestException(`Recipient wallet currency mismatch. Expected ${receiverWallet.currency}, got ${toCurrency}`);
  //     }
  
  //     // Validate recipient name
  //     const recipientUser = await this.userRepository.findOne({ where: { id: Number(receiverWallet.user) } });
  //     if (!recipientUser || recipientUser.name !== recipientName) {
  //       throw new BadRequestException('Recipient name and wallet number do not match');
  //     }
  
  //     // Check sender balance
  //     if (senderWallet.balance < amount) {
  //       throw new BadRequestException('Insufficient balance');
  //     }
  
  //     // Perform currency conversion
  //     const conversionRate = await this.currencyService.getConversionRate(fromCurrency, toCurrency);
  //     const convertedAmount = amount * conversionRate;
  
  //     // Update balances
  //     senderWallet.balance -= amount;
  //     receiverWallet.balance += convertedAmount;
  
  //     // Save wallet updates
  //     await senderWallet.save();
  //     await receiverWallet.save();
  
  //     // Log transaction in SQL
  //     const transaction = this.transactionRepository.create({
  //       transactionId: Date.now().toString(),
  //       senderWallet: fromWallet,
  //       recipientWallet: toWallet,
  //       recipientName,
  //       senderCurrency: fromCurrency,
  //       recipientCurrency: toCurrency,
  //       amountSent: amount,
  //       amountReceived: convertedAmount,
  //       conversionRate,
  //       status: 'Success',
  //       timestamp: new Date(),
  //     });
  
  //     await queryRunner.manager.save(transaction);
  
  //     await queryRunner.commitTransaction();
  

  //     return {
  //       message: 'Transfer successful',
  //       details: {
  //         fromWallet: senderWallet.walletNumber,
  //         toWallet: receiverWallet.walletNumber,
  //         amount,
  //         convertedAmount,
  //         fromCurrency,
  //         toCurrency,
  //         conversionRate,
  //         timestamp: transaction.timestamp,
  //       },
  //     };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }
  

    /**
   * Get total balances, monthly incoming, and monthly outgoing in USD for a user.
   */
    //mongodb:
    async getFinancialOverview(userId: string): Promise<{
      totalBalanceInUSD: number;
      monthlyIncomingInUSD: number;
      monthlyOutgoingInUSD: number;
    }> {
      // Get all user wallets
      const { wallets } = await this.getWalletsForUser(userId);
      const walletNumbers = wallets.map(w => w.walletNumber);

      // Calculate total balance in USD
      let totalBalanceInUSD = 0;
      for (const wallet of wallets) {
        const conversionRate = await this.currencyService.getConversionRate(
          wallet.currency, 
          'USD'
        );
        totalBalanceInUSD += wallet.balance * conversionRate;
      }

      // Get monthly date range
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Get monthly transactions
      const incomingTransactions = await this.transactionModel.find({
        recipientWallet: { $in: walletNumbers },
        timestamp: { $gte: monthStart, $lte: monthEnd },
        status: 'Success'
      });

      const outgoingTransactions = await this.transactionModel.find({
        senderWallet: { $in: walletNumbers },
        timestamp: { $gte: monthStart, $lte: monthEnd },
        status: 'Success'
      });

      // Calculate USD amounts
      let monthlyIncomingInUSD = 0;
      for (const tx of incomingTransactions) {
        const conversionRate = await this.currencyService.getConversionRate(
          tx.recipientCurrency, 
          'USD'
        );
        monthlyIncomingInUSD += tx.amountReceived * conversionRate;
      }

      let monthlyOutgoingInUSD = 0;
      for (const tx of outgoingTransactions) {
        const conversionRate = await this.currencyService.getConversionRate(
          tx.senderCurrency, 
          'USD'
        );
        monthlyOutgoingInUSD += tx.amountSent * conversionRate;
      }

      return {
        totalBalanceInUSD: parseFloat(totalBalanceInUSD.toFixed(2)),
        monthlyIncomingInUSD: parseFloat(monthlyIncomingInUSD.toFixed(2)),
        monthlyOutgoingInUSD: parseFloat(monthlyOutgoingInUSD.toFixed(2)),
      };
    }



  // sql
    // async getFinancialOverview(userId: string): Promise<{
    //   totalBalanceInUSD: number;
    //   monthlyIncomingInUSD: number;
    //   monthlyOutgoingInUSD: number;
    // }> {
    //   // 1. Get all user wallets
    //   const { wallets } = await this.getWalletsForUser(userId);
    //   const walletNumbers = wallets.map(w => w.walletNumber);
  
    //   // 2. Calculate total balance in USD
    //   let totalBalanceInUSD = 0;
    //   for (const wallet of wallets) {
    //     const conversionRate = await this.currencyService.getConversionRate(wallet.currency, 'USD');
    //     totalBalanceInUSD += wallet.balance * conversionRate;
    //   }
  
    //   // 3. Determine monthly time range (current month)
    //   const now = new Date();
    //   const monthStart = startOfMonth(now);
    //   const monthEnd = endOfMonth(now);
  
    //   // 4. Fetch monthly transactions where user is recipient (Incoming)
    //   const incomingTransactions = await this.transactionRepository.find({
    //     where: {
    //       recipientWallet: In(walletNumbers),
    //       timestamp: Between(monthStart, monthEnd)
    //     },
    //   });
  
    //   let monthlyIncomingInUSD = 0;
    //   for (const tx of incomingTransactions) {
    //     const conversionRate = await this.currencyService.getConversionRate(tx.recipientCurrency, 'USD');
    //     monthlyIncomingInUSD += tx.amountReceived * conversionRate;
    //   }
  
    //   // 5. Fetch monthly transactions where user is sender (Outgoing)
    //   const outgoingTransactions = await this.transactionRepository.find({
    //     where: {
    //       senderWallet: In(walletNumbers),
    //       timestamp: Between(monthStart, monthEnd),
    //     },
    //   });
  
    //   let monthlyOutgoingInUSD = 0;
    //   for (const tx of outgoingTransactions) {
    //     const conversionRate = await this.currencyService.getConversionRate(tx.senderCurrency, 'USD');
    //     monthlyOutgoingInUSD += tx.amountSent * conversionRate;
    //   }
  
    //   return {
    //     totalBalanceInUSD: parseFloat(totalBalanceInUSD.toFixed(2)),
    //     monthlyIncomingInUSD: parseFloat(monthlyIncomingInUSD.toFixed(2)),
    //     monthlyOutgoingInUSD: parseFloat(monthlyOutgoingInUSD.toFixed(2)),
    //   };
    // }
 
 
}

