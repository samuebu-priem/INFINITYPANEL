const fs = require("fs");
const path = require("path");
const dist = path.join("frontend", "dist", "assets");
for (const file of fs.readdirSync(dist)) {
  if (file.endsWith(".js")) {
    const content = fs.readFileSync(path.join(dist, file), "utf8");
    const markers = ["InfinityPainel", "Submanager", "Running", "undefined", "Plans.jsx", "Login"];
    console.log("\nFILE:", file);
    for (const marker of markers) {
      if (content.includes(marker)) console.log("FOUND:", marker);
    }
  }
}
