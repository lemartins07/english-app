export type ISODateString = string;

export interface BaseEntity {
  id: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UserEntity extends BaseEntity {
  email: string;
  displayName?: string;
  level?: string;
}
