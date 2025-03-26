"use client"

import { useState, useEffect, useRef } from "react"

interface GameObject {
  x: number
  y: number
  width: number
  height: number
  speed?: number
}

interface Cactus extends GameObject {
  type: number
}

interface Cloud extends GameObject {
  speed: number
}

export default function DinosaurGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  // Game state refs (to avoid dependency issues in useEffect)
  const dinoRef = useRef<GameObject>({
    x: 50,
    y: 0,
    width: 44,
    height: 47,
  })

  const cactusesRef = useRef<Cactus[]>([])
  const cloudsRef = useRef<Cloud[]>([])
  const groundYRef = useRef(0)
  const jumpingRef = useRef(false)
  const jumpVelocityRef = useRef(0)
  const gameSpeedRef = useRef(5)
  const scoreRef = useRef(0)
  const animationFrameRef = useRef<number>(0)
  const dinoFrameRef = useRef(0)
  const frameCountRef = useRef(0)

  // Initialize the game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 800
    canvas.height = 300

    // Set ground Y position
    groundYRef.current = canvas.height - 20

    // Set initial dino Y position
    dinoRef.current.y = groundYRef.current - dinoRef.current.height

    // Draw initial state
    drawGame()

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.code === "ArrowUp") && !jumpingRef.current && !gameOver) {
        if (!gameStarted) {
          setGameStarted(true)
          startGameLoop()
        } else {
          jump()
        }
      }

      if (e.code === "Space" && gameOver) {
        restartGame()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [gameOver])

  const startGameLoop = () => {
    // Reset game state
    cactusesRef.current = []
    cloudsRef.current = []
    scoreRef.current = 0
    setScore(0)
    gameSpeedRef.current = 5

    // Start the game loop
    const gameLoop = () => {
      updateGame()
      drawGame()

      if (!gameOver) {
        animationFrameRef.current = requestAnimationFrame(gameLoop)
      }
    }

    gameLoop()
  }

  const updateGame = () => {
    const dino = dinoRef.current
    const cactusList = cactusesRef.current
    const cloudsList = cloudsRef.current

    // Update frame count for animation
    frameCountRef.current++
    if (frameCountRef.current % 10 === 0) {
      dinoFrameRef.current = (dinoFrameRef.current + 1) % 2
    }

    // Update dino position if jumping
    if (jumpingRef.current) {
      dino.y += jumpVelocityRef.current
      jumpVelocityRef.current += 0.5 // Gravity

      // Check if landed
      if (dino.y >= groundYRef.current - dino.height) {
        dino.y = groundYRef.current - dino.height
        jumpingRef.current = false
      }
    }

    // Generate cloud randomly
    if (Math.random() < 0.01 && cloudsList.length < 5) {
      cloudsList.push({
        x: canvasRef.current?.width || 800,
        y: Math.random() * 100 + 20,
        width: 70,
        height: 30,
        speed: 1 + Math.random() * 0.5,
      })
    }

    // Generate cactus randomly
    if (Math.random() < 0.02 && cactusList.length < 3) {
      const cactusType = Math.floor(Math.random() * 3) // 0, 1, or 2
      const cactusWidth = cactusType === 0 ? 20 : cactusType === 1 ? 30 : 40
      const cactusHeight = cactusType === 0 ? 40 : cactusType === 1 ? 50 : 60

      cactusList.push({
        x: canvasRef.current?.width || 800,
        y: groundYRef.current - cactusHeight,
        width: cactusWidth,
        height: cactusHeight,
        type: cactusType,
        speed: gameSpeedRef.current,
      })
    }

    // Update cloud positions
    for (let i = 0; i < cloudsList.length; i++) {
      const cloud = cloudsList[i]
      cloud.x -= cloud.speed

      // Remove cloud if off screen
      if (cloud.x + cloud.width < 0) {
        cloudsList.splice(i, 1)
        i--
      }
    }

    // Update cactus positions
    for (let i = 0; i < cactusList.length; i++) {
      const cactus = cactusList[i]
      cactus.x -= cactus.speed || gameSpeedRef.current

      // Remove cactus if off screen
      if (cactus.x + cactus.width < 0) {
        cactusList.splice(i, 1)
        i--
      }

      // Check collision
      if (
        dino.x < cactus.x + cactus.width - 10 &&
        dino.x + dino.width - 10 > cactus.x &&
        dino.y < cactus.y + cactus.height - 10 &&
        dino.y + dino.height - 10 > cactus.y
      ) {
        setGameOver(true)
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current)
        }
        cancelAnimationFrame(animationFrameRef.current)
      }
    }

    // Update score
    scoreRef.current += 0.1
    setScore(Math.floor(scoreRef.current))

    // Increase game speed gradually
    if (scoreRef.current % 100 === 0 && scoreRef.current > 0) {
      gameSpeedRef.current += 0.5
    }
  }

  const drawGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw clouds
    ctx.fillStyle = "#FFFFFF"
    for (const cloud of cloudsRef.current) {
      ctx.beginPath()
      ctx.arc(cloud.x, cloud.y, 15, 0, Math.PI * 2)
      ctx.arc(cloud.x + 15, cloud.y - 10, 15, 0, Math.PI * 2)
      ctx.arc(cloud.x + 30, cloud.y, 15, 0, Math.PI * 2)
      ctx.arc(cloud.x + 45, cloud.y - 5, 15, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw ground
    ctx.beginPath()
    ctx.moveTo(0, groundYRef.current)
    ctx.lineTo(canvas.width, groundYRef.current)
    ctx.stroke()

    // Draw dino
    const dino = dinoRef.current
    ctx.fillStyle = "#333"

    // Draw dino body
    ctx.fillRect(dino.x, dino.y, dino.width - 15, dino.height - 20)

    // Draw dino head
    ctx.fillRect(dino.x + 15, dino.y - 15, dino.width - 25, dino.height - 30)

    // Draw dino eye
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.arc(dino.x + 30, dino.y - 5, 3, 0, Math.PI * 2)
    ctx.fill()

    // Draw dino legs (animated)
    if (!jumpingRef.current) {
      if (dinoFrameRef.current === 0) {
        ctx.fillStyle = "#333"
        ctx.fillRect(dino.x + 5, dino.y + dino.height - 20, 10, 20)
        ctx.fillRect(dino.x + 25, dino.y + dino.height - 20, 10, 15)
      } else {
        ctx.fillStyle = "#333"
        ctx.fillRect(dino.x + 5, dino.y + dino.height - 20, 10, 15)
        ctx.fillRect(dino.x + 25, dino.y + dino.height - 20, 10, 20)
      }
    } else {
      // Both legs together when jumping
      ctx.fillStyle = "#333"
      ctx.fillRect(dino.x + 5, dino.y + dino.height - 20, 10, 15)
      ctx.fillRect(dino.x + 25, dino.y + dino.height - 20, 10, 15)
    }

    // Draw cacti
    ctx.fillStyle = "#2E8B57"
    for (const cactus of cactusesRef.current) {
      // Main cactus body
      ctx.fillRect(cactus.x, cactus.y, cactus.width, cactus.height)

      // Cactus arms
      if (cactus.type === 1 || cactus.type === 2) {
        ctx.fillRect(cactus.x - 10, cactus.y + 15, 10, 8)
        ctx.fillRect(cactus.x + cactus.width, cactus.y + 25, 10, 8)
      }

      if (cactus.type === 2) {
        ctx.fillRect(cactus.x - 8, cactus.y + 30, 8, 6)
        ctx.fillRect(cactus.x + cactus.width, cactus.y + 10, 8, 6)
      }
    }

    // Draw score
    ctx.fillStyle = "black"
    ctx.font = "20px monospace"
    ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, canvas.width - 150, 30)

    // Draw high score
    ctx.fillText(`HI: ${highScore}`, canvas.width - 150, 60)

    // Draw game over message
    if (gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "white"
      ctx.font = "30px monospace"
      ctx.fillText("G A M E  O V E R", canvas.width / 2 - 120, canvas.height / 2 - 20)
      ctx.font = "20px monospace"
      ctx.fillText("Press Space to Restart", canvas.width / 2 - 120, canvas.height / 2 + 20)
    }

    // Draw start message
    if (!gameStarted && !gameOver) {
      ctx.fillStyle = "black"
      ctx.font = "20px monospace"
      ctx.fillText("Press Space to Start", canvas.width / 2 - 120, canvas.height / 2)
    }
  }

  const jump = () => {
    if (!jumpingRef.current) {
      jumpingRef.current = true
      jumpVelocityRef.current = -12
    }
  }

  const restartGame = () => {
    setGameOver(false)
    setGameStarted(true)
    dinoRef.current.y = groundYRef.current - dinoRef.current.height
    startGameLoop()
  }

  const handleCanvasClick = () => {
    if (!gameStarted) {
      setGameStarted(true)
      startGameLoop()
    } else if (!gameOver) {
      jump()
    } else {
      restartGame()
    }
  }

  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-lg">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2">Dinosaur T-Rex Game</h2>
        <p className="text-sm text-gray-600 mb-4">
          Press space bar to start the game. Use the up arrow or space to jump over obstacles.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        className="border border-gray-300 bg-white cursor-pointer"
        onClick={handleCanvasClick}
        width={800}
        height={300}
      />

      <div className="mt-4 flex space-x-4">
        <div className="text-lg">
          <span className="font-bold">Controls:</span> Press Space or Up Arrow to jump
        </div>

        <button
          onClick={restartGame}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
          disabled={!gameOver}
        >
          Restart Game
        </button>
      </div>
    </div>
  )
}

