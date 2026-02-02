import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TahfizCenter } from './TahfizCenter.entity.ts';

@Entity('activitypost')
export class ActivityPost {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255 })
    title!: string;

    @Column('text')
    content!: string;

    @Column({ type: 'varchar', nullable: true })
    photourl?: string;

    @Column({ type: 'boolean', default: true })
    ispublished!: boolean;

    @ManyToOne(() => TahfizCenter, (tahfizcenter) => tahfizcenter.activityposts, {
        nullable: true,
        onDelete: "SET NULL",
    })
    tahfizcenter?: TahfizCenter | null;

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;

    @UpdateDateColumn({ name: "updatedat" })
    updatedat!: Date;
}
