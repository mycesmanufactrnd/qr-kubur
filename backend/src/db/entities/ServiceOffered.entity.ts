import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Check,
} from "typeorm";
import { TahfizCenter } from "./TahfizCenter.entity.ts";
import { Organisation } from "./Organisation.entity.ts";

@Entity("serviceoffered")
@Unique(["tahfizcenter", "service"])
@Unique(["organisation", "service"])
@Check(
  `(("tahfizcenterId" IS NOT NULL AND "organisationId" IS NULL) OR ("tahfizcenterId" IS NULL AND "organisationId" IS NOT NULL))`
)
export class ServiceOffered {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 120 })
  service!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  price!: number;

  @ManyToOne(() => TahfizCenter, (tahfizcenter) => tahfizcenter.services, {
    nullable: true,
    onDelete: "CASCADE",
  })
  tahfizcenter?: TahfizCenter | null;

  @ManyToOne(() => Organisation, (organisation) => organisation.services, {
    nullable: true,
    onDelete: "CASCADE",
  })
  organisation?: Organisation | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
