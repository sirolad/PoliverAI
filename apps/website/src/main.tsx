import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import Landing from './Landing'
import './index.css'
import Splash from './components/Splash'

function App() {
	const [showSplash, setShowSplash] = useState(true)

	return showSplash ? <Splash onComplete={() => setShowSplash(false)} /> : <Landing />
}

const container = document.getElementById('root')
if (container) {
	createRoot(container).render(<App />)
} else {
	// If root element is missing, log a helpful message for debugging
	console.error('Root element with id "root" not found')
}
