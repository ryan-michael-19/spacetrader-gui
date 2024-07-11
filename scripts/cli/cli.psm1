$baseUrl = "https://api.spacetraders.io/v2"

function Invoke-New-Agent {
  Param (
    $AgentName
  )

  Process {
    # TODO: Convert to Invoke-RestMethod
    $repsonse=Invoke-WebRequest "$baseUrl/register" `
      -Method Post `
      -ContentType "application/json" `
      -Body (@{symbol=$AgentName; faction="COSMIC"} | ConvertTo-Json) `

    (($response).Content | ConvertFrom-Json).data.token | Out-File -FilePath .\api_key
    
  }
   
}

function Get-Agent-Data {
  Process {
    Invoke-RestMethod "$baseUrl/my/agent" `
      -Method Get `
      -ContentType "application/json" `
      -Headers @{Authorization="Bearer $(Get-Content .\api_key)"}
  }
}

function Get-Contracts {
  Process {
    Invoke-RestMethod "$baseUrl/my/contracts" `
      -Method Get `
      -ContentType "application/json" `
      -Headers @{Authorization="Bearer $(Get-Content .\api_key)"}
  }
}

function Invoke-Accept-Contract {
  Param (
    $ContractId
  )
  Process {
    Invoke-RestMethod "$baseUrl/my/contracts/$ContractId/accept" `
      -Method Post `
      -Headers @{Authorization="Bearer $(Get-Content .\api_key)"}
  }
}

function Get-ShipYards {
  Param (
    $System
  )
  Process {
    Invoke-RestMethod "$baseUrl/systems/$System/waypoints?traits=SHIPYARD" `
      -Headers @{Authorization="Bearer $(Get-Content .\api_key)"}
  }
}

function Get-ShipYard-Ships {
  Param (
    $System, 
    $Waypoint
  )
  Process {
    Invoke-RestMethod "$baseUrl/systems/$System/waypoints/$Waypoint/shipyard" `
      -Headers @{Authorization="Bearer $(Get-Content .\api_key)"}
  }
}

function Invoke-Purchase-Ship {
  Param (
    $Waypoint,
    $ShipType
  )
  Process {
    Invoke-RestMethod "$baseUrl/my/ships" `
      -Method Post `
      -Body @{shipType=$shipType; waypointSymbol=$Waypoint} `
      -Headers @{Authorization="Bearer $(Get-Content .\api_key)"}
  }
}

function Get-Ship-Data {
  Process {
    Invoke-RestMethod "$baseUrl/my/ships" `
      -Headers @{Authorization="Bearer $(Get-Content .\api_key)"}
    }
}

function Get-Engineered-Asteroids {
  Param (
    $System
  )
  Process {
    Invoke-RestMethod "$baseUrl/systems/$System/waypoints?type=ENGINEERED_ASTEROID" `
      -Headers @{Authorization="Bearer $(Get-Content .\api_key)"}
  }
}

function Invoke-Orbit-Ship {
  Param (
    $ShipName
  )
  Process {
    Invoke-RestMethod "$baseUrl/my/ships/$ShipName/orbit" `
      -Method Post `
      -Headers @{Authorization="Bearer $(Get-Content .\api_key)"}
  }
}

function Invoke-Fly-Ship {
  Param (
    $ShipName,
    $WaypointSymbol
  )
  Process {
      Invoke-RestMethod "$baseUrl/my/ships/$ShipName/navigate" `
        -Method Post `
        -Headers @{Authorization="Bearer $(Get-Content .\api_key)"} `
        -Body @{waypointSymbol=$WaypointSymbol}
  }
}

function Invoke-Dock-Ship {
    Param (
      $ShipName
    )
    Process {
        Invoke-RestMethod "$baseUrl/my/ships/$ShipName/dock" `
          -Method Post `
          -Headers @{Authorization="Bearer $(Get-Content .\api_key)"} `
    }
}

function Invoke-Refuel-Ship {
    Param (
      $ShipName
    )
    Process {
        Invoke-RestMethod "$baseUrl/my/ships/$ShipName/refuel" `
          -Method Post `
          -Headers @{Authorization="Bearer $(Get-Content .\api_key)"} `
    }
}

function Invoke-Extract-Ship {
    Param (
      $ShipName
    )
    Process {
        Invoke-RestMethod "$baseUrl/my/ships/$ShipName/extract" `
          -Method Post `
          -Headers @{Authorization="Bearer $(Get-Content .\api_key)"} `
    }
}

function Get-Market-Data {
    Param (
      $System,
      $Waypoint
    )
    Process {
      Invoke-RestMethod "$baseUrl/systems/$System/waypoints/$Waypoint/market" `
        -Headers @{Authorization="Bearer $(Get-Content .\api_key)"}
    }
}

function Get-Ship-Cargo {
    Param (
      $ShipName
    )
    Process {
        Invoke-RestMethod "$baseUrl/my/ships/$ShipName/cargo" `
          -Headers @{Authorization="Bearer $(Get-Content .\api_key)"} 
    }
}

function Invoke-Sell-Goods {
    Param (
      $ShipName,
      $GoodSymbol,
      $Units
    )
    Process {
        Invoke-RestMethod "$baseUrl/my/ships/$ShipName/sell" `
          -Method Post `
          -Headers @{Authorization="Bearer $(Get-Content .\api_key)"} `
          -Body @{symbol=$GoodSymbol; units=$Units}
    }
}


Export-ModuleMember -Function *
