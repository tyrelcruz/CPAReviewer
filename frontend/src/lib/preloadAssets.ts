function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

function loadVideo(src: string): Promise<void> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.oncanplaythrough = () => resolve()
    video.onerror = () => resolve()
    video.src = src
  })
}

interface PreloadSources {
  images?: string[]
  videos?: string[]
}

// Resolves once every asset has either loaded or failed — a broken/slow
// asset must never hang the loading screen forever.
export function preloadAssets({ images = [], videos = [] }: PreloadSources): Promise<void> {
  return Promise.all([...images.map(loadImage), ...videos.map(loadVideo)]).then(() => undefined)
}
