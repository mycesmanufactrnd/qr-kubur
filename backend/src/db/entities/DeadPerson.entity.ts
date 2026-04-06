import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Grave } from "./Grave.entity.ts";
import { Suggestion } from "./Suggestion.entity.ts";
import { Quotation } from "./Quotation.entity.ts";
import { User } from "./User.entity.ts";

@Entity("deadperson")
export class DeadPerson {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  name!: string;

  @Column("varchar", { length: 255, nullable: true })
  icnumber?: string | null;

  @Column({ type: "date" })
  dateofbirth!: Date;

  @Column({ type: "date" })
  dateofdeath!: Date;

  @Column("varchar", { length: 255, nullable: true })
  causeofdeath?: string | null;

  @ManyToOne(() => Grave, (grave) => grave.deadPersons, {
    nullable: true,
    onDelete: "SET NULL",
  })
  grave?: Grave | null;

  @Column("varchar", { length: 255, nullable: true })
  biography?: string | null;

  @Column("varchar", { length: 255, nullable: true })
  photourl?: string | null;

  @Column("double precision", { nullable: true })
  latitude?: number | null;

  @Column("double precision", { nullable: true })
  longitude?: number | null;

  @OneToMany(() => Suggestion, (suggestions) => suggestions.deadperson)
  suggestions?: Suggestion[] | [];

  @OneToMany(() => Quotation, (quotations) => quotations.deadperson)
  quotations?: Quotation[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @Column("integer", { nullable: true })
  createdbyId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "createdbyId" })
  createdby?: User | null;
}
