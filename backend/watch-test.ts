// watch-test.ts
import chokidar from "chokidar";

chokidar.watch("./src").on("all", (event, path) => {
  console.log("File change:", event, path);
});