import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from "typeorm";
import { OnlineTransactionAccount } from "./OnlineTransactionAccount.entity.ts";

@Entity("onlinetransaction")
export class OnlineTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 50 })
  referenceno!: string; 
  // ToyyibPay: refno
  // App: unique reference ID from your app
  
  @Column("varchar", { length: 50 })
  orderno!: string; 
  // ToyyibPay: order_id
  // App: billExternalReferenceNo, sent through service

  @Column("timestamp", { nullable: true })
  ordertime?: Date;
  // ToyyibPay: null
  // App: When user initiated the payment

  @Column("decimal", { precision: 18, scale: 2 })
  orderamount!: number;
  // ToyyibPay: amount
  // App: Total amount for the transaction

  @Column("varchar", { length: 10, nullable: true })
  orderstatus?: string;
  // ToyyibPay: status_id (3=unsuccessful, 1=success, 2=pending)
  // App: status code (pending, success, failed)

  // This come from ToyyiPay not Bank
  @Column("varchar", { length: 50, nullable: true })
  transactionid?: string;
  // App: null
  // ToyyibPay: transaction_id

  @Column("varchar", { length: 50, nullable: true })
  userid?: string;
  // App: User who initiated the transaction
  // ToyyibPay: null

  // Settlement/intermediary response
  @Column("varchar", { length: 2, nullable: true })
  fpxdirectrespcode?: string;
  // App: null
  // ToyyibPay: none

  // Settlement/intermediary response
  @Column("varchar", { length: 2, nullable: true })
  fpxindirectrespcode?: string;
  // App: null
  // ToyyibPay: none

  // This come from Bank
  @Column("varchar", { length: 50, nullable: true })
  fpxtransactionid?: string;
  // App: null
  // ToyyibPay: fpx_transaction_id

  @Column("timestamp", { nullable: true })
  fpxtransactiontime?: Date;
  // App: null
  // ToyyibPay: transaction_time

  @Column("varchar", { length: 50, nullable: true })
  billcode?: string;
  // App: null
  // ToyyibPay: billcode
  
  @Column("varchar", { length: 50, nullable: true })
  gatewaymsg?: string;
  // App: null
  // ToyyibPay: msg

  @Column("varchar", { length: 50, nullable: true })
  gatewayadditionalmsg?: string;
  // App: null
  // ToyyibPay: reason

  @Column("varchar", { length: 10, nullable: true })
  gatewaystatus?: string;
  // App: null
  // ToyyibPay: status (3=unsuccessful, 1=success, 2=pending)

  @Column("varchar", { length: 64, nullable: true })
  gatewayhash?: string;
  // App: null
  // ToyyibPay: hash (SHA2560) for callback verification

  @OneToMany(() => OnlineTransactionAccount, (account) => account.transaction)
  accounts?: OnlineTransactionAccount[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
