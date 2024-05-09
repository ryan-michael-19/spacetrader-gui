import { useState } from "react";
import { WebRequestClient, HandleError } from "../WebRequests";
import { components } from "../types";
import createClient from "openapi-fetch";
import { assert } from "../Utils";
import { AgentDataTable } from "./AgentDataTable";
import { CoordinateMap } from "./CoordinateMap";
import { ContractDataTable } from "./ContractDataTable";
import { NewKeyPopUp } from "./NewKeyPopup";
import { paths } from "../types";

async function getPaginatedWaypointData(
  authedClient: WebRequestClient, headquarters: string, page: number = 1, waypoints: components["schemas"]["Waypoint"][][] = []
) : Promise<components["schemas"]["Waypoint"][][]> {
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
  waypoints.push(requestData.data);
  if (page > requestData.meta.limit) {
    return waypoints
  } else {
    return getPaginatedWaypointData(
      authedClient, headquarters, page+1, waypoints);
  }
}

export function LogInWithAuthKey() {
  // Todo: this is waaaaaay too much state to keep in one place.
  const [displayNewKeyPopup, setDisplayNewKeyPopup] = useState(false);
  const [authenticatedClient, setAuthenticatedClient] = useState<WebRequestClient|null>(null);
  // TODO: Clean these types up
  const [agentData, setAgentData] = useState<components["schemas"]["Agent"]|undefined>();
  const [systemWaypointData, setSystemWaypointData] = useState<components["schemas"]["Waypoint"][][]>([]);
  const [contractData, setContractData] = useState<components["schemas"]["Contract"][]>([]);
  const [agentRequestSent, setAgentRequestSent] = useState(false);

  async function getAllData(authedClient: WebRequestClient) {
    const agentDataResult = HandleError(await authedClient.GET("/my/agent"));
    setAgentData(agentDataResult.data);

    const systemWaypointDataResult = await getPaginatedWaypointData(
      authedClient, agentDataResult.data.headquarters.split("-").slice(0,2).join("-"));
    setSystemWaypointData(systemWaypointDataResult);

    const contractDataResult = HandleError(await authedClient.GET("/my/contracts"));
    setContractData(contractDataResult.data);

    setAgentRequestSent(true);
  }

  return(
  <>
    <link rel="stylesheet" type="text/css" href="./main.css"/>
    <h1>Welcome</h1>
    <div id="main-menu">
      <div id="login">
        <label htmlFor="auth-key">Enter your auth key:</label>
        <input id="auth-key" type="text" onChange={e => {setAuthenticatedClient(
          createClient<paths>({
            baseUrl: "https://api.spacetraders.io/v2/",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${e.target.value}`
            }
          }));
        }}
        />
        <button id='get-agent-data' onClick={async () =>{ 
          assert(authenticatedClient, "authenticated client is null"); 
          await getAllData(authenticatedClient)}}
        >Get Agent Data</button>
      </div>
      {
        // todo: clean up this trinary nonsense
        agentRequestSent ?
          <>
            <AgentDataTable agentData={agentData}/>
            <CoordinateMap 
              systemWaypointPages={systemWaypointData} agentData={agentData} webReqClient={
                (() => {assert(authenticatedClient, "Authenticated client is null") ; return authenticatedClient;})()}
            />
            <ContractDataTable 
              webReqClient={(() => {assert(authenticatedClient, "Authenticated client is null") ; return authenticatedClient;})()}
              contractData={contractData} 
              updateContractTable={async () => setContractData(
                HandleError(await authenticatedClient.GET("/my/contracts")).data
              )}/>
          </>
        : ! agentRequestSent ?
          <>
            <button id="get-new-key-popup" onClick={() => setDisplayNewKeyPopup(true)}>Get New Key</button>
          </>
        :
          // I missed a bunch of edge cases YEEEEEEET
          <p>bruh</p>
      }
      {
        displayNewKeyPopup ? 
          <NewKeyPopUp
            closePopupFunc={() => setDisplayNewKeyPopup(false)}
          />
          :
          null
      }
      
    </div>
  </>
  );
}