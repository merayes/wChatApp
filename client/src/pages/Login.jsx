import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await axios.post('https://wchatapp.onrender.com/api/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş başarısız')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 font-sans">
  <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
    <h2 className="text-2xl font-semibold text-purple-600 mb-6">Giriş</h2>

    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Şifre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {/* Buton */}
      <button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm transition"
      >
        Giriş Yap
      </button>
    </form>

    <p className="mt-4 text-sm text-gray-600 text-center">
      Hesabın yok mu?{" "}
      <Link to="/register" className="text-purple-600 hover:underline">
        Kayıt ol
      </Link>
    </p>
  </div>
</div>

  )
}


