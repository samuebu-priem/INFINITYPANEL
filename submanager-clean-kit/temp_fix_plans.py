from pathlib import Path

path = Path("frontend/src/pages/Plans.jsx")
s = path.read_text(encoding="utf-8")
s = s.replace(
    '              <p className="mt-2 text-slate-400">\n                Visual limpo, hierarquia mais clara e dados carregados diretamente da API.\n              </p>',
    '              <p className="mt-2 text-slate-400">\n                Visual limpo, hierarquia mais clara e dados atualizados em tempo real.\n              </p>',
)
s = s.replace(
    '          <StatCard label="Assinaturas" value={subscriptions.length} help="Histórico da API" />',
    '          <StatCard label="Assinaturas" value={subscriptions.length} help="Histórico recente" />',
)
s = s.replace(
    '          <StatCard label="Pagamentos" value={payments.length} help="Dados da API" />',
    '          <StatCard label="Pagamentos" value={payments.length} help="Dados recentes" />',
)
s = s.replace(
    '          <StatCard label="Receita" value={formatCurrency(totalRevenue)} help="Somatório da API" />',
    '          <StatCard label="Receita" value={formatCurrency(totalRevenue)} help="Somatório total" />',
)
path.write_text(s, encoding="utf-8")
