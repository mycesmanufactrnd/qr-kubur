import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("activitylog")
export class ActivityLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255, nullable: true })
    activitytype?: string;
    
    @Column("varchar", { length: 255, nullable: true })
    functionname?: string;
    
    @Column("varchar", { length: 255, nullable: true })
    useremail?: string;
    
    @Column("varchar", { length: 255, nullable: true })
    level?: string;
    
    @Column("varchar", { length: 255, nullable: true })
    summary?: string;

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}