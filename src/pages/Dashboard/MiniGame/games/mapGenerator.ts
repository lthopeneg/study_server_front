import { CELL_COUNT, NATURAL_WALL_COUNT, PERMANENT_WALL_MAX, PERMANENT_WALL_MIN } from "./constants";
import { findShortestPath, manhattan } from "./pathfinding";
import type { CellData } from "./types";

const emptyGrid = ():CellData[] => Array.from({length:CELL_COUNT},()=>({type:"empty"}));

export interface GeneratedMap {
  grid: CellData[];
  start: number;
  goal: number;
  path: number[];
}

export function generateMap():GeneratedMap {
  for(let mapAttempt=0;mapAttempt<200;mapAttempt++){
    const grid=emptyGrid();
    let start=0,goal=0;
    do {
      start=Math.floor(Math.random()*CELL_COUNT);
      goal=Math.floor(Math.random()*CELL_COUNT);
    } while(start===goal || manhattan(start,goal)<2);

    const permanentCount=PERMANENT_WALL_MIN+
      Math.floor(Math.random()*(PERMANENT_WALL_MAX-PERMANENT_WALL_MIN+1));

    const place=(type:"permanent"|"natural",count:number)=>{
      let placed=0,tries=0;
      while(placed<count && tries++<3000){
        const i=Math.floor(Math.random()*CELL_COUNT);
        if(i===start||i===goal||grid[i].type!=="empty") continue;
        grid[i]={type};
        if(findShortestPath(grid,start,goal)) placed++;
        else grid[i]={type:"empty"};
      }
      return placed===count;
    };

    if(!place("permanent",permanentCount)) continue;
    if(!place("natural",NATURAL_WALL_COUNT)) continue;
    const path=findShortestPath(grid,start,goal);
    if(path) return {grid,start,goal,path};
  }
  throw new Error("유효한 맵을 생성하지 못했습니다.");
}