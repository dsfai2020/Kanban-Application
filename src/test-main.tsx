// import React from 'react'
import ReactDOM from 'react-dom/client'

function SimpleTest() {
  return (
    <div>
      <h1>Firefox React Test</h1>
      <p>If you can see this, React is working in Firefox!</p>
      <button onClick={() => alert('Button clicked!')}>
        Test Click
      </button>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<SimpleTest />)