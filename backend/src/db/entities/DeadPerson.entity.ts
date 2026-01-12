import { Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn} from "typeorm";
import { Grave } from "./Grave.entity.ts";

@Entity("deadperson")
export class DeadPerson {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255 })
    name!: string;

    @Column("varchar", { length: 255 })
    icnumber!: string;

    @CreateDateColumn({ name: "dateofbirth" })
    dateofbirth!: Date;

    @CreateDateColumn({ name: "dateofdeath" })
    dateofdeath!: Date;

    @CreateDateColumn({ name: "causeofdeath" })
    causeofdeath!: string;
    
    @OneToOne(() => Grave, (grave) => grave.deadPerson)
    grave?: Grave;

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
}