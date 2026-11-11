export interface IBaseRepository<TEntity, TId = string> {
  create(entity: TEntity): Promise<TEntity>;

  findById(id: TId): Promise<TEntity | null>;

  update(entity: TEntity): Promise<TEntity>;

  delete(id: TId): Promise<void>;

  exists(id: TId): Promise<boolean>;
}
