import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
} from "typeorm";
import { OnlineTransaction } from "./OnlineTransaction.entity.ts";

@Entity("online_trans_acct")
export class OnlineTransactionAccount {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => OnlineTransaction, (transaction) => transaction.accounts)
  transaction!: OnlineTransaction;

  @Column("varchar", { length: 2 })
  type!: string;
  // App: QR Kubur

  @Column("varchar", { length: 50 })
  accountno!: string;
  // App: QR Kubur receiving

  @Column("decimal", { precision: 18, scale: 2 })
  amount!: number;
  // App: Amount for the transaction (split)
  // ToyyibPay: amount

  @Column("varchar", { length: 50, nullable: true })
  referenceno?: string;
  // ToyyibPay: refno

  @Column("varchar", { length: 50, nullable: true })
  gatewaystatus?: string;
  // ToyyibPay: status (3=unsuccessful, 1=success, 2=pending)

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
