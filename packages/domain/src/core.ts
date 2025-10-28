export type ISODateString = string;

export interface BaseEntity {
  id: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type UserRole = "USER" | "ADMIN";

export interface UserEntity extends BaseEntity {
  email: string;
  role: UserRole;
  displayName?: string;
  level?: string;
}
