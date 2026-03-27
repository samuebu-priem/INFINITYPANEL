from pathlib import Path
print(Path("backend/prisma/schema.prisma").read_text(encoding="utf-8"))
