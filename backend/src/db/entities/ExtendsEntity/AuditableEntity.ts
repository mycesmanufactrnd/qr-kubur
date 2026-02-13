import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { getCurrentUserId } from "../../../helpers/requestContext.ts";

export abstract class AuditableEntity {
  @Column("int", { nullable: true })
  createdby?: number | null;

  @Column("int", { nullable: true })
  updatedby?: number | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @UpdateDateColumn({ name: "updatedat" })
  updatedat!: Date;

  @BeforeInsert()
  setCreatedBy() {
    const userId = getCurrentUserId();
    if (userId) {
      this.createdby = userId;
      this.updatedby = userId;
    }
  }
  
  @BeforeUpdate()
  setUpdatedBy() {
    const userId = getCurrentUserId();
    if (userId) {
      this.updatedby = userId;
    }
  }
}
