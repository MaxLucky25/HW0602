import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Базовый класс для всех Entity в проекте
 * Содержит общие поля: createdAt, updatedAt, deletedAt (soft delete)
 */
export abstract class BaseEntity {
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;

  @Column({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date | null;
}
