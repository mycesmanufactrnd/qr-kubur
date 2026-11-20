import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  type Relation,
} from "typeorm";
import { OnlineTransactionAccount } from "./OnlineTransactionAccount.entity.js";

// Active gateway: Billplz — rows written by recordBillplzPayment (services/billplz.service.ts).
// ToyyibPay comments kept for reference (old rows were written by handleToyyibPayCallback).
@Entity("onlinetransaction")
export class OnlineTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 50 })
  referenceno!: string;
  // ToyyibPay: refno
  // Billplz: transaction_id, or the bill id when no transaction_id is sent
  // App: unique reference ID from your app

  @Column("varchar", { length: 50 })
  orderno!: string;
  // ToyyibPay: order_id
  // Billplz: reference_1
  // App: billExternalReferenceNo, sent through service

  @Column("timestamp", { nullable: true })
  ordertime?: Date;
  // ToyyibPay: null
  // Billplz: paid_at
  // App: When user initiated the payment

  @Column("decimal", { precision: 18, scale: 2, default: 0 })
  orderamount!: number;
  // ToyyibPay: amount
  // Billplz: amount / 100 (Billplz sends cents)
  // App: Total amount for the transaction

  @Column("decimal", { precision: 18, scale: 2, default: 0 })
  originalamount!: number;
  // ToyyibPay: null
  // Billplz: null
  // App: Original amount for the transaction

  @Column("decimal", { precision: 18, scale: 2, default: 0 })
  maintenancefee!: number;
  // ToyyibPay: null
  // Billplz: null
  // App: From app PLATFORM_FEE (platform fee)

  @Column("varchar", { length: 10, nullable: true })
  orderstatus?: string;
  // ToyyibPay: status_id (3=unsuccessful, 1=success, 2=pending)
  // Billplz: paid → "1" (success), not paid → "3" (unsuccessful)
  // App: status code (pending, success, failed)

  // This come from ToyyiPay not Bank
  // This comes from Billplz, not the bank
  @Column("varchar", { length: 50, nullable: true })
  transactionid?: string;
  // App: null
  // ToyyibPay: transaction_id
  // Billplz: transaction_id (only sent when "Extra Payment Completion
  //   Information" is enabled on the Billplz account, otherwise null)

  @Column("varchar", { length: 50, nullable: true })
  userid?: string;
  // App: User who initiated the transaction (users.id or googleuser.id), null for guests
  // ToyyibPay: null
  // Billplz: carried on the bill as reference_2 ("<table>:<id>"), read back here

  @Column("varchar", { length: 50, nullable: true })
  usertablereference?: string;
  // App: GoogleUser | Users — which table userid points to, null for guests

  // UNUSED with Billplz — kept only for legacy ToyyibPay rows. Do not write.
  // Settlement/intermediary response
  @Column("varchar", { length: 2, nullable: true })
  fpxdirectrespcode?: string;
  // App: null
  // ToyyibPay: none
  // Billplz: not provided

  // UNUSED with Billplz — kept only for legacy ToyyibPay rows. Do not write.
  // Settlement/intermediary response
  @Column("varchar", { length: 2, nullable: true })
  fpxindirectrespcode?: string;
  // App: null
  // ToyyibPay: none
  // Billplz: not provided

  // UNUSED with Billplz — kept only for legacy ToyyibPay rows. Do not write.
  // Don't comment out the @Column: DATABASE_SYNC=true would DROP the column and its data.
  // This come from Bank
  @Column("varchar", { length: 50, nullable: true })
  fpxtransactionid?: string;
  // App: null
  // ToyyibPay: fpx_transaction_id
  // Billplz: not provided

  @Column("timestamp", { nullable: true })
  fpxtransactiontime?: Date;
  // App: null
  // ToyyibPay: transaction_time
  // Billplz: paid_at

  @Column("varchar", { length: 50, nullable: true })
  billcode?: string;
  // App: null
  // ToyyibPay: billcode
  // Billplz: bill id (used to find the row again)

  @Column("varchar", { length: 50, nullable: true })
  gatewaymsg?: string;
  // App: null
  // ToyyibPay: msg
  // Billplz: bill state (due / paid / deleted)

  @Column("varchar", { length: 50, nullable: true })
  gatewayadditionalmsg?: string;
  // App: null
  // ToyyibPay: reason
  // Billplz: transaction_status (pending / completed / failed), same condition as transactionid

  @Column("varchar", { length: 30, nullable: true })
  gatewaystatus?: string;
  // App: null
  // ToyyibPay: status (3=unsuccessful, 1=success, 2=pending)
  // Billplz: "success" when paid, otherwise "unsuccessful"

  @Column("varchar", { length: 64, nullable: true })
  gatewayhash?: string;
  // App: null
  // ToyyibPay: hash (SHA2560) for callback verification
  // Billplz: x_signature (HMAC-SHA256) used for callback verification

  @OneToMany(() => OnlineTransactionAccount, (account) => account.transaction)
  accounts?: Relation<OnlineTransactionAccount[]>;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
