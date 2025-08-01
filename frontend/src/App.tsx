import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './modulos/auth/Dashboard/Dashboard';
import routes from './modulos/auth/menuRoutes';
import LoginForm from './modulos/LoginForm';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirige raíz a login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Login público */}
        <Route path="/login" element={<LoginForm />} />

        {/* Dashboard y rutas anidadas */}
        <Route path="/dashboard" element={<Dashboard />}>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path} // sin "/"
              element={route.element}
            />
          ))}
        </Route>

        {/* Ruta no encontrada */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}



export default App;