import { Composition } from 'remotion'
import { WhyKabisHero } from './WhyKabisHero'
import { HeroQuizLoop } from './HeroQuizLoop'

export const CANVAS_WIDTH = 1200
export const CANVAS_HEIGHT = 1060
export const FPS = 30
export const DURATION_IN_FRAMES = 240

export const HERO_CANVAS_WIDTH = 1320
export const HERO_CANVAS_HEIGHT = 740

export function Root() {
  return (
    <>
      <Composition
        id="WhyKabisHero"
        component={WhyKabisHero}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
      <Composition
        id="HeroQuizLoop"
        component={HeroQuizLoop}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={HERO_CANVAS_WIDTH}
        height={HERO_CANVAS_HEIGHT}
      />
    </>
  )
}
