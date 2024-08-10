import { useEffect, useState } from 'react';
import { HandleError, WebRequestClient, getPaginatedWaypointData } from "../lib/WebRequests";
import type { components } from '../lib/types';
import { AgentDataTable } from './AgentDataTable';
import { CoordinateMap } from  './CoordinateMap';
import { ContractDataTable } from './ContractDataTable';
import { ShipInventory } from './ShipInventory';


export function MainPage ({ client }: { client: WebRequestClient }) {
    const [agentData, setAgentData] = useState<components["schemas"]["Agent"]|null>(null);
    const [systemWaypointData, setSystemWaypointData] = useState<components["schemas"]["Waypoint"][][]>([]);
    const [contractData, setContractData] = useState<components["schemas"]["Contract"][]>([]);
    const [shipInventory, setShipInventory] = useState<components["schemas"]["Ship"][]>([]);
    // this is bad code but you can't stop me
    function setWebRequestData() {
        (async () => {
            const agentDataFromReq = HandleError(await client.GET("/my/agent")).data;
            setAgentData(agentDataFromReq);
            const waypointDataFromReq = await getPaginatedWaypointData(
                client, agentDataFromReq.headquarters.split("-").slice(0,2).join("-"));
            setSystemWaypointData(waypointDataFromReq);
            const contractDataFromReq = HandleError(await client.GET("/my/contracts")).data;
            setContractData(contractDataFromReq);
            const shipInvFromReq = HandleError(await client.GET("/my/ships")).data;
            setShipInventory(shipInvFromReq);
          }
        )();
    }
    useEffect(() => {
        setWebRequestData();
    }, []);

    return (
        <>
            <AgentDataTable agentData={agentData!}/>
            <CoordinateMap 
              systemWaypointPages={systemWaypointData} agentData={agentData!} webReqClient={client!}
              shipInventory={shipInventory}
              shipInventoryUpdate={setShipInventory}
              setAgentData={setAgentData} // used to update agent credits
            />
            <ContractDataTable 
              webReqClient={client!}
              contractData={contractData} 
              updateContractTable={async () => setContractData(
                HandleError(await client!.GET("/my/contracts")).data
              )}/>
              <ShipInventory ShipInventory={shipInventory}/>

        </>
    )

}
