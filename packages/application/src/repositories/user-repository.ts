import type { UserEntity, UserRole } from "@english-app/domain";

export interface SaveUserInput {
  id?: string;
  email: string;
  displayName?: string;
  level?: string;
  role?: UserRole;
}

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: SaveUserInput): Promise<UserEntity>;
}
