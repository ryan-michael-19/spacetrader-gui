import React, { Dispatch, SetStateAction } from 'react';
import { Waypoint } from '../map_objects';
import { components } from "../types";
import { WebRequestClient, HandleError } from '../web_requests';
import { assert } from "../utils";

export function WaypointDataPane({clickedWaypoints, setShipData,  agentData, webReqClient }:
  {
    clickedWaypoints: Waypoint[], 
    setShipData: Dispatch<SetStateAction<components["schemas"]["Shipyard"]>>,
    agentData: components["schemas"]["Agent"]|undefined,
    webReqClient: WebRequestClient}) {
  
  function WaypointTable({clickedWaypoint}: {clickedWaypoint: Waypoint}) {
    return (
    <table className={"general-table"}>
      <caption>
        {`${clickedWaypoint.symbol}: ${clickedWaypoint.type.replace("_", " ")}: belongs to ${clickedWaypoint.faction.symbol}`}
      </caption>
      <tbody>
        <tr>
          <th>Trait Name</th>
          <th>Trait Description</th>
          <th>Trait Action</th>
        </tr>
        {
          [...clickedWaypoint.traits.entries()].map(([traitNum, t]) => {return(
            <tr className="selectable-row" key={traitNum}
                onClick={t.symbol === "SHIPYARD" ? 
                            async () => {
                              assert(agentData, "agent data does not exist");
                              setShipData(HandleError(await webReqClient.GET("/systems/{systemSymbol}/waypoints/{waypointSymbol}/shipyard", {
                                params: {
                                  path: {
                                    systemSymbol: agentData.headquarters.split("-").slice(0,2).join("-"),
                                    waypointSymbol: clickedWaypoint.symbol
                                  }
                                }
                              })).data)
                            }
                            : () => null}>
              <td>
                {t.name}
              </td>
              <td className={"description-text"}>
                {t.description}
              </td>
              <td>
                {t.symbol === "SHIPYARD" ? "Browse ships" : "N/A"}
              </td>
            </tr>
          )})
        }
      </tbody>
    </table>
    );
  }

  return (
    <div className={"c waypoint-data"}>
      <div className={"scrollable"}>
        {
          clickedWaypoints.length > 0 ? 
          [...clickedWaypoints.entries()].map(([waypointNum, clickedWaypoint]) => (
            <WaypointTable key={waypointNum} clickedWaypoint={clickedWaypoint}></WaypointTable>
          ))
          :
          null
        }
      </div>
    </div>
  );
}