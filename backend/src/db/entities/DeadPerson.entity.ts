import { Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, JoinColumn, OneToMany} from "typeorm";
import { Grave } from "./Grave.entity.ts";
import { Suggestion } from "./Suggestion.entity.ts";

@Entity("deadperson")
export class DeadPerson {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  name!: string;

  @Column("varchar", { length: 255 })
  icnumber!: string;

  @Column({ type: "date" })
  dateofbirth!: Date;

  @Column({ type: "date" })
  dateofdeath!: Date;

  @Column("varchar", { length: 255 })
  causeofdeath!: string;
    
  @OneToOne(() => Grave, (grave) => grave.deadPerson, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  grave?: Grave | null;

  @Column("varchar", { length: 255 })
  biography?: string;

  @Column("varchar", { length: 255 })
  photourl?: string;

  @Column("double precision", { nullable: true })
  latitude?: number;
  
  @Column("double precision", { nullable: true })
  longitude?: number;

  @Column("varchar", { length: 255, nullable: true })
  url?: string;

  @OneToMany(() => Suggestion, (suggestions) => suggestions.deadperson)
  suggestions!: Suggestion[];

  @CreateDateColumn ({ name: "createdat" })
  createdat!: Date;
}