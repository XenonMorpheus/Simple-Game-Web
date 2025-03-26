"use client"

import type React from "react"

import { useState } from "react"

interface Game {
  id: string
  name: string
  component: React.ReactNode
}

interface GameSelectorProps {
  games: Game[]
  onSelectGame: (gameId: string) => void
}

export function GameSelector({ games, onSelectGame }: GameSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto p-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} onSelect={onSelectGame} />
      ))}
    </div>
  )
}

interface GameCardProps {
  game: Game
  onSelect: (gameId: string) => void
}

function GameCard({ game, onSelect }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const backgrounds: Record<string, string> = {
    chess: "bg-gradient-to-br from-green-700 to-green-900",
    minesweeper: "bg-gradient-to-br from-lime-600 to-lime-800",
    sudoku: "bg-gradient-to-br from-blue-500 to-blue-700",
    dinosaur: "bg-gradient-to-br from-gray-700 to-gray-900",
  }

  const icons: Record<string, string> = {
    chess: "♟️",
    minesweeper: "💣",
    sudoku: "🔢",
    dinosaur: "🦖",
  }

  return (
    <div
      className={`${backgrounds[game.id]} rounded-xl overflow-hidden shadow-lg transition-all duration-300 transform ${isHovered ? "scale-105" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6 text-white">
        <div className="flex items-center mb-4">
          <span className="text-4xl mr-3">{icons[game.id]}</span>
          <h3 className="text-2xl font-bold">{game.name}</h3>
        </div>
        <p className="mb-6 opacity-80">
          {game.id === "chess" && "Play the classic game of strategy"}
          {game.id === "minesweeper" && "Clear the minefield without exploding"}
          {game.id === "sudoku" && "Fill the grid with numbers from 1-9"}
          {game.id === "dinosaur" && "Jump over obstacles and set high scores"}
        </p>
        <button
          onClick={() => onSelect(game.id)}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-md transition-all duration-300 backdrop-blur-sm hover:scale-105 w-full"
        >
          Play Now
        </button>
      </div>
    </div>
  )
}

