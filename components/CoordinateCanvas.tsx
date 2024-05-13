import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import { components } from "../types";
import { Waypoint, CreateWayPoint } from '../MapObjects';
import { assert } from "../Utils";


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


export function CoordinateCanvas({systemWaypointPages, agentData, setClickedWaypoints, clickedWaypoints, fullyExpanded} : 
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
          // assert(waypoint.x && waypoint.y, "Waypoint is undefined");
          const canvasAbsoluteX = (canvas.width / 2) + (waypoint.x! + offset.x)*zoom;
          const canvasAbsoluteY = (canvas.height / 2) + (waypoint.y! + offset.y)*zoom;
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
          // assert(waypoint.size, "waypoint size is undefined");
          if (distanceSquared < (waypoint.size!+4) ** 2) {
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
        // assert(waypoint.x && waypoint.y, "waypoint is undefined");
        const canvasAbsoluteX = (canvas.width / 2) + (waypoint.x! + offset.x)*zoom;
        const canvasAbsoluteY = (canvas.height / 2) + (waypoint.y! + offset.y)*zoom;
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
          // assert(clickedWaypoint.x && clickedWaypoint.y, "waypoint is undefined");
          const canvasAbsoluteX = (canvas.width / 2) + (clickedWaypoint.x! + offset.x)*zoom;
          const canvasAbsoluteY = (canvas.height / 2) + (clickedWaypoint.y! + offset.y)*zoom;
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