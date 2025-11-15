import React, { useEffect, useRef, useState } from 'react';
import './App.css';

// Simple typewriter effect for assistant responses without changing data flow
function Typewriter({ text, speed = 20 }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span className="typewriter">{displayed}</span>;
}

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
          text: "Something went wrong. Please try again.",
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
        <div className="glyph" aria-hidden></div>
        <h1>
          ADVISOR <span className="accent">—</span> CINEMATIC MODE
        </h1>
      </header>

      <div className="chat-container">
        <div className="messages" ref={listRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.sender === 'shelby' ? (
                <Typewriter text={msg.text} />
              ) : (
                msg.text
              )}
            </div>
          ))}
          {isLoading && <div className="message loading" aria-hidden></div>}
        </div>

        <form onSubmit={handleSubmit} className="message-form">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            aria-label="Message"
          />
          <button type="submit" disabled={isLoading || !message.trim()}>
            {isLoading ? '...' : 'SEND'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
