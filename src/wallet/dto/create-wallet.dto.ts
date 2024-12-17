import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateWalletDto {

    @IsString()
    walletNumber: string;
    
    @IsNumber()
    @Min(0)
    initialBalance: number;

  
    @IsOptional()
    @IsString()
    name?: string;
  }
  