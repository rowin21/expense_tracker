export interface ApiStatus {
  isSuccess?: boolean;
  statusCode?: number;
  message?: string;
  data?: unknown;
  toastMessage?: string;
}

export interface ResponseObject {
  status: number;
  message: string;
  data: unknown;
  toastMessage: string | null;
}
