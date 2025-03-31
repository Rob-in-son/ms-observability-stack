import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [time, setTime] = useState(null);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [cacheData, setCacheData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTime();
  }, []);

  // Fetch the current time from Flask API
  const fetchTime = async () => {
    try {
      const response = await fetch("/time");
      const data = await response.json();
      setTime(new Date(data.time * 1000).toLocaleString());
    } catch (error) {
      console.error("Error fetching time:", error);
    }
  };

  // Create a key-value pair in Redis
  const createCache = async () => {
    if (!key || !value) {
      setMessage("⚠️ Please enter both key and value.");
      return;
    }
    try {
      const response = await fetch("/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await response.json();
      setMessage(data.message);
      setKey("");
      setValue("");
    } catch (error) {
      setMessage("❌ Error setting cache.");
    }
  };

  // Get a value from Redis by key
  const getCache = async () => {
    if (!key) {
      setMessage("⚠️ Please enter a key.");
      return;
    }
    try {
      const response = await fetch(`/cache/${key}`);
      if (response.status === 404) {
        setMessage("⚠️ Key not found.");
        setCacheData(null);
      } else {
        const data = await response.json();
        setCacheData(data);
        setMessage("");
      }
    } catch (error) {
      setMessage("❌ Error fetching cache.");
    }
  };

  // Delete a key from Redis
  const deleteCache = async () => {
    if (!key) {
      setMessage("⚠️ Please enter a key.");
      return;
    }
    try {
      const response = await fetch(`/cache/${key}`, { method: "DELETE" });
      const data = await response.json();
      setMessage(data.message);
      setCacheData(null);
      setKey("");
    } catch (error) {
      setMessage("❌ Error deleting key.");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Flask + React Integration</h1>

        {/* Time Display */}
        <h2>⏰ Current Time</h2>
        <p>{time ? time : "Loading..."}</p>

        {/* Cache Input Fields */}
        <h2>🔑 Manage Redis Cache</h2>
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        {/* Buttons for API Actions */}
        <div className="button-container">
          <button onClick={createCache}>Set Cache</button>
          <button onClick={getCache}>Get Cache</button>
          <button onClick={deleteCache}>Delete Cache</button>
        </div>

        {/* Display Fetched Cache Data */}
        {cacheData && (
          <div className="result">
            <h3>📦 Cached Data</h3>
            <p>
              <strong>Key:</strong> {cacheData.key} <br />
              <strong>Value:</strong> {cacheData.value}
            </p>
          </div>
        )}

        {/* Message Display */}
        {message && <p className="message">{message}</p>}
      </header>
    </div>
  );
}

export default App;

