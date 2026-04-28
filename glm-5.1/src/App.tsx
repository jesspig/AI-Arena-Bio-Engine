import { P5Canvas } from '@p5-wrapper/react'
import sketch from './sketch'

export default function App() {
  return <P5Canvas sketch={sketch} />
}
