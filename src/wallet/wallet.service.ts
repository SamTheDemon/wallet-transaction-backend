import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
  ) {}

  async createWallet(walletNumber: string, initialBalance: number): Promise<Wallet> {
    const wallet = new this.walletModel({ walletNumber, balance: initialBalance });
    return wallet.save();
  }

  async getWalletBalance(walletNumber: string): Promise<Wallet> {
    return this.walletModel.findOne({ walletNumber }).exec();
  }

  async updateWalletBalance(walletNumber: string, balance: number): Promise<Wallet> {
    return this.walletModel.findOneAndUpdate({ walletNumber }, { balance }, { new: true }).exec();
  }
}
