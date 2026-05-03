export interface IUserGeneric {
  guid: string,
  username: string,
  displayName?: string,
  role: string,
  lastLoginAt?: Date ,
  language?: string
  createdAt: Date
}