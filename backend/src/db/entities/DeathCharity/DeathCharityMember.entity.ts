// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { DeathCharity } from "./DeathCharity.entity.js";
import { DeathCharityPayment } from "./DeathCharityPayment.entity.js";
import { DeathCharityDependent } from "./DeathCharityDependent.entity.js";
import { DeathCharityClaim } from "./DeathCharityClaim.entity.js";
import { AuditableEntity } from "../ExtendsEntity/AuditableEntity.js";
import { Mosque } from "../Mosque.entity.js";
import { Organisation } from "../Organisation.entity.js";
import { DeadPerson } from "../DeadPerson.entity.js";

@Entity("deathcharitymember")
export class DeathCharityMember extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => DeathCharity, (deathcharity) => deathcharity.members, {
    nullable: true,
    onDelete: "SET NULL",
  })
  deathcharity?: DeathCharity | null;

  @OneToMany(() => DeathCharityPayment, (payments) => payments.member)
  payments?: DeathCharityPayment[];

  @OneToMany(() => DeathCharityDependent, (dependents) => dependents.member)
  dependents?: DeathCharityDependent[];

  @OneToMany(() => DeathCharityClaim, (claims) => claims.member)
  claims?: DeathCharityClaim[];

  @Column("varchar", { length: 255 })
  fullname!: string;

  @Column("varchar", { length: 255 })
  icnumber!: string;

  @Column("varchar", { length: 255, nullable: true })
  phone?: string;

  @Column("varchar", { length: 255, nullable: true })
  email?: string;

  @Column("text", { nullable: true })
  address?: string;

  @Column("boolean", { default: false })
  isdeceased!: boolean;

  @Column("integer", { nullable: true })
  mosqueId?: number | null;

  @ManyToOne(() => Mosque, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "mosqueId" })
  mosque?: Mosque | null;

  @ManyToOne(() => Organisation, { nullable: true, onDelete: "SET NULL" })
  organisation?: Organisation | null;

  @Column("boolean", { default: false })
  isapproved!: boolean;

  @Column("integer", { nullable: true })
  deadpersonId?: number | null;

  @OneToOne(() => DeadPerson, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "deadpersonId" })
  deadperson?: DeadPerson | null;
}
