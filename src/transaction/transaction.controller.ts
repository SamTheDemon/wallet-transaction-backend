import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}


  // 1- Retrieves all transactions for the authenticated user, with optional filtering and pagination.
 @UseGuards(JwtAuthGuard)
  @Get('all')
  async getAllTransactions(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('senderWallet') senderWallet?: string,
    @Query('recipientWallet') recipientWallet?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('status') status?: string,
  ) {
    const userId = String(req.user.id);

    // If filters are provided, call the filtered transactions service
    const filterOptions = {
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
    };

    const result = senderWallet || recipientWallet || startDate || endDate || minAmount || maxAmount || status
      ? await this.transactionService.getFilteredTransactions(filterOptions)
      : await this.transactionService.getTransactionsForUser(userId, page, limit);

    return {
      transactions: result.transactions,
      total: result.total,
      page,
      limit,
    };
  }

  // 2- Retrieves a 7-day overview of incoming and outgoing transactions for the authenticated user.
  @UseGuards(JwtAuthGuard)
  @Get('7days-overview')
  async getLast7DaysOverview(@Request() req) {
    const userId = String(req.user.id);
    return this.transactionService.getLast7DaysOverview(userId);
  }

}