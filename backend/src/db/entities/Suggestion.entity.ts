import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TahfizCenter } from "./TahfizCenter.entity.ts";
import { Organisation } from "./Organisation.entity.ts";
import { ApprovalStatus } from "../enums.ts";

@Entity("suggestion")
export class Suggestion {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 20 })
    type!: string;

    @Column("text")
    suggestedchanges!: string;
    
    @Column("text")
    reason!: string;

    @Column({
        type: "enum",
        enum: ApprovalStatus,
        default: ApprovalStatus.PENDING,
    })
    status!: ApprovalStatus;

    @Column("text", { nullable: true })
    adminnotes?: string;
    
    @Column("varchar", { length: 255, nullable: true })
    visitorip?: string;

    @CreateDateColumn ({ name: "createdat" })
    createdat!: Date;
}