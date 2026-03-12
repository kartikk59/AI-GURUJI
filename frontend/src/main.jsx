import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { ReactLenis } from '@studio-freight/react-lenis'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ReactLenis root>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ReactLenis>
    </React.StrictMode>,
)
