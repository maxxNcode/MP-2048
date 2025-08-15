export type Direction = 'up'|'down'|'left'|'right'

export function createInitialBoard(): number[][] {
  const b = Array.from({ length: 4 }, () => Array(4).fill(0))
  return addRandomTile(addRandomTile(b))
}

function cloneBoard(b: number[][]) { return b.map(r => [...r]) }

function emptyCells(b: number[][]) {
  const res: { r: number; c: number }[] = []
  for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (b[r][c]===0) res.push({ r, c })
  return res
}

function addRandomTile(b: number[][]) {
  const cells = emptyCells(b)
  if (cells.length===0) return b
  const { r, c } = cells[Math.floor(Math.random()*cells.length)]
  const v = Math.random() < 0.9 ? 2 : 4
  const nb = cloneBoard(b)
  nb[r][c] = v
  return nb
}

function addRandomTileWithPos(b: number[][]) {
  const cells = emptyCells(b)
  if (cells.length===0) return { board: b, spawn: undefined as undefined | { r: number; c: number } }
  const { r, c } = cells[Math.floor(Math.random()*cells.length)]
  const v = Math.random() < 0.9 ? 2 : 4
  const nb = cloneBoard(b)
  nb[r][c] = v
  return { board: nb, spawn: { r, c } }
}

function compress(line: number[]) {
  const arr = line.filter(v => v!==0)
  while (arr.length < 4) arr.push(0)
  return arr
}

function merge(line: number[]) {
  const res = [...line]
  let scoreGain = 0
  for (let i=0;i<3;i++) {
    if (res[i]!==0 && res[i]===res[i+1]) {
      res[i]*=2
      scoreGain += res[i]
      res[i+1]=0
      i++
    }
  }
  return { line: compress(res), scoreGain }
}

function moveLeft(board: number[][]) {
  let changed=false, gain=0
  const nb = board.map(row => {
    const c = compress(row)
    const { line, scoreGain } = merge(c)
    if (!changed && line.some((v,i)=>v!==row[i])) changed=true
    gain += scoreGain
    return line
  })
  return { board: nb, changed, gain }
}

function moveRight(board: number[][]) {
  const reversed = board.map(r => [...r].reverse())
  const { board: nb, changed, gain } = moveLeft(reversed)
  return { board: nb.map(r=>r.reverse()), changed, gain }
}

function transpose(b: number[][]) {
  const nb = Array.from({ length: 4 }, () => Array(4).fill(0))
  for (let r=0;r<4;r++) for (let c=0;c<4;c++) nb[c][r] = b[r][c]
  return nb
}

function moveUp(board: number[][]) {
  const t = transpose(board)
  const { board: nb, changed, gain } = moveLeft(t)
  return { board: transpose(nb), changed, gain }
}

function moveDown(board: number[][]) {
  const t = transpose(board)
  const { board: nb, changed, gain } = moveRight(t)
  return { board: transpose(nb), changed, gain }
}

export function applyMove(board: number[][], dir: Direction) {
  let res
  if (dir==='left') res = moveLeft(board)
  else if (dir==='right') res = moveRight(board)
  else if (dir==='up') res = moveUp(board)
  else res = moveDown(board)
  if (!res.changed) return { board, changed: false, gain: 0 }
  const { board: nb, spawn } = addRandomTileWithPos(res.board)
  return { board: nb, changed: true, gain: res.gain, spawn }
}

export function canMoveAny(board: number[][]) {
  if (emptyCells(board).length>0) return true
  // check merges
  for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
    const v = board[r][c]
    if (r<3 && board[r+1][c]===v) return true
    if (c<3 && board[r][c+1]===v) return true
  }
  return false
}

export function scoreOfBoard(board: number[][]) {
  let s = 0
  for (let r=0;r<4;r++) for (let c=0;c<4;c++) s += board[r][c]
  return s
}
