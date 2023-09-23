import { useState, useRef, useEffect } from 'react';
import '../main.css';
import { GetAgentData, GetSystemWaypointData, GetNewKey, 
          AcceptContract, GetContractData } from '../web_requests'

function AgentDataTable({ agentData }) {
  // TODO: Error handling when we get bad agentdata
  return (
    <>
    Agent Data
    <table className="main-table">
      <tbody>
      <tr>
        <th>Account ID</th>
        <th>Name</th>
        <th>HQ</th>
        <th>Credits</th>
      </tr>
      <tr>
        <td>{agentData["data"]["accountId"]}</td>
        <td>{agentData["data"]["symbol"]}</td>
        <td>{agentData["data"]["headquarters"]}</td>
        <td>{agentData["data"]["credits"]}</td>
      </tr>
      </tbody>
    </table>
    </>
  )
}

function NewKeyPopUp({closePopupFunc}) {
  const [userName, setUserName] = useState("");
  const [authKey, setAuthKey] = useState("");
  return (
    <div id="new-key-popup">
      <div className="center">
        <label htmlFor="new-user-name">Enter a username:</label>
        <input id="new-user-name" type="text" onChange={e => setUserName(e.target.value)}/>
        <button id="get-new-key" onClick={async () => setAuthKey(await GetNewKey(userName))}>
          Submit
        </button>
        {
          authKey !== "" && authKey.slice(0,5) !== "Error" ? 
            <>
            <p id="save-token-warning">
              Save your token. You will not be able to retrieve it again.
            </p>
            <p id="new-key-text" className="wrappable">
              {authKey}
            </p>
            <button id="add-to-clipboard" onClick={() => navigator.clipboard.writeText(authKey)}>
              Add To Clipboard
            </button>
            <button onClick={closePopupFunc}>
              Close
            </button>
            </>
            :
            null
        }
      </div>
    </div>
  )
}

function ContractDataTable({apiKey, contractData, updateContractTable}) {
  let contractTableRows = contractData["data"].map(element => (
    <tr className="contract-row" 
      onClick={async () => {await AcceptContract(apiKey, element["id"]) ; updateContractTable()}}>
      <td>
        {element["type"]}
      </td>
      <td>
        {element["terms"]["payment"]["onAccepted"]}
      </td>
      <td>
        {element["terms"]["payment"]["onFulfilled"]}
      </td>
      <table className="subtable">
        <tablebody>
            <tr>
              <th>Resource</th>
              <th>Destination</th>
              <th>Required Resource Count</th>
              <th>Fulfilled Resource Count</th>
            </tr>
            {element["terms"]["deliver"].map(resource => 
            <tr>
              <td>
                {resource["tradeSymbol"]}
              </td>
              <td>
                {resource["destinationSymbol"]}
              </td>
              <td>
                {resource["unitsRequired"]}
              </td>
              <td>
                {resource["unitsFulfilled"]}
              </td>
            </tr>
            )}
          </tablebody>
      </table>
      <td>
        {element["accepted"] ? "Yes" : "No"}
      </td>
      <td>
        {element["fulfilled"] ? "Yes" : "No"}
      </td>
      <td>
        {element["deadlineToAccept"]}
      </td>
    </tr>)
  );
  return (
    <>
      <table className="main-table">
        <tbody>
          <tr>
            <th>Type</th>
            <th>Accept Payment</th>
            <th>Fulfilled Payment</th>
            <th>Resources</th>
            <th>Accepted</th>
            <th>Fulfilled</th>
            <th>Deadline to Accept</th>
          </tr>
          {contractTableRows}
        </tbody>
      </table>
      Click On a Contract Row to Accept It
    </>
  );
}

function LogInWithAuthKey() {
  const [displayNewKeyPopup, setDisplayNewKeyPopup] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [agentData, setAgentData] = useState({});
  const [systemWaypointData, setSystemWaypointData] = useState({});
  const [contractData, setContractData] = useState({});

  async function getAllData(apiKey) {
    let agentDataResult = await GetAgentData(apiKey);
    setAgentData(agentDataResult);
    let systemWaypointDataResult = {};
    try{
      systemWaypointDataResult = await GetSystemWaypointData(apiKey, agentDataResult['data']['headquarters']);
    }
    catch(err)
    {
      // communicate to CoordinateMap that we couldn't find anything. It will automatically render a blank map.
      // todo: Make CoordinateMap notify user that there was an error getting system data
      systemWaypointDataResult = [];
    }
    setSystemWaypointData(systemWaypointDataResult);
    let contractDataResult = await GetContractData(apiKey);
    setContractData(contractDataResult);
  }

  return(
  <>
    <link rel="stylesheet" href="./main.css"/>
    <h1>Welcome</h1>
    <div id="main-menu">
      <div id="login">
        <label htmlFor="auth-key">Enter your auth key:</label>
        <input id="auth-key" type="text" onChange={e => setApiKey(e.target.value)}/>
        <button id='get-agent-data' onClick={async () => await getAllData(apiKey)}>Get Agent Data</button>
      </div>
      {
        agentData !== undefined && "data" in agentData &&
        systemWaypointData !== undefined && //"data" in systemWaypointData &&
        contractData !== undefined && "data" in contractData ?
        <>
          <AgentDataTable agentData={agentData}/>
          <CoordinateMap systemWaypointPages={systemWaypointData} agentData={agentData}/>
          <ContractDataTable 
            apiKey={apiKey} contractData={contractData} 
            updateContractTable={async () => setContractData(await GetContractData(apiKey))}/>
        </>
        :
        <>
        <button id="get-new-key-popup" onClick={() => setDisplayNewKeyPopup(true)}>Get New Key</button>
        {
          displayNewKeyPopup ? // todo:  what javascript type fuckery did they add to the question mark
            <NewKeyPopUp
              closePopupFunc={() => setDisplayNewKeyPopup(false)}
            />
            :
            null
        }
        </>
      }
    </div>
  </>
  );
}

function getPixelRatio(context) {
  var backingStore =
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;

    return (window.devicePixelRatio || 1) / backingStore;
}

function CoordinateMap({systemWaypointPages, agentData}) {
  let ref = useRef();

  useEffect(() => {
    let canvas = ref.current;
    let context = canvas.getContext('2d');

    let ratio = getPixelRatio(context);
    let width = getComputedStyle(canvas)
      .getPropertyValue('width')
      .slice(0, -2);
     
    let height = getComputedStyle(canvas)
      .getPropertyValue('height')
      .slice(0, -2);

    canvas.width = width*ratio;
    canvas.height = height*ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    let requestId;
    // blah
    function render() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (const systemWaypointPage of systemWaypointPages)
      {
        for (const waypoint of systemWaypointPage["data"]){
          let x = (canvas.width / 2) + waypoint["x"];
          let y = (canvas.height / 2) + waypoint["y"];
          context.beginPath();
          context.arc(
            x,
            y,
            2.5,
            0,
            2 * Math.PI
          );
          context.fill();
          if (waypoint['symbol'] === agentData['data']['headquarters'])
          {
            context.fillText("You are here", x+10, y+10);
          }
        }
      }
      requestId = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(requestId);
    }
  });
      
  return (
    <canvas
      ref={ref}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <LogInWithAuthKey/>
    </>
  )
}
