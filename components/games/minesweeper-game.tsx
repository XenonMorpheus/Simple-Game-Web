"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"

interface Cell {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  adjacentMines: number
}

type Difficulty = "easy" | "medium" | "hard"

const difficultySettings = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
}

export default function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [board, setBoard] = useState<Cell[][]>([])
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing")
  const [flagsPlaced, setFlagsPlaced] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [firstClick, setFirstClick] = useState(true)

  // Initialize the board
  useEffect(() => {
    initializeBoard()
  }, [difficulty])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (startTime && gameStatus === "playing") {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [startTime, gameStatus])

  const initializeBoard = () => {
    const { rows, cols, mines } = difficultySettings[difficulty]

    // Create empty board
    const newBoard: Cell[][] = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0,
          })),
      )

    setBoard(newBoard)
    setGameStatus("playing")
    setFlagsPlaced(0)
    setStartTime(null)
    setElapsedTime(0)
    setFirstClick(true)
  }

  const placeMines = useCallback(
    (firstClickRow: number, firstClickCol: number) => {
      const { rows, cols, mines } = difficultySettings[difficulty]

      // Create a copy of the board
      const newBoard = [...board.map((row) => [...row])]

      // Place mines randomly, avoiding the first click and its adjacent cells
      let minesPlaced = 0
      while (minesPlaced < mines) {
        const row = Math.floor(Math.random() * rows)
        const col = Math.floor(Math.random() * cols)

        // Skip if this is the first click cell or adjacent to it
        if (Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1) {
          continue
        }

        if (!newBoard[row][col].isMine) {
          newBoard[row][col].isMine = true
          minesPlaced++
        }
      }

      // Calculate adjacent mines
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (newBoard[row][col].isMine) continue

          let count = 0

          // Check all 8 adjacent cells
          for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
              if (r === row && c === col) continue
              if (newBoard[r][c].isMine) count++
            }
          }

          newBoard[row][col].adjacentMines = count
        }
      }

      setBoard(newBoard)
      return newBoard
    },
    [board, difficulty],
  )

  const handleCellClick = (row: number, col: number) => {
    if (gameStatus !== "playing" || board[row][col].isRevealed || board[row][col].isFlagged) {
      return
    }

    // Start timer on first click
    if (startTime === null) {
      setStartTime(Date.now())
    }

    // On first click, place mines (ensuring first click is never a mine)
    let currentBoard = board
    if (firstClick) {
      currentBoard = placeMines(row, col)
      setFirstClick(false)
    }

    const newBoard = [...currentBoard.map((row) => [...row])]

    // If clicked on a mine, game over
    if (newBoard[row][col].isMine) {
      revealAllMines(newBoard)
      setGameStatus("lost")
      return
    }

    // Reveal the clicked cell
    revealCell(newBoard, row, col)

    // Check if player has won
    if (checkWinCondition(newBoard)) {
      setGameStatus("won")
    }

    setBoard(newBoard)
  }

  const handleCellRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()

    if (gameStatus !== "playing" || board[row][col].isRevealed) {
      return
    }

    // Start timer on first interaction
    if (startTime === null) {
      setStartTime(Date.now())
    }

    const newBoard = [...board.map((row) => [...row])]
    const { mines } = difficultySettings[difficulty]

    // Toggle flag
    if (newBoard[row][col].isFlagged) {
      newBoard[row][col].isFlagged = false
      setFlagsPlaced(flagsPlaced - 1)
    } else if (flagsPlaced < mines) {
      newBoard[row][col].isFlagged = true
      setFlagsPlaced(flagsPlaced + 1)
    }

    setBoard(newBoard)

    // Check if player has won
    if (checkWinCondition(newBoard)) {
      setGameStatus("won")
    }
  }

  const revealCell = (board: Cell[][], row: number, col: number) => {
    const { rows, cols } = difficultySettings[difficulty]

    // If out of bounds, already revealed, or flagged, return
    if (row < 0 || row >= rows || col < 0 || col >= cols || board[row][col].isRevealed || board[row][col].isFlagged) {
      return
    }

    // Reveal the cell
    board[row][col].isRevealed = true

    // If it's a cell with no adjacent mines, reveal all adjacent cells
    if (board[row][col].adjacentMines === 0) {
      for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
          if (r === row && c === col) continue
          revealCell(board, r, c)
        }
      }
    }
  }

  const revealAllMines = (board: Cell[][]) => {
    const { rows, cols } = difficultySettings[difficulty]

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (board[row][col].isMine) {
          board[row][col].isRevealed = true
        }
      }
    }
  }

  const checkWinCondition = (board: Cell[][]) => {
    const { rows, cols, mines } = difficultySettings[difficulty]

    let revealedCount = 0
    let correctlyFlaggedCount = 0

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (board[row][col].isRevealed && !board[row][col].isMine) {
          revealedCount++
        }
        if (board[row][col].isFlagged && board[row][col].isMine) {
          correctlyFlaggedCount++
        }
      }
    }

    return revealedCount === rows * cols - mines || correctlyFlaggedCount === mines
  }

  const getNumberColor = (count: number): string => {
    const colors = [
      "", // 0 has no number
      "text-blue-600",
      "text-green-600",
      "text-red-600",
      "text-purple-800",
      "text-yellow-800",
      "text-teal-600",
      "text-black",
      "text-gray-600",
    ]

    return colors[count] || ""
  }

  return (
    <div className="flex flex-col items-center">
      {/* Game header */}
      <div className="mb-4 w-full max-w-fit bg-[#4a752c] rounded-t-md p-2 flex justify-between items-center">
        <div className="relative">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="appearance-none bg-white px-3 py-1 pr-8 rounded text-sm font-medium"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="text-red-500 mr-1">🚩</span>
            <div className="bg-black text-red-500 font-mono text-xl px-2 py-0.5">
              {difficultySettings[difficulty].mines - flagsPlaced}
            </div>
          </div>

          <button
            onClick={initializeBoard}
            className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300"
          >
            {gameStatus === "playing" ? "😊" : gameStatus === "won" ? "😎" : "😵"}
          </button>

          <div className="bg-black text-red-500 font-mono text-xl px-2 py-0.5">
            {elapsedTime.toString().padStart(3, "0")}
          </div>
        </div>
      </div>

      {/* Game board */}
      <div
        className={`grid gap-px bg-[#87ab66] p-px ${
          difficulty === "easy"
            ? "grid-cols-9"
            : difficulty === "medium"
              ? "grid-cols-16"
              : "grid-cols-[repeat(30,minmax(0,1fr))]"
        }`}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                w-8 h-8 flex items-center justify-center font-bold
                ${
                  cell.isRevealed
                    ? cell.isMine
                      ? "bg-red-500"
                      : "bg-[#a7d948]"
                    : "bg-[#8bae3e] hover:bg-[#9ec44a] cursor-pointer"
                }
                ${gameStatus === "lost" && cell.isMine && cell.isRevealed ? "bg-red-500" : ""}
              `}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
            >
              {cell.isFlagged && !cell.isRevealed ? (
                <span className="text-red-600">🚩</span>
              ) : cell.isRevealed ? (
                cell.isMine ? (
                  <span>💣</span>
                ) : cell.adjacentMines > 0 ? (
                  <span className={getNumberColor(cell.adjacentMines)}>{cell.adjacentMines}</span>
                ) : null
              ) : null}
            </div>
          )),
        )}
      </div>

      {/* Game status */}
      {gameStatus !== "playing" && (
        <div className="mt-4 text-xl font-bold">{gameStatus === "won" ? "You Win! 🎉" : "Game Over! 💥"}</div>
      )}
    </div>
  )
}

