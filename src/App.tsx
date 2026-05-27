import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  function clicked() {
    setCount(count+1);
    console.log("クリックされたよ");
  }
  return (
    <>
      <h1>Test Vercel</h1>
      <div>{count}</div>
      <button onClick={clicked}>increment</button>
      <div>{}</div>
    </>
  )
}

export default App
