import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DeadPerson } from "./DeadPerson.entity.ts";
import { Grave } from "./Grave.entity.ts";
import { Organisation } from "./Organisation.entity.ts";
import { QuotationStatus } from "../enums.ts";

@Entity("quotation")
export class Quotation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Organisation, { nullable: true, onDelete: "SET NULL" })
  organisation?: Organisation | null;

  @ManyToOne(() => DeadPerson, { nullable: true, onDelete: "SET NULL" })
  deadperson?: DeadPerson | null;
  
  @ManyToOne(() => Grave, { nullable: true, onDelete: "SET NULL" })
  grave?: Grave | null;

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

  // gambar untuk bukti pembayaran
  @Column("varchar", { length: 255, nullable: true })
  photourl?: string;

  // grave service
  // gambar kubur/tempat yang dibuat user untuk servis
  @Column("varchar", { length: 255, nullable: true })
  servicephotourl?: string;

  @Column("varchar", { length: 255, nullable: true })
  servicedescription?: string;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
