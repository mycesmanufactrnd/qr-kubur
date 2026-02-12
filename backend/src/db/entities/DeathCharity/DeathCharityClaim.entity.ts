import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { DeathCharityMember } from "./DeathCharityMember.entity.ts";
import { DeathCharity } from "./DeathCharity.entity.ts";
import { ClaimStatus } from "../../enums.ts";

@Entity("deathcharityclaim")
export class DeathCharityClaim {
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

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
