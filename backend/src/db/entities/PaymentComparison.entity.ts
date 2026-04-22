import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("paymentcomparison")
export class PaymentComparison {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 100 })
  gateway!: string;

  @Column("text")
  content!: string;

  @Column("integer", { default: 0 })
  sortorder!: number;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
