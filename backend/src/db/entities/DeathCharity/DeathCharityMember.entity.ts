import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
} from "typeorm";
import { DeathCharity } from "./DeathCharity.entity.ts";
import { DeathCharityPayment } from "./DeathCharityPayment.entity.ts";
import { DeathCharityDependent } from "./DeathCharityDependent.entity.ts";
import { DeathCharityClaim } from "./DeathCharityClaim.entity.ts";
import { AuditableEntity } from "../ExtendsEntity/AuditableEntity.ts";

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

  @Column("boolean", { default: true })
  isactive!: boolean;
}
