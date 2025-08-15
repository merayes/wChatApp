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
    const socket = io('https://wchatapp.onrender.com', { auth: { token } })
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
    window.location.href = '/'
  }

  return (
    <div className="max-w-2xl mx-auto my-5 font-sans">
  {/* Üst Bar */}
  <div className="flex justify-between items-center bg-purple-600 text-white p-4 rounded-t-xl shadow">
    <h2 className="text-lg font-semibold">Global Sohbet</h2>
    <div className="flex items-center gap-4">
      <span>Merhaba, <strong>{user?.username}</strong></span>
      <button
        onClick={logout}
        className="bg-purple-800 hover:bg-purple-900 px-3 py-1 rounded text-sm transition"
      >
        Çıkış
      </button>
    </div>
  </div>

  {/* Aktif Kullanıcılar */}
  <div className="text-gray-600 text-sm my-2">
    Aktif kullanıcılar: {activeUsers.map(u => u.username).join(', ')}
  </div>

  {/* Rate Limit Mesajı */}
  {rateMsg && (
    <div className="text-red-500 text-sm mb-2">
      {rateMsg}
    </div>
  )}

  {/* Mesaj Listesi */}
  <div
    ref={listRef}
    className="h-[420px] border border-gray-300 rounded-lg p-3 overflow-y-auto bg-gray-50 shadow-inner flex flex-col gap-2"
  >
    {messages.map(m => {
      const isOwnMessage = m.username === user?.username;
      return (
        <div
          key={m._id}
          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[70%] rounded-lg px-3 py-2 shadow
            ${isOwnMessage
              ? 'bg-purple-600 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-800 rounded-bl-none'
            }`}
          >
            <div className="text-xs opacity-80 mb-1">
              <strong>{m.username}</strong> · {formatTime(m.timestamp)}
            </div>
            <div className="text-sm whitespace-pre-line">{m.message}</div>
          </div>
        </div>
      );
    })}
  </div>

  {/* Mesaj Gönderme Alanı */}
  <form
    onSubmit={sendMessage}
    className="flex mt-3 gap-2"
  >
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Mesaj yazın..."
      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
    />
    <button
      type="submit"
      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition"
    >
      Gönder
    </button>
  </form>
</div>

  )
}


