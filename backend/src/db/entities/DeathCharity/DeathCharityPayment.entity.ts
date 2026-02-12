import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { DeathCharityMember } from "./DeathCharityMember.entity.ts";

@Entity("deathcharitypayment")
export class DeathCharityPayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => DeathCharityMember, (deathcharitymember) => deathcharitymember.payments, {
    nullable: true,
    onDelete: "SET NULL",
  })
  member?: DeathCharityMember | null;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column("varchar", { length: 255, })
  paymenttype!: string; // registration | monthly | yearly

  @Column("varchar", { nullable: true })
  referenceno?: string;

  @CreateDateColumn({ name: "paidat" })
  paidat!: Date;
}
