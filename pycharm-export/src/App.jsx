import { useState } from 'react'
import Frame1 from './pages/Frame1'
import Frame2 from './pages/Frame2'
import Frame3 from './pages/Frame3'
import Frame4 from './pages/Frame4'
import './App.css'

function App() {
  const [currentFrame, setCurrentFrame] = useState(1)

  const renderFrame = () => {
    switch(currentFrame) {
      case 1: return <Frame1 />
      case 2: return <Frame2 />
      case 3: return <Frame3 />
      case 4: return <Frame4 />
      default: return <Frame1 />
    }
  }

  return (
    <div className="app">
      {/* Frame Navigation */}
      <nav className="frame-nav">
        <div className="frame-nav__container">
          <h1 className="frame-nav__title">Figma Mobile Frames</h1>
          <div className="frame-nav__buttons">
            {[1, 2, 3, 4].map(frameNum => (
              <button
                key={frameNum}
                className={`frame-nav__btn ${currentFrame === frameNum ? 'active' : ''}`}
                onClick={() => setCurrentFrame(frameNum)}
              >
                Frame {frameNum}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Current Frame Display */}
      <main className="frame-display">
        {renderFrame()}
      </main>
    </div>
  )
}

export default App
