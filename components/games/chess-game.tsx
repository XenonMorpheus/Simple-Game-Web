"use client"

import { useState, useEffect, useCallback } from "react"

type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king"
type PieceColor = "white" | "black"

interface Piece {
  type: PieceType
  color: PieceColor
  hasMoved?: boolean
}

type Board = (Piece | null)[][]

export default function ChessGame() {
  const [board, setBoard] = useState<Board>([])
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<[number, number][]>([])
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>("white")
  const [gameStatus, setGameStatus] = useState<"playing" | "check" | "checkmate" | "stalemate">("playing")
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[]; black: Piece[] }>({
    white: [],
    black: [],
  })

  // Initialize the board
  useEffect(() => {
    initializeBoard()
  }, [])

  const initializeBoard = () => {
    const initialBoard: Board = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null))

    // Set up pawns
    for (let i = 0; i < 8; i++) {
      initialBoard[1][i] = { type: "pawn", color: "black", hasMoved: false }
      initialBoard[6][i] = { type: "pawn", color: "white", hasMoved: false }
    }

    // Set up rooks
    initialBoard[0][0] = { type: "rook", color: "black", hasMoved: false }
    initialBoard[0][7] = { type: "rook", color: "black", hasMoved: false }
    initialBoard[7][0] = { type: "rook", color: "white", hasMoved: false }
    initialBoard[7][7] = { type: "rook", color: "white", hasMoved: false }

    // Set up knights
    initialBoard[0][1] = { type: "knight", color: "black" }
    initialBoard[0][6] = { type: "knight", color: "black" }
    initialBoard[7][1] = { type: "knight", color: "white" }
    initialBoard[7][6] = { type: "knight", color: "white" }

    // Set up bishops
    initialBoard[0][2] = { type: "bishop", color: "black" }
    initialBoard[0][5] = { type: "bishop", color: "black" }
    initialBoard[7][2] = { type: "bishop", color: "white" }
    initialBoard[7][5] = { type: "bishop", color: "white" }

    // Set up queens
    initialBoard[0][3] = { type: "queen", color: "black" }
    initialBoard[7][3] = { type: "queen", color: "white" }

    // Set up kings
    initialBoard[0][4] = { type: "king", color: "black", hasMoved: false }
    initialBoard[7][4] = { type: "king", color: "white", hasMoved: false }

    setBoard(initialBoard)
    setCurrentPlayer("white")
    setGameStatus("playing")
    setCapturedPieces({ white: [], black: [] })
  }

  // Find the king's position
  const findKing = useCallback(
    (color: PieceColor, boardState: Board = board): [number, number] | null => {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = boardState[row]?.[col]
          if (piece && piece.type === "king" && piece.color === color) {
            return [row, col]
          }
        }
      }
      return null
    },
    [board],
  )

  // Calculate raw moves without considering check
  const calculateRawMoves = useCallback(
    (row: number, col: number, boardState: Board = board): [number, number][] => {
      const piece = boardState[row]?.[col]
      if (!piece) return []

      const moves: [number, number][] = []

      switch (piece.type) {
        case "pawn":
          // Pawns move differently based on color
          const direction = piece.color === "white" ? -1 : 1

          // Forward move
          if (row + direction >= 0 && row + direction < 8 && !boardState[row + direction][col]) {
            moves.push([row + direction, col])

            // Double move from starting position
            if (
              !piece.hasMoved &&
              row + 2 * direction >= 0 &&
              row + 2 * direction < 8 &&
              !boardState[row + 2 * direction][col]
            ) {
              moves.push([row + 2 * direction, col])
            }
          }

          // Capture moves
          for (const captureCol of [col - 1, col + 1]) {
            if (captureCol >= 0 && captureCol < 8 && row + direction >= 0 && row + direction < 8) {
              const targetPiece = boardState[row + direction][captureCol]
              if (targetPiece && targetPiece.color !== piece.color) {
                moves.push([row + direction, captureCol])
              }
            }
          }
          break

        case "rook":
          // Horizontal and vertical moves
          for (const [dr, dc] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            let r = row + dr
            let c = col + dc

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
              if (!boardState[r][c]) {
                moves.push([r, c])
              } else {
                if (boardState[r][c].color !== piece.color) {
                  moves.push([r, c])
                }
                break
              }

              r += dr
              c += dc
            }
          }
          break

        case "knight":
          // L-shaped moves
          for (const [dr, dc] of [
            [2, 1],
            [2, -1],
            [-2, 1],
            [-2, -1],
            [1, 2],
            [1, -2],
            [-1, 2],
            [-1, -2],
          ]) {
            const r = row + dr
            const c = col + dc

            if (r >= 0 && r < 8 && c >= 0 && c < 8 && (!boardState[r][c] || boardState[r][c].color !== piece.color)) {
              moves.push([r, c])
            }
          }
          break

        case "bishop":
          // Diagonal moves
          for (const [dr, dc] of [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ]) {
            let r = row + dr
            let c = col + dc

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
              if (!boardState[r][c]) {
                moves.push([r, c])
              } else {
                if (boardState[r][c].color !== piece.color) {
                  moves.push([r, c])
                }
                break
              }

              r += dr
              c += dc
            }
          }
          break

        case "queen":
          // Combination of rook and bishop moves
          for (const [dr, dc] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ]) {
            let r = row + dr
            let c = col + dc

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
              if (!boardState[r][c]) {
                moves.push([r, c])
              } else {
                if (boardState[r][c].color !== piece.color) {
                  moves.push([r, c])
                }
                break
              }

              r += dr
              c += dc
            }
          }
          break

        case "king":
          // One square in any direction
          for (const [dr, dc] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ]) {
            const r = row + dr
            const c = col + dc

            if (r >= 0 && r < 8 && c >= 0 && c < 8 && (!boardState[r][c] || boardState[r][c].color !== piece.color)) {
              moves.push([r, c])
            }
          }

          // Castling - simplified to avoid recursion
          if (!piece.hasMoved) {
            // Kingside castling
            if (
              boardState[row][7]?.type === "rook" &&
              !boardState[row][7].hasMoved &&
              !boardState[row][6] &&
              !boardState[row][5]
            ) {
              moves.push([row, 6])
            }

            // Queenside castling
            if (
              boardState[row][0]?.type === "rook" &&
              !boardState[row][0].hasMoved &&
              !boardState[row][1] &&
              !boardState[row][2] &&
              !boardState[row][3]
            ) {
              moves.push([row, 2])
            }
          }
          break
      }

      return moves
    },
    [board],
  )

  // Check if a position is under direct attack
  const isUnderDirectAttack = useCallback(
    (row: number, col: number, attackerColor: PieceColor, boardState: Board = board): boolean => {
      // Check pawn attacks
      const pawnDirection = attackerColor === "white" ? 1 : -1
      for (const dc of [-1, 1]) {
        const r = row + pawnDirection
        const c = col + dc
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const piece = boardState[r][c]
          if (piece && piece.type === "pawn" && piece.color === attackerColor) {
            return true
          }
        }
      }

      // Check knight attacks
      const knightMoves = [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ]
      for (const [dr, dc] of knightMoves) {
        const r = row + dr
        const c = col + dc
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const piece = boardState[r][c]
          if (piece && piece.type === "knight" && piece.color === attackerColor) {
            return true
          }
        }
      }

      // Check horizontal and vertical (rook and queen)
      const straightDirections = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]
      for (const [dr, dc] of straightDirections) {
        let r = row + dr
        let c = col + dc
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const piece = boardState[r][c]
          if (piece) {
            if (piece.color === attackerColor && (piece.type === "rook" || piece.type === "queen")) {
              return true
            }
            break
          }
          r += dr
          c += dc
        }
      }

      // Check diagonals (bishop and queen)
      const diagonalDirections = [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]
      for (const [dr, dc] of diagonalDirections) {
        let r = row + dr
        let c = col + dc
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const piece = boardState[r][c]
          if (piece) {
            if (piece.color === attackerColor && (piece.type === "bishop" || piece.type === "queen")) {
              return true
            }
            break
          }
          r += dr
          c += dc
        }
      }

      // Check king attacks (one square in any direction)
      const kingMoves = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]
      for (const [dr, dc] of kingMoves) {
        const r = row + dr
        const c = col + dc
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const piece = boardState[r][c]
          if (piece && piece.type === "king" && piece.color === attackerColor) {
            return true
          }
        }
      }

      return false
    },
    [board],
  )

  // Check if the king is in check
  const isInCheck = useCallback(
    (color: PieceColor, boardState: Board = board): boolean => {
      const kingPosition = findKing(color, boardState)
      if (!kingPosition) return false

      const [kingRow, kingCol] = kingPosition
      const opponentColor = color === "white" ? "black" : "white"

      return isUnderDirectAttack(kingRow, kingCol, opponentColor, boardState)
    },
    [findKing, isUnderDirectAttack],
  )

  // Calculate legal moves (considering check)
  const calculateLegalMoves = useCallback(
    (row: number, col: number): [number, number][] => {
      const piece = board[row]?.[col]
      if (!piece) return []

      const rawMoves = calculateRawMoves(row, col)
      const legalMoves: [number, number][] = []

      // Check each move to see if it would leave the king in check
      for (const [moveRow, moveCol] of rawMoves) {
        // Create a temporary board with the move applied
        const tempBoard = board.map((r) => [...r])
        tempBoard[moveRow][moveCol] = tempBoard[row][col]
        tempBoard[row][col] = null

        // Special case for castling
        if (piece.type === "king" && Math.abs(col - moveCol) === 2) {
          // Kingside castling
          if (moveCol === 6) {
            tempBoard[row][5] = tempBoard[row][7]
            tempBoard[row][7] = null
          }
          // Queenside castling
          else if (moveCol === 2) {
            tempBoard[row][3] = tempBoard[row][0]
            tempBoard[row][0] = null
          }
        }

        // Check if the king would be in check after the move
        if (!isInCheck(piece.color, tempBoard)) {
          legalMoves.push([moveRow, moveCol])
        }
      }

      return legalMoves
    },
    [board, calculateRawMoves, isInCheck],
  )

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    // If no cell is selected and the clicked cell has a piece of the current player's color
    if (!selectedCell && board[row][col] && board[row][col]?.color === currentPlayer) {
      setSelectedCell([row, col])
      const moves = calculateLegalMoves(row, col)
      setPossibleMoves(moves)
    }
    // If a cell is already selected
    else if (selectedCell) {
      const [selectedRow, selectedCol] = selectedCell

      // Check if the clicked cell is a valid move
      const isValidMove = possibleMoves.some(([r, c]) => r === row && c === col)

      if (isValidMove) {
        // Move the piece
        const newBoard = [...board.map((row) => [...row])]
        const piece = newBoard[selectedRow][selectedCol]
        const capturedPiece = newBoard[row][col]

        if (piece) {
          // Update hasMoved for pawns, kings, and rooks
          if (piece.type === "pawn" || piece.type === "king" || piece.type === "rook") {
            piece.hasMoved = true
          }

          // Handle castling
          if (piece.type === "king" && Math.abs(selectedCol - col) === 2) {
            // Kingside castling
            if (col === 6) {
              newBoard[row][5] = newBoard[row][7]
              newBoard[row][7] = null
            }
            // Queenside castling
            else if (col === 2) {
              newBoard[row][3] = newBoard[row][0]
              newBoard[row][0] = null
            }
          }

          // Handle pawn promotion
          if (piece.type === "pawn" && (row === 0 || row === 7)) {
            piece.type = "queen" // Auto-promote to queen for simplicity
          }

          // Update captured pieces
          if (capturedPiece) {
            const newCapturedPieces = { ...capturedPieces }
            if (capturedPiece.color === "white") {
              newCapturedPieces.white = [...newCapturedPieces.white, capturedPiece]
            } else {
              newCapturedPieces.black = [...newCapturedPieces.black, capturedPiece]
            }
            setCapturedPieces(newCapturedPieces)
          }

          // Move the piece
          newBoard[row][col] = piece
          newBoard[selectedRow][selectedCol] = null

          // Update the board
          setBoard(newBoard)

          // Switch players
          const nextPlayer = currentPlayer === "white" ? "black" : "white"
          setCurrentPlayer(nextPlayer)

          // Check game status
          const inCheck = isInCheck(nextPlayer, newBoard)

          // Check if the next player has any legal moves
          let hasLegalMoves = false
          outerLoop: for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const p = newBoard[r][c]
              if (p && p.color === nextPlayer) {
                // Create a temporary function to check moves without recursion
                const tempMoves = calculateRawMoves(r, c, newBoard)
                for (const [moveRow, moveCol] of tempMoves) {
                  const tempBoardCopy = newBoard.map((row) => [...row])
                  tempBoardCopy[moveRow][moveCol] = tempBoardCopy[r][c]
                  tempBoardCopy[r][c] = null

                  if (!isInCheck(nextPlayer, tempBoardCopy)) {
                    hasLegalMoves = true
                    break outerLoop
                  }
                }
              }
            }
          }

          if (inCheck && !hasLegalMoves) {
            setGameStatus("checkmate")
          } else if (!inCheck && !hasLegalMoves) {
            setGameStatus("stalemate")
          } else if (inCheck) {
            setGameStatus("check")
          } else {
            setGameStatus("playing")
          }
        }
      }

      // Reset selection
      setSelectedCell(null)
      setPossibleMoves([])
    }
  }

  // Render the chess board
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex justify-between w-full max-w-md">
        <div className="text-xl font-semibold">
          {gameStatus === "playing" && `${currentPlayer === "white" ? "White" : "Black"}'s turn`}
          {gameStatus === "check" && `${currentPlayer === "white" ? "Black" : "White"} is in check!`}
          {gameStatus === "checkmate" && `Checkmate! ${currentPlayer === "white" ? "Black" : "White"} wins!`}
          {gameStatus === "stalemate" && "Stalemate! The game is a draw."}
        </div>
        <button onClick={initializeBoard} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
          New Game
        </button>
      </div>

      <div className="flex">
        {/* Captured black pieces */}
        <div className="w-16 mr-2">
          <div className="flex flex-wrap justify-center">
            {capturedPieces.black.map((piece, index) => (
              <div key={index} className="w-6 h-6 flex items-center justify-center">
                {renderPiece(piece)}
              </div>
            ))}
          </div>
        </div>

        {/* Chess board */}
        <div className="grid grid-cols-8 border border-gray-800 shadow-lg">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex
              const isPossibleMove = possibleMoves.some(([r, c]) => r === rowIndex && c === colIndex)
              const isLightSquare = (rowIndex + colIndex) % 2 === 0

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-12 h-12 md:w-16 md:h-16 flex items-center justify-center relative
                    ${isLightSquare ? "bg-[#f0d9b5]" : "bg-[#b58863]"}
                    ${isSelected ? "ring-4 ring-blue-500 z-10" : ""}
                    cursor-pointer
                  `}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell && renderPiece(cell)}
                  {isPossibleMove && (
                    <div
                      className={`absolute ${cell ? "w-full h-full ring-4 ring-green-500 ring-opacity-50" : "w-3 h-3 rounded-full bg-green-500 opacity-70"}`}
                    ></div>
                  )}
                </div>
              )
            }),
          )}
        </div>

        {/* Captured white pieces */}
        <div className="w-16 ml-2">
          <div className="flex flex-wrap justify-center">
            {capturedPieces.white.map((piece, index) => (
              <div key={index} className="w-6 h-6 flex items-center justify-center">
                {renderPiece(piece)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game status */}
      {gameStatus !== "playing" && (
        <div className="mt-4 text-xl font-bold">
          {gameStatus === "check" && `${currentPlayer === "white" ? "Black" : "White"} is in check!`}
          {gameStatus === "checkmate" && `Checkmate! ${currentPlayer === "white" ? "Black" : "White"} wins!`}
          {gameStatus === "stalemate" && "Stalemate! The game is a draw."}
        </div>
      )}
    </div>
  )

  // Render a chess piece
  function renderPiece(piece: Piece) {
    const pieceSymbols: Record<PieceType, string> = {
      pawn: piece.color === "white" ? "♙" : "♟",
      rook: piece.color === "white" ? "♖" : "♜",
      knight: piece.color === "white" ? "♘" : "♞",
      bishop: piece.color === "white" ? "♗" : "♝",
      queen: piece.color === "white" ? "♕" : "♛",
      king: piece.color === "white" ? "♔" : "♚",
    }

    return (
      <div className={`text-4xl ${piece.color === "white" ? "text-white" : "text-black"}`}>
        {pieceSymbols[piece.type]}
      </div>
    )
  }
}

