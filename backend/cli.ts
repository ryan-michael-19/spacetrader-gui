import fs from "node:fs";

import createClient  from "openapi-fetch";
import { paths, components } from "../lib/types";
import { HandleError, getPaginatedWaypointData} from "../lib/WebRequests";


const API_KEY = process.argv[2];
if (!API_KEY) {
  throw Error("No api key specified");
}

const CLIENT = createClient<paths>({
  baseUrl: "https://api.spacetraders.io/v2/",
  headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${fs.readFileSync(API_KEY, 'ascii')}`
  }
});

function GetSystemFromWaypoint(waypoint: string){
  return waypoint.split("-").slice(0,2).join("-");
}


class CachedWaypointData {
  #waypointData: components["schemas"]["Waypoint"][][]|null = null;
  #hasLock: boolean = false;

  public GetPaginatedDataWithCache = async function(this: CachedWaypointData, system: string) {
    // check that no other coroutine has the lock
    while (true) {
      if (!this.#hasLock) {
        console.log("Unlocked")
        // check if cache is empty
        if (!this.#waypointData) {
          // obtain lock 
          console.log("Getting lock");
          this.#hasLock = true;
          try{
            this.#waypointData = await getPaginatedWaypointData(CLIENT, system);
          } finally {
            // release lock
            console.log("Releasing lock");
            this.#hasLock = false;
          }
          return this.#waypointData;
        }
        else {
          return this.#waypointData;
        }
      }
      else {
        // wait for lock
        console.log("Waiting 1 second for lock to release.");
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}

const WAYPOINT_CACHE = new CachedWaypointData();

class CLIFuncs {

  static GetWaypointsByTrait = async function(system: string, trait: components["schemas"]["WaypointTraitSymbol"]) { 
    return (await getPaginatedWaypointData(CLIENT, system)).flat().filter(w => w.traits.map(t=>t.symbol).includes(trait));
  }

  static GetAgentData = async function() {
    return HandleError(await CLIENT.GET("/my/agent"));
  };

  static GetShipData = async function() {
    return HandleError(await CLIENT.GET("/my/ships"));
  }

  static GetMarketData = async function(waypoint: string) {
    return HandleError(await CLIENT.GET("/systems/{systemSymbol}/waypoints/{waypointSymbol}/market", {
      params: {path: {systemSymbol: GetSystemFromWaypoint(waypoint), waypointSymbol: waypoint}}
    }));
  }

  static GetMarketWaypoints = async function(system: string) { 
    return HandleError(await CLIENT.GET("/systems/{systemSymbol}/waypoints", {
      params: {path: {systemSymbol: GetSystemFromWaypoint(system)}}
    })).data.filter(w => w.traits.map(t=>t.symbol).includes("MARKETPLACE"));
  }

  static FindMarketToSellMaterial = async function(system: string, material: components["schemas"]["TradeSymbol"]) {
    const marketPlaces = (await getPaginatedWaypointData(CLIENT, system)).flat();
    return await Promise.all(
      marketPlaces.filter(m=>m.traits.map(t=>t.symbol).includes("MARKETPLACE")).map(async m => {
        console.log(`Getting market data for ${m.symbol}`);
        try{
          const marketData = await CLIFuncs.GetMarketData(m.symbol);
          await new Promise(r => setTimeout(r, 200));
          return marketData.data.exchange.map(e=>e.symbol).includes(material);
        } catch (error) {
          console.error(error);
          await new Promise(r => setTimeout(r, 200));
        }
      })
    );
  }

  static GetContracts = async function() {
    return HandleError(await CLIENT.GET("/my/contracts")); 
  }

  static AcceptContract = async function(contractId: string) {
    return HandleError(await CLIENT.POST("/my/contracts/{contractId}/accept", {
      params: {path: {contractId: contractId}}
    }));
  }

  static GetShipYardData = async function(waypoint: string) {
    return HandleError(await CLIENT.GET("/systems/{systemSymbol}/waypoints/{waypointSymbol}/shipyard", {
      params: {path: {systemSymbol: GetSystemFromWaypoint(waypoint), waypointSymbol: waypoint}}
    }))
  }

  static FindMiningDrone = async function(system: string) {
    const shipyards = await CLIFuncs.GetWaypointsByTrait(system, "SHIPYARD");
    const shipyardInfo = await Promise.all(shipyards.map(async s => {
      return HandleError(await CLIENT.GET("/systems/{systemSymbol}/waypoints/{waypointSymbol}/shipyard", {
        params: {path: {systemSymbol: s.systemSymbol, waypointSymbol: s.symbol}}
      }))
    }));
    const miningDroneInfo = shipyardInfo.filter(s=>s.data.shipTypes.map(x=>x.type).includes("SHIP_MINING_DRONE"));
    return miningDroneInfo;
  }

  static PurchaseShip = async function(waypoint: string, shipType: components["schemas"]["ShipType"]) {
    return await CLIENT.POST("/my/ships", {
      body: {waypointSymbol: waypoint, shipType: shipType}
    });
  }

  static GetWaypointData = async function(system: string) {
    return HandleError(await CLIENT.GET("/systems/{systemSymbol}/waypoints", {
      params: {path: {systemSymbol: system}}
    }));
  }

  static OrbitShip = async function(shipName: string ) {
    return HandleError(await CLIENT.POST("/my/ships/{shipSymbol}/orbit", {
      params: {path: {shipSymbol: shipName}}
    }));
  }

  static PerformSurvey = async function(shipName: string) {
    // TODO: survey is deprecated??
    return HandleError(await CLIENT.POST("/my/ships/{shipSymbol}/survey", {
      params: {path: {shipSymbol: shipName}}
    }));
  }

  static NavigateShip = async function(shipName: string, destinationWaypoint: string) {
    return HandleError(await CLIENT.POST("/my/ships/{shipSymbol}/navigate", {
      params: {path: {shipSymbol: shipName}},
      body: {waypointSymbol: destinationWaypoint}
    }));
  }

  static MineResources = async function(shipName: string) {
    return HandleError(await CLIENT.POST("/my/ships/{shipSymbol}/extract", {
      params: {path: {shipSymbol: shipName}},
    }));
  }

  static TravelToAndMineAsteroid = async function(system: string, shipName: string) {
    const ship = (await CLIFuncs.GetShipData()).data.find(s=>s.symbol === shipName);
    if (!ship) {
      throw Error(`Cannot find ship named ${shipName}`);
    }
    if (!ship.mounts.map(s=>s.symbol).filter(s=>s.startsWith("MOUNT_MINING_LASER")).length) {
      throw Error(`Cannot find mining laser on ${shipName}`);
    }
    if (ship.nav.status === "IN_TRANSIT") {
      throw Error(`${shipName} is already in transit`);
    }

    await CLIFuncs.OrbitShip(shipName);

    //const asteroid = (await CLIFuncs.GetWaypointData(system)).data.find(w=>w.type === "ENGINEERED_ASTEROID");
    const asteroid = (await WAYPOINT_CACHE.GetPaginatedDataWithCache(system)).flat().find(w=>w.type === "ENGINEERED_ASTEROID");
    if (!asteroid) {
      throw Error(`${shipName} cannot find an engineered asteroid to navigate to`);
    }
    
    const navResult = await CLIFuncs.NavigateShip(shipName, asteroid.symbol);
    const arrivalTime = Date.parse(navResult.data.nav.route.arrival);

    await new Promise(r => setTimeout(r, arrivalTime - Date.now()));

    return await CLIFuncs.MineResources(shipName);
  }

  static AllShipsTravelAndMineAsteroid = async function(this: CLIFuncs, system: string) {
    const miningShips = (await CLIFuncs.GetShipData()).data
      .filter(s=>["IN_ORBIT", "DOCKED"].includes(s.nav.status)  
               && s.mounts.filter(m=>m.symbol.includes("MOUNT_MINING_LASER")).length
               && ! s.cooldown.remainingSeconds);


    if (!miningShips) {
      throw Error("No available mining ships");
    }
    console.log(`Sending ${miningShips.map(m=>m.symbol)} to mine asteroids`)
    return await Promise.all(miningShips.map(async m => await CLIFuncs.TravelToAndMineAsteroid(system, m.symbol)));
  }

  static MineForever = async function(system: string) {
    console.log("TICK!!")
    await CLIFuncs.AllShipsTravelAndMineAsteroid(system);
    setInterval(
      async () => {console.log("TICK!!"); return await CLIFuncs.AllShipsTravelAndMineAsteroid(system);},
      10000
    )

  }
}

import repl from "repl";
const r = repl.start();
const cliObject = new CLIFuncs();
r.context.CLIENT = CLIENT;
r.context.CLIFuncs = CLIFuncs;
r.context.cliObject = cliObject;

// static methods
for (const k in CLIFuncs) {
  r.context[k] = CLIFuncs[k];
}
