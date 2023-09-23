// factory pattern :(
export function CreateWayPoint(requestData){
    const wayPointType = requestData['type'];
    if (wayPointType === "PLANET") {
        return new Planet(requestData);
    }
    else if (wayPointType === "MOON") {
        return new Moon(requestData);
    }
    else if (wayPointType == "ASTEROID_FIELD") {
        return new AsteroidField(requestData);
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
    else {
        throw Error("Undefined Waypoint Type");
    }
}

// todo: create an interface to force all subclasses to have a render method
class Waypoint {
    // ALL WAYPOINTS MUST DEFINE this.size !!!!
    // Apparently we can't create an interface to enforce this because of duck typing.
    constructor(requestData) {
        if (this.constructor === Waypoint) {
            throw new Error("Waypoint is an abstract class.");
        }
        else {
            // future me will regret past me doing this when I try to migrate to typescript :)
            Object.assign(this, requestData);
            return this;
        }
    }

    render(context, x, y) {
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
    constructor(requestData){
        super(requestData);
        this.size = 2.5;
    }
}

class Moon extends Waypoint{
    constructor(requestData){
        super(requestData);
        this.size = 1.5;
    }
}

class AsteroidField extends Waypoint {
    constructor(requestData){
        super(requestData);
        this.size = 5.5;
    }
}

class GasGiant extends Waypoint {
    constructor(requestData){
        super(requestData);
        this.size = 4.5;
    }
}

class OrbitalStation extends Waypoint {
    constructor(requestData){
        super(requestData);
        this.size = 4;
    }
}

class JumpGate extends Waypoint {
    constructor(requestData){
        super(requestData);
        this.size = 6;
    }

}