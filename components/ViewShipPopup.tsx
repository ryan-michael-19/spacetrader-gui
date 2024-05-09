import { Dispatch, SetStateAction } from 'react';
import { components } from "../types";

export function ViewShipPopup({shipData, setShipData}: {
    shipData: components["schemas"]["Shipyard"]|undefined|null,
    setShipData: Dispatch<SetStateAction<components["schemas"]["Shipyard"]|null|undefined>>,
  }) {

  function ShipDataIfExists() {
    if (shipData && shipData.ships) {
      return (
        <>
          <tr className="popup-table ">
            <th>Type</th> 
            <th>Name</th>
            <th>Description</th>
            <th>Supply</th>
            <th>Activity</th>
            <th>Price</th>
          </tr>
          {[...shipData.ships.entries()].map(([shipNum, ship]) =>(
            <tr key={shipNum} className="selectable-row">
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
    <button onClick={() => setShipData(null)}>
      Close
    </button>
    </div> 
    </div>)
}