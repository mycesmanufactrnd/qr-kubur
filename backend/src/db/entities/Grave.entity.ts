// Added ManyToOne and JoinColumn to the imports
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"; 
import { Organisation } from "./Organisation.entity.ts";
import { ActiveInactiveStatus } from "../enums.ts";

@Entity("grave")
export class Grave {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255, nullable: true })
  name?: string;

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

  @Column("int", { nullable: true }) 
  totalgraves?: number;

  @Column({
    type: "enum",
    enum: ActiveInactiveStatus,
    default: ActiveInactiveStatus.ACTIVE,
  })
  status!: ActiveInactiveStatus;


  @ManyToOne(() => Organisation, (organisation) => organisation.graves, {
    nullable: true,
    onDelete: "SET NULL",
  })
  organisation?: Organisation | null;
}