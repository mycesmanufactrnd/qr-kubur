import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { ActiveInactiveStatus, ApprovalStatus } from "../enums.ts";
import { OrganisationType } from "./OrganisationType.entity.ts";

@Entity("temporganisation")
export class TempOrganisation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => OrganisationType, {
    nullable: true,
    onDelete: "SET NULL",
  })
  organisationtype?: OrganisationType | null;

  @Column("varchar", { length: 255 })
  name!: string;

  @Column("text", { array: true, nullable: true })
  states?: string[];

  @Column("varchar", { length: 255, nullable: true })
  address?: string;

  @Column("varchar", { length: 255, nullable: true })
  phone?: string;

  @Column("varchar", { length: 255, nullable: true })
  email?: string;

  @Column("varchar", { length: 255, nullable: true })
  url?: string;

  @Column("double precision", { nullable: true })
  latitude?: number;

  @Column("double precision", { nullable: true })
  longitude?: number;

  @Column({ type: "boolean", default: false })
  canbedonated!: boolean;

  @Column({ type: "boolean", default: false })
  canmanagemosque!: boolean;

  @Column({ type: "boolean", default: false })
  isgraveservices!: boolean;

  @Column("text", { array: true, nullable: true })
  serviceoffered?: string[];

  @Column("jsonb", { nullable: true })
  serviceprice?: Record<string, number>;

  @Column("jsonb", { nullable: true })
  paymentconfigdraft?: { paymentPlatformId: number; paymentFieldId: number; value: string }[];

  @Column("varchar", { length: 255 })
  contactname!: string;

  @Column("varchar", { length: 255 })
  contactemail!: string;

  @Column("varchar", { length: 255, nullable: true })
  contactphoneno?: string;

  @Column({
    type: "enum",
    enum: ActiveInactiveStatus,
    default: ActiveInactiveStatus.ACTIVE,
  })
  status!: ActiveInactiveStatus;

  @Column({
    type: "enum",
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approvalstatus!: ApprovalStatus;

  @Column("varchar", { length: 255, nullable: true })
  reviewnote?: string;

  @Column("int", { nullable: true })
  reviewedbyuserid?: number;

  @Column("timestamp", { nullable: true })
  reviewedat?: Date;

  @Column("int", { nullable: true })
  approvedorganisationid?: number;

  @Column("int", { nullable: true })
  approvedadminuserid?: number;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
