import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export type StoredFileUploadedBy = {
  id: number;
  fullname?: string | null;
  organisationId?: number | null;
  tahfizcenterId?: number | null;
};

@Entity("storedfile")
@Index(["bucket", "key"], { unique: true })
export class StoredFile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 128 })
  bucket!: string;

  @Column("varchar", { length: 512 })
  key!: string;

  @Column("varchar", { length: 255, nullable: true })
  originalName?: string | null;

  @Column("varchar", { length: 255, nullable: true })
  contentType?: string | null;

  @Column("integer", { nullable: true })
  sizeBytes?: number | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @Column("jsonb", { nullable: true })
  uploadedBy?: StoredFileUploadedBy | null;
}
