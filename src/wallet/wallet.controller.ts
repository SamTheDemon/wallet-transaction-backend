import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createWallet(
    @Request() req,
    @Body('initialBalance') initialBalance: number,
  ) {
    return this.walletService.createWallet(req.user, initialBalance);
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getWallets(@Request() req) {
    return this.walletService.getWalletBalance(req.user.id);
  }
}
