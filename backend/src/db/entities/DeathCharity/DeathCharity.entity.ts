import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { DeathCharityMember } from "./DeathCharityMember.entity.ts";
import { DeathCharityClaim } from "./DeathCharityClaim.entity.ts";
import { Organisation } from "../Organisation.entity.ts";

@Entity("deathcharity")
export class DeathCharity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar")
  name!: string;

  @Column("varchar", { nullable: true })
  description?: string;

  @Column("varchar", { nullable: true })
  state!: string;

  @Column("varchar", { nullable: true })
  contactperson?: string;

  @Column("varchar", { nullable: true })
  contactphone?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  registrationfee!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  monthlyfee!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  deathbenefitamount!: number;

  @Column({ type: "boolean", default: true })
  coversspouse!: boolean;

  @Column({ type: "boolean", default: true })
  coverschildren!: boolean;

  @Column({ type: "int", default: 0 })
  maxdependents!: number;

  @Column({ type: "boolean", default: true })
  isactive!: boolean;

  @OneToMany(() => DeathCharityMember, member => member.deathcharity)
  members!: DeathCharityMember[];

  @OneToMany(() => DeathCharityClaim, claim => claim.deathcharity)
  claims!: DeathCharityClaim[];

  @ManyToOne(() => Organisation, (organisation) => organisation.deathcharites, {
    nullable: true,
    onDelete: "SET NULL",
  })
  organisation?: Organisation | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @UpdateDateColumn({ name: "updatedat" })
  updatedat!: Date;
}
