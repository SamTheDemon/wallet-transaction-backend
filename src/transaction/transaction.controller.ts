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
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const userId = String(req.user.id);
    const { transactions, total } = await this.transactionService.getTransactionsForUser(userId, page, limit);
    return { transactions, total, page, limit };
  }
}
