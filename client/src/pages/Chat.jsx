import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [room, setRoom] = useState('general');
  const [joinedRoom, setJoinedRoom] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket]);

  useEffect(() => {
    socket.on('reconnect', () => {
        console.log('Reconnected! Re-joining room...');
        if (joinedRoom && room) {
            socket.emit('join_room', room);
        }
    });

    return () => {
        socket.off('reconnect');
    };
  }, [socket, joinedRoom, room]);

  

  //Loads message history after log in 
  useEffect(() => {
    socket.on('message_history', (history) => {
        setMessages(history);
    });

    return () => {
        socket.off('message_history');
    };
  }, [socket]);

  const joinRoom = () => {
    if (room.trim()) {
      console.log('Socket connected?', socket.connected);
      if (socket.connected) {
        socket.emit('join_room', room);
        setJoinedRoom(true);
      } else {
        socket.connect();
        socket.once('connect', () => {
          socket.emit('join_room', room);
          setJoinedRoom(true);
        });
      }
    }
  };

  const sendMessage = () => {
    if (input.trim() && joinedRoom) {
      const messageData = {
        roomId: room,
        message: input,
        sender: user.username,
        time: new Date().toLocaleTimeString(),
      };
      socket.emit('send_message', messageData);
      setInput('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>💬 ChatApp</h2>
        <div style={styles.headerRight}>
          <span style={styles.username}>👤 {user?.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {!joinedRoom ? (
        <div style={styles.roomSelector}>
          <h3>Join a Room</h3>
          <input
            style={styles.input}
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Enter room name"
          />
          <button style={styles.joinBtn} onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div style={styles.chatContainer}>
          <div style={styles.roomInfo}>
            Room: <strong>#{room}</strong>
          </div>

          <div style={styles.messages}>
            {messages.length === 0 && (
              <p style={styles.emptyMsg}>No messages yet. Say hello! 👋</p>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.message,
                  alignSelf: msg.sender === user.username ? 'flex-end' : 'flex-start',
                  background: msg.sender === user.username ? '#4f46e5' : '#e5e7eb',
                  color: msg.sender === user.username ? 'white' : '#111',
                }}
              >
                <span style={styles.sender}>
                  {msg.sender === user.username ? 'You' : msg.sender}
                </span>
                <p style={{ margin: 0 }}>{msg.message}</p>
                <span style={styles.time}>{msg.time}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={styles.inputRow}>
            <input
              style={styles.messageInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
            />
            <button style={styles.sendBtn} onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f0f2f5' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#4f46e5', color: 'white' },
  headerTitle: { margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  username: { fontSize: '0.9rem' },
  logoutBtn: { padding: '0.4rem 1rem', background: 'white', color: '#4f46e5', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  roomSelector: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1rem' },
  input: { padding: '0.75rem', width: '300px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' },
  joinBtn: { padding: '0.75rem 2rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' },
  chatContainer: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  roomInfo: { padding: '0.5rem 1rem', background: '#e0e7ff', fontSize: '0.9rem' },
  messages: { display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', padding: '1rem', gap: '0.75rem' },
  emptyMsg: { textAlign: 'center', color: '#888', marginTop: '2rem' },
  message: { maxWidth: '60%', padding: '0.6rem 1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  sender: { fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.8 },
  time: { fontSize: '0.7rem', opacity: 0.6, alignSelf: 'flex-end' },
  inputRow: { display: 'flex', padding: '1rem', gap: '0.5rem', background: 'white', borderTop: '1px solid #e5e7eb' },
  messageInput: { flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' },
  sendBtn: { padding: '0.75rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' },
};

export default Chat;