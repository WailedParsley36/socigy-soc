import { ErrorResponse } from "./ErrorResponse";

export interface AsyncResult<T> {
  result?: T;
  error?: ErrorResponse;
}
