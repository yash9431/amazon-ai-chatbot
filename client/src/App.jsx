import { useMemo, useState } from "react";
import { chat } from "./api.js";
import ProductCard from "./ProductCard.jsx";
import "./styles.css";

function MessageBubble({ role, text }) {
  return (
    <div className={`msg ${role}`}>
      <div className="bubble">
        <div className="role">{role === "user" ? "You" : "Assistant"}</div>
        <div className="text">{text}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(undefined);
  const [messages, setMessages] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const latestProducts = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant" && Array.isArray(messages[i].products) && messages[i].products.length) {
        return messages[i].products;
      }
    }
    return [];
  }, [messages]);

  async function onSend(e) {
    e.preventDefault();
    setError("");
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setMessage("");
    setLoading(true);

    try {
      const data = await chat(trimmed, {}, conversationId);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.assistantText || "",
          products: data.products || [],
        },
      ]);
      setConversationId(data.conversationId);
    } catch (err) {
      setError(err.message || "Request failed");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry—something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <h1>Amazon AI Chatbot</h1>

      <div className="chat">
        {messages.length === 0 ? (
          <div className="empty">
            Ask for a product (example: <span className="mono">“wireless headphones under $50”</span>)
          </div>
        ) : (
          messages.map((m, idx) => <MessageBubble key={idx} role={m.role} text={m.text} />)
        )}
      </div>

      <form className="composer" onSubmit={onSend}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message…"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !message.trim()}>
          {loading ? "Searching…" : "Send"}
        </button>
      </form>

      {error ? <div className="error">{error}</div> : null}

      <h2>Products</h2>
      <div className="grid">
        {latestProducts.length ? (
          latestProducts.map((p) => <ProductCard key={p.asin || p.url} product={p} />)
        ) : (
          <div className="muted">No products yet.</div>
        )}
      </div>

      <footer className="footer">
        Powered by Rainforest API. Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.
      </footer>
    </div>
  );
}
