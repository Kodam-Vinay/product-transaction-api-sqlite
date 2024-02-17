import express from "express";
import { server } from "./connection.js";
import cors from "cors";
import axios from "axios";

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
      "CREATE TABLE IF NOT EXISTS transactions (id INT, title TEXT, price FLOAT,description TEXT, category VARCHAR(100), image TEXT, sold BOOLEAN, dateOfSale DATETIME)"
    );
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const data = response.data;

    if (data.length > 0) {
      for (let item of data) {
        const queryData = `SELECT id FROM transactions WHERE id = ${item?.id}`;
        const existingData = await db.get(queryData);
        if (existingData === undefined) {
          const query = `
       INSERT INTO transactions (id, title, price, description, category, image, sold, dateOfSale) 
       VALUES (
           ${item.id},
           '${item.title.replace(/'/g, "''")}',
           ${item.price},
           '${item.description.replace(/'/g, "''")}',
           '${item.category.replace(/'/g, "''")}',
           '${item.image.replace(/'/g, "''")}',
           ${item.sold},
           '${item.dateOfSale.replace(/'/g, "''")}'
       );
    `;
          await db.run(query);
          res.status(201).send("Data Inserted Successfully");
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/products", async (req, res) => {
  try {
    const query = `
    SELECT * FROM transactions
    `;
    const response = await db.run(query);
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
      FROM transactions
      LIMIT ${limit}
      OFFSET ${skip}
    `;
    const response = await db.run(query);
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
    const query = `SELECT * FROM transactions`;
    const response = await db.run(query);
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
    const query = `SELECT * FROM transactions`;
    const result = await db.run(query);
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
    const query = `SELECT * FROM transactions`;
    const response = await db.run(query);
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
