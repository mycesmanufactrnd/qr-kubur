// Added ManyToOne and JoinColumn to the imports
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"; 
import { Organisation } from "./Organisation.entity.ts";

@Entity("grave")
export class Grave {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255, nullable: true })
  cemeteryname?: string;

  @Column("varchar", { length: 255, nullable: true })
  block?: string;

  @Column("varchar", { length: 255, nullable: true })
  lot?: string;

  @Column("double precision", { nullable: true }) // Standardized to lowercase
  latitude?: number;

  @Column("varchar", { length: 255, nullable: true })
  icnumber?: string;

  @Column("double precision", { nullable: true })
  longitude?: number;

  @Column("varchar", { length: 255, nullable: true })
  state?: string;

  @Column("varchar", { length: 255, nullable: true })
  qrcode?: string;

  // Changed "number" to "int"
  @Column("int", { nullable: true }) 
  totalgraves?: number;

  @Column("varchar", { length: 255, nullable: true })
  status?: string;

  // This is the actual database column
  @Column({ name: "organisationid", nullable: true })
  organisationid?: number;

  // This is the TypeORM relation mapping
  @ManyToOne(() => Organisation, (organisation) => organisation.graves, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "organisationid" }) 
  organisation?: Organisation;
}