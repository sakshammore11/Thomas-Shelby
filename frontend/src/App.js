import React, { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toSend = message.trim();
    if (!toSend) return;

    const userMessage = { text: toSend, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: toSend }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Request failed');
      }
      setMessages((prev) => [...prev, { text: data.response, sender: 'shelby' }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: "By order of the Peaky fookin' Blinders, we've got a problem here.",
          sender: 'error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>
          TOMMY SHELBY <span className="accent">—</span> ADVICE FOR BLOODY SITUATIONS
        </h1>
        <div className="hat-icon" aria-hidden>🎩</div>
      </header>

      <div className="chat-container">
        <div className="messages" ref={listRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {isLoading && (
            <div className="message shelby">*takes a drag from his cigarette*</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="message-form">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Thomas Shelby for advice..."
            disabled={isLoading}
            aria-label="Ask Thomas Shelby"
          />
          <button type="submit" disabled={isLoading || !message.trim()}>
            {isLoading ? '...' : 'ASK'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
