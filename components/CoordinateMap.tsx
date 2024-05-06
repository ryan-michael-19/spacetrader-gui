import React, { useState } from 'react';
import { components } from "../types";
import { WebRequestClient } from "../web_requests";
import { Waypoint } from "../map_objects";
import { CoordinateCanvas } from './CoordinateCanvas';
import { WaypointDataPane } from './WaypointDataPane';
import { ViewShipPopup } from './ViewShipPopup';

export function CoordinateMap({systemWaypointPages, agentData, webReqClient}:
  {systemWaypointPages: components["schemas"]["Waypoint"][][],
    agentData: components["schemas"]["Agent"]|undefined,
    webReqClient: WebRequestClient}
  ){
  const [clickedWaypoints, setClickedWaypoints] = useState<Waypoint[]>([]);
  const [shipData, setShipData] = useState<components["schemas"]["Shipyard"]|undefined|null>();
  
  if (clickedWaypoints.length > 0) { 
    return (
      <>
        <CoordinateCanvas systemWaypointPages={systemWaypointPages} agentData={agentData}
                          setClickedWaypoints={setClickedWaypoints} clickedWaypoints={clickedWaypoints} fullyExpanded={false}/>
        <WaypointDataPane clickedWaypoints={clickedWaypoints} webReqClient={webReqClient}
                          setShipData={setShipData} agentData={agentData}/>
        {
          shipData ? <ViewShipPopup shipData={shipData} setShipData={setShipData}/> : null
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
