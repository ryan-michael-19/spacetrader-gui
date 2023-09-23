export async function GetAgentData(apiKey) {
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
    throw new Error(`Response: ${response.status}`);
  }
  return message;
}

export async function GetSystemWaypointData(apiKey, headquarters) {
  const pageLimit = 20;
  async function requestWaypointPage(apiKey, headquarters, pageNumber){
    let query_params = new URLSearchParams({
          limit: pageLimit,
          page: pageNumber
    });
    let response = await fetch(
        `https://api.spacetraders.io/v2/systems/${headquarters.slice(0,6)}/waypoints?`+query_params, {
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
        throw new Error(`Response: ${response.status}`);
    }
    return message;
  }

  let firstPage = await requestWaypointPage(apiKey, headquarters, 1);
  // todo: re add this if we get 429s
  // await new Promise(r => setTimeout(r, 600));
  let totalPages = Math.ceil(firstPage['meta']['total'] / pageLimit);
  let allPages = [firstPage];
  // note i is set to 2 since we already have the first page
  for (let i = 2; i <= totalPages; i++)
  {
    allPages.push(await requestWaypointPage(apiKey, headquarters, i));
    await new Promise(r => setTimeout(r, 600));
  }
  return allPages;
}

export async function GetNewKey(username) {
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

export async function AcceptContract(apiKey, contractID) {
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

export async function GetContractData(apiKey) {
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
    throw new Error(`Response: ${response.status}`);
  }
  return message;
}
