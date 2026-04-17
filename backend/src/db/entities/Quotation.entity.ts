import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DeadPerson } from "./DeadPerson.entity.ts";
import { Organisation } from "./Organisation.entity.ts";
import { QuotationStatus } from "../enums.ts";

@Entity("quotation")
export class Quotation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Organisation, (organisation) => organisation.quotations, {
    nullable: true,
    onDelete: "SET NULL",
  })
  organisation?: Organisation | null;

  @ManyToOne(() => DeadPerson, (deadperson) => deadperson.quotations, {
    nullable: true,
    onDelete: "SET NULL",
  })
  deadperson?: DeadPerson | null;

  @Column("jsonb", { nullable: true })
  selectedservices?: Array<{ service: string; price: number }> | null;

  @Column("varchar", { length: 255, nullable: true })
  referenceno?: string;
  
  @Column("varchar", { length: 255, nullable: true })
  payername?: string;
  
  @Column("varchar", { length: 255, nullable: true })
  payeremail?: string;
  
  @Column("varchar", { length: 255, nullable: true })
  payerphone?: string;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  serviceamount?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  maintenancefeeamount?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  totalamount?: number;

  @Column({
    type: "enum",
    enum: QuotationStatus,
    default: QuotationStatus.PENDING,
  })
  status!: QuotationStatus;

  @Column("varchar", { length: 255, nullable: true })
  photourl?: string;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
