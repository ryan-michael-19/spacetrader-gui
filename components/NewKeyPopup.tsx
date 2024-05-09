import { useState } from 'react';
import createClient  from "openapi-fetch";
import { HandleError } from "../WebRequests";
import type { paths } from "../types";

export function NewKeyPopUp({closePopupFunc}: {closePopupFunc: () => void}) {
  const [userName, setUserName] = useState("");
  const [requestClient, setRequestClient] = useState(
    createClient<paths>({
      baseUrl: "https://api.spacetraders.io/v2/",
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }
    })
  );
  const [authKeyComponentData, setAuthKeyComponentData] = useState(<></>);
  async function getAuthKeyComponentData(username: string){
    try {
      const authKey = HandleError(await requestClient.POST(
        "/register", {body: {symbol: username, faction: "COSMIC"}}
      ));
      if (authKey){
        setRequestClient(
          createClient<paths>({
            baseUrl: "https://api.spacetraders.io/v2/",
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authKey.data.token}`
            }
          })
        )
      } else {
        throw Error("Cannot get authentication key");
      }
      return (              
        <>
          <p id="save-token-warning">
            Save your token. You will not be able to retrieve it again.
          </p>
          <p id="new-key-text" className="wrappable">
            {authKey.data.token}
          </p>
          <button id="add-to-clipboard" onClick={() => navigator.clipboard.writeText(authKey.data.token)}>
            Add To Clipboard
          </button>
        </>
      );
    }
    catch(err) {
      return <p>There was an error getting an auth key.</p>;
    }
  }
  return (
    <div className="popup">
      <div className="center">
        <label htmlFor="new-user-name">Enter a username:</label>
        <input id="new-user-name" type="text" onChange={e => setUserName(e.target.value)}/>
        <button id="get-new-key" onClick={async () => setAuthKeyComponentData(await getAuthKeyComponentData(userName))}>
          Submit
        </button>
        <>
          {authKeyComponentData}
          <button onClick={closePopupFunc}>
            Close
          </button>
        </>
      </div>
    </div>
  )
}
