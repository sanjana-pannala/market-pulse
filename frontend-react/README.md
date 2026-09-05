# 📈 Market Pulse — Smart Market Watchlist

## 🚀 Overview

Market Pulse is a full-stack Smart Market Watchlist application inspired by the Groww challenge.

It allows users to search for stocks, add stocks to a personal watchlist, view current market information, track meaningful price changes, and inspect today's price history through an interactive chart.

The application focuses on simplicity, persistence, useful market updates, and a clean user experience.

---

## ✨ Features

- 🔍 Search stocks by symbol or company name
- ⭐ Add stocks to a personal watchlist
- 🗑️ Remove stocks from the watchlist
- 💾 Persist the watchlist using browser local storage
- 📊 Display latest market prices
- 📈 Display today's price history
- 📉 Interactive stock price chart
- 🔄 Manual market data refresh
- ⏱️ Automatic refresh every 60 seconds
- 🕒 Display the last updated time
- 🚦 Market connection status
- 📌 Meaningful change detection
- 📱 Responsive user interface
- ⚠️ Error handling when market data is unavailable

---

## 🧠 Meaningful Change Detection

Market Pulse considers a price movement of **0.5% or more** between updates to be meaningful.

This prevents very small price fluctuations from being presented as important changes.

Examples:

- `+0.10%` → No meaningful change
- `-0.25%` → No meaningful change
- `+0.75%` → Meaningful increase
- `-0.80%` → Meaningful decrease

This threshold can be changed easily in the frontend logic.

---

## 🏗️ Architecture

The project uses a simple full-stack architecture:

```text
User
  │
  ▼
React Frontend
  │
  │ HTTP Requests
  ▼
Node.js + Express Backend
  │
  │ Market Data Request
  ▼
Yahoo Finance Market Data