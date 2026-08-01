import React, { useState } from 'react';
import { translations } from './translations';

export default function Signup() {
  const [lang, setLang] = useState('rw');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tenant');
  const [error, setError] = useState('');
  
  const t = translations[lang];

  const handleSignup = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    const existing = users.find(u => u.email === email);
    if (existing) {
      setError(lang === 'rw' ? "Iyi meri isanzwe ikoreshwa!" : "Email already exists!");
      return;
    }

    const newUser = { name, email, password, role };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('loggedUser', JSON.stringify(newUser));

    if (role === 'landlord') {
      window.location.href = '/landlord';
    } else {
      window.location.href = '/tenant';
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

        <h2 style={styles.title}>📝 {t.signupTitle}</h2>
        {error && <p style={styles.error}>{error}</p>}
        
        <form onSubmit={handleSignup} style={styles.form}>
          <div style={styles.inputGroup}>
            <label>{t.namePlaceholder}</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              style={styles.input} 
              required 
            />
          </div>

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

          <div style={styles.inputGroup}>
            <label>{lang === 'rw' ? "Hitamo Uruhare (Role)" : "Select Role"}</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
              <option value="tenant">{lang === 'rw' ? "Umukodesha (Tenant)" : "Tenant"}</option>
              <option value="landlord">{lang === 'rw' ? "Nyir'inzu (Landlord)" : "Landlord"}</option>
            </select>
          </div>

          <button type="submit" style={styles.btn}>{t.signupBtn}</button>
        </form>

        <p style={styles.footerText}>
          {t.hasAccount} <a href="/login" style={styles.link}>{t.loginTitle}</a>
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
  btn: { background: '#007bff', color: '#fff', padding: '12px', border: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' },
  error: { color: 'red', fontSize: '13px', textAlign: 'center', marginBottom: '10px' },
  footerText: { textAlign: 'center', marginTop: '15px', fontSize: '13px', color: '#666' },
  link: { color: '#007bff', textDecoration: 'none', fontWeight: 'bold' },
  langBtn: { background: '#6c757d', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }
};