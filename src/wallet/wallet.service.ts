import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Connection } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';
import { InjectConnection } from '@nestjs/mongoose';
import { TransactionService } from '../transaction/transaction.service';
import { Transaction } from '../transaction/schemas/transaction.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CurrencyService } from '../currency/currency.service';
import { User } from '../user/entities/user/user'; // Update with the correct path
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';



@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectConnection() private connection: Connection,
    private readonly transactionService: TransactionService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly currencyService: CurrencyService,
    @InjectRepository(User) private readonly userRepository: Repository<User>, // Inject User repository

  ) {}

  async createWallet(userId: string, walletDto: { walletNumber: string; initialBalance: number; name?: string; currency?: string }): Promise<Wallet> {
    
    try{

      const { walletNumber, initialBalance, name, currency } = walletDto;
    
      const newWallet = new this.walletModel({
        walletNumber,
        balance: initialBalance,
        user: userId,
        name: name || walletNumber,
        currency: currency || 'SAR', // Default to SAR
      });
    
      return await newWallet.save();
    } catch(error) {
      //Handle the MongoDB  duplicate key error
      if (error.code === 11000 && error.keyPattern.walletNumber){
        throw new BadRequestException("Wallet number already exists")
      }
      throw error;
    }
  }
  

  async getWalletsForUser(userId: string): Promise<{ wallets: Wallet[]; totalWallets: number }> {
    const wallets = await this.walletModel
      .find({ user: userId })
      .select('-__v') // Exclude the __v field
      .exec();
  
    const totalWallets = await this.walletModel.countDocuments({ user: userId });
  
    return { wallets, totalWallets };
  }

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
      const senderWallet = await this.walletModel.findOne({ walletNumber: fromWallet, user: userId }).session(session);
      const receiverWallet = await this.walletModel.findOne({ walletNumber: toWallet }).session(session);
  
      if (!senderWallet || !receiverWallet) {
        throw new BadRequestException('One or both wallets do not exist');
      }
  
      // Fetch the recipient user details using TypeORM
      const recipientUser = await this.userRepository.findOne({
        where: { id: Number(receiverWallet.user) }, // Convert to number
      });
      if (!recipientUser) {
        throw new BadRequestException('Recipient user not found');
      }
  
      // Compare the provided name with the recipient's actual name
      if (recipientUser.name !== recipientName) {
        throw new BadRequestException('Recipient name and wallet number do not match');
      }
  
      if (senderWallet.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }
  
      const conversionRate = await this.currencyService.getConversionRate(fromCurrency, toCurrency);
      const convertedAmount = amount * conversionRate;
  
      senderWallet.balance -= amount;
      receiverWallet.balance += convertedAmount;
  
      await senderWallet.save({ session });
      await receiverWallet.save({ session });
  
      await session.commitTransaction();
      session.endSession();
  
      return {
        message: 'Transfer successful',
        details: {
          fromWallet: senderWallet.walletNumber,
          toWallet: receiverWallet.walletNumber,
          amount,
          convertedAmount,
          fromCurrency,
          toCurrency,
          conversionRate,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  

  // async transferMoney(fromWallet: string, toWallet: string, amount: number): Promise<{ message: string }> {
  //   const session = await this.connection.startSession();
  //   session.startTransaction();

  //   try {
  //     const senderWallet = await this.walletModel.findOne({ walletNumber: fromWallet }).session(session);
  //     const receiverWallet = await this.walletModel.findOne({ walletNumber: toWallet }).session(session);

  //     if (!senderWallet || !receiverWallet) {
  //       throw new BadRequestException('One or both wallets do not exist');
  //     }

  //     if (senderWallet.balance < amount) {
  //       throw new BadRequestException('Insufficient balance in sender\'s wallet');
  //     }

  //     senderWallet.balance -= amount;
  //     receiverWallet.balance += amount;

  //     await senderWallet.save({ session });
  //     await receiverWallet.save({ session });

  //     // Notify clients about the updated balances
  //     this.realtimeGateway.sendBalanceUpdate(senderWallet._id.toString(), senderWallet.balance);
  //     this.realtimeGateway.sendBalanceUpdate(receiverWallet._id.toString(), receiverWallet.balance);

  //     await session.commitTransaction();
  //     session.endSession();

  //     return { message: 'Transfer successful' };
  //   } catch (error) {
  //     await session.abortTransaction();
  //     session.endSession();
  //     throw error;
  //   }
  // }


}






