import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { OnlineTransaction } from "./OnlineTransaction.entity.ts";

@Entity("online_trans_acct")
export class OnlineTransactionAccount {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => OnlineTransaction, (transaction) => transaction.accounts)
  transaction!: OnlineTransaction;

  @Column("varchar", { length: 2 })
  type!: string; 

  @Column("varchar", { length: 50 })
  accountno!: string;

  @Column("decimal", { precision: 18, scale: 2 })
  amount!: number;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
