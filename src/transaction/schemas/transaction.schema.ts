import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema()
export class Transaction extends Document {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ required: true })
  senderWallet: string;

  @Prop({ required: true })
  recipientWallet: string;

  @Prop({ required: true })
  recipientName: string;


  @Prop({ required: true })
  senderCurrency: string;

  @Prop({ required: true })
  recipientCurrency: string;

  @Prop({ required: true })
  amountSent: number; 

  @Prop({ required: true })
  amountReceived: number;

  @Prop({ required: true })
  conversionRate: number;

  @Prop({ required: true })
  status: string;

  @Prop({ default: Date.now })
  timestamp: Date;

}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
