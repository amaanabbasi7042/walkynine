
export enum Role {
  User = 'user',
  Model = 'model',
  Error = 'error',
}

export interface Message {
  role: Role;
  content: string;
}
