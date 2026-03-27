from pathlib import Path
for p in ["frontend/src/main.jsx", "frontend/src/layouts/AppShell.jsx", "frontend/src/context/auth.jsx", "frontend/src/services/api.js", "frontend/vite.config.js"]:
    print("\n###", p)
    print(Path(p).read_text(encoding="utf-8"))
