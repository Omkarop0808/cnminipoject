import React, { useEffect, useState, useRef } from 'react'

export interface SplitTextProps {
  text: string
  className?: string
  delay?: number
  animationFrom?: { opacity: number; transform: string }
  animationTo?: { opacity: number; transform: string }
  threshold?: number
  rootMargin?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  onLetterAnimationComplete?: () => void
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 35,
  animationFrom = { opacity: 0, transform: 'translate3d(0, 20px, 0)' },
  animationTo = { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  textAlign = 'left',
  onLetterAnimationComplete
}) => {
  const words = text.split(' ')
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (ref.current) observer.unobserve(ref.current)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  let charCount = 0

  return (
    <p
      ref={ref}
      className={`inline-block overflow-hidden ${className}`}
      style={{ textAlign }}
      aria-label={text}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.25em]">
          {word.split('').map((char, charIndex) => {
            const currentDelay = charCount * delay
            charCount++

            return (
              <span
                key={charIndex}
                className="inline-block transition-all duration-500 ease-out"
                style={{
                  opacity: inView ? animationTo.opacity : animationFrom.opacity,
                  transform: inView ? animationTo.transform : animationFrom.transform,
                  transitionDelay: `${currentDelay}ms`
                }}
                onTransitionEnd={() => {
                  if (wordIndex === words.length - 1 && charIndex === word.length - 1) {
                    onLetterAnimationComplete?.()
                  }
                }}
              >
                {char}
              </span>
            )
          })}
        </span>
      ))}
    </p>
  )
}

export default SplitText
