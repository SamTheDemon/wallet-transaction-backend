import { Controller, Post, Get, Body, Req,Request, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { TransferDto } from './dto/transfer.dto';


@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}


  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createWallet(@Request() req, @Body() body: CreateWalletDto) {
    const userId = String(req.user.id);
    try {
      return await this.walletService.createWallet(userId, body);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error creating wallet',
        HttpStatus.BAD_REQUEST,
      );
    }
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
    @Body() body: TransferDto,
  ) {
    const userId = req.user.id;
    return this.walletService.transferMoney(
      userId,
      body.fromWallet,
      body.toWallet,
      body.amount,
      body.fromCurrency,
      body.toCurrency,
      body.recipientName,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('overview')
  async getFinancialOverview(@Request() req) {
    const userId = String(req.user.id);
    const overview = await this.walletService.getFinancialOverview(userId);
    return overview;
  }
  
}
