import { Injectable, ConflictException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';


@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
  ) {}

  async createWallet(walletNumber: string, initialBalance: number, userId: string): Promise<Wallet> {
    const existingWallet = await this.walletModel.findOne({ walletNumber }).exec();
    if (existingWallet) {
      throw new ConflictException('Wallet number already exists');
    }
  
    const wallet = new this.walletModel({
      walletNumber,
      balance: initialBalance,
      user: userId,
    });
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
}
