import createClient  from "openapi-fetch";
import { paths } from "../lib/types";
import { HandleError } from "../lib/WebRequests";

const CLIENT = createClient<paths>({
  baseUrl: "https://api.spacetraders.io/v2/",
  headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
  }
});

const AGENT_NAME = process.argv[2];
if (!AGENT_NAME) {
  throw Error("No agent name specified");
}

console.log(HandleError(
  await CLIENT.POST("/register", {
    body: {faction: "COSMIC", symbol: AGENT_NAME}
  })
).data.token);
