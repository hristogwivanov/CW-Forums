import { Routes, Route } from 'react-router'

import './App.css'

import { AuthProvider } from './contexts/AuthContext';
import { Header } from './layout/header/Header'
import { Footer } from './layout/footer/Footer'
import { Home } from './components/pages/home/Home'
import { Login } from './components/pages/login/Login'
import { Forums } from './components/pages/forums/Forums';
import { Register } from './components/pages/register/Register'
import { Profile } from './components/pages/profile/Profile';
import { Settings } from './components/pages/settings/Settings';
import { NotFound } from './components/pages/notFound/NotFound';

function App() {
  return (
    <AuthProvider>
    <Header />
    <main id="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forums" element={<Forums />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} /> 
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
    </AuthProvider>
  )
}

export default App
