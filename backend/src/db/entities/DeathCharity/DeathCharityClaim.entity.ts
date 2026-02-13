import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { DeathCharityMember } from "./DeathCharityMember.entity.ts";
import { DeathCharity } from "./DeathCharity.entity.ts";
import { ClaimStatus } from "../../enums.ts";
import { DeathCharityDependent } from "./DeathCharityDependent.entity.ts";
import { AuditableEntity } from "../ExtendsEntity/AuditableEntity.ts";

@Entity("deathcharityclaim")
export class DeathCharityClaim extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => DeathCharity, (deathcharity) => deathcharity.claims, {
    nullable: true,
    onDelete: "SET NULL",
  })
  deathcharity?: DeathCharity | null;

  @ManyToOne(() => DeathCharityMember, (deathcharitymember) => deathcharitymember.claims, {
    nullable: true,
    onDelete: "SET NULL",
  })
  member?: DeathCharityMember | null;

  @ManyToOne(() => DeathCharityDependent, (deathcharitydependent) => deathcharitydependent.claims)
  dependent?: DeathCharityDependent | null;

  @Column("varchar", { length: 255 })
  deceasedname!: string;

  @Column("varchar", { length: 255 })
  relationship!: string; // member / spouse / child

  @Column({ type: "decimal", precision: 10, scale: 2 })
  payoutamount!: number;

  @Column({
    type: "enum",
    enum: ClaimStatus,
    default: ClaimStatus.PENDING,
  })
  status!: ClaimStatus;
}
