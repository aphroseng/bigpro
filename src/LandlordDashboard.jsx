import React, { useState, useEffect } from 'react';
import { translations } from './translations';

export default function LandlordDashboard() {
  const [lang, setLang] = useState('rw');
  const [properties, setProperties] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState('');
  const [video, setVideo] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [modalMedia, setModalMedia] = useState(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const [rentedProperties, setRentedProperties] = useState([]);
  
  const currentUser = JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('user')) || { name: 'Landlord' };
  const t = translations[lang];

  const loadData = () => {
    const savedProperties = JSON.parse(localStorage.getItem('landlordProperties')) || [];
    setProperties(savedProperties);

    const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    setMessages(savedMessages);

    const unread = savedMessages.filter(m => m.role === 'tenant').length;
    setUnreadCount(unread);

    const savedRented = JSON.parse(localStorage.getItem('rentedProperties')) || [];
    setRentedProperties(savedRented);
  };

  useEffect(() => {
    loadData();

    // Kwumva impinduka za Real-time zituruka muri localStorage (nko kwishyura kw'umukodesha)
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadData, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVideo(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProperty = (e) => {
    e.preventDefault();
    if (!title || !price || !location) {
      alert("Uzuza ibisabwa by'ingenzi!");
      return;
    }

    if (editingId) {
      const updated = properties.map(p => {
        if (p.id === editingId) {
          return {
            ...p,
            title,
            price: parseFloat(price),
            location,
            image: image ? image : p.image,
            video: video ? video : p.video
          };
        }
        return p;
      });
      setProperties(updated);
      localStorage.setItem('landlordProperties', JSON.stringify(updated));
      alert("Inzu yahinduwe neza!");
      setEditingId(null);
    } else {
      const newProperty = {
        id: Date.now(),
        title,
        price: parseFloat(price),
        location,
        image: image ? image : "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500",
        video: video || '',
        landlordName: currentUser.name
      };

      const updatedProperties = [...properties, newProperty];
      setProperties(updatedProperties);
      localStorage.setItem('landlordProperties', JSON.stringify(updatedProperties));
      alert("Inzu yongeweho neza!");
    }

    setTitle('');
    setPrice('');
    setLocation('');
    setImage('');
    setVideo('');
    setShowForm(false);
  };

  const handleEditClick = (p) => {
    setEditingId(p.id);
    setTitle(p.title);
    setPrice(p.price);
    setLocation(p.location);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    const filtered = properties.filter(p => p.id !== id);
    setProperties(filtered);
    localStorage.setItem('landlordProperties', JSON.stringify(filtered));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: currentUser.name,
      role: 'landlord',
      text
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
    window.dispatchEvent(new Event('storage'));
    setText('');
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const toggleLanguage = () => {
    setLang(lang === 'rw' ? 'en' : 'rw');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>🏠 {t.landlordDashboard}: {currentUser.name}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={toggleLanguage} style={styles.langBtn}>
            {lang === 'rw' ? 'English 🇺🇸' : 'Kinyarwanda 🇷🇼'}
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>{t.logout}</button>
        </div>
      </header>

      {/* UMWANYA W'INZU ZISHYURWE (RENTED PROPERTIES ALERTS) */}
      {rentedProperties.length > 0 && (
        <div style={styles.alertBanner}>
          <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>
            🔔 {lang === 'rw' ? 'Amazu amaze kwishyurwa n\'abakodesha:' : 'Paid/Rented Properties:'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rentedProperties.map((rp, index) => (
              <div key={index} style={styles.alertCard}>
                <span>
                  👤 <strong>{rp.tenantName}</strong> {lang === 'rw' ? 'yishyuye inzu' : 'paid for'} <strong>{rp.propertyTitle}</strong> 
                  {' '}({rp.months} {lang === 'rw' ? 'amezi' : 'months'}) - <strong style={{ color: '#28a745' }}>{rp.totalAmount.toLocaleString()} Frw</strong>
                </span>
                <span style={{ fontSize: '11px', color: '#666' }}>{rp.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.mainLayout}>
        
        {/* URUHANDE RW'IBUMOSO: Urutonde rw'Inzu */}
        <div style={styles.leftSection}>
          <h3>{t.myProperties} ({properties.length})</h3>
          {properties.length === 0 ? (
            <p style={{ color: '#771', marginTop: '15px' }}>{t.noProperties}</p>
          ) : (
            <div style={styles.gridContainer}>
              {properties.map(p => (
                <div key={p.id} style={styles.propertyCard}>
                  <img 
                    src={p.image} 
                    alt={p.title} 
                    style={styles.propertyImg} 
                    onClick={() => setModalMedia({ type: 'image', url: p.image })}
                  />
                  <div style={styles.propertyInfo}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{p.title}</h4>
                    <p style={styles.price}>{p.price.toLocaleString()} Frw / {lang === 'rw' ? 'ukwezi' : 'month'}</p>
                    <p style={styles.location}>📍 {p.location}</p>
                    {p.video && (
                      <div style={{ position: 'relative' }}>
                        <video src={p.video} style={styles.propertyVideo} />
                        <button onClick={() => setModalMedia({ type: 'video', url: p.video })} style={styles.expandVideoBtn}>
                          🔍 {t.viewVideo}
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '5px', marginTop: 'auto' }}>
                      <button onClick={() => handleEditClick(p)} style={styles.editBtn}>{t.edit}</button>
                      <button onClick={() => handleDelete(p.id)} style={styles.deleteBtn}>{t.delete}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* URUHANDE RW'IBURYO: Form na Chat */}
        <div style={styles.rightSection}>
          <div style={styles.card}>
            <button 
              onClick={() => { setShowForm(!showForm); setEditingId(null); setTitle(''); setPrice(''); setLocation(''); }} 
              style={styles.toggleMainBtn}
            >
              {showForm ? `✕ ${t.hideForm}` : `➕ ${t.addProperty}`}
            </button>

            {showForm && (
              <form onSubmit={handleSaveProperty} style={styles.form}>
                <h4 style={{ margin: '5px 0', color: '#333' }}>{editingId ? t.saveChanges : t.addProperty}</h4>
                <input
                  type="text"
                  placeholder={t.titlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={styles.input}
                />
                <input
                  type="number"
                  placeholder={t.pricePlaceholder}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder={t.locationPlaceholder}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={styles.input}
                />
                
                <div style={styles.fileContainer}>
                  <label style={{ fontSize: '11px', color: '#666' }}>{t.imageLabel}</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '11px', marginTop: '3px' }} />
                </div>

                <div style={styles.fileContainer}>
                  <label style={{ fontSize: '11px', color: '#666' }}>{t.videoLabel}</label>
                  <input type="file" accept="video/*" onChange={handleVideoChange} style={{ fontSize: '11px', marginTop: '3px' }} />
                </div>

                <button type="submit" style={styles.addBtn}>{editingId ? t.saveChanges : t.showProperty}</button>
              </form>
            )}
          </div>

          <div style={styles.card}>
            <button 
              onClick={() => { setShowChat(!showChat); setUnreadCount(0); }} 
              style={styles.toggleChatBtn}
            >
              {showChat ? `✕ ${t.hideChat}` : `💬 ${t.chatWithTenants}`}
              {unreadCount > 0 && !showChat && <span style={styles.badge}>{unreadCount}</span>}
            </button>

            {showChat && (
              <div style={{ marginTop: '15px' }}>
                <div style={styles.chatBox}>
                  {messages.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginTop: '40px' }}>{t.noMessages}</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} style={{ textAlign: m.role === 'landlord' ? 'right' : 'left', margin: '5px 0' }}>
                        <span style={{ background: m.role === 'landlord' ? '#dcf8c6' : '#fff', padding: '8px 12px', borderRadius: '8px', display: 'inline-block', border: '1px solid #ddd', fontSize: '13px' }}>
                          <strong>{m.sender}: </strong> {m.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder={t.placeholder}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <button type="submit" style={styles.sendBtn}>{t.send}</button>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>

      {modalMedia && (
        <div style={styles.modalOverlay} onClick={() => setModalMedia(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {modalMedia.type === 'image' ? (
              <img src={modalMedia.url} alt="Zoomed" style={styles.zoomedMedia} />
            ) : (
              <video src={modalMedia.url} controls autoPlay style={styles.zoomedMedia} />
            )}
            <br />
            <button onClick={() => setModalMedia(null)} style={styles.closeModalBtn}>{t.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px', background: '#f4f6f9', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px' },
  logoutBtn: { background: '#dc3545', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
  langBtn: { background: '#6c757d', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  
  alertBanner: { background: '#d4edda', border: '1px solid #c3e6cb', padding: '15px', borderRadius: '8px', marginBottom: '20px' },
  alertCard: { background: '#fff', padding: '10px 15px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e3e5', fontSize: '13px' },

  mainLayout: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' },
  leftSection: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  rightSection: { display: 'flex', flexDirection: 'column', gap: '15px' },

  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '15px' },
  propertyCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
  propertyImg: { width: '100%', height: '110px', objectFit: 'cover', cursor: 'pointer' },
  propertyVideo: { width: '100%', height: '80px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px' },
  expandVideoBtn: { background: '#007bff', color: '#fff', border: 'none', width: '100%', padding: '3px', fontSize: '10px', cursor: 'pointer', borderRadius: '3px', marginTop: '2px', fontWeight: 'bold' },
  
  propertyInfo: { padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  price: { color: '#28a745', fontWeight: 'bold', fontSize: '13px', margin: 0 },
  location: { color: '#666', fontSize: '11px', margin: 0 },
  
  editBtn: { background: '#ffc107', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', flex: 1 },
  deleteBtn: { background: '#dc3545', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', flex: 1 },

  card: { background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  toggleMainBtn: { background: '#28a745', color: '#fff', width: '100%', padding: '12px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  toggleChatBtn: { background: '#007bff', color: '#fff', width: '100%', padding: '12px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', position: 'relative' },
  badge: { background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '11px', position: 'absolute', right: '10px', top: '10px' },

  form: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', background: '#fafafa', padding: '12px', borderRadius: '6px', border: '1px solid #eee' },
  input: { padding: '9px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px', width: '100%', boxSizing: 'border-box' },
  fileContainer: { display: 'flex', flexDirection: 'column', background: '#fff', padding: '6px', borderRadius: '5px', border: '1px solid #ddd' },
  addBtn: { background: '#28a745', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  sendBtn: { background: '#007bff', color: '#fff', padding: '9px 12px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  chatBox: { height: '180px', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '5px', padding: '10px', overflowY: 'scroll', marginTop: '10px' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', padding: '20px', borderRadius: '10px', textAlign: 'center', maxWidth: '85%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  zoomedMedia: { maxWidth: '100%', maxHeight: '65vh', borderRadius: '6px', objectFit: 'contain' },
  closeModalBtn: { background: '#dc3545', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold', fontSize: '14px' }
};