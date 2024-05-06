import { assert } from "./utils"
import { FetchResponse } from "openapi-fetch"
import createClient from "openapi-fetch"
import type { paths } from "./types";

export type WebRequestClient = ReturnType<typeof createClient<paths>>;

// TODO: Not this
export function HandleError<T,U>(res: FetchResponse<T, U, `${string}/${string}`>) {
    assert(res.data, "response data is null or undefined")
    if (res.error!==undefined) {throw new Error(res.error.toString());} else {return res.data;}
}