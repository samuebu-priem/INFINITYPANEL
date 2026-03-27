from pathlib import Path

path = Path("frontend/src/pages/Plans.jsx")
s = path.read_text(encoding="utf-8")

s = s.replace(
    '  useEffect(() => {\n    let alive = true;\n\n    async function loadPlans() {\n      setLoading(true);\n      try {\n        const data = await api.get("/api/plans", { auth: true });\n        if (!alive) return;\n\n        const rows = Array.isArray(data?.plans) ? data.plans.map(mapPlan) : [];\n        setPlans(rows);\n      } catch (error) {\n        if (alive) {\n          setPlans([]);\n          toast.error(error?.message || "NÃ£o foi possÃ­vel carregar os planos.");\n        }\n      } finally {\n        if (alive) setLoading(false);\n      }\n    }\n\n    loadPlans();\n\n    return () => {\n      alive = false;\n    };\n  }, []);\n',
    '  const loadPlans = useCallback(async ({ silent = false } = {}) => {\n    if (!silent) setLoading(true);\n    setRefreshing(true);\n    try {\n      const data = await api.get("/api/plans", { auth: true });\n      const rows = Array.isArray(data?.plans) ? data.plans.map(mapPlan) : [];\n      setPlans(rows);\n      return rows;\n    } catch (error) {\n      setPlans([]);\n      toast.error(error?.message || "Não foi possível carregar os planos.");\n      return [];\n    } finally {\n      if (!silent) setLoading(false);\n      setRefreshing(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    loadPlans();\n  }, [loadPlans]);\n',
)

s = s.replace(
    '      setCheckoutPlan({\n        ...selectedPlan,\n        checkout,\n      });\n      toast.success("Checkout criado com sucesso.");\n      await loadPlans({ silent: true });\n',
    '      setCheckoutPlan({\n        ...selectedPlan,\n        checkout,\n      });\n      toast.success("Checkout criado com sucesso.");\n      await loadPlans({ silent: true });\n',
)

s = s.replace(
    '      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">\n',
    '      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">\n        <div className="flex items-center justify-end">\n          <button\n            type="button"\n            onClick={() => loadPlans({ silent: true })}\n            disabled={refreshing}\n            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-sm"\n          >\n            {refreshing ? "Atualizando..." : "Atualizar planos"}\n          </button>\n        </div>\n',
)

path.write_text(s, encoding="utf-8")
