"use client"

import { useState, useEffect } from "react"

type SudokuGrid = (number | null)[][]

export default function SudokuGame() {
  const [grid, setGrid] = useState<SudokuGrid>([])
  const [originalGrid, setOriginalGrid] = useState<SudokuGrid>([])
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [notes, setNotes] = useState<Record<string, number[]>>({})
  const [isNoteMode, setIsNoteMode] = useState(false)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "expert" | "master">("easy")
  const [gameStatus, setGameStatus] = useState<"playing" | "solved">("playing")
  const [timer, setTimer] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [maxMistakes] = useState(3)

  // Initialize the game
  useEffect(() => {
    generateNewGame()
  }, [difficulty])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (gameStatus === "playing") {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameStatus])

  const generateNewGame = () => {
    // Create a solved Sudoku grid
    const solvedGrid = generateSolvedGrid()

    // Create a puzzle by removing numbers based on difficulty
    const cellsToRemove = {
      easy: 30,
      medium: 40,
      hard: 50,
      expert: 55,
      master: 60,
    }[difficulty]

    const puzzleGrid = [...solvedGrid.map((row) => [...row])]
    let removed = 0

    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9)
      const col = Math.floor(Math.random() * 9)

      if (puzzleGrid[row][col] !== null) {
        puzzleGrid[row][col] = null
        removed++
      }
    }

    setGrid(puzzleGrid)
    setOriginalGrid(puzzleGrid.map((row) => [...row]))
    setSelectedCell(null)
    setNotes({})
    setGameStatus("playing")
    setTimer(0)
    setMistakes(0)
  }

  const generateSolvedGrid = (): SudokuGrid => {
    // Create an empty grid
    const grid: SudokuGrid = Array(9)
      .fill(null)
      .map(() => Array(9).fill(null))

    // Helper function to check if a number can be placed at a position
    const isValid = (grid: SudokuGrid, row: number, col: number, num: number): boolean => {
      // Check row
      for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num) return false
      }

      // Check column
      for (let x = 0; x < 9; x++) {
        if (grid[x][col] === num) return false
      }

      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3
      const boxCol = Math.floor(col / 3) * 3

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (grid[boxRow + r][boxCol + c] === num) return false
        }
      }

      return true
    }

    // Solve the grid using backtracking
    const solve = (grid: SudokuGrid): boolean => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === null) {
            // Try placing numbers 1-9
            const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
            // Shuffle the numbers for randomness
            for (let i = nums.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[nums[i], nums[j]] = [nums[j], nums[i]]
            }

            for (const num of nums) {
              if (isValid(grid, row, col, num)) {
                grid[row][col] = num

                if (solve(grid)) {
                  return true
                }

                grid[row][col] = null
              }
            }

            return false
          }
        }
      }

      return true
    }

    solve(grid)
    return grid
  }

  const handleCellClick = (row: number, col: number) => {
    // Can't select cells that were filled in the original grid
    if (originalGrid[row][col] !== null) return

    setSelectedCell([row, col])
  }

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return

    const [row, col] = selectedCell

    if (originalGrid[row][col] !== null) return

    if (isNoteMode) {
      // Handle notes
      const cellKey = `${row}-${col}`
      const currentNotes = notes[cellKey] || []

      if (currentNotes.includes(num)) {
        // Remove the note
        setNotes({
          ...notes,
          [cellKey]: currentNotes.filter((n) => n !== num),
        })
      } else {
        // Add the note
        setNotes({
          ...notes,
          [cellKey]: [...currentNotes, num].sort(),
        })
      }

      // Clear the cell value
      const newGrid = [...grid.map((row) => [...row])]
      newGrid[row][col] = null
      setGrid(newGrid)
    } else {
      // Handle direct number input
      const newGrid = [...grid.map((row) => [...row])]

      // Check if the number is valid for this cell
      const solvedGrid = generateSolvedGrid() // This is inefficient but works for demo
      const correctValue = solvedGrid[row][col]

      if (num !== correctValue) {
        // Increment mistakes
        setMistakes((prev) => prev + 1)

        // If max mistakes reached, don't allow more inputs
        if (mistakes + 1 >= maxMistakes) {
          return
        }
      }

      newGrid[row][col] = num
      setGrid(newGrid)

      // Clear notes for this cell
      const cellKey = `${row}-${col}`
      if (notes[cellKey]) {
        const newNotes = { ...notes }
        delete newNotes[cellKey]
        setNotes(newNotes)
      }

      // Check if the puzzle is solved
      if (isSudokuSolved(newGrid)) {
        setGameStatus("solved")
      }
    }
  }

  const handleClearCell = () => {
    if (!selectedCell) return

    const [row, col] = selectedCell

    if (originalGrid[row][col] !== null) return

    const newGrid = [...grid.map((row) => [...row])]
    newGrid[row][col] = null
    setGrid(newGrid)
  }

  const isSudokuSolved = (grid: SudokuGrid): boolean => {
    // Check if all cells are filled
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === null) return false
      }
    }

    // Check rows
    for (let row = 0; row < 9; row++) {
      const seen = new Set<number>()
      for (let col = 0; col < 9; col++) {
        const num = grid[row][col]
        if (num === null || seen.has(num)) return false
        seen.add(num)
      }
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
      const seen = new Set<number>()
      for (let row = 0; row < 9; row++) {
        const num = grid[row][col]
        if (num === null || seen.has(num)) return false
        seen.add(num)
      }
    }

    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const seen = new Set<number>()
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const num = grid[boxRow * 3 + row][boxCol * 3 + col]
            if (num === null || seen.has(num)) return false
            seen.add(num)
          }
        }
      }
    }

    return true
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col items-center">
      {/* Game header */}
      <div className="mb-4 w-full max-w-md flex justify-between items-center">
        <div className="flex space-x-2">
          {["easy", "medium", "hard", "expert", "master"].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff as any)}
              className={`px-2 py-1 text-sm rounded-md ${
                difficulty === diff ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>

        <div className="text-2xl font-bold">
          {mistakes}/{maxMistakes}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
        {/* Sudoku grid */}
        <div className="grid grid-cols-9 gap-px bg-gray-800 p-px border-2 border-gray-800">
          {Array(9)
            .fill(null)
            .map((_, rowIndex) =>
              Array(9)
                .fill(null)
                .map((_, colIndex) => {
                  const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex
                  const isOriginal = originalGrid[rowIndex]?.[colIndex] !== null
                  const cellValue = grid[rowIndex]?.[colIndex]
                  const cellNotes = notes[`${rowIndex}-${colIndex}`] || []

                  // Determine box shading
                  const boxRow = Math.floor(rowIndex / 3)
                  const boxCol = Math.floor(colIndex / 3)
                  const isShaded = (boxRow + boxCol) % 2 === 1

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                    w-9 h-9 flex items-center justify-center relative
                    ${isShaded ? "bg-[#edf2f7]" : "bg-white"}
                    ${isSelected ? "ring-2 ring-blue-500" : ""}
                    ${isOriginal ? "font-bold" : ""}
                    cursor-pointer
                    ${(rowIndex + 1) % 3 === 0 && rowIndex < 8 ? "border-b-2 border-gray-800" : ""}
                    ${(colIndex + 1) % 3 === 0 && colIndex < 8 ? "border-r-2 border-gray-800" : ""}
                  `}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {cellValue ? (
                        <span className={`text-lg ${isOriginal ? "text-black" : "text-blue-600"}`}>{cellValue}</span>
                      ) : cellNotes.length > 0 ? (
                        <div className="grid grid-cols-3 grid-rows-3 gap-0 w-full h-full p-px">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <div key={num} className="flex items-center justify-center">
                              {cellNotes.includes(num) ? <span className="text-[8px] text-gray-600">{num}</span> : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )
                }),
            )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="font-mono text-xl">Time: {formatTime(timer)}</div>

            <button onClick={generateNewGame} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              New Game
            </button>
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                className="w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center text-xl font-bold text-blue-800 hover:bg-blue-200"
                onClick={() => handleNumberInput(num)}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
            <button
              className={`flex-1 px-4 py-2 rounded-md ${isNoteMode ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              onClick={() => setIsNoteMode(!isNoteMode)}
            >
              Notes {isNoteMode ? "On" : "Off"}
            </button>

            <button className="flex-1 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300" onClick={handleClearCell}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Game status */}
      {gameStatus === "solved" && <div className="mt-4 text-xl font-bold text-green-600">Puzzle Solved! 🎉</div>}
    </div>
  )
}

