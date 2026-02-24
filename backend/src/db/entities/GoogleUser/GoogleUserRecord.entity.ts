import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { GoogleUser } from "./GoogleUser.entity.ts";

@Entity("googleuserrecord")
export class GoogleUserRecord {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255, nullable: true })
    entityname?: string;
    
    @Column("int", { nullable: true })
    entityid?: number;

    @Column("varchar", { length: 255, nullable: true })
    referenceno?: string;

    @Column("varchar", { length: 255, nullable: true })
    status?: string;

    @ManyToOne(() => GoogleUser, (googleuser) => googleuser.records, {
        nullable: true,
        onDelete: "SET NULL",
    })
    googleuser?: GoogleUser | null;

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}
