import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Loja from "./pages/Produtos";
import Produtos from "./pages/Produtos";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/loja/:id" element={<Produtos />} />

        {/* 404 simples (opcional) */}
        <Route
          path="*"
          element={<div className="p-6">Página não encontrada</div>}
        />
      </Routes>
    </div>
  );
}
