import { Dispatch, SetStateAction } from 'react';
import { Waypoint } from '../lib/MapObjects';
import { components } from "../lib/types";
import { WebRequestClient, HandleError } from '../lib/WebRequests';
import { assert } from "../lib/Utils";

export function WaypointDataPane({clickedWaypoints, setShipyardData,  agentData, webReqClient}:
  {
    clickedWaypoints: Waypoint[], 
    setShipyardData: Dispatch<SetStateAction<components["schemas"]["Shipyard"]|undefined|null>>,
    agentData: components["schemas"]["Agent"]|undefined,
    webReqClient: WebRequestClient
  }) {
  function WaypointTable({clickedWaypoint}: {clickedWaypoint: Waypoint}) {
    return (
    <table className={"general-table"}>
      <caption>
        {(() => {assert(clickedWaypoint.symbol && clickedWaypoint.type && clickedWaypoint.faction, "clickedWaypoint properties undefined") ;
                return `${clickedWaypoint.symbol}: ${clickedWaypoint.type.replace("_", " ")}: belongs to ${clickedWaypoint.faction.symbol}`})()}
      </caption>
      <tbody>
        <tr>
          <th>Trait Name</th>
          <th>Trait Description</th>
          <th>Trait Action</th>
        </tr>
        {
          // @ts-ignore
          [...clickedWaypoint.traits.entries()].map(([traitNum, t]) => {return(
            <tr className="selectable-row" key={traitNum}
                onClick={t.symbol === "SHIPYARD" ? 
                            async () => {
                              assert(agentData, "agent data does not exist");
                              assert(clickedWaypoint.symbol, "clickedWaypoint symbol does not exist");
                              const shipYardData =  
                                HandleError(await webReqClient.GET("/systems/{systemSymbol}/waypoints/{waypointSymbol}/shipyard", {
                                  params: {
                                    path: {
                                      systemSymbol: agentData.headquarters.split("-").slice(0,2).join("-"),
                                      waypointSymbol: clickedWaypoint.symbol
                                    }
                                  }
                              })).data;
                              setShipyardData(shipYardData);
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
