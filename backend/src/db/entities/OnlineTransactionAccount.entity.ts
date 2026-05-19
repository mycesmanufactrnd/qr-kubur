// @ts-nocheck
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  type Relation,
} from "typeorm";
import { OnlineTransaction } from "./OnlineTransaction.entity.js";
import { OnlineTransactionStatus } from "../enums.js";

@Entity("onlinetransactionaccount")
export class OnlineTransactionAccount {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => OnlineTransaction, (transaction) => transaction.accounts)
  transaction!: Relation<OnlineTransaction>;

  @Column("varchar", { length: 50 })
  type!: string;
  // App: QR Kubur

  @Column("varchar", { length: 50, nullable: true })
  bankname!: string;
  // App: Bank recieving

  @Column("varchar", { length: 50 })
  accountno!: string;
  // App: Account No receiving

  @Column("decimal", { precision: 18, scale: 2 })
  amount!: number;
  // App: Amount for the transaction (split)
  // ToyyibPay: amount

  @Column({
    type: "enum",
    enum: OnlineTransactionStatus,
    default: OnlineTransactionStatus.PENDING,
  })
  status!: OnlineTransactionStatus;
  // App: Status of online transaction from QR Kubur to recepient

  @Column("varchar", { nullable: true })
  referencetransferno!: string;
  // App: Reference No for transaction from QR Kubur to recepient

  @Column("varchar", { nullable: true })
  photourl?: string;
  // App: Reference Image (Receipt) for transaction from QR Kubur to recepient

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
