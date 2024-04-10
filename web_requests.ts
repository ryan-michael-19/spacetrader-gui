import { Waypoint } from './map_objects';
import { assert } from './utils';

export type ResponseData<ResponseType, ResponseMetaType> = {
    data: ResponseType | null
    meta?: ResponseMetaType 
}

export type AgentData = {
    accountId: string,
    symbol: string,
    headquarters: string,
    credits: string
}

export type SingleContractDeliveryTerm = {
    tradeSymbol: string
    destinationSymbol: string
    unitsRequired: number
    unitsFulfilled: number
}

export type ContractDeliveryTerms = Array<SingleContractDeliveryTerm>

export type ContractPayment = {
    onAccepted: number
    onFulfilled: number
}

export type ContractTerm = {
    payment: ContractPayment
    deliver: ContractDeliveryTerms 
}

export type ContractEntry = {
    id: string,
    type: string,
    terms: ContractTerm,
    accepted: boolean,
    fulfilled: boolean,
    deadlineToAccept: string
}

export type ContractData = Array<ContractEntry>

export type WaypointMetaData = {
    total: number
}

export type SingleWaypointData = {
    type: string
}

export type WaypointData = Array<SingleWaypointData>

export type ShipData = {
    type: string
    name: string
    description: string
    supply: string
    activity: string
    purchasePrice: string
}


export async function GetAgentData(apiKey: string): Promise<ResponseData<AgentData, null>> {
  let response = await fetch(
      'https://api.spacetraders.io/v2/my/agent',{
      method: 'GET',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
      }
  });
  if (response.status === 200) {
    let resData: ResponseData<AgentData, null> = await response.json();
    return resData;
  }
  else {
    throw new Error(`Response: ${response.status}`);
  }
}

export async function GetSystemWaypointData(apiKey: string, headquarters: string): Promise<Array<ResponseData<WaypointData, WaypointMetaData>>> {
  const pageLimit = 20;
  async function requestWaypointPage(
    apiKey: string, headquarters: string, pageNumber: number): Promise<ResponseData<WaypointData, WaypointMetaData>> {
    let queryParams = new URLSearchParams({
          limit: pageLimit.toString(),
          page: pageNumber.toString()
    });
    let [sector, system, waypoint] = headquarters.split("-");
    let response = await fetch(
        `https://api.spacetraders.io/v2/systems/${sector}-${system}/waypoints?`+queryParams, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        }
    });
    if (response.status === 200) {
        let resData: ResponseData<WaypointData, WaypointMetaData> = await response.json();
        return resData;
    }
    else {
        throw new Error(`Response: ${response.status}`);
    }
  }

  let firstPage = await requestWaypointPage(apiKey, headquarters, 1);
  assert(firstPage.meta, "could not get metadata");
  // todo: re add this if we get 429s
  // await new Promise(r => setTimeout(r, 600));
  let totalPages = Math.ceil(firstPage.meta.total / pageLimit);
  let allPages = [firstPage];
  // note i is set to 2 since we already have the first page
  for (let i = 2; i <= totalPages; i++)
  {
    allPages.push(await requestWaypointPage(apiKey, headquarters, i));
    await new Promise(r => setTimeout(r, 600));
  }
  return allPages;
}

export async function GetNewKey(username: string): Promise<string> {
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
            throw new Error(`Response: ${response.status}`);
        }
    }
    return message
}

// TODO: Type annotate return
export async function AcceptContract(apiKey: string, contractID: string) {
    let response = await fetch(
        `https://api.spacetraders.io/v2/my/contracts/${contractID}/accept`,{
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
    });
    return await response.json();
}

export async function GetContractData(apiKey: string): Promise<ResponseData<ContractData, null>> {
  let response = await fetch(
      'https://api.spacetraders.io/v2/my/contracts/',{
      method: 'GET',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
      }
  });
  if (response.status === 200) {
      let resData: ResponseData<ContractData, null> = await response.json();
      return resData;
  }
  else {
    throw new Error(`Response: ${response.status}`);
  }
}

export async function GetAvailableShips(apiKey: string, currentSystem: string, shipyardWaypoint: string) {
    let response = await fetch(
        `https://api.spacetraders.io/v2/systems/${currentSystem}/waypoints/${shipyardWaypoint}/shipyard`,{
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
    });
    if (response.status === 200) {
        const resData = await response.json();
        // dirty hack because I screwed the types up :)
        const parsedResData: ResponseData<Array<ShipData>, null> = {data: resData.data.ships} ;
        return parsedResData;
    }
    else {
        throw new Error(`Response: ${response.status}`);
    }
}
