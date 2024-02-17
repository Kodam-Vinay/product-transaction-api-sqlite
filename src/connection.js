import sqlite3 from "sqlite3";
import path from "path";
import { open } from "sqlite";
const PORT = process.env.PORT || 8001;
import "dotenv/config";

const dbPath = path.join("./db", "productTransactions.db");
let db = null;
const initializeServer = async (app) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(PORT, () => {
      console.log("Server Running at " + PORT);
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
  return db;
};

export const server = initializeServer;
