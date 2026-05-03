export interface IJRPCResponse {
  method: string;
  id: number;
}

export interface IJRPCError {
  code: number;
  message: string;
  data?: {
    fields?: string[];

    [index: string]: any;
  };
}

export type IResponse<T = any> = IJRPCResponse & ({ result: T } | { error: IJRPCError });