import { COLS, ROWS } from "./constants";
import type { CellData } from "./types";

const dirs = [[1,0],[-1,0],[0,1],[0,-1]] as const;
export const toIndex = (r:number,c:number) => r*COLS+c;
export const toRC = (i:number):[number,number] => [Math.floor(i/COLS),i%COLS];

export function manhattan(a:number,b:number) {
  const [ar,ac]=toRC(a), [br,bc]=toRC(b);
  return Math.abs(ar-br)+Math.abs(ac-bc);
}

export function isBlocked(cell: CellData) {
  return cell.type !== "empty";
}

export function findShortestPath(grid:CellData[], start:number, goal:number):number[] | null {
  const prev = new Int32Array(grid.length);
  prev.fill(-2);
  prev[start] = -1;
  const queue:number[]=[start];
  let head=0;

  while(head<queue.length){
    const cur=queue[head++];
    if(cur===goal) break;
    const [r,c]=toRC(cur);
    for(const [dr,dc] of dirs){
      const nr=r+dr,nc=c+dc;
      if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
      const ni=toIndex(nr,nc);
      if(prev[ni]!==-2) continue;
      if(ni!==goal && isBlocked(grid[ni])) continue;
      prev[ni]=cur;
      queue.push(ni);
    }
  }
  if(prev[goal]===-2) return null;
  const path:number[]=[];
  for(let cur=goal;cur!==-1;cur=prev[cur]) path.push(cur);
  return path.reverse();
}