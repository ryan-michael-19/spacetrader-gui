import { useEffect, useState, useRef } from 'react';
import { HandleError } from "../WebRequests";
import type { WebRequestClient } from '../WebRequests';
import type { components } from '../types';
import { AgentDataTable } from './AgentDataTable';
import { CoordinateMap } from  './CoordinateMap';
import { ContractDataTable } from './ContractDataTable';


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
  await new Promise(r => setTimeout(r, 200));
  waypoints.push(requestData.data);
  if (page > 10 || page > requestData.meta.limit) {
    return waypoints
  } else {
    return getPaginatedWaypointData(
      authedClient, headquarters, page+1, waypoints);
  }
}


export function MainPage ({ client }: { client: WebRequestClient }) {
    const [agentData, setAgentData] = useState<components["schemas"]["Agent"]|null>(null);
    const [systemWaypointData, setSystemWaypointData] = useState<components["schemas"]["Waypoint"][][]>([]);
    const [contractData, setContractData] = useState<components["schemas"]["Contract"][]>([]);
    function setWebRequestData() {
        (async () => {
            const agentDataFromReq = HandleError(await client.GET("/my/agent")).data;
            setAgentData(agentDataFromReq);
            const waypointDataFromReq = await getPaginatedWaypointData(
                client, agentDataFromReq.headquarters.split("-").slice(0,2).join("-"));
            setSystemWaypointData(waypointDataFromReq);
            const contractDataFromReq = HandleError(await client.GET("/my/contracts")).data;
            setContractData(contractDataFromReq);
        })();
    }
    useEffect(() => {
        setWebRequestData();
    }, []);
    return (
        <>
            <AgentDataTable agentData={agentData!}/>
            <CoordinateMap 
              systemWaypointPages={systemWaypointData} agentData={agentData!} webReqClient={client!}
            />
            <ContractDataTable 
              webReqClient={client!}
              contractData={contractData} 
              updateContractTable={async () => setContractData(
                HandleError(await client!.GET("/my/contracts")).data
              )}/>
        </>
    )

}