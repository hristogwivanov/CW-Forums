import { useState } from 'react'
import { Routes, Route } from 'react-router'
import './App.css'

function App() {
  return (
    <>
    <Header />
    <main id="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </main>
    <Footer />
    </>
  )
}

export default App
