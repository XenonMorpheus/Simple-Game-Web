"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface Game {
  id: string
  name: string
  component: React.ReactNode
}

interface GameMenuProps {
  games: Game[]
  onSelectGame: (gameId: string) => void
  activeGame: string | null
}

export default function GameMenu({ games, onSelectGame, activeGame }: GameMenuProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-lg"
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="text-white font-bold text-xl">Game Paradise</div>

          <div className="flex space-x-4">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => onSelectGame(game.id)}
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  activeGame === game.id
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/70"
                }`}
              >
                {game.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

