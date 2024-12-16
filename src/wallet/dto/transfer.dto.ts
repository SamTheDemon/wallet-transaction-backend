import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  fromWallet: string;

  @IsString()
  @IsNotEmpty()
  toWallet: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
