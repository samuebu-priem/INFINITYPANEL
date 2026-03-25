import AppShell from "@/layouts/AppShell";

export default function Checkout() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-3xl font-bold">Checkout</h2>
          <p className="text-slate-400 mt-3">
            Esta rota ficou pronta para você trocar o checkout simulado por um checkout real com backend e gateway de pagamento.
          </p>
          <div className="mt-6 rounded-2xl bg-slate-950 border border-slate-800 p-5 text-slate-300">
            Próximos passos ideais: criar preferência de pagamento no backend, integrar Mercado Pago ou Asaas e usar webhook para ativar a assinatura só depois do pagamento confirmado.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
