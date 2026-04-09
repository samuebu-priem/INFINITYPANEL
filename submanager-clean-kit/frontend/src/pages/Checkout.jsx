import AppShell from "@/layouts/AppShell";

export default function Checkout() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-8 shadow-lg shadow-black/20">
          <h2 className="text-3xl font-bold text-[#f3f4f6]">Checkout</h2>
          <p className="mt-3 text-[#9ca3af]">
            Esta página permanece reservada para o fluxo real de pagamento quando o backend expuser o contrato necessário.
          </p>
          <div className="mt-6 rounded-2xl border border-[#1f2937] bg-[#0f141c] p-5 text-[#cbd5e1]">
            Nenhuma integração simulada é exibida aqui.
          </div>
        </div>
      </div>
    </AppShell>
  );
}