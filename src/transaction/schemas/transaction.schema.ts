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
  amount: number;

  @Prop({ required: true })
  status: string; // e.g., 'Success' or 'Failed'

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
