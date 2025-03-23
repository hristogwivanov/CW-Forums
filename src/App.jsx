import { Routes, Route } from 'react-router'

import './App.css'

import { Header } from './layout/header/Header'
import { Footer } from './layout/footer/Footer'
import { Home } from './components/pages/home/Home'
import { Login } from './components/pages/login/Login'
import { Register } from './components/pages/register/Register'

function App() {
  return (
    <>
    <Header />
    <main id="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </main>
    <Footer />
    </>
  )
}

export default App
