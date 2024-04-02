// import { AssertionError } from 'assert';
import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import '../main.css';
import { GetAgentData, GetSystemWaypointData, GetNewKey, 
          AcceptContract, GetContractData, ResponseData, 
          AgentData, ContractData, SingleWaypointData, 
          WaypointData, WaypointMetaData } from '../web_requests'
import { CreateWayPoint, Waypoint } from '../map_objects'
import { assert } from "../utils"


function AgentDataTable({ agentData }: { agentData: ResponseData<AgentData, null> }) {
  // TODO: Error handling when we get bad agentdata
  return (
    <>
    <table className="general-table">
      <tbody>
      <tr>
        <th>Account ID</th>
        <th>Name</th>
        <th>HQ</th>
        <th>Credits</th>
      </tr>
      <tr>
        <td>{agentData.data?.accountId}</td>
        <td>{agentData.data?.symbol}</td>
        <td>{agentData.data?.headquarters}</td>
        <td>{agentData.data?.credits}</td>
      </tr>
      </tbody>
    </table>
    </>
  )
}

function NewKeyPopUp({closePopupFunc}: {closePopupFunc: () => void}) {
  const [userName, setUserName] = useState("");
  const [authKeyComponentData, setAuthKeyComponentData] = useState(<></>);
  async function getAuthKeyComponentData(username: string){
    try {
      let authKey = await GetNewKey(username) ;
      return (              
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
        </>
      );
    }
    catch(err) {
      return <p>There was an error getting an auth key.</p>;
    }
  }
  return (
    <div id="new-key-popup">
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

function ContractDataTable({apiKey, contractData, updateContractTable}: 
  {apiKey: string, contractData: ResponseData<ContractData, null>, updateContractTable: () => void}) {
  let contractTableRows = contractData.data?.map(element => (
    <tr className="selectable-row" 
      onClick={async () => {await AcceptContract(apiKey, element.id) ; updateContractTable()}}>
      <td>
        {element.type}
      </td>
      <td>
        {element.terms.payment.onAccepted}
      </td>
      <td>
        {element.terms.payment.onFulfilled}
      </td>
      <table className="subtable">
        <tbody>
            <tr>
              <th>Resource</th>
              <th>Destination</th>
              <th>Required Resource Count</th>
              <th>Fulfilled Resource Count</th>
            </tr>
            {element.terms.deliver.map(resource => 
            <tr>
              <td>
                {resource.tradeSymbol}
              </td>
              <td>
                {resource.destinationSymbol}
              </td>
              <td>
                {resource.unitsRequired}
              </td>
              <td>
                {resource.unitsFulfilled}
              </td>
            </tr>
            )}
          </tbody>
      </table>
      <td>
        {element.accepted ? "Yes" : "No"}
      </td>
      <td>
        {element.fulfilled ? "Yes" : "No"}
      </td>
      <td>
        {element.deadlineToAccept}
      </td>
    </tr>)
  );
  return (
    <>
      <table className="general-table">
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
  // Todo: this is waaaaaay too much state to keep in one place.
  const [displayNewKeyPopup, setDisplayNewKeyPopup] = useState(false);
  const [apiKey, setApiKey] = useState("");
  // TODO: Clean these types up
  const [agentData, setAgentData]: [ResponseData<AgentData, null>, any] = useState({data: null});
  const [systemWaypointData, setSystemWaypointData] = useState<Array<ResponseData<WaypointData, WaypointMetaData>>>([]);
  const [contractData, setContractData] = useState<ResponseData<ContractData, null>>({data: null});
  const [agentRequestSent, setAgentRequestSent] = useState(false);
  const [agentDataError, setAgentDataError] = useState(false);

  async function getAllData(apiKey: string) {
    let agentDataResult: ResponseData<AgentData, null> = {data: null};
    let errorFromRequest = false;
    try {
      agentDataResult = await GetAgentData(apiKey);
    }
    catch(err) {
      agentDataResult =  {data: null};
      errorFromRequest = true;
    }
    setAgentData(agentDataResult);

    let systemWaypointDataResult: Array<ResponseData<WaypointData, WaypointMetaData>> = [];
    if (agentDataResult.data) {
      try {
        systemWaypointDataResult = await GetSystemWaypointData(apiKey, agentDataResult.data.headquarters);
      }
      catch(err) {
        // communicate to CoordinateMap that we couldn't find anything. It will automatically render a blank map.
        // todo: Make CoordinateMap notify user that there was an error getting system data
        systemWaypointDataResult = [];
        errorFromRequest = true;
      }
    }
    setSystemWaypointData(systemWaypointDataResult);

    let contractDataResult: ResponseData<ContractData, null> = {data: null};
    try {
      contractDataResult = await GetContractData(apiKey);
    }
    catch(err) {
      contractDataResult = {data: null};
      errorFromRequest = true;
    }
    setContractData(contractDataResult);

    setAgentRequestSent(true);
    setAgentDataError(errorFromRequest);
  }

  return(
  <>
    <link rel="stylesheet" type="text/css" href="./main.css"/>
    <h1>Welcome</h1>
    <div id="main-menu">
      <div id="login">
        <label htmlFor="auth-key">Enter your auth key:</label>
        <input id="auth-key" type="text" onChange={e => setApiKey(e.target.value)}/>
        <button id='get-agent-data' onClick={async () => await getAllData(apiKey)}>Get Agent Data</button>
      </div>
      {
        // todo: clean up this trinary nonsense
        agentRequestSent && agentDataError ? 
          <>
            <p>There was an error getting your agent's data. Are you using a valid auth key?</p>
            <button id="get-new-key-popup" onClick={() => setDisplayNewKeyPopup(true)}>Get New Key</button>
          </>
        : agentRequestSent && ! agentDataError ?
          <>
            <AgentDataTable agentData={agentData}/>
            <CoordinateMap 
              systemWaypointPages={systemWaypointData} agentData={agentData} 
            />
            <ContractDataTable 
              apiKey={apiKey} contractData={contractData} 
              updateContractTable={async () => setContractData(await GetContractData(apiKey))}/>
          </>
        : ! agentRequestSent ?
          <>
            <button id="get-new-key-popup" onClick={() => setDisplayNewKeyPopup(true)}>Get New Key</button>
          </>
        :
          // I missed a bunch of edge cases YEEEEEEET
          <p>bruh</p>
      }
      {
        displayNewKeyPopup ? 
          <NewKeyPopUp
            closePopupFunc={() => setDisplayNewKeyPopup(false)}
          />
          :
          null
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

function WaypointDataPane({setClickedWaypoint, currentWaypoint}:
  {setClickedWaypoint: Dispatch<SetStateAction<null>>, currentWaypoint: Waypoint}) {
  return (
    <div className={"c waypoint-data"}>
      <div className={"scrollable"}>
        <table className={"general-table"}>
          <caption>
            {`${currentWaypoint.symbol}: ${currentWaypoint.type.replace("_", " ")}: belongs to ${currentWaypoint.faction.symbol}`}
          </caption>
          <tbody>
            <tr>
              <th>Trait Name</th>
              <th>Trait Description</th>
              <th>Trait Action</th>
            </tr>
            {
              currentWaypoint.traits.map(t => {return(
                <tr className="selectable-row">
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
      </div>
      <button className={"close-table"} onClick={() => setClickedWaypoint(null)}>Close</button>
    </div>
  );
}

function CoordinateMap({systemWaypointPages, agentData}:
  {systemWaypointPages: Array<ResponseData<WaypointData, WaypointMetaData>>, agentData: ResponseData<AgentData, null>}) {
  const [clickedWaypoint, setClickedWaypoint] = useState<Waypoint|null>(null);
  if (clickedWaypoint) { 
    return (
      <div>
        <CoordinateCanvas systemWaypointPages={systemWaypointPages} agentData={agentData}
                          setClickedWaypoint={setClickedWaypoint} clickedWaypoint={clickedWaypoint} fullyExpanded={false}/>
        <WaypointDataPane setClickedWaypoint={setClickedWaypoint} currentWaypoint={clickedWaypoint}/>
      </div>
    );
  } else { // waypoint is not clicked on/ has been closed
    return (
      <CoordinateCanvas systemWaypointPages={systemWaypointPages} agentData={agentData} 
                        setClickedWaypoint={setClickedWaypoint} clickedWaypoint={clickedWaypoint} fullyExpanded={true}/>
    );
  }
}

function CoordinateCanvas({systemWaypointPages, agentData, setClickedWaypoint, clickedWaypoint, fullyExpanded} : 
  {systemWaypointPages: Array<ResponseData<WaypointData, WaypointMetaData>>, 
    agentData: ResponseData<AgentData, null>,
    setClickedWaypoint: Dispatch<SetStateAction<Waypoint>>,
    clickedWaypoint: Waypoint|null,
    fullyExpanded: boolean}) {
  let ref = useRef<HTMLCanvasElement>(null); // refs start being set to null?? and the type system works???
  const [zoom, setZoom] = useState(1);
  const [previousMouseLoc, setPreviousMouseLoc] = useState({x:0, y:0});
  const [offset, setOffset] = useState({x: 0, y: 0});
  const [mouseClickedCoordinates, setMouseClickedCoordinates] = useState<{x:number, y:number}>();
  const [clickMustBeProcessed, setClickMustBeProcessed] = useState(false);
  let [mouseIsDown, setMouseIsDown] = useState(false);
  let [mouseWasDragged, setMouseWasDragged] = useState(false);


  // todo: do we really need an effect here?
  useEffect(() => {
    let canvas = ref.current;
    // No guarantee we actually get the canvas on the first render
    if (!canvas) { return ;}
    let context = canvas.getContext('2d');

    let ratio = getPixelRatio(context);
    let width = Number(getComputedStyle(canvas)
      .getPropertyValue('width')
      .slice(0, -2));
     
    let height = Number(getComputedStyle(canvas)
      .getPropertyValue('height')
      .slice(0, -2));

    canvas.width = width*ratio;
    canvas.height = height*ratio;
    // canvas.style.width = `${width}px`;
    // canvas.style.height = `${height}px`;

    let requestId: number;
    // blah
    function render() {
      // I'm guessing there's some closure weirdness here that makes us
      // have to run the canvas type assertion again
      assert(canvas !== null, "Canvas is null");
      assert(context !== null, "Context is null");
      assert(agentData.data, "no agent data");
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (const systemWaypointPage of systemWaypointPages)
      {
        assert(systemWaypointPage.data, "missing waypoint data");
        for (const waypoint of systemWaypointPage.data.map(CreateWayPoint)){
          const canvasAbsoluteX = (canvas.width / 2) + (waypoint.x + offset.x)*zoom;
          const canvasAbsoluteY = (canvas.height / 2) + (waypoint.y + offset.y)*zoom;
          if ((!mouseIsDown) && clickMustBeProcessed)
          {
            assert(typeof mouseClickedCoordinates !== 'undefined', 'mouse clicked coordinates is undefined');
            // Get mouse coordinates in terms of the canvas
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mouseRelativeToCanvasX = mouseClickedCoordinates.x * scaleX - rect.x;
            const mouseRelativeToCanvasY = mouseClickedCoordinates.y * scaleY - rect.y;
            // radial bounds check.
            // check if the distance between the waypoint and the mouse is less than the size of the waypoint
            const distanceSquared = (canvasAbsoluteX - mouseRelativeToCanvasX) ** 2 
                                  + (canvasAbsoluteY - mouseRelativeToCanvasY) ** 2;
            if (distanceSquared < (waypoint.size+4) ** 2)
            {
              setClickedWaypoint(waypoint); // register click
            }
            setClickMustBeProcessed(false);
          }
          waypoint.render(context, canvasAbsoluteX, canvasAbsoluteY);
          if (waypoint.symbol === agentData.data.headquarters)
          {
            context.fillText("You are here", canvasAbsoluteX+(10), canvasAbsoluteY+(10));
          }
        }
      }
      if (clickedWaypoint) {
        const selectedWaypointAbsoluteX = (canvas.width / 2) + (clickedWaypoint.x + offset.x)*zoom;
        const selectedWaypointAbsoluteY = (canvas.height / 2) + (clickedWaypoint.y + offset.y)*zoom;
        clickedWaypoint.renderSelectedCircle(context, selectedWaypointAbsoluteX, selectedWaypointAbsoluteY);
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
      className={`c ${fullyExpanded ? "fully-expand": "partially-expand"}`}
      // Todo: put lambdas somewhere more organized
      // zoom in and out with mousewheel
      onWheel={e => {
        const zoomFactor = 200;
        const newZoom = zoom-(e.deltaY / zoomFactor);
        if (newZoom <= 1){
          setZoom(1);
        }
        else {
          setZoom(newZoom);
        }
      }}

      // used https://stackoverflow.com/a/59741870 as a template
      onMouseDown={e => {
        setMouseIsDown(true);
        setPreviousMouseLoc({x: e.pageX, y: e.pageY});
      }}
      onMouseUp={e => {
        setMouseClickedCoordinates({x: e.pageX, y: e.pageY});
        if (!mouseWasDragged) {
          setClickMustBeProcessed(true);
        }
        setMouseIsDown(false);
        setMouseWasDragged(false);
      }}
      onMouseMove={e => {
        if (mouseIsDown) {
          const diffX = e.pageX - previousMouseLoc.x;
          const diffY = e.pageY - previousMouseLoc.y;
          const delta = 6;
          if (Math.abs(diffX) < delta && Math.abs(diffY) < delta) {
            // Click!
          } else {
            // drag
            const calcNewOffset = (coord: number, diff: number) => {
              return coord+(diff/zoom);
            };
            let newOffset = {x: calcNewOffset(offset.x, diffX), y: calcNewOffset(offset.y, diffY)};
            setOffset(newOffset);
            setMouseWasDragged(true);
            setPreviousMouseLoc({x: e.pageX, y: e.pageY});
          }
        }
      }}
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
