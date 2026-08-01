import React, { useState } from 'react';
import { translations } from './translations';

export default function Login() {
  const [lang, setLang] = useState('rw');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const t = translations[lang];

  const handleLogin = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const validUser = users.find(u => u.email === email && u.password === password);

    if (validUser) {
      localStorage.setItem('loggedUser', JSON.stringify(validUser));
      if (validUser.role === 'landlord') {
        window.location.href = '/landlord';
      } else {
        window.location.href = '/tenant';
      }
    } else {
      setError(lang === 'rw' ? "Imeri cyangwa ijambo ry'ibanga sibyo!" : "Invalid email or password!");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <button onClick={() => setLang(lang === 'rw' ? 'en' : 'rw')} style={styles.langBtn}>
            {lang === 'rw' ? 'English 🇺🇸' : 'Kinyarwanda 🇷🇼'}
          </button>
        </div>

        <h2 style={styles.title}>🔐 {t.loginTitle}</h2>
        {error && <p style={styles.error}>{error}</p>}
        
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label>{t.emailPlaceholder}</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={styles.input} 
              required 
            />
          </div>

          <div style={styles.inputGroup}>
            <label>{t.passwordPlaceholder}</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={styles.input} 
              required 
            />
          </div>

          <button type="submit" style={styles.btn}>{t.loginBtn}</button>
        </form>

        <p style={styles.footerText}>
          {t.noAccount} <a href="/signup" style={styles.link}>{t.signupTitle}</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f6f9', fontFamily: 'Arial, sans-serif' },
  card: { background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  title: { textAlign: 'center', marginBottom: '20px', color: '#333' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px' },
  btn: { background: '#28a745', color: '#fff', padding: '12px', border: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' },
  error: { color: 'red', fontSize: '13px', textAlign: 'center', marginBottom: '10px' },
  footerText: { textAlign: 'center', marginTop: '15px', fontSize: '13px', color: '#666' },
  link: { color: '#007bff', textDecoration: 'none', fontWeight: 'bold' },
  langBtn: { background: '#6c757d', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }
};