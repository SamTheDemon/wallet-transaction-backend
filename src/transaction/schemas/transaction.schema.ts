// transaction.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  @Prop({ required: true, type: Number })
  amountSent: number;

  @Prop({ required: true, type: Number })
  amountReceived: number;

  @Prop({ required: true, type: Number })
  conversionRate: number;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
