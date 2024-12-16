import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createWallet(
    @Request() req,
    @Body() body: { walletNumber: string; initialBalance: number },
  ) {
    const userId = String(req.user.id); // Convert to string if it's a number
    return this.walletService.createWallet(body.walletNumber, body.initialBalance, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getWallets(@Request() req) {
    const userId = String(req.user.id);
    const { wallets, totalWallets } = await this.walletService.getWalletsForUser(userId);
    return { wallets, totalWallets };
  }
}
