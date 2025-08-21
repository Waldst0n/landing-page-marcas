import { useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useMarcas } from "../contexts/MarcasContext";

export default function Home() {
  const { data: lojas, loading, error, reload, setEmpresaId } = useMarcas();

  // Carrega as marcas apenas se ainda não estiverem carregadas
  useEffect(() => {
    if (!lojas.length) reload();
  }, [lojas.length, reload]);

  console.table(lojas);

  const handleSelectLoja = useCallback(
    (empresaId: number) => {
      setEmpresaId(empresaId);
      localStorage.setItem("empresa_id", String(empresaId));
    },
    [setEmpresaId]
  );

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-2xl font-bold">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-red-600 font-semibold">Erro ao carregar lojas.</p>
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 mt-6 ">
      <h2 className="text-center text-lg sm:text-xl text-gray-700">
        Em qual <span className="font-bold">LOJA</span> você deseja ser
        atendido?
      </h2>

      <div className="mt-6 mb-6 space-y-4  flex flex-col items-center">
        {lojas.map((loja) => (
          <Link
            key={loja.empresa_id}
            to={`/loja/${loja.empresa_id}`}
            state={{ loja }}
            onClick={() => handleSelectLoja(loja.empresa_id)}
            className="w-full max-w-3xl bg-gray-600 text-white font-semibold py-4 rounded-full shadow-sm hover:bg-gray-700 transition px-6 text-center"
          >
            {loja.nome_empresa}
          </Link>
        ))}
      </div>
    </section>
  );
}
