import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Home from './pages/Home';
import Explorer from './pages/Explorer';
import SkillDetail from './pages/SkillDetail';
import Compare from './pages/Compare';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import About from './pages/About';
import Methodology from './pages/Methodology';
import Contact from './pages/Contact';
import { isAuthenticated } from './utils/api';
function PrivateRoute({ children }) {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
}
export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {}
                <Route path="/" element={<Home />} />
                <Route path="/explorer" element={<Explorer />} />
                <Route path="/skill/:name" element={<SkillDetail />} />
                <Route path="/compare" element={<Compare />} />
                {}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {}
                <Route path="/about" element={<About />} />
                <Route path="/methodology" element={<Methodology />} />
                <Route path="/contact" element={<Contact />} />
                {}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    }
                />
                {}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
