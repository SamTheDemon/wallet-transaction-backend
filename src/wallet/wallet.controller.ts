import { Controller, Post, Get, Body, Req,Request, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransferDto } from './dto/transfer.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createWallet(
    @Request() req,
    @Body() body: { walletNumber: string; initialBalance: number; name?: string},
  ) {
    const userId = String(req.user.id);
    return this.walletService.createWallet(userId, body);

  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getWallets(@Request() req) {
    const userId = String(req.user.id);
    const { wallets, totalWallets } = await this.walletService.getWalletsForUser(userId);
    return { wallets, totalWallets };
  }

  @UseGuards(JwtAuthGuard)
  @Post('transfer')
  async transferMoney(
    @Req() req,
    @Body()
    body: {
      fromWallet: string;
      toWallet: string;
      amount: number;
      fromCurrency: string;
      toCurrency: string;
      recipientName: string; // Ensure recipientName is part of the request body
    },
  ) {
    const userId = req.user.id; // Extract user ID from the authenticated request
    return this.walletService.transferMoney(
      userId,
      body.fromWallet,
      body.toWallet,
      body.amount,
      body.fromCurrency,
      body.toCurrency,
      body.recipientName, // Pass recipientName as the last parameter
    );
  }
  
}
