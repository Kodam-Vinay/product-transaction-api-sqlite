import express from "express";
import { server } from "./connection.js";
import sqlite3 from "sqlite3";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

const db = await server(app);

app.get("/store-to-db", async (req, res) => {
  try {
    db.run(
      "CREATE TABLE IF NOT EXISTS products (title TEXT, price FLOAT,description TEXT, category VARCHAR(100), image TEXT, sold BOOLEAN, dateOfSale DATETIME)"
    );
    const response = await fetch(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const data = await response.json();

    const placeholders = data.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
    const sql = `INSERT INTO products (title , price ,description , category , image , sold , dateOfSale ) VALUES ${placeholders}`;
    const values = data.flatMap((each) => [
      each?.id,
      each?.title,
      each?.price,
      each?.description,
      each?.category,
      each?.image,
      each?.sold,
      each?.dateOfSale,
    ]);

    await db.run(sql, values, function (err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`Inserted ${this.changes} rows with last ID ${this.lastID}`);
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/products", async (req, res) => {
  try {
    const query = `
    SELECT * FROM products
    `;
    const response = await db.all(query);
    res.status(200).send(response);
  } catch (error) {
    console.log(error);
  }
});

app.get("/search", async (req, res) => {
  try {
    const { search_q = "", page = 1, limit = 10, month = 3 } = req.query;
    const skip = (page - 1) * limit;
    const query = `
      SELECT *
      FROM products
      LIMIT ${limit}
      OFFSET ${skip}
    `;
    const response = await db.all(query);
    const dateFilter = response.filter(
      (each) => new Date(each?.dateOfSale).getMonth() === month - 1
    );
    const filterData = dateFilter?.filter(
      (each) =>
        each?.title?.toLowerCase().includes(search_q?.toLowerCase()) ||
        each?.description?.toLowerCase().includes(search_q?.toLowerCase()) ||
        each?.price === Number(search_q)
    );
    res
      .status(200)
      .send({ data: filterData, items: filterData.length, page: page });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/stats", async (req, res) => {
  try {
    const monthNumber = req.query.month || 3;
    const query = `SELECT * FROM products`;
    const response = await db.all(query);
    const filterData = response?.filter(
      (each) => new Date(each?.dateOfSale).getMonth() === monthNumber - 1
    );
    const soldItems = filterData.filter((each) => each?.sold === 1);
    const unSoldItems = filterData.filter((each) => each?.sold === 0);
    const saleAmount = soldItems.reduce((cur, { price }) => cur + price, 0);
    res.status(200).send({
      totalSale: saleAmount,
      noOfSoldItems: soldItems?.length,
      noOfNotSoldItems: unSoldItems?.length,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/price-range-stats", async (req, res) => {
  try {
    const monthNumber = req.query.month || 3;
    const query = `SELECT * FROM products`;
    const result = await db.all(query);
    const zeroToHundread = result.filter(
      (each) =>
        new Date(each?.dateOfSale).getMonth() === monthNumber - 1 &&
        each?.price > 0 &&
        each?.price <= 100
    );
    const hundreadToTwoHundread = result.filter(
      (each) =>
        each?.price > 100 &&
        each?.price <= 200 &&
        new Date(each?.dateOfSale).getMonth() === monthNumber - 1
    );
    const twoHundreadToThreeHundread = result.filter(
      (each) =>
        each?.price > 200 &&
        each?.price <= 300 &&
        new Date(each?.dateOfSale).getMonth() === monthNumber - 1
    );
    const threeHundreadToFourHundread = result.filter(
      (each) =>
        each?.price > 300 &&
        each?.price <= 400 &&
        new Date(each?.dateOfSale).getMonth() === monthNumber - 1
    );
    const fourHundreadToFiveHundread = result.filter(
      (each) =>
        each?.price > 400 &&
        each?.price <= 500 &&
        new Date(each?.dateOfSale).getMonth() === monthNumber - 1
    );
    const fiveHundreadToSixHundread = result.filter(
      (each) =>
        each?.price > 500 &&
        each?.price <= 600 &&
        new Date(each?.dateOfSale).getMonth() === monthNumber - 1
    );
    const sixHundreadToSevenHundread = result.filter(
      (each) =>
        each?.price > 600 &&
        each?.price <= 700 &&
        new Date(each?.dateOfSale).getMonth() === monthNumber - 1
    );
    const sevenHundreadToEightHundread = result.filter(
      (each) =>
        each?.price > 700 &&
        each?.price <= 800 &&
        new Date(each?.dateOfSale).getMonth() === monthNumber - 1
    );
    const eightHundreadToNineHundread = result.filter(
      (each) =>
        each?.price > 800 &&
        each?.price <= 900 &&
        new Date(each?.dateOfSale).getMonth() === monthNumber - 1
    );
    const aboveNineHundread = result.filter(
      (each) =>
        each?.price > 900 &&
        new Date(each?.dateOfSale).getMonth() === monthNumber - 1
    );
    res.status(200).send([
      { name: "0-100", value: zeroToHundread?.length },
      { name: "101-200", value: hundreadToTwoHundread?.length },
      { name: "201-300", value: twoHundreadToThreeHundread?.length },
      { name: "301-400", value: threeHundreadToFourHundread?.length },
      { name: "401-500", value: fourHundreadToFiveHundread?.length },
      { name: "501-600", value: fiveHundreadToSixHundread?.length },
      { name: "601-700", value: sixHundreadToSevenHundread?.length },
      { name: "701-800", value: sevenHundreadToEightHundread?.length },
      { name: "701-800", value: eightHundreadToNineHundread?.length },
      { name: "901 above", value: aboveNineHundread?.length },
    ]);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/unique-category", async (req, res) => {
  try {
    const monthNumber = req.query.month || 3;
    const query = `SELECT * FROM products`;
    const response = await db.all(query);
    const filterData = response.filter(
      (each) => new Date(each?.dateOfSale).getMonth() === monthNumber - 1
    );
    let uniqueCategories = {};
    filterData.map((each) => {
      if (!uniqueCategories.hasOwnProperty(each?.category)) {
        uniqueCategories[each?.category] = 1;
      } else {
        uniqueCategories[each?.category] += 1;
      }
    });
    const result = Object.entries(uniqueCategories).map(
      ([eachCategory, value]) => ({ eachCategory, value })
    );
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});
