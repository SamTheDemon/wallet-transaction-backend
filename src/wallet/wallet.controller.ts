import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
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
    @Body() body: { walletNumber: string; initialBalance: number; name?: string },
  ) {
    const userId = String(req.user.id);
    return this.walletService.createWallet(body.walletNumber, body.initialBalance, userId, body.name);
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
  async transfer(@Body() transferDto: TransferDto) {
    const { fromWallet, toWallet, amount } = transferDto;
    return this.walletService.transferMoney(fromWallet, toWallet, amount);
  }
}
