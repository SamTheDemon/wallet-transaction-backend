import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class TransferDto {
    fromWallet: string;
    toWallet: string;
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    recipientName: string;
}
