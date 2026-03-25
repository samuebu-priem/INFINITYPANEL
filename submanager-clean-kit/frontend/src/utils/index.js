export function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR");
}
