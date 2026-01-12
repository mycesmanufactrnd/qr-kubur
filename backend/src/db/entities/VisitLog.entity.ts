import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("visitlog")
export class VisitLog {
    @PrimaryGeneratedColumn()
    id!: number;

    // @ManyToOne(() => Grave, (grave) => grave.visitlogs, {
    //     nullable: true,
    //     onDelete: "SET NULL",
    // })
    // grave?: Grave | null;
    
    // @ManyToOne(() => DeadPerson, (deadperson) => deadperson.visitlogs, {
    //     nullable: true,
    //     onDelete: "SET NULL",
    // })
    // deadperson?: DeadPerson | null;

    @Column("varchar", { length: 255, nullable: true })
    visitorip?: string;
    
    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}