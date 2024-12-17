import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  transactionId: string;

  @Column()
  senderWallet: string;

  @Column()
  recipientWallet: string;

  @Column()
  recipientName: string;

  @Column()
  senderCurrency: string;

  @Column()
  recipientCurrency: string;

  @Column('decimal')
  amountSent: number;

  @Column('decimal')
  amountReceived: number;

  @Column('decimal')
  conversionRate: number;

  @Column()
  status: string;

  @CreateDateColumn()
  timestamp: Date;
}
