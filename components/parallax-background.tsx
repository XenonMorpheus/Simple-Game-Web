"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

interface ParallaxBackgroundProps {
  scrollY: number
  maxScroll: number
}

export default function ParallaxBackground({ scrollY, maxScroll }: ParallaxBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentScene, setCurrentScene] = useState(1)

  // Calculate which scene to show based on scroll position
  useEffect(() => {
    const scrollPercentage = maxScroll <= 0 ? 0 : Math.min(scrollY / maxScroll, 1)

    if (scrollPercentage < 0.33) {
      setCurrentScene(1)
    } else if (scrollPercentage < 0.66) {
      setCurrentScene(2)
    } else {
      setCurrentScene(3)
    }
  }, [scrollY, maxScroll])

  // Calculate opacity for each scene based on scroll position
  const getSceneOpacity = (sceneNumber: number): number => {
    // Prevent division by zero if maxScroll is 0
    const scrollPercentage = maxScroll <= 0 ? 0 : Math.min(scrollY / maxScroll, 1)

    if (sceneNumber === 1) {
      return scrollPercentage < 0.33 ? 1 : Math.max(0, 1 - (scrollPercentage - 0.33) * 3)
    } else if (sceneNumber === 2) {
      if (scrollPercentage < 0.33) {
        return Math.min(1, scrollPercentage * 3)
      } else if (scrollPercentage > 0.66) {
        return Math.max(0, 1 - (scrollPercentage - 0.66) * 3)
      } else {
        return 1
      }
    } else {
      return scrollPercentage > 0.66 ? Math.min(1, (scrollPercentage - 0.66) * 3) : 0
    }
  }

  // Calculate parallax offsets for each layer with enhanced animation
  const getParallaxOffset = (layer: number, scene: number, element: "sky" | "mountains" | "trees"): string => {
    if (isNaN(scrollY)) return "translateY(0px) translateX(0px)"

    const scrollPercentage = maxScroll <= 0 ? 0 : Math.min(scrollY / maxScroll, 1)
    const baseSpeed = 0.1 * layer

    // Enhanced animation factors based on element type
    let speedMultiplier = 1
    let directionFactor = 1

    // Adjust animation based on element type
    if (element === "sky") {
      speedMultiplier = 0.5
      directionFactor = scene === 3 ? -1 : 1 // Sky moves differently in night scene
    } else if (element === "mountains") {
      speedMultiplier = 1.2
    } else if (element === "trees") {
      speedMultiplier = 1.5
      // Trees move faster in scene transitions
      if (
        (scrollPercentage > 0.28 && scrollPercentage < 0.38) ||
        (scrollPercentage > 0.61 && scrollPercentage < 0.71)
      ) {
        speedMultiplier = 2
      }
    }

    // Add horizontal movement for some elements during transitions
    let horizontalOffset = 0
    if (
      element === "trees" &&
      ((scrollPercentage > 0.28 && scrollPercentage < 0.38) || (scrollPercentage > 0.61 && scrollPercentage < 0.71))
    ) {
      const transitionProgress =
        scrollPercentage > 0.5 ? (scrollPercentage - 0.61) / 0.1 : (scrollPercentage - 0.28) / 0.1
      horizontalOffset = Math.sin(transitionProgress * Math.PI) * 10
    }

    // Calculate vertical offset with enhanced animation
    const verticalOffset = scrollY * baseSpeed * speedMultiplier * directionFactor

    // Return transform string with both vertical and horizontal movement
    return `translateY(${verticalOffset}px) translateX(${horizontalOffset}px)`
  }

  // Calculate scale for elements during transitions
  const getElementScale = (scene: number, element: "sky" | "mountains" | "trees"): number => {
    const scrollPercentage = maxScroll <= 0 ? 0 : Math.min(scrollY / maxScroll, 1)

    // Default scale is 1 (no scaling)
    let scale = 1

    // Apply scaling during transitions
    if ((scrollPercentage > 0.28 && scrollPercentage < 0.38) || (scrollPercentage > 0.61 && scrollPercentage < 0.71)) {
      // Calculate how far into the transition we are (0 to 1)
      const transitionProgress =
        scrollPercentage > 0.5 ? (scrollPercentage - 0.61) / 0.1 : (scrollPercentage - 0.28) / 0.1

      // Different elements scale differently
      if (element === "mountains") {
        // Mountains grow slightly during transition
        scale = 1 + Math.sin(transitionProgress * Math.PI) * 0.05
      } else if (element === "trees") {
        // Trees shrink slightly during first half of transition, then grow
        if (transitionProgress < 0.5) {
          scale = 1 - transitionProgress * 0.1
        } else {
          scale = 0.95 + (transitionProgress - 0.5) * 0.1
        }
      }
    }

    return scale
  }

  return (
    <div ref={containerRef} className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
      {/* Scene 1 - Sunset/Sunrise with Orange Mountains */}
      <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: getSceneOpacity(1) }}>
        {/* Sky */}
        <div
          className="absolute inset-0 bg-[#FFDDBB] transition-all duration-700"
          style={{ transform: getParallaxOffset(0.5, 1, "sky") }}
        ></div>

        {/* Far Mountains */}
        <div
          className="absolute w-full h-[60%] bottom-[40%] transition-all duration-700"
          style={{
            transform: getParallaxOffset(1, 1, "mountains"),
            scale: getElementScale(1, "mountains"),
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/scene1.png"
              alt="Mountains at sunset"
              fill
              style={{ objectFit: "cover", objectPosition: "center 30%" }}
              priority
              quality={100}
            />
          </div>
        </div>

        {/* Forest Silhouette */}
        <div
          className="absolute w-full h-[40%] bottom-0 transition-all duration-700"
          style={{
            transform: getParallaxOffset(2, 1, "trees"),
            scale: getElementScale(1, "trees"),
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/scene1.png"
              alt="Forest silhouette"
              fill
              style={{ objectFit: "cover", objectPosition: "center bottom" }}
              priority
              quality={100}
            />
          </div>
        </div>
      </div>

      {/* Scene 2 - Green Forest Landscape */}
      <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: getSceneOpacity(2) }}>
        {/* Sky */}
        <div
          className="absolute inset-0 bg-[#C5E8A5] transition-all duration-700"
          style={{ transform: getParallaxOffset(0.5, 2, "sky") }}
        ></div>

        {/* Far Mountains */}
        <div
          className="absolute w-full h-[70%] bottom-[30%] transition-all duration-700"
          style={{
            transform: getParallaxOffset(1, 2, "mountains"),
            scale: getElementScale(2, "mountains"),
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/scene2.png"
              alt="Green mountains"
              fill
              style={{ objectFit: "cover", objectPosition: "center 20%" }}
              priority
              quality={100}
            />
          </div>
        </div>

        {/* Mid Forest */}
        <div
          className="absolute w-full h-[50%] bottom-[10%] transition-all duration-700"
          style={{
            transform: getParallaxOffset(1.5, 2, "trees"),
            scale: getElementScale(2, "trees"),
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/scene2.png"
              alt="Mid forest"
              fill
              style={{ objectFit: "cover", objectPosition: "center 60%" }}
              priority
              quality={100}
            />
          </div>
        </div>

        {/* Near Forest */}
        <div
          className="absolute w-full h-[30%] bottom-0 transition-all duration-700"
          style={{
            transform: getParallaxOffset(2, 2, "trees"),
            scale: getElementScale(2, "trees"),
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/scene2.png"
              alt="Near forest"
              fill
              style={{ objectFit: "cover", objectPosition: "center bottom" }}
              priority
              quality={100}
            />
          </div>
        </div>
      </div>

      {/* Scene 3 - Night Scene with Moon */}
      <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: getSceneOpacity(3) }}>
        {/* Sky */}
        <div
          className="absolute inset-0 bg-[#0A2C3E] transition-all duration-700"
          style={{ transform: getParallaxOffset(0.5, 3, "sky") }}
        ></div>

        {/* Moon and Clouds */}
        <div
          className="absolute w-full h-[60%] bottom-[40%] transition-all duration-700"
          style={{
            transform: getParallaxOffset(1, 3, "sky"),
            scale: getElementScale(3, "sky"),
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/scene3.png"
              alt="Moon and clouds"
              fill
              style={{ objectFit: "cover", objectPosition: "center 30%" }}
              priority
              quality={100}
            />
          </div>
        </div>

        {/* Mountains */}
        <div
          className="absolute w-full h-[50%] bottom-[20%] transition-all duration-700"
          style={{
            transform: getParallaxOffset(1.5, 3, "mountains"),
            scale: getElementScale(3, "mountains"),
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/scene3.png"
              alt="Night mountains"
              fill
              style={{ objectFit: "cover", objectPosition: "center 60%" }}
              priority
              quality={100}
            />
          </div>
        </div>

        {/* Forest and River */}
        <div
          className="absolute w-full h-[40%] bottom-0 transition-all duration-700"
          style={{
            transform: getParallaxOffset(2, 3, "trees"),
            scale: getElementScale(3, "trees"),
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/scene3.png"
              alt="Forest and river"
              fill
              style={{ objectFit: "cover", objectPosition: "center bottom" }}
              priority
              quality={100}
            />
          </div>
        </div>
      </div>

      {/* Scene Indicator */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-50">
        {[1, 2, 3].map((scene) => (
          <div
            key={scene}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentScene === scene ? "bg-white scale-125" : "bg-white/50 hover:bg-white/70"
            }`}
          ></div>
        ))}
      </div>
    </div>
  )
}

