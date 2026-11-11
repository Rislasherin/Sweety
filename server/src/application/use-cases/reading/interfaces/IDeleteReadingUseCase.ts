export interface IDeleteReadingUseCase {
  execute(userId: string, id: string): Promise<void>;
}
