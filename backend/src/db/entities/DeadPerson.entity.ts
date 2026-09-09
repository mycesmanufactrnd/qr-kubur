// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
  OneToOne,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { Grave } from "./Grave.entity.js";
import { Suggestion } from "./Suggestion.entity.js";
import { Quotation } from "./Quotation.entity.js";
import { User } from "./User.entity.js";
import { DeathCharityMember } from "./DeathCharity/DeathCharityMember.entity.js";
import { GraveSlot } from "./GraveSlot.entity.js";
import {
  encryptField,
  decryptField,
  hashForSearch,
} from "../../helpers/cryptoHelper.js";

@Entity("deadperson")
export class DeadPerson {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  name!: string;

  // Encrypted at rest (AES-256-GCM) via the transformer below. Never query
  // this column directly with WHERE/ILIKE — use icnumberhash for lookups.
  @Column("varchar", {
    length: 255,
    nullable: true,
    transformer: {
      to: (value?: string | null) => (value ? encryptField(value) : value),
      from: (value?: string | null) => (value ? decryptField(value) : value),
    },
  })
  icnumber?: string | null;

  // Deterministic HMAC of icnumber, kept in sync automatically (see
  // setIcNumberHash below). Used for exact-match search since the encrypted
  // icnumber column itself can't be matched with WHERE/ILIKE.
  @Column("varchar", { length: 64, nullable: true })
  icnumberhash?: string | null;

  @Column({ type: "date", nullable: true })
  dateofbirth?: Date | null;

  @Column({ type: "date", nullable: true })
  dateofdeath?: Date | null;

  @Column("varchar", { length: 255, nullable: true })
  causeofdeath?: string | null;

  @ManyToOne(() => Grave, (grave) => grave.deadPersons, {
    nullable: true,
    onDelete: "SET NULL",
  })
  grave?: Grave | null;

  @Column("varchar", { length: 255, nullable: true })
  gravelot!: string | null;

  @Column("integer", { nullable: true })
  graveslotId?: number | null;

  @OneToOne(() => GraveSlot, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "graveslotId" })
  graveslot?: GraveSlot | null;

  @Column("varchar", { length: 255, nullable: true })
  biography?: string | null;

  @Column("varchar", { length: 255, nullable: true })
  photourl?: string | null;

  @Column("double precision", { nullable: true })
  latitude?: number | null;

  @Column("double precision", { nullable: true })
  longitude?: number | null;

  @Column("varchar", { length: 255, nullable: true })
  heirname?: string;

  @Column("varchar", { length: 255, nullable: true })
  heirphoneno?: string;

  @Column("text", { nullable: true })
  deathconfirmationphotourl?: string | null;

  @Column("text", { nullable: true })
  policereportphotourl?: string | null;

  @Column("text", { nullable: true })
  supportingdocphotourl?: string | null;

  @OneToMany(() => Suggestion, (suggestions) => suggestions.deadperson)
  suggestions?: Suggestion[] | [];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @Column("integer", { nullable: true })
  createdbyId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "createdbyId" })
  createdby?: User | null;

  @OneToOne(() => DeathCharityMember, (member) => member.deadperson)
  deathcharitymember?: DeathCharityMember | null;

  // Runs before the icnumber transformer encrypts the value, so `this.icnumber`
  // is still plaintext here.
  @BeforeInsert()
  @BeforeUpdate()
  setIcNumberHash() {
    this.icnumberhash = this.icnumber ? hashForSearch(this.icnumber) : null;
  }
}
