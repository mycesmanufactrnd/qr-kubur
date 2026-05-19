// @ts-nocheck
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ApprovalStatus } from "../enums.js";
import { DeadPerson } from "./DeadPerson.entity.js";
import { Grave } from "./Grave.entity.js";
import { Organisation } from "./Organisation.entity.js";

@Entity("suggestion")
export class Suggestion {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 20 })
    name!: string;

    @Column("varchar", { length: 20 })
    phoneno!: string;

    @Column("varchar", { length: 255, nullable: true })
    email?: string;

    @Column("varchar", { length: 20 })
    type!: string;

    @Column("text")
    suggestedchanges!: string;

    @Column("text")
    reason!: string;

    @ManyToOne(() => DeadPerson, (deadperson) => deadperson.suggestions, {
        nullable: true,
        onDelete: "SET NULL",
    })
    deadperson?: DeadPerson | null;

    @ManyToOne(() => Grave, (grave) => grave.suggestions, {
        nullable: true,
        onDelete: "SET NULL",
    })
    grave?: Grave | null;

    @ManyToOne(() => Organisation, {
        nullable: true,
        onDelete: "SET NULL",
    })
    organisation?: Organisation | null;

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