import { SingleWaypointData } from "./web_requests";

// factory pattern :(
export function CreateWayPoint(requestData: SingleWaypointData){
    const wayPointType = requestData.type;
    if (wayPointType === "PLANET") {
        return new Planet(requestData);
    }
    else if (wayPointType === "MOON") {
        return new Moon(requestData);
    }
    else if (wayPointType == "ASTEROID_FIELD" || wayPointType == "ASTEROID_BASE") {
        return new AsteroidField(requestData);
    }
    else if (wayPointType == 'ASTEROID' || wayPointType == "ENGINEERED_ASTEROID") {
        return new Asteroid(requestData);
    }
    else if (wayPointType == "GAS_GIANT") {
        return new GasGiant(requestData);
    }
    else if (wayPointType == "ORBITAL_STATION") {
        return new OrbitalStation(requestData);
    }
    else if (wayPointType == "JUMP_GATE") {
        return new JumpGate(requestData);
    }
    else if (wayPointType == "FUEL_STATION") {
        return new FuelStation(requestData);
    }
    else {
        throw Error("Undefined Waypoint Type");
    }
}

// todo: create an interface to force all subclasses to have a render method
export class Waypoint {
    size: number;
    traits: any;
    symbol: string;
    x: number;
    y: number;
    // ALL WAYPOINTS MUST DEFINE this.size !!!!
    // Apparently we can't create an interface to enforce this because of duck typing.
    constructor(requestData: SingleWaypointData) {
        if (this.constructor === Waypoint) {
            throw new Error("Waypoint is an abstract class.");
        }
        else {
            // TODO: use some sort of reflection library to make this safe??
            Object.assign(this, requestData);
            return this;
        }
    }

    render(context, x, y) {
        let color;
        if (this.traits.map(t=>t.symbol).includes("SHIPYARD")) {
            color = "red";
        } else {
            color = "black";
        }
        context.fillStyle = color;
        context.strokeStyle = color;
        context.beginPath(); 
        context.arc(
            x,
            y,
            this.size,
            0,
            2 * Math.PI
        );
        context.fill();
    };
}

class Planet extends Waypoint {
    constructor(requestData: SingleWaypointData){
        super(requestData);
        this.size = 2.5;
    }
}

class Moon extends Waypoint{
    constructor(requestData: SingleWaypointData){
        super(requestData);
        this.size = 1.5;
    }
}

class AsteroidField extends Waypoint {
    constructor(requestData: SingleWaypointData){
        super(requestData);
        this.size = 5.5;
    }
}

class GasGiant extends Waypoint {
    constructor(requestData: SingleWaypointData){
        super(requestData);
        this.size = 4.5;
    }
}

class OrbitalStation extends Waypoint {
    constructor(requestData: SingleWaypointData){
        super(requestData);
        this.size = 4;
    }
}

class JumpGate extends Waypoint {
    constructor(requestData: SingleWaypointData){
        super(requestData);
        this.size = 6;
    }

}

class Asteroid extends Waypoint {
    constructor(requestData: SingleWaypointData){
        super(requestData);
        this.size = 1;
    }
}

class FuelStation extends Waypoint {
    constructor(requestData: SingleWaypointData){
        super(requestData);
        this.size = 3;
    }
}