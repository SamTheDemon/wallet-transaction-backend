import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model,Connection } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';
import { TransactionService } from '../transaction/transaction.service';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CurrencyService } from '../currency/currency.service';
import { User } from '../user/entities/user/user'; 
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';



@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectConnection() private connection: Connection,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>, 
    private readonly transactionService: TransactionService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly currencyService: CurrencyService,
    @InjectRepository(User) private readonly userRepository: Repository<User>, 

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

  
  // 3. Transfer Money Between Wallets
  async transferMoney(
    userId: string,
    fromWallet: string,
    toWallet: string,
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    recipientName: string,
  ): Promise<{ message: string; details: any }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const senderWallet = await this.validateSenderWallet(userId, fromWallet, session);
      const receiverWallet = await this.validateReceiverWallet(toWallet, recipientName, session);

      this.ensureSufficientBalance(senderWallet, amount);

      const conversionRate = await this.currencyService.getConversionRate(fromCurrency, toCurrency);
      const convertedAmount = amount * conversionRate;

      await this.updateBalances(senderWallet, receiverWallet, amount, convertedAmount, session);
      await this.logTransaction(senderWallet, receiverWallet, amount, convertedAmount, conversionRate, fromCurrency, toCurrency, recipientName, session);

      await session.commitTransaction();
      session.endSession();

      return {
        message: 'Transfer successful',
        details: {
          fromWallet: senderWallet.walletNumber,
          toWallet: receiverWallet.walletNumber,
          amountSent: amount,
          amountReceived: convertedAmount,
          conversionRate,
          fromCurrency,
          toCurrency,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }


// --- Private Helper Methods ---

  private async validateSenderWallet(userId: string, fromWallet: string, session: any) {
    const senderWallet = await this.walletModel.findOne({ walletNumber: fromWallet, user: userId }).session(session);
    if (!senderWallet) throw new BadRequestException('Sender wallet not found');
    return senderWallet;
  }

  private async validateReceiverWallet(toWallet: string, recipientName: string, session: any) {
    const receiverWallet = await this.walletModel.findOne({ walletNumber: toWallet }).session(session);
    if (!receiverWallet) throw new BadRequestException('Recipient wallet not found');

    const recipientUser = await this.userRepository.findOne({ where: { id: Number(receiverWallet.user) } });
    if (!recipientUser || recipientUser.name !== recipientName) {
      throw new BadRequestException('Recipient name and wallet number do not match');
    }

    return receiverWallet;
  }

  private ensureSufficientBalance(wallet: Wallet, amount: number) {
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }
  }

  private async updateBalances(senderWallet: Wallet, receiverWallet: Wallet, amount: number, convertedAmount: number, session: any) {
    senderWallet.balance -= amount;
    receiverWallet.balance += convertedAmount;

    await senderWallet.save({ session });
    await receiverWallet.save({ session });
  }

  private async logTransaction(
    senderWallet: Wallet,
    receiverWallet: Wallet,
    amountSent: number,
    amountReceived: number,
    conversionRate: number,
    fromCurrency: string,
    toCurrency: string,
    recipientName: string,
    session: any,
  ) {
    const transaction = new this.transactionModel({
      transactionId: Date.now().toString(),
      senderWallet: senderWallet.walletNumber,
      recipientWallet: receiverWallet.walletNumber,
      recipientName,
      senderCurrency: fromCurrency,
      recipientCurrency: toCurrency,
      amountSent,
      amountReceived,
      conversionRate,
      status: 'Success',
      timestamp: new Date(),
    });
    await transaction.save({ session });
  }
}

