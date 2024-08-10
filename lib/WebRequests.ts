import { FetchResponse } from "openapi-fetch";
import createClient from "openapi-fetch";
import type { paths, components } from "./types";

export type WebRequestClient = ReturnType<typeof createClient<paths>>;

// Errors are undocumented in api spec which is very unkind to the type schemas.
export function HandleError<T,U>(res: FetchResponse<T, U, `${string}/${string}`>) {
    if (res.error !== undefined) {
      // yikes!
      console.log(res.error);
      const errorString = (res.error as any).error.message;
      throw new Error(errorString);
    } else {
      return res!.data! ;
    }
}

export async function getPaginatedWaypointData(
  authedClient: WebRequestClient, headquarters: string, page: number = 1, waypoints: components["schemas"]["Waypoint"][][] = []
) : Promise<components["schemas"]["Waypoint"][][]> {
  console.log(page);
  const requestData = HandleError(await authedClient.GET("/systems/{systemSymbol}/waypoints", {
    params: {
      path: {
        systemSymbol: headquarters
      },
      query: {
        limit: 20,
        page: page
      }
    }}));
  await new Promise(r => setTimeout(r, 200));
  waypoints.push(requestData.data);
  if (page > 10 || page > requestData.meta.limit) {
    return waypoints
  } else {
    return getPaginatedWaypointData(
      authedClient, headquarters, page+1, waypoints);
  }
}
