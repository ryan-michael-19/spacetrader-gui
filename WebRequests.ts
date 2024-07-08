import { FetchResponse } from "openapi-fetch";
import createClient from "openapi-fetch";
import type { paths } from "./types";

export type WebRequestClient = ReturnType<typeof createClient<paths>>;

// Errors are undocumented in api spec which is very unkind to the type schemas.
export function HandleError<T,U>(res: FetchResponse<T, U, `${string}/${string}`>) {
    if (res.error !== undefined) {
      // yikes!
      const errorString = (res.error as any).error.message;
      throw new Error(errorString);
    } else {
      return res!.data! ;
    }
}
