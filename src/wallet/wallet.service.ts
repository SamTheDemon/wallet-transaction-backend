import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Connection } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';
import { InjectConnection } from '@nestjs/mongoose';


@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectConnection() private connection: Connection,
  ) {}

  async createWallet(walletNumber: string, initialBalance: number, userId: string, name?: string): Promise<Wallet> {
    const existingWallet = await this.walletModel.findOne({ walletNumber }).exec();
    if (existingWallet) {
      throw new ConflictException('Wallet number already exists');
    }
  
    const wallet = new this.walletModel({
      walletNumber,
      balance: initialBalance,
      user: userId,
      name: name || walletNumber, // Explicitly use the provided name or default to walletNumber

    });
    console.log('Creating wallet:', wallet);
    return wallet.save();
  }

  async getWalletsForUser(userId: string): Promise<{ wallets: Wallet[]; totalWallets: number }> {
    const wallets = await this.walletModel
      .find({ user: userId })
      .select('-__v') // Exclude the __v field
      .exec();
  
    const totalWallets = await this.walletModel.countDocuments({ user: userId });
  
    return { wallets, totalWallets };
  }


  async transferMoney(fromWallet: string, toWallet: string, amount: number): Promise<{ message: string }> {
    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than zero');
    }
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Step 1: Find wallets
      const senderWallet = await this.walletModel.findOne({ walletNumber: fromWallet }).session(session);
      const receiverWallet = await this.walletModel.findOne({ walletNumber: toWallet }).session(session);

      if (!senderWallet || !receiverWallet) {
        throw new BadRequestException('One or both wallets do not exist');
      }

      // Step 2: Validate sufficient balance
      if (senderWallet.balance < amount) {
        throw new BadRequestException('Insufficient balance in sender\'s wallet');
      }

      // Step 3: Deduct and credit amounts
      senderWallet.balance -= amount;
      receiverWallet.balance += amount;

      // Step 4: Save wallets
      await senderWallet.save({ session });
      await receiverWallet.save({ session });

      // Step 5: Commit transaction
      await session.commitTransaction();
      session.endSession();

      return { message: 'Transfer successful' };
    } catch (error) {
      // Rollback on failure
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }










}
