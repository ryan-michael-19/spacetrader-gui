import { useState, useRef, useEffect } from 'react';
import '../main.css';

async function GetAgentData(apiKey) {
  let response = await fetch(
      'https://api.spacetraders.io/v2/my/agent',{
      method: 'GET',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
      }
  });
  let message = "";
  if (response.status === 200) {
      let res_data = await response.json();
      message = res_data;
  }
  else {
      message = {"data": `Error: Response: ${response.status}`};
  }
  return message;
}

async function GetAgentCoordinates(apiKey, headquarters) {
  let response = await fetch(
      `https://api.spacetraders.io/v2/systems/${headquarters.slice(0,7)}/waypoints/${headquarters}/`,{
      method: 'GET',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
      }
  });
  let message = "";
  if (response.status === 200) {
      let res_data = await response.json();
      message = res_data;
  }
  else {
      message = {"data": `Error: Response: ${response.status}`};
  }
  return message;
}

async function GetNewKey(username) {
    let message = "";
    if (username.length > 14){
        message = "Error: Username must be less than 14 characters.";
    }
    else {
        let response = await fetch(
            'https://api.spacetraders.io/v2/register',{
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "symbol": username,
                "faction": "COSMIC"
            })
        });
        if (response.status === 201) {
            let res_data = await response.json();
            message = res_data["data"]["token"];
        }
        else {
            message = `Error: Response: ${response.status}: Could not get token. Does your username already exist?`;
        }
    }
    return message
}

async function GetContractData(apiKey) {
  let response = await fetch(
      'https://api.spacetraders.io/v2/my/contracts/',{
      method: 'GET',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
      }
  });
  let message = "";
  if (response.status === 200) {
      let res_data = await response.json();
      message = res_data;
  }
  else {
      message = {"data": `Error: Response: ${response.status}`};
  }
  return message;
}

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

function NewKeyPopUp({toggleFunc}) {
  const [userName, setUserName] = useState("");
  const [authKey, setAuthKey] = useState(
    // lol. lmao
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGlmaWVyIjoiUllBTiIsInZlcnNpb24iOiJ2MiIsInJlc2V0X2RhdGUiOiIyMDIzLTA5LTAyIiwiaWF0IjoxNjk0MDEyNTY0LCJzdWIiOiJhZ2VudC10b2tlbiJ9.QXOBVFfj9axOlvdMCOPbWagLRQ-VPQZl2X4f4PD7u4w7onY65qAmvUwBp6lKv5CjTfdK1w6qXEcukXAtpxSgJjd5Q79OSDVk0UmaBNB9u8RtRwWwzmf49WG5J5fsadtzCZmCVq96AUY2gYHAJeWD1yFCKmVjf4Y_f2IefMzkNoWW4-8xet6XqmGT_d39w-ebgw0cZAYy9U_aNpUJO0wQGf1Oh9v7Iavz_2zmXMYDhk47kasAb3Gx-c9l8kyHPriW-2ek2tyr0bLN3rITD_2IZf-KIqx2LihCF-h-uRSjSu-wQh-ixTzRYbbKpDDedSLmnrZSEF8L--C1Ds90yWcFcg"
    // ""
  );
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
            <button onClick={toggleFunc}>
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

function ContractDataTable({contractData}) {
  let contractTableRows = contractData["data"].map(element => (
    <tr className="contract-row">
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
  const [agentCoordinates, setAgentCoordinates] = useState({});
  const [contractData, setContractData] = useState({});

  async function getAllData(apiKey) {
    let agentDataResult = await GetAgentData(apiKey);
    setAgentData(agentDataResult);
    let agentCoordinatesResult = await GetAgentCoordinates(apiKey, agentDataResult['data']['headquarters']);
    setAgentCoordinates(agentCoordinatesResult);
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
        agentCoordinates !== undefined && "data" in agentCoordinates &&
        contractData !== undefined && "data" in contractData ?
        <>
          <AgentDataTable agentData={agentData}/>
          <CoordinateMap agentCoordinates={agentCoordinates}/>
          <ContractDataTable contractData={contractData}/>
        </>
        :
        null
      }
    </div>
    
    <button id="get-new-key-popup" onClick={() => setDisplayNewKeyPopup(true)}>Get New Key</button>
    {
      displayNewKeyPopup ? // todo:  what javascript type fuckery did they add to the question mark
        <NewKeyPopUp
          toggleFunc={() => setDisplayNewKeyPopup(false)}
        />
        :
        null
    }
  </>
  )
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

function CoordinateMap({agentCoordinates}) {
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
    let x = agentCoordinates["data"]["x"];
    let y = agentCoordinates["data"]["y"];
    function render() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();
      context.arc(
        x,
        y,
        5,
        0,
        2 * Math.PI
      );
      context.fill();
      context.fillText("You are here", x+10, y+10);
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
