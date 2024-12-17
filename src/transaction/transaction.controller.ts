import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getAllTransactions(
    @Request() req,
    @Query('page') page: number ,
    @Query('limit') limit: number,
    @Query('senderWallet') senderWallet?: string,
    @Query('recipientWallet') recipientWallet?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('status') status?: string,
  ) {
    const userId = String(req.user.id);
    const { transactions, total } = await this.transactionService.getTransactionsForUser(userId, page, limit);
    return this.transactionService.getFilteredTransactions({
      userId,
      senderWallet,
      recipientWallet,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      status,
      page,
      limit,
    });
  }
}
