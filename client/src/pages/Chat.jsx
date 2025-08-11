import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

export default function Chat() {
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [rateMsg, setRateMsg] = useState('')
  const [activeUsers, setActiveUsers] = useState([])
  const socketRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    const socket = io('http://localhost:5000', { auth: { token } })
    socketRef.current = socket

    socket.on('connect_error', (err) => {
      console.error('socket error', err.message)
    })

    socket.on('chat:history', (history) => {
      setMessages(history)
    })

    socket.on('chat:new_message', (m) => {
      setMessages((prev) => [...prev, m])
    })

    socket.on('chat:rate_limited', (d) => {
      setRateMsg(d.message)
      setTimeout(() => setRateMsg(''), 1500)
    })

    socket.on('users:active', (list) => {
      setActiveUsers(list)
    })

    return () => {
      socket.disconnect()
    }
  }, [token])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    socketRef.current.emit('chat:send', { message: text })
    setInput('')
  }

  function formatTime(ts) {
    const d = new Date(ts)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <div style={{ maxWidth: 720, margin: '20px auto', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Global Sohbet</h2>
        <div>
          <span style={{ marginRight: 16 }}>Merhaba, <strong>{user?.username}</strong></span>
          <button onClick={logout}>Çıkış</button>
        </div>
      </div>

      <div style={{ marginBottom: 8, color: '#666' }}>Aktif kullanıcılar: {activeUsers.map(u => u.username).join(', ')}</div>
      {rateMsg && <div style={{ color: 'tomato', marginBottom: 8 }}>{rateMsg}</div>}

      <div ref={listRef} style={{ height: 420, border: '1px solid #ddd', borderRadius: 8, padding: 12, overflowY: 'auto', background: '#fafafa' }}>
        {messages.map(m => (
          <div key={m._id} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: '#555' }}>
              <strong>{m.username}</strong> · {formatTime(m.timestamp)}
            </div>
            <div style={{ fontSize: 14 }}>{m.message}</div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: 10, gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Mesaj yazın..." style={{ flex: 1 }} />
        <button type="submit">Gönder</button>
      </form>
    </div>
  )
}


