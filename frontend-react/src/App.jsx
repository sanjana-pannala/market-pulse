import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

function App() {
  const [search, setSearch] = useState("");
  const [stocks, setStocks] = useState([]);
  const [previousStocks, setPreviousStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [watchlist, setWatchlist] = useState(() => {
    const savedWatchlist = localStorage.getItem("watchlist");
    return savedWatchlist ? JSON.parse(savedWatchlist) : [];
  });

  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStocks = () => {
    setLoading(true);
    setError("");

    fetch("http://localhost:5000/stocks")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to fetch market data");
        }

        return response.json();
      })
      .then((data) => {
        const savedStocks = localStorage.getItem("currentStocks");

        const oldStocks = savedStocks
          ? JSON.parse(savedStocks)
          : [];

        setPreviousStocks(oldStocks);
        setStocks(data);

        localStorage.setItem(
          "currentStocks",
          JSON.stringify(data)
        );

        setLastUpdated(new Date().toLocaleTimeString());

        setWatchlist((currentWatchlist) =>
          currentWatchlist.map((oldStock) => {
            const latestStock = data.find(
              (stock) => stock.symbol === oldStock.symbol
            );

            return latestStock ? latestStock : oldStock;
          })
        );
      })
      .catch(() => {
        setError(
          "Unable to load market data. Please try again."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStocks();

    const refreshInterval = setInterval(() => {
      fetchStocks();
    }, 60000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "watchlist",
      JSON.stringify(watchlist)
    );
  }, [watchlist]);

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      stock.name
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const addToWatchlist = (stock) => {
    if (
      !watchlist.some(
        (item) => item.symbol === stock.symbol
      )
    ) {
      setWatchlist([...watchlist, stock]);
    }
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist(
      watchlist.filter(
        (stock) => stock.symbol !== symbol
      )
    );
  };

  const isInWatchlist = (symbol) => {
    return watchlist.some(
      (stock) => stock.symbol === symbol
    );
  };

  const getPriceMovement = (
    symbol,
    currentPrice
  ) => {
    const previousStock = previousStocks.find(
      (stock) => stock.symbol === symbol
    );

    if (!previousStock) {
      return {
        text: "🆕 First update",
        className: "neutral",
      };
    }

    const oldPrice = parseFloat(
      previousStock.price
        .replace("₹", "")
        .replace(",", "")
    );

    const newPrice = parseFloat(
      currentPrice
        .replace("₹", "")
        .replace(",", "")
    );

    if (
      Number.isNaN(oldPrice) ||
      Number.isNaN(newPrice) ||
      oldPrice === 0
    ) {
      return {
        text: "⚪ Change unavailable",
        className: "neutral",
      };
    }

    const percentageChange =
      ((newPrice - oldPrice) / oldPrice) * 100;

    const meaningfulChange =
      Math.abs(percentageChange) >= 0.5;

    if (!meaningfulChange) {
      return {
        text: `➡️ No meaningful change (${percentageChange >= 0 ? "+" : ""}${percentageChange.toFixed(2)}%)`,
        className: "neutral",
      };
    }

    if (percentageChange > 0) {
      return {
        text: `🚀 Meaningful increase from ₹${oldPrice.toFixed(2)} (+${percentageChange.toFixed(2)}%)`,
        className: "positive",
      };
    }

    return {
      text: `📉 Meaningful decrease from ₹${oldPrice.toFixed(2)} (${percentageChange.toFixed(2)}%)`,
      className: "negative",
    };
  };

  const getChangeClass = (change) => {
    if (change.startsWith("+")) {
      return "positive";
    }

    if (change.startsWith("-")) {
      return "negative";
    }

    return "neutral";
  };

  const openStockDetails = (stock) => {
    setSelectedStock(stock);
    setHistory([]);
    setHistoryLoading(true);

    fetch(
      `http://localhost:5000/stocks/${stock.symbol}/history`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to fetch history");
        }

        return response.json();
      })
      .then((data) => {
        setHistory(data.history || []);
      })
      .catch(() => {
        setHistory([]);
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  };

  const closeStockDetails = () => {
    setSelectedStock(null);
    setHistory([]);
  };

  if (selectedStock) {
    const movement = getPriceMovement(
      selectedStock.symbol,
      selectedStock.price
    );

    return (
      <div>
        <header>
          <h1>📊 Stock Details</h1>

          <p>
            Detailed information about your selected stock.
          </p>
        </header>

        <main>
          <div className="stock-details">
            <button onClick={closeStockDetails}>
              ← Back to Market
            </button>

            <h2>{selectedStock.symbol}</h2>

            <h3>{selectedStock.name}</h3>

            <p className="detail-label">
              Current Price
            </p>

            <p className="detail-price">
              {selectedStock.price}
            </p>

            <p className="detail-label">
              Today's Change
            </p>

            <p
              className={`detail-change ${getChangeClass(
                selectedStock.change
              )}`}
            >
              {selectedStock.change}
            </p>

            <p className="detail-label">
              Price Movement
            </p>

            <p className={movement.className}>
              {movement.text}
            </p>

            <p className="detail-label">
              Meaningful Change Threshold
            </p>

            <p>
              Changes of 0.5% or more are considered
              meaningful.
            </p>

            <p className="detail-label">
              Last Updated
            </p>

            <p>
              {lastUpdated || "Not available"}
            </p>

            <div className="chart-section">
              <h3>
                📈 Today's Price History
              </h3>

              {historyLoading ? (
                <p>
                  Loading price history...
                </p>
              ) : history.length === 0 ? (
                <p>
                  Price history is currently unavailable.
                </p>
              ) : (
                <div className="chart-container">
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >
                    <LineChart data={history}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis dataKey="time" />

                      <YAxis
                        domain={["auto", "auto"]}
                      />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {isInWatchlist(
              selectedStock.symbol
            ) ? (
              <button
                onClick={() =>
                  removeFromWatchlist(
                    selectedStock.symbol
                  )
                }
              >
                Remove from Watchlist
              </button>
            ) : (
              <button
                onClick={() =>
                  addToWatchlist(selectedStock)
                }
              >
                Add to Watchlist
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>📈 Market Watchlist</h1>

        <p>
          Track the stocks that matter to you.
        </p>

        <div
          className={`market-status ${
            error
              ? "status-error"
              : loading
              ? "status-loading"
              : "status-connected"
          }`}
        >
          <span className="status-dot"></span>

          <span>
            {error
              ? "Market data unavailable"
              : loading
              ? "Updating market data..."
              : "Market data connected"}
          </span>
        </div>

        <input
          type="text"
          placeholder="🔍 Search stocks..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <br />

        <button
          onClick={fetchStocks}
          disabled={loading}
        >
          {loading
            ? "⏳ Loading..."
            : "🔄 Refresh Market Data"}
        </button>

        {lastUpdated && !loading && (
          <p className="last-updated">
            Last updated: {lastUpdated}
          </p>
        )}

        <p className="refresh-info">
          🔄 Market data automatically refreshes
          every 60 seconds.
        </p>
      </header>

      <main>
        <section className="dashboard-summary">
          <div className="summary-card">
            <div className="summary-icon">
              ⭐
            </div>

            <div>
              <p className="summary-label">
                Watchlist
              </p>

              <h3>
                {watchlist.length}
              </h3>

              <span>
                {watchlist.length === 1
                  ? "Stock tracked"
                  : "Stocks tracked"}
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">
              📡
            </div>

            <div>
              <p className="summary-label">
                Market Status
              </p>

              <h3
                className={
                  error
                    ? "summary-error"
                    : loading
                    ? "summary-loading"
                    : "summary-success"
                }
              >
                {error
                  ? "Offline"
                  : loading
                  ? "Updating"
                  : "Connected"}
              </h3>

              <span>
                {error
                  ? "Check connection"
                  : "Live market data"}
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">
              🕒
            </div>

            <div>
              <p className="summary-label">
                Last Updated
              </p>

              <h3 className="summary-time">
                {lastUpdated || "--:--"}
              </h3>

              <span>
                Auto-refresh every 60 sec
              </span>
            </div>
          </div>
        </section>

        {error && (
          <div className="error-message">
            <p>
              ⚠️ {error}
            </p>

            <button
              onClick={fetchStocks}
              disabled={loading}
            >
              🔁 Try Again
            </button>
          </div>
        )}

        <section className="watchlist-section">
          <div className="section-header">
            <div>
              <h2>⭐ My Watchlist</h2>

              <p>
                {watchlist.length === 0
                  ? "You are not tracking any stocks yet."
                  : `You are tracking ${
                      watchlist.length
                    } ${
                      watchlist.length === 1
                        ? "stock"
                        : "stocks"
                    }.`}
              </p>
            </div>

            <div className="watchlist-count">
              {watchlist.length}
            </div>
          </div>

          {watchlist.length === 0 ? (
            <div className="empty-watchlist">
              <p>
                ⭐ Your watchlist is empty.
              </p>

              <p>
                Add stocks from the Market Stocks
                section below.
              </p>
            </div>
          ) : (
            <div className="stock-grid">
              {watchlist.map((stock) => {
                const movement =
                  getPriceMovement(
                    stock.symbol,
                    stock.price
                  );

                return (
                  <div
                    key={stock.symbol}
                    className="stock-card"
                    onClick={() =>
                      openStockDetails(stock)
                    }
                  >
                    <h3>
                      {stock.symbol}
                    </h3>

                    <p>{stock.name}</p>

                    <p>
                      <strong>
                        {stock.price}
                      </strong>
                    </p>

                    <p
                      className={getChangeClass(
                        stock.change
                      )}
                    >
                      {stock.change}
                    </p>

                    <p
                      className={
                        movement.className
                      }
                    >
                      {movement.text}
                    </p>

                    <button
                      onClick={(event) => {
                        event.stopPropagation();

                        removeFromWatchlist(
                          stock.symbol
                        );
                      }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="market-section">
          <h2>📊 Market Stocks</h2>

          <p className="section-description">
            Browse available stocks and add the
            ones you want to track.
          </p>

          {loading && stocks.length === 0 ? (
            <p>
              Loading market data...
            </p>
          ) : (
            <div className="stock-grid">
              {filteredStocks.map((stock) => {
                const movement =
                  getPriceMovement(
                    stock.symbol,
                    stock.price
                  );

                return (
                  <div
                    key={stock.symbol}
                    className="stock-card"
                    onClick={() =>
                      openStockDetails(stock)
                    }
                  >
                    <h3>
                      {stock.symbol}
                    </h3>

                    <p>{stock.name}</p>

                    <p>
                      <strong>
                        {stock.price}
                      </strong>
                    </p>

                    <p
                      className={getChangeClass(
                        stock.change
                      )}
                    >
                      {stock.change}
                    </p>

                    <p
                      className={
                        movement.className
                      }
                    >
                      {movement.text}
                    </p>

                    {isInWatchlist(
                      stock.symbol
                    ) ? (
                      <button
                        disabled
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        ✓ Added
                      </button>
                    ) : (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();

                          addToWatchlist(
                            stock
                          );
                        }}
                      >
                        Add to Watchlist
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading &&
            filteredStocks.length === 0 &&
            !error && (
              <p>
                No stocks found.
              </p>
            )}
        </section>
      </main>
    </div>
  );
}

export default App;