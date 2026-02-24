import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, OneToMany } from "typeorm";
import { GoogleUserRecord } from "./GoogleUserRecord.entity.ts";

@Entity("googleuser")
export class GoogleUser {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255, nullable: true })
    name?: string;

    @Column("varchar", { length: 255, nullable: true })
    email?: string;

    @Column("varchar", { length: 255, nullable: true })
    picture?: string;

    @OneToMany(() => GoogleUserRecord, (records) => records.googleuser) 
    records?: GoogleUserRecord[] | [];

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}
