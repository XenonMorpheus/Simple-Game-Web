"use client"

import { useState, useEffect, useRef } from "react"
import ParallaxBackground from "@/components/parallax-background"
import ChessGame from "@/components/games/chess-game"
import MinesweeperGame from "@/components/games/minesweeper-game"
import SudokuGame from "@/components/games/sudoku-game"
import DinosaurGame from "@/components/games/dinosaur-game"
import { GameSelector } from "@/components/game-selector"

export default function Home() {
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [showGames, setShowGames] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxScroll, setMaxScroll] = useState(0)

  // Update the useEffect to ensure maxScroll is always a positive number
  useEffect(() => {
    // Calculate the maximum scroll height
    const updateMaxScroll = () => {
      if (containerRef.current) {
        const newMaxScroll = Math.max(1, containerRef.current.scrollHeight - window.innerHeight)
        setMaxScroll(newMaxScroll)
      }
    }

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    // Initial calculation
    updateMaxScroll()

    const handleResize = () => {
      updateMaxScroll()
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const games = [
    { id: "chess", name: "Chess", component: <ChessGame /> },
    { id: "minesweeper", name: "Minesweeper", component: <MinesweeperGame /> },
    { id: "sudoku", name: "Sudoku", component: <SudokuGame /> },
    { id: "dinosaur", name: "T-Rex Runner", component: <DinosaurGame /> },
  ]

  return (
    <div ref={containerRef} className="relative">
      {/* Parallax Background */}
      <ParallaxBackground scrollY={scrollY} maxScroll={maxScroll} />

      {/* Content */}
      <main className="relative z-10 min-h-screen">
        {/* Welcome Section - Minimized transparent box */}
        <section className="h-screen flex items-center justify-center">
          <div className="text-center p-4 bg-black/10 backdrop-blur-sm rounded-lg shadow-xl inline-block mx-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
              A game website project by XenonMorpheus(Van)
            </h1>
            <button
              onClick={() => setShowGames(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-md transition-all duration-300 backdrop-blur-sm hover:scale-105 text-sm"
            >
              Show Games
            </button>
          </div>
        </section>

        {/* Spacer sections for scrolling through scenes */}
        <section className="h-screen"></section>
        <section className="h-screen"></section>

        {/* Final section with game menu */}
        <section className="h-screen flex items-center justify-center">
          <GameSelector games={games} onSelectGame={setActiveGame} />
        </section>
      </main>

      {/* Game Modal */}
      {activeGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{games.find((game) => game.id === activeGame)?.name}</h2>
              <button
                onClick={() => setActiveGame(null)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                Close Game
              </button>
            </div>
            <div className="game-container">{games.find((game) => game.id === activeGame)?.component}</div>
          </div>
        </div>
      )}

      {/* Games Sidebar */}
      {showGames && (
        <div className="fixed inset-y-0 right-0 z-40 w-64 bg-black/50 backdrop-blur-md p-4 transform transition-transform duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Games</h3>
            <button onClick={() => setShowGames(false)} className="text-white hover:text-gray-300">
              ✕
            </button>
          </div>
          <div className="flex flex-col space-y-2">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => {
                  setActiveGame(game.id)
                  setShowGames(false)
                }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-md transition-all"
              >
                {game.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating button to show games */}
      <button
        onClick={() => setShowGames(!showGames)}
        className="fixed bottom-6 right-6 z-30 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full shadow-lg backdrop-blur-md transition-all hover:scale-110"
      >
        {showGames ? "✕" : "🎮"}
      </button>
    </div>
  )
}

