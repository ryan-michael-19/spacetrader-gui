import { useState, useEffect, useRef } from 'react';
import { HandleError, WebRequestClient } from "../lib/WebRequests";
import {components} from '../lib/types';


// Courtesy of https://overreacted.io/making-setinterval-declarative-with-react-hooks/
function useInterval(callback: Function, delay: number) {
  const savedCallback = useRef<Function>();
 
  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
 
  // Set up the interval.
  useEffect(() => {
    function tick() {
        // @ts-ignore
        savedCallback?.current();
    } 
    if (delay !== null) {
      tick();
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}


export function MainPage ({ client }: { client: WebRequestClient }) {
  const [shipInventory, setShipInventory] = useState<components["schemas"]["Ship"][]>([]);

  useInterval(async () => setShipInventory(
    HandleError(await client.GET("/my/ships")).data
  ), 60000);

  return (
    <>
      <table className="general-table">
          <caption>Ship Inventory</caption>
          <tr>
              <th>Symbol</th>
              <th>Frame</th>
              <th>Registered Name</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Status</th>
          </tr> 
          {shipInventory.map(
              ship => (
                  <tr>
                      <td>{ship.symbol}</td>
                      <td>{ship.frame.symbol.slice(6)/*remove FRAME_ from the symbol*/}</td>
                      <td>{ship.registration.name}</td>
                      <td>{ship.nav.route.origin.symbol}</td>
                      <td>{ship.nav.route.destination.symbol}</td>
                      <td>{ship.nav.status}</td>
                  </tr>
              )
          )
          }
      </table>
      {<button onClick={async () => setShipInventory(HandleError(await client.GET("/my/ships")).data)}>Reload</button>}
    </>
  )
}
