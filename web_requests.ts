import { assert } from "./utils"
import { FetchResponse } from "openapi-fetch"

// TODO: Not this
export function HandleError<T,U>(res: FetchResponse<T, U, `${string}/${string}`>) {
    assert(res.data, "response data is null or undefined")
    if (res.error!==undefined) {throw new Error(res.error.toString());} else {return res.data;}
}