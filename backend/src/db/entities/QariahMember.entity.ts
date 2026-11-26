// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { Mosque } from "./Mosque.entity.js";
import { GoogleUser } from "./GoogleUser/GoogleUser.entity.js";
import { QariahMemberStatus } from "../enums.js";
import {
  encryptField,
  decryptField,
  hashForSearch,
} from "../../helpers/cryptoHelper.js";

// Kariah registrations from the public form (UserKariahRegistration), approved
// by the mosque's organisation admin. Separate from DeathCharityMember, which
// is the death-charity register (on hold for kariah, 2026-11-25).
//
// The table pre-existed (created outside git, July 2026): every column of it is
// declared here so DATABASE_SYNC doesn't drop any. Changes vs. that table:
// icno/phoneno/spouseicno widened 20 -> 255 for ciphertext, icnohash added.

const encrypted = {
  to: (value?: string | null) => (value ? encryptField(value) : value),
  from: (value?: string | null) => (value ? decryptField(value) : value),
};

@Entity("qariahmember")
export class QariahMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  fullname!: string;

  @Column("varchar", { length: 255, transformer: encrypted })
  icno!: string;

  // HMAC of icno for exact-match lookup (icno ciphertext is non-deterministic)
  @Column("varchar", { length: 64, nullable: true })
  icnohash?: string | null;

  // runs before the icno transformer encrypts the value
  @BeforeInsert()
  @BeforeUpdate()
  setIcNoHash() {
    this.icnohash = this.icno ? hashForSearch(this.icno) : null;
  }

  @Column("varchar", { length: 10, nullable: true })
  gender?: string | null;

  @Column("varchar", { length: 255, nullable: true, transformer: encrypted })
  phoneno?: string | null;

  @Column("varchar", { length: 255, nullable: true, transformer: encrypted })
  email?: string | null;

  @Column("text", { nullable: true, transformer: encrypted })
  address?: string | null;

  @Column("varchar", { length: 10, nullable: true })
  postcode?: string | null;

  @Column("varchar", { length: 100, nullable: true })
  city?: string | null;

  @Column("varchar", { length: 100, nullable: true })
  state?: string | null;

  @Column("varchar", { length: 30, nullable: true })
  maritalstatus?: string | null;

  @Column("varchar", { length: 255, nullable: true })
  spousename?: string | null;

  @Column("varchar", { length: 255, nullable: true, transformer: encrypted })
  spouseicno?: string | null;

  @Column("integer", { nullable: true })
  numberofchildren?: number | null;

  @Column("integer", { nullable: true })
  numberofhouseholdmembers?: number | null;

  @Column("integer", { nullable: true })
  googleUserId?: number | null;

  @ManyToOne(() => GoogleUser, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "googleUserId" })
  googleUser?: GoogleUser | null;

  @Column({
    type: "enum",
    enum: QariahMemberStatus,
    default: QariahMemberStatus.PENDING,
  })
  status!: QariahMemberStatus;

  @Column("varchar", { length: 100, nullable: true })
  referenceno?: string | null;

  @Column("text", { nullable: true })
  notes?: string | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @Column("timestamp", { nullable: true })
  approvedat?: Date | null;

  @Column("integer", { nullable: true })
  mosqueId?: number | null;

  @ManyToOne(() => Mosque, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "mosqueId" })
  mosque?: Mosque | null;
}
