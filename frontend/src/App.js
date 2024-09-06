import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useEffect } from 'react';
import "./App.css";
import Home from './Pages/Home/Home';
import Login from './Pages/Login/Login';
import Register from './Pages/Register/Register';
import { useTheme } from '@mui/material/styles';
import './index.css';
import { Authenticator } from './Authenticator';
import ProtectedRoute from './ProtectedRoute';
import AppBarComponent from './Components/NavBarComponent/NavBarComponent';
import { SubscriptionProvider } from './Context/SubscriptionContext';

function App() {
  const theme = useTheme();

  useEffect(() => {
    if (theme.palette.mode === 'dark') {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [theme.palette.mode]);

  return (
    <SubscriptionProvider>
      <Authenticator>
        <Router>
          <>
            <AppBarComponent />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Login />} />
              <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </>
        </Router>
      </Authenticator>
    </SubscriptionProvider>
  );
}

export default App;
