import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema()
export class Wallet extends Document {
  @Prop({ unique: true, required: true })
  walletNumber: string;

  @Prop({ required: true, default: 0 })
  balance: number;
  
  @Prop({ type: String, required: true })
  user: string;
  
  @Prop({
    required: true,
    default: function () {
      return this.walletNumber; // Default to walletNumber if name is not provided
    },
  })
  name: string;

}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
