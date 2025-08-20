export function getUrlParam(param: string) {
  return new URLSearchParams(window.location.search).get(param);
}

export function formatarTelefoneParaEnvio(telFull: string) {
  telFull = telFull.replace(/[^0-9]/g, "");

  if (!telFull || telFull.length < 8 || telFull.length > 13)
    throw "Telefone em formato invÃ¡lido";

  const ddd = telFull.substring(0, 2);
  const numero = telFull.substring(2, telFull.length);

  return { ddd, numero };
}

export const formatarTelefone = (telefone: string) => {
  const numeros = telefone.replace(/\D/g, "");
  return numeros
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})(\d)/, "$1-$2");
};
