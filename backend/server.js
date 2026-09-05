const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

const stocks = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    yahooSymbol: "RELIANCE.NS",
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    yahooSymbol: "TCS.NS",
  },
  {
    symbol: "INFY",
    name: "Infosys",
    yahooSymbol: "INFY.NS",
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    yahooSymbol: "HDFCBANK.NS",
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank",
    yahooSymbol: "ICICIBANK.NS",
  },
  {
    symbol: "ITC",
    name: "ITC Limited",
    yahooSymbol: "ITC.NS",
  },
];

app.get("/", (req, res) => {
  res.send("Market Watchlist Backend is running");
});

app.get("/stocks", async (req, res) => {
  try {
    const results = await Promise.all(
      stocks.map(async (stock) => {
        const url =
          `https://query1.finance.yahoo.com/v8/finance/chart/` +
          `${stock.yahooSymbol}?range=1d&interval=1m`;

        const response = await axios.get(url);

        const result = response.data.chart.result[0];
        const meta = result.meta;

        const price = meta.regularMarketPrice;
        const previousClose = meta.previousClose;

        const change =
          previousClose
            ? ((price - previousClose) / previousClose) * 100
            : 0;

        return {
          symbol: stock.symbol,
          name: stock.name,
          price: `₹${price.toFixed(2)}`,
          change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.log("Market data error:", error.message);

    res.status(500).json({
      error: "Unable to fetch market data",
    });
  }
});

app.get("/stocks/:symbol/history", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    const stock = stocks.find(
      (item) => item.symbol === symbol
    );

    if (!stock) {
      return res.status(404).json({
        error: "Stock not found",
      });
    }

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/` +
      `${stock.yahooSymbol}?range=1d&interval=5m`;

    const response = await axios.get(url);

    const result = response.data.chart.result[0];

    const timestamps = result.timestamp || [];
    const prices =
      result.indicators.quote[0].close || [];

    const history = timestamps
      .map((timestamp, index) => {
        const price = prices[index];

        if (price === null || price === undefined) {
          return null;
        }

        return {
          time: new Date(timestamp * 1000).toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
          price: Number(price.toFixed(2)),
        };
      })
      .filter(Boolean);

    res.json({
      symbol: stock.symbol,
      name: stock.name,
      history,
    });
  } catch (error) {
    console.log("History data error:", error.message);

    res.status(500).json({
      error: "Unable to fetch stock history",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});