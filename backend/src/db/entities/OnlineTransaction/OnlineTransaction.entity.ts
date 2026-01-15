import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { OnlineTransactionAccount } from "./OnlineTransactionAccount.entity.ts";

@Entity("online_trans")
export class OnlineTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 50 })
  orderno!: string; 

  @Column("timestamp", { nullable: true })
  ordertime?: Date;

  @Column("decimal", { precision: 18, scale: 2 })
  orderamount!: number;

  @Column("varchar", { length: 2 })
  orderstatus!: string;

  @Column("varchar", { length: 50 })
  userid?: string;

  @Column("varchar", { length: 2, nullable: true })
  fpxdirectrespcode?: string;

  @Column("varchar", { length: 2, nullable: true })
  fpxindirectrespsecode?: string;

  @Column("varchar", { length: 50, nullable: true })
  fpxtransactionid?: string;

  @Column("timestamp", { nullable: true })
  fpxtransactiontime?: Date;

  @Column("varchar", { length: 50, nullable: true })
  fpxrefno?: string;

  @OneToMany(() => OnlineTransactionAccount, (account) => account.transaction)
  accounts?: OnlineTransactionAccount[];

  @CreateDateColumn({ name: "createdat" })
  createdAt!: Date;
}
