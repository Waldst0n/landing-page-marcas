import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useMarcas } from "../contexts/MarcasContext";

const CDN_BASE = "https://playnee.s3.us-east-005.backblazeb2.com/prod/";

export default function Header() {
  const params = useParams<Record<string, string>>();
  const { data, empresaId, setEmpresaId } = useMarcas();

  useEffect(() => {
    const routeIdStr =
      params.empresa_id ?? params.empresaId ?? params.id ?? null;
    const fromRoute = routeIdStr ? parseInt(routeIdStr, 10) : null;
    const fromStorage = Number(localStorage.getItem("empresa_id")) || null;
    const candidate = fromRoute ?? fromStorage;

    if (candidate && candidate !== empresaId) {
      setEmpresaId(candidate);
      localStorage.setItem("empresa_id", String(candidate));
    }
  }, [params, empresaId, setEmpresaId]);

  const selected = useMemo(
    () =>
      empresaId ? data.find((d) => d.empresa_id === empresaId) : undefined,
    [empresaId, data]
  );

  const nomeMarca = selected?.nome_marca ?? "";
  const logoMarca = `${CDN_BASE}${selected?.logo_marca}`;

  if (!selected) {
    return (
      <header className="w-full bg-white pt-6 pb-4">
        <div className="mx-4 sm:mx-8 h-16 sm:h-20 bg-[#e71837] rounded-2xl" />
        <div className="-mt-10 sm:-mt-12 flex justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
            <img
              src="/placeholder-logo.svg"
              alt="Carregando..."
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white pt-6 pb-4">
      <div className="mx-4 sm:mx-8 h-16 sm:h-20 bg-[#e71837] rounded-2xl" />

      <div className="-mt-10 sm:-mt-12 flex justify-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
          <img
            src={logoMarca}
            alt={nomeMarca || "Marca"}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </div>

      {nomeMarca && (
        <div className="flex justify-center mt-3">
          <span className="text-slate-800 font-semibold">{nomeMarca}</span>
        </div>
      )}

      <div className="flex justify-center mt-3">
        <div className="w-48 sm:w-64 h-1.5 bg-[#e71837] rounded-full" />
      </div>
    </header>
  );
}
