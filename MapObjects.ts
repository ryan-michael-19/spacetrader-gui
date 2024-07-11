import type { components } from "./types";
import { assert } from "./Utils";

// factory pattern :(
export function CreateWayPoint(requestData: components["schemas"]["Waypoint"]){
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
    // These should all be assigned via the constructor
    size: number | undefined;
    traits: Array<{symbol: string, name: string, description: string}> | undefined;
    symbol: string | undefined;
    type: string | undefined;
    faction: {symbol: string} | undefined;
    x: number|undefined;
    y: number|undefined;
    // ALL WAYPOINTS MUST DEFINE this.size !!!!
    // Apparently we can't create an interface to enforce this because of duck typing.
    constructor(requestData: components["schemas"]["Waypoint"]) {
        if (this.constructor === Waypoint) {
            throw new Error("Waypoint is an abstract class.");
        }
        else {
            // TODO: use some sort of reflection library to make this safe??
            Object.assign(this, requestData);
            return this;
        }
    }
    // todo: split update coords and render into two different functions?
    // they're two different operations, but having two functions that *must*
    // be run right after another is bad practice.
    // render({context, absoluteCoords, offsetCoords, canvasSize, zoomFactor}) {
    render(context, x, y) {
        const color = "black";
        assert(this.traits, "traits is undefined");
        if (this.traits.map(t=>t.symbol).includes("SHIPYARD")) {
            // color = "red";
            context.fillText("S", x-10, y+10);
        } 
        if (this.type === "ASTEROID") {
            // color = "red";
            context.fillText("A", x+10, y+10);
        } else if (this.type === "ENGINEERED_ASTEROID") {
            context.fillText("E", x+5, y+5);
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

    renderSelectedCircle(context, x: number, y: number) {
        assert(this.size, "size is undefined");
        context.fillStyle = "black";
        context.beginPath();
        context.arc(
            x,
            y,
            this.size+10,
            0,
            2 * Math.PI
        );
        context.stroke();
    }
}

class Planet extends Waypoint {
    constructor(requestData: components["schemas"]["Waypoint"]){
        super(requestData);
        this.size = 2.5;
    }
}

class Moon extends Waypoint{
    constructor(requestData: components["schemas"]["Waypoint"]){
        super(requestData);
        this.size = 1.5;
    }
}

class AsteroidField extends Waypoint {
    constructor(requestData: components["schemas"]["Waypoint"]){
        super(requestData);
        this.size = 5.5;
    }
}

class GasGiant extends Waypoint {
    constructor(requestData: components["schemas"]["Waypoint"]){
        super(requestData);
        this.size = 4.5;
    }
}

class OrbitalStation extends Waypoint {
    constructor(requestData: components["schemas"]["Waypoint"]){
        super(requestData);
        this.size = 4;
    }
}

class JumpGate extends Waypoint {
    constructor(requestData: components["schemas"]["Waypoint"]){
        super(requestData);
        this.size = 6;
    }

}

class Asteroid extends Waypoint {
    constructor(requestData: components["schemas"]["Waypoint"]){
        super(requestData);
        this.size = 1;
    }
}

class FuelStation extends Waypoint {
    constructor(requestData: components["schemas"]["Waypoint"]){
        super(requestData);
        this.size = 3;
    }
}
