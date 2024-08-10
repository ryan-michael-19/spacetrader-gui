import { getPaginatedWaypointData, HandleError } from "../lib/WebRequests";
import createClient  from "openapi-fetch";
import { paths, components } from "../lib/types";
import fs from "node:fs";
import repl from "repl";

const apiKey = process.argv[2];
const headquarters = process.argv[3];

if (!apiKey) {
  throw Error("No api key specified");
}
if (!headquarters) {
  throw Error("No HQ specified");
}
console.log(fs.readFileSync(apiKey, 'ascii'));
const client = createClient<paths>({
  baseUrl: "https://api.spacetraders.io/v2/",
  headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${fs.readFileSync(apiKey, 'ascii')}`
  }
});

export const paginatedWaypointData = await getPaginatedWaypointData(client, headquarters);
const marketData = await Promise.all(paginatedWaypointData.flat().filter(
    x=>x.type.endsWith("ASTEROID") && x.traits.map(x=>x.symbol).includes("MARKETPLACE")
  ).map(
    async x => {
      console.log(`Getting market data: ${x.symbol}`);
      const res = await client.GET(
      "/systems/{systemSymbol}/waypoints/{waypointSymbol}/market", {
        params: {
          path: {
            systemSymbol: x.systemSymbol,
            waypointSymbol: x.symbol
          }
        }
      });
      await new Promise(r => setTimeout(r, 100));
      return res;
    }
));


export async function PurchaseShip() {}

export async function MineAsteroidForMetal(
    waypoints: components["schemas"]["Waypoint"][][], 
    shipData: components["schemas"]["Ship"][],
    marketData: components["schemas"]["Market"][]
){ 
  // find aluminum.
  console.log("Finding asteroids with metal deposits.");
  const asteroidsWithAluminum = waypoints.flat().filter(
    w => w.type.endsWith("ENGINEERED_ASTEROID") //&& w.traits.map(t=>t.symbol).includes("COMMON_METAL_DEPOSITS")
  );
  console.log("Done!");

  // get appropriate ship
  console.log("Finding a probe ship.");
  const filteredProbeShips = shipData.filter(s => s.frame.symbol === "FRAME_DRONE");
  console.log("Done!");

  if (filteredProbeShips.length && asteroidsWithAluminum.length) {
    // array is populated
    const assignedProbeShip = filteredProbeShips[0]
    //console.log(`Orbiting ship ${assignedProbeShip!.symbol}`)
    //HandleError(await client.POST("/my/ships/{shipSymbol}/orbit", {
    //  params: {
    //    path: {
    //      shipSymbol: assignedProbeShip!.symbol
    //    }
    //  }
    //}));
    //console.log("Done");
    //console.log(`Navigating ${assignedProbeShip!.symbol} to ${asteroidsWithAluminum[0]!.symbol}`);
    //const navResponse = HandleError(await client.POST("/my/ships/{shipSymbol}/navigate", {
    //  params: {
    //    path: {
    //      shipSymbol: assignedProbeShip!.symbol
    //    }
    //  },
    //  body: {
    //    waypointSymbol: asteroidsWithAluminum[0]!.symbol
    //  }
    //}));
    //console.log("Done");
    //const waitTime = Date.parse(navResponse.data.nav.route.arrival) - Date.now();
    //console.log(`Waiting ${waitTime} seconds for ship to arrrive before docking.`);
    //await new Promise(r => setTimeout(r, waitTime+1000));
    //console.log("Done");
    //console.log(`Docking ${assignedProbeShip!.symbol}`);
    //HandleError(await client.POST("/my/ships/{shipSymbol}/dock", {
    //  params: {
    //    path: {
    //      shipSymbol: assignedProbeShip!.symbol
    //    }
    //  }
    //}));
    //console.log("Done");
    //console.log(`Refueling ${assignedProbeShip!.symbol}`);
    //HandleError(await client.POST("/my/ships/{shipSymbol}/refuel", {
    //  params: {
    //    path: {
    //      shipSymbol: assignedProbeShip!.symbol
    //    }
    //  }
    //}));
    //console.log("Done");
    //console.log(`Orbiting ship ${assignedProbeShip!.symbol}`)
    //HandleError(await client.POST("/my/ships/{shipSymbol}/orbit", {
    //  params: {
    //    path: {
    //      shipSymbol: assignedProbeShip!.symbol
    //    }
    //  }
    //}));
    //console.log("Done");
    //console.log(`Ship ${assignedProbeShip!.symbol} extracting cargo`);
    //const cargoResult = HandleError(await client.POST("/my/ships/{shipSymbol}/extract", {
    //  params: {
    //    path: {
    //      shipSymbol: assignedProbeShip!.symbol
    //    }
    //  }
    //}));
    //console.log("Done");
    console.log(`Docking ${assignedProbeShip!.symbol}`);
    HandleError(await client.POST("/my/ships/{shipSymbol}/dock", {
      params: {
        path: {
          shipSymbol: assignedProbeShip!.symbol
        }
      }
    }));
    const cargoResult = HandleError(await client.GET("/my/ships/{shipSymbol}/cargo", {
      params: {
        path: {
          shipSymbol: assignedProbeShip!.symbol
        }
      }
    }));
    cargoResult.data.inventory.forEach(async i => {
      console.log(`Ship ${assignedProbeShip!.symbol} selling cargo`);


      const relevantMarketData = marketData.find(m=>m.symbol===i.symbol);
      console.log(relevantMarketData);
      if (relevantMarketData?.tradeGoods && relevantMarketData.tradeGoods.map(x=>x.symbol).includes(i.symbol)) {
        console.log(`Sold ${i.units} ${i.symbol}`);
        HandleError(await client.POST("/my/ships/{shipSymbol}/sell", {
          params: {
            path: {
              shipSymbol: assignedProbeShip!.symbol
            }
          },
          body: {
            symbol: i.symbol,
            units: i.units
          }
        }));
        await new Promise(r => setTimeout(r, 100))
      }
    });

    console.log("Done");
  } else {
    // array is empty
    throw new Error("Either missing asteroids or a ship to probe them with.");
  }
}

 
const r =  repl.start();
r.context.paginatedWaypointData = paginatedWaypointData;
r.context.client = client;
r.context.marketData = marketData;

console.log("Getting ship data");
const s = await client.GET("/my/ships");
r.context.s = s;
r.context.MineAsteroidForMetal = MineAsteroidForMetal;

await MineAsteroidForMetal(paginatedWaypointData, s.data!.data, marketData.map(x=>x!.data!.data));
