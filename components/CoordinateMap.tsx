import { useState } from 'react';
import { components } from "../lib/types";
import { WebRequestClient } from "../lib/WebRequests";
import { Waypoint } from "../lib/MapObjects";
import { CoordinateCanvas } from './CoordinateCanvas';
import { WaypointDataPane } from './WaypointDataPane';
import { ViewShipPopup } from './ViewShipPopup';

export function CoordinateMap({systemWaypointPages, agentData, webReqClient, shipInventory, shipInventoryUpdate, setAgentData}:
  {systemWaypointPages: components["schemas"]["Waypoint"][][],
    agentData: components["schemas"]["Agent"]|undefined,
    webReqClient: WebRequestClient,
    shipInventory: components["schemas"]["Ship"][]
    setAgentData: (x:components["schemas"]["Agent"]) => void,
    shipInventoryUpdate: (x:components["schemas"]["Ship"][]) => void}
  ){
  const [clickedWaypoints, setClickedWaypoints] = useState<Waypoint[]>([]);
  const [shipYardData, setShipyardData] = useState<components["schemas"]["Shipyard"]|undefined|null>();
  
  if (clickedWaypoints.length > 0) { 
    return (
      <>
        <CoordinateCanvas systemWaypointPages={systemWaypointPages} agentData={agentData}
                          setClickedWaypoints={setClickedWaypoints} clickedWaypoints={clickedWaypoints} fullyExpanded={false}/>
        <WaypointDataPane clickedWaypoints={clickedWaypoints} webReqClient={webReqClient} 
                          setShipyardData={setShipyardData} agentData={agentData}/>
        {
          shipYardData ? 
            <ViewShipPopup shipYardData={shipYardData} setShipyardData={setShipyardData} setClickedWaypoints={setClickedWaypoints}
                           setAgentData={setAgentData}
                           shipInventory={shipInventory}  shipInventoryUpdate={shipInventoryUpdate} webReqClient={webReqClient}/> : null
        }
      </>
    );
  } else { // waypoint is not clicked on/ has been closed
    return (
      <CoordinateCanvas systemWaypointPages={systemWaypointPages} agentData={agentData} 
                        setClickedWaypoints={setClickedWaypoints} clickedWaypoints={clickedWaypoints} fullyExpanded={true}/>
    )
  }
}
