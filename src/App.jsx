import { Routes, Route, Navigate } from 'react-router'

import './App.css'

import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';

import { Header } from './layout/header/Header'
import { Footer } from './layout/footer/Footer'
import { Home } from './components/pages/home/Home'
import { Login } from './components/pages/login/Login'
import { Forums } from './components/pages/forums/Forums';
import { Category } from './components/pages/forums/Category';
import { Thread } from './components/pages/forums/Thread';
import { Register } from './components/pages/register/Register'
import { Profile } from './components/pages/profile/Profile';
import { Settings } from './components/pages/settings/Settings';
import { NotFound } from './components/pages/notFound/NotFound';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <Header />
        <main id="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/forums" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forums" element={<Forums />} />
            <Route path="/categories/:categoryId" element={<Category />} />
            <Route path="/thread/:threadId" element={<Thread />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </UserProvider>
    </AuthProvider>
  )
}

export default App
