import { Dispatch, SetStateAction } from 'react';
import { components } from "../types";
import type { WebRequestClient } from '../WebRequests';
import { HandleError } from "../WebRequests";
import { Waypoint } from "../MapObjects";


export function ViewShipPopup({shipYardData, setShipyardData, shipInventory, shipInventoryUpdate, setClickedWaypoints, setAgentData, webReqClient}: {
    shipYardData: components["schemas"]["Shipyard"]|undefined|null,
    setShipyardData: Dispatch<SetStateAction<components["schemas"]["Shipyard"]|null|undefined>>,
    shipInventory: components["schemas"]["Ship"][],
    shipInventoryUpdate: (x: components["schemas"]["Ship"][]) => void,
    setClickedWaypoints: (x: Waypoint[]) => void,
    setAgentData: (x: components["schemas"]["Agent"]) => void
    webReqClient: WebRequestClient
  }) {
  async function PurchaseShip(
    webReqClient: WebRequestClient, shipType: components["schemas"]["ShipType"], waypoint: string
  ): Promise<[components["schemas"]["Ship"] | null, components["schemas"]["Agent"] | null]> {
    try {
      const data = HandleError(await webReqClient.POST("/my/ships", {
        body: {
          shipType: shipType,
          waypointSymbol: waypoint
        }
      }));
      return [data!.data!.ship, data!.data!.agent];
    } catch (e) {
      alert(e);
      return [null, null];
    }
  }

  function ShipDataIfExists() {
    if (shipYardData && shipYardData.ships) {
      return (
        <>
          <tr className="popup-table">
            <th>Type</th> 
            <th>Name</th>
            <th>Description</th>
            <th>Supply</th>
            <th>Activity</th>
            <th>Price</th>
          </tr>
          {[...shipYardData.ships.entries()].map(([shipNum, ship]) =>(
            <tr key={shipNum} className="selectable-row" 
              onClick={async () => {
                const [newShipData, agentData] = await PurchaseShip(webReqClient, ship.type, shipYardData.symbol); 
                if (newShipData){
                  shipInventoryUpdate(shipInventory.concat(newShipData));
                }
                if (agentData) {
                  setAgentData(agentData);
                }
                setClickedWaypoints([]);
                setShipyardData(null);
              }}>
              <td>
                {ship.type}  
              </td>
              <td>
                {ship.name}
              </td>
              <td>
                {ship.description}
              </td>
              <td>
                {ship.supply}
              </td>
              <td>
                {ship.activity}
              </td>
              <td>
                {ship.purchasePrice}
              </td>
            </tr>
            ))
          }
        </>
        );
    } else {
      return <tr className="popup-table"><th className="popup-table">No ship data</th></tr>;
    }
  }

  return (
  <div className="popup">
    <div className="scrollable">
    <table className="general-table popup-table">
      <ShipDataIfExists/>
    </table>
    <button onClick={() => setShipyardData(null)}>
      Close
    </button>
    </div> 
    </div>)
}
