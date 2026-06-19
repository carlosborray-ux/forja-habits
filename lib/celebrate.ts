'use client'

import confetti from 'canvas-confetti'

export function celebrate(type: 'habit' | 'task' | 'weight' = 'task') {
  if (typeof window === 'undefined') return

  if (type === 'weight') {
    // Fuegos artificiales desde los lados para peso
    const left = () => confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#00E5B8', '#7C6FFF', '#FFD93D', '#FF4FA3'],
    })
    const right = () => confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#00E5B8', '#7C6FFF', '#FFD93D', '#FF4FA3'],
    })
    left(); right()
    setTimeout(() => { left(); right() }, 300)
    setTimeout(() => { left(); right() }, 600)
    return
  }

  if (type === 'habit') {
    // Ráfaga rápida y pequeña para hábitos (se repiten mucho)
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#7C6FFF', '#00E5B8', '#FFD93D'],
      scalar: 0.9,
      ticks: 120,
    })
    return
  }

  // task: confeti estándar más festivo
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.65 },
    colors: ['#7C6FFF', '#00E5B8', '#FF6B6B', '#FFD93D', '#FF4FA3'],
  })
  setTimeout(() => confetti({
    particleCount: 40,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#7C6FFF', '#00E5B8', '#FFD93D'],
    scalar: 0.75,
    ticks: 150,
  }), 200)
}
