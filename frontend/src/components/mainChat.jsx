// sysmind/frontend/src/pages/Chat/ChatMain.jsx
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Message from '../../components/chat/Message';
import { useAuth } from '../../context/AuthContext';

const ChatMain = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef();
  const messagesEndRef = useRef();

  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('user online', user.id);
    });

    socketRef.current.on('online users', (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on('chat message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on('chat history', (history) => {
      setMessages(history);
    });

    socketRef.current.on('typing users', (users) => {
      setTypingUsers(users);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socketRef.current.emit('chat message', {
        message,
        senderId: user.id
      });
      setMessage('');
    }
  };

  const handleTyping = () => {
    socketRef.current.emit('typing', {
      isTyping: true,
      userId: user.id
    });
    // You might want to debounce this and send a 'stopped typing' event
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <Message 
            key={index} 
            message={msg} 
            isCurrentUser={msg.senderId === user.id} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500">
          {typingUsers.length === 1 
            ? `${typingUsers[0]} is typing...` 
            : `${typingUsers.length} people are typing...`}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-4 py-2 rounded-r-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatMain;