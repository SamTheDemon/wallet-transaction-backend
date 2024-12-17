import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema()
export class Wallet extends Document {

  @Prop({ unique: true, required: true })
  walletNumber: string;

  @Prop({ required: true, default: 0 })
  balance: number;
  
  // FK to user
  @Prop({ type: String, required: true })
  user: string;
  
  @Prop({ required: true, default: function () { return this.walletNumber;},})
  name: string;

  @Prop({ type: String, default: 'SAR', required: true })
  currency: string;

}



export const WalletSchema = SchemaFactory.createForClass(Wallet);

/**
 * Pre-validate hook to set default `name` if not provided.
 */
WalletSchema.pre<Wallet>('validate', function (next) {
  if (!this.name) {
    this.name = this.walletNumber;
  }
  next();
});