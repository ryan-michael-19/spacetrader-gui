import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import '../main.css';
import { HandleError } from "../web_requests";
import { CreateWayPoint, Waypoint } from '../map_objects';
import { assert } from "../utils"

import createClient  from "openapi-fetch";
import type { paths, components } from "../types";

type WebRequestClient = ReturnType<typeof createClient<paths>>;

function AgentDataTable({ agentData }: { agentData: components["schemas"]["Agent"] | undefined }) {
  // TODO: Error handling when we get bad agentdata
  return (
    <>
    <table className="general-table">
      <caption>Player Info</caption>
      <tbody>
      <tr>
        <th>Account ID</th>
        <th>Name</th>
        <th>HQ</th>
        <th>Credits</th>
      </tr>
      <tr>
        <td>{agentData?.accountId}</td>
        <td>{agentData?.symbol}</td>
        <td>{agentData?.headquarters}</td>
        <td>{agentData?.credits}</td>
      </tr>
      </tbody>
    </table>
    </>
  )
}

function NewKeyPopUp({closePopupFunc}: {closePopupFunc: () => void}) {
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

function ContractDataTable({webReqClient, contractData, updateContractTable}: 
  {webReqClient: WebRequestClient, contractData: components["schemas"]["Contract"][], updateContractTable: () => void}) {
  const contractTableRows = [...contractData.entries()].map(([elementNumber, element]) => (
    <tr className="selectable-row" key={elementNumber}
      onClick={async () => {
        webReqClient.POST("/my/contracts/{contractId}/accept", {
          params: {
            path: {
              contractId: element.id
            }
          }
        });
        updateContractTable()}}>
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
            {
            element.terms.deliver ? [...element.terms.deliver.entries()].map(([resourceNumber, resource]) => 
            <tr key={resourceNumber}>
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
            ): null}
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
        <caption>Contract Info</caption>
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

async function getPaginatedWaypointData(
  authedClient: WebRequestClient, headquarters: string, page: number = 1, waypoints: components["schemas"]["Waypoint"][][] = []
) : Promise<components["schemas"]["Waypoint"][][]> {
  const requestData = HandleError(await authedClient.GET("/systems/{systemSymbol}/waypoints", {
    params: {
      path: {
        systemSymbol: headquarters
      },
      query: {
        limit: 20,
        page: page
      }
    }}));
  waypoints.push(requestData.data);
  if (page > requestData.meta.limit) {
    return waypoints
  } else {
    return getPaginatedWaypointData(
      authedClient, headquarters, page+1, waypoints);
  }
}

function LogInWithAuthKey() {
  // Todo: this is waaaaaay too much state to keep in one place.
  const [displayNewKeyPopup, setDisplayNewKeyPopup] = useState(false);
  const [authenticatedClient, setAuthenticatedClient] = useState<WebRequestClient|null>(null);
  // TODO: Clean these types up
  const [agentData, setAgentData] = useState<components["schemas"]["Agent"]|undefined>();
  const [systemWaypointData, setSystemWaypointData] = useState<components["schemas"]["Waypoint"][][]>([]);
  const [contractData, setContractData] = useState<components["schemas"]["Contract"][]>([]);
  const [agentRequestSent, setAgentRequestSent] = useState(false);

  async function getAllData(authedClient: WebRequestClient) {
    const agentDataResult = HandleError(await authedClient.GET("/my/agent"));
    setAgentData(agentDataResult.data);

    // TODO: Reimplement paging
    // const systemWaypointDataResult = HandleError(await authedClient.GET("/systems/{systemSymbol}/waypoints",{
    //   params: {path: {systemSymbol: agentDataResult.data.headquarters.split("-").slice(0,2).join("-")}}}))
    const systemWaypointDataResult = await getPaginatedWaypointData(
      authedClient, agentDataResult.data.headquarters.split("-").slice(0,2).join("-"));
    setSystemWaypointData(systemWaypointDataResult);

    const contractDataResult = HandleError(await authedClient.GET("/my/contracts"));
    setContractData(contractDataResult.data);

    setAgentRequestSent(true);
  }

  return(
  <>
    <link rel="stylesheet" type="text/css" href="./main.css"/>
    <h1>Welcome</h1>
    <div id="main-menu">
      <div id="login">
        <label htmlFor="auth-key">Enter your auth key:</label>
        <input id="auth-key" type="text" onChange={e => {setAuthenticatedClient(
          createClient<paths>({
            baseUrl: "https://api.spacetraders.io/v2/",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${e.target.value}`
            }
          }));
        }}
        />
        <button id='get-agent-data' onClick={async () =>{ 
          assert(authenticatedClient, "authenticated client is null"); 
          await getAllData(authenticatedClient)}}
        >Get Agent Data</button>
      </div>
      {
        // todo: clean up this trinary nonsense
        agentRequestSent ?
          <>
            <AgentDataTable agentData={agentData}/>
            <CoordinateMap 
              systemWaypointPages={systemWaypointData} agentData={agentData} webReqClient={
                (() => {assert(authenticatedClient, "Authenticated client is null") ; return authenticatedClient;})()}
            />
            <ContractDataTable 
              webReqClient={(() => {assert(authenticatedClient, "Authenticated client is null") ; return authenticatedClient;})()}
              contractData={contractData} 
              updateContractTable={async () => setContractData(
                HandleError(await authenticatedClient.GET("/my/contracts")).data
              )}/>
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
  const backingStore =
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;

    return (window.devicePixelRatio || 1) / backingStore;
}

function WaypointDataPane({setClickedWaypoint, clickedWaypoints, setShipData,  agentData, webReqClient }:
  {setClickedWaypoint: Dispatch<SetStateAction<Waypoint[]>>,
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

function ViewShipPopup({shipData, setShipData}: {
    shipData: components["schemas"]["Shipyard"]|undefined,
    setShipData: Dispatch<SetStateAction<components["schemas"]["Shipyard"]|null>>,
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

function CoordinateMap({systemWaypointPages, agentData, webReqClient}:
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
        <WaypointDataPane setClickedWaypoint={setClickedWaypoints} clickedWaypoints={clickedWaypoints} webReqClient={webReqClient}
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


function CoordinateCanvas({systemWaypointPages, agentData, setClickedWaypoints, clickedWaypoints, fullyExpanded} : 
  {systemWaypointPages: components["schemas"]["Waypoint"][][], 
    agentData: components["schemas"]["Agent"]|undefined,
    setClickedWaypoints: Dispatch<SetStateAction<Waypoint[]>>,
    clickedWaypoints: Waypoint[],
    fullyExpanded: boolean}) {
  const ref = useRef<HTMLCanvasElement>(null); // refs start being set to null?? and the type system works???
  const [zoom, setZoom] = useState(1);
  const [previousMouseLoc, setPreviousMouseLoc] = useState({x:0, y:0});
  const [offset, setOffset] = useState({x: 0, y: 0});
  const [mouseClickedCoordinates, setMouseClickedCoordinates] = useState<{x:number, y:number}>();
  const [clickMustBeProcessed, setClickMustBeProcessed] = useState(false);
  const [mouseIsDown, setMouseIsDown] = useState(false);
  const [mouseWasDragged, setMouseWasDragged] = useState(false);
  const effectDeps = [zoom, previousMouseLoc, offset, mouseClickedCoordinates, clickMustBeProcessed, mouseIsDown, mouseWasDragged];


  // todo: do we really need an effect here?
  useEffect(() => {
    const canvas = ref.current;
    // No guarantee we actually get the canvas on the first render
    if (!canvas) { return ;}
    const context = canvas.getContext('2d');

    const ratio = getPixelRatio(context);
    const width = Number(getComputedStyle(canvas)
      .getPropertyValue('width')
      .slice(0, -2));
     
    const height = Number(getComputedStyle(canvas)
      .getPropertyValue('height')
      .slice(0, -2));

    canvas.width = width*ratio;
    canvas.height = height*ratio;

    let requestId: number;
    // blah
    function render() {
      // I'm guessing there's some closure weirdness here that makes us
      // have to run the canvas type assertion again
      assert(canvas !== null, "Canvas is null");
      assert(context !== null, "Context is null");
      context.clearRect(0, 0, canvas.width, canvas.height);
      const waypoints = systemWaypointPages.map(systemWaypointPage => {
        assert(systemWaypointPage, "missing waypoint data");
        return systemWaypointPage.map(CreateWayPoint);
      }).flat();

      if ((!mouseIsDown) && clickMustBeProcessed) {
        setClickMustBeProcessed(false);
        const filteredWaypoints = waypoints.filter(waypoint => {
          const canvasAbsoluteX = (canvas.width / 2) + (waypoint.x + offset.x)*zoom;
          const canvasAbsoluteY = (canvas.height / 2) + (waypoint.y + offset.y)*zoom;
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
          if (distanceSquared < (waypoint.size+4) ** 2) {
            // Todo: Remove render methods from waypoint so we're not adding stateful calls
            //       in a filter function
            return true;
          } else {
            return false;
          }
        });
        setClickedWaypoints(filteredWaypoints);
      }

      for (const waypoint of waypoints) {
        const canvasAbsoluteX = (canvas.width / 2) + (waypoint.x + offset.x)*zoom;
        const canvasAbsoluteY = (canvas.height / 2) + (waypoint.y + offset.y)*zoom;
        waypoint.render(context, canvasAbsoluteX, canvasAbsoluteY);
        assert(agentData, "no agent data");
        if (waypoint.symbol === agentData.headquarters) {
          context.fillText("You are here", canvasAbsoluteX+(10), canvasAbsoluteY+(10));
        }
      }
      if (clickedWaypoints.length > 0) {
        // all clicked waypoints should have the same (or very close) coordinates.
        // only draw one selection circle around all these waypoints.
        const clickedWaypoint = clickedWaypoints[0];
        if (clickedWaypoint){
          const canvasAbsoluteX = (canvas.width / 2) + (clickedWaypoint.x + offset.x)*zoom;
          const canvasAbsoluteY = (canvas.height / 2) + (clickedWaypoint.y + offset.y)*zoom;
          clickedWaypoint.renderSelectedCircle(context, canvasAbsoluteX, canvasAbsoluteY);
          requestId = requestAnimationFrame(render);
        }
      }
    }
    render();

    return () => {
      cancelAnimationFrame(requestId);
    }
  }, );
      
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
            const newOffset = {x: calcNewOffset(offset.x, diffX), y: calcNewOffset(offset.y, diffY)};
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
