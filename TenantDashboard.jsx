import React, { useState, useEffect } from 'react';
import { translations } from './translations';

export default function TenantDashboard() {
  const [lang, setLang] = useState('rw');
  const [properties, setProperties] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalMedia, setModalMedia] = useState(null);
  
  const [likedProperties, setLikedProperties] = useState([]);
  const [selectedPropertyForPayment, setSelectedPropertyForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [monthsCount, setMonthsCount] = useState(1);

  const currentUser = JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('user')) || { name: 'Umukodesha' };
  const t = translations[lang];

  const loadData = () => {
    const savedProperties = JSON.parse(localStorage.getItem('landlordProperties')) || [];
    setProperties(savedProperties);

    const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    setMessages(savedMessages);

    const unread = savedMessages.filter(m => m.role === 'landlord').length;
    setUnreadCount(unread);

    const savedLikes = JSON.parse(localStorage.getItem(`liked_${currentUser.email}`)) || [];
    setLikedProperties(savedLikes);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleLike = (propertyId) => {
    let updatedLikes;
    if (likedProperties.includes(propertyId)) {
      updatedLikes = likedProperties.filter(id => id !== propertyId);
    } else {
      updatedLikes = [...likedProperties, propertyId];
    }
    setLikedProperties(updatedLikes);
    localStorage.setItem(`liked_${currentUser.email}`, JSON.stringify(updatedLikes));
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!phoneNumber && paymentMethod === 'momo') {
      alert(lang === 'rw' ? "Nyamuneka shyiramo nimero ya telefone!" : "Please enter phone number!");
      return;
    }

    const totalPrice = selectedPropertyForPayment.price * monthsCount;

    const rentedRecord = {
      propertyTitle: selectedPropertyForPayment.title,
      months: monthsCount,
      totalAmount: totalPrice,
      tenantName: currentUser.name,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const existingRented = JSON.parse(localStorage.getItem('rentedProperties')) || [];
    const updatedRented = [rentedRecord, ...existingRented];
    
    // Kubika muri localStorage
    localStorage.setItem('rentedProperties', JSON.stringify(updatedRented));
    
    // Gutangaza event kugira ngo Landlord ahite abibona ako kanya
    window.dispatchEvent(new Event('storage'));

    alert(
      lang === 'rw' 
        ? `Ukwishyura inzu "${selectedPropertyForPayment.title}" y'amezi ${monthsCount} (Amafaranga yose: ${totalPrice.toLocaleString()} Frw) byagenze neza! Nyir'inzu abimenye.` 
        : `Payment for "${selectedPropertyForPayment.title}" for ${monthsCount} month(s) (Total: ${totalPrice.toLocaleString()} Frw) was successful! Landlord has been notified.`
    );

    setSelectedPropertyForPayment(null);
    setPhoneNumber('');
    setMonthsCount(1);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: currentUser.name,
      role: 'tenant',
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
        <h2>🏠 {t.tenantDashboard}: {currentUser.name}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={toggleLanguage} style={styles.langBtn}>
            {lang === 'rw' ? 'English 🇺🇸' : 'Kinyarwanda 🇷🇼'}
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>{t.logout}</button>
        </div>
      </header>

      <div style={styles.mainLayout}>
        
        {/* URUHANDE RW'IBUMOSO: Amazu aboneka */}
        <div style={styles.leftSection}>
          <h3>{t.availableProperties} ({properties.length})</h3>
          {properties.length === 0 ? (
            <p style={{ color: '#771', marginTop: '15px' }}>{t.noProperties}</p>
          ) : (
            <div style={styles.gridContainer}>
              {properties.map(p => {
                const isLiked = likedProperties.includes(p.id);
                return (
                  <div key={p.id} style={styles.propertyCard}>
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      style={styles.propertyImg} 
                      onClick={() => setModalMedia({ type: 'image', url: p.image })}
                      title="Kanda kugira ngo ifoto igire nini"
                    />
                    <div style={styles.propertyInfo}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{p.title}</h4>
                      <p style={styles.price}>{p.price.toLocaleString()} Frw / {lang === 'rw' ? 'ukwezi' : 'month'}</p>
                      <p style={styles.location}>📍 {p.location}</p>
                      
                      {p.video && (
                        <div style={{ position: 'relative', marginTop: '5px' }}>
                          <video src={p.video} style={styles.propertyVideo} />
                          <button 
                            onClick={() => setModalMedia({ type: 'video', url: p.video })}
                            style={styles.expandVideoBtn}
                          >
                            🔍 {t.viewVideo}
                          </button>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                        <button 
                          onClick={() => handleToggleLike(p.id)} 
                          style={{
                            ...styles.likeBtn,
                            background: isLiked ? '#dc3545' : '#e0e0e0',
                            color: isLiked ? '#fff' : '#333'
                          }}
                        >
                          {isLiked ? '❤️ Nyishimiye' : '🤍 Shima'}
                        </button>

                        <button 
                          onClick={() => { setSelectedPropertyForPayment(p); setMonthsCount(1); }}
                          style={styles.payBtn}
                        >
                          💳 {lang === 'rw' ? 'Yishyure' : 'Pay'}
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* URUHANDE RW'IBURYO: Chat na Landlord */}
        <div style={styles.rightSection}>
          <div style={styles.card}>
            <button 
              onClick={() => { setShowChat(!showChat); setUnreadCount(0); }} 
              style={styles.toggleChatBtn}
            >
              {showChat ? `✕ ${t.hideChat}` : `💬 ${t.chatWithLandlord}`}
              {unreadCount > 0 && !showChat && <span style={styles.badge}>{unreadCount}</span>}
            </button>

            {showChat && (
              <div style={{ marginTop: '15px' }}>
                <div style={styles.chatBox}>
                  {messages.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginTop: '40px' }}>{t.noMessages}</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} style={{ textAlign: m.role === 'tenant' ? 'right' : 'left', margin: '5px 0' }}>
                        <span style={{ 
                          background: m.role === 'tenant' ? '#007bff' : '#fff', 
                          color: m.role === 'tenant' ? '#fff' : '#000',
                          padding: '8px 12px', 
                          borderRadius: '8px', 
                          display: 'inline-block', 
                          border: '1px solid #ddd', 
                          fontSize: '13px' 
                        }}>
                          <strong>{m.sender}: </strong> {m.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder={t.typeMessage || 'Andika ubutumwa...'}
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

      {/* Modal yo Kwishyura na Amezi */}
      {selectedPropertyForPayment && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPropertyForPayment(null)}>
          <div style={styles.paymentModalContent} onClick={(e) => e.stopPropagation()}>
            <h3>💳 {lang === 'rw' ? 'Kwishyura Inzu' : 'Property Payment'}</h3>
            <p style={{ fontSize: '13px', color: '#555', margin: '5px 0' }}>
              {selectedPropertyForPayment.title}
            </p>
            
            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', textAlign: 'left' }}>
              
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {lang === 'rw' ? 'Hitamo umubare w\'amezi:' : 'Select number of months:'}
                </label>
                <select 
                  value={monthsCount} 
                  onChange={(e) => setMonthsCount(parseInt(e.target.value))} 
                  style={styles.input}
                >
                  <option value={1}>{lang === 'rw' ? 'Ukwezi 1 (1 Month)' : '1 Month'}</option>
                  <option value={2}>{lang === 'rw' ? 'Amezi 2 (2 Months)' : '2 Months'}</option>
                  <option value={3}>{lang === 'rw' ? 'Amezi 3 (3 Months)' : '3 Months'}</option>
                  <option value={6}>{lang === 'rw' ? 'Amezi 6 (6 Months)' : '6 Months'}</option>
                  <option value={12}>{lang === 'rw' ? 'Umwaka 1 (1 Year)' : '1 Year'}</option>
                </select>
              </div>

              <div style={{ background: '#e9f7ef', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#2e7d32' }}>{lang === 'rw' ? 'Amafaranga yose hamwe:' : 'Total Amount:'}</span>
                <h3 style={{ color: '#28a745', margin: '2px 0 0 0' }}>
                  {(selectedPropertyForPayment.price * monthsCount).toLocaleString()} Frw
                </h3>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{lang === 'rw' ? 'Uburyo bwo kwishyura:' : 'Payment Method:'}</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)} 
                  style={styles.input}
                >
                  <option value="momo">Mobile Money (MTN / Airtel)</option>
                  <option value="card">Bank Card / Credit Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {paymentMethod === 'momo' && (
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>{lang === 'rw' ? 'Nimero ya Telefone:' : 'Phone Number:'}</label>
                  <input 
                    type="text" 
                    placeholder="078... / 072..." 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button type="submit" style={{ ...styles.sendBtn, flex: 1, background: '#28a745' }}>
                  {lang === 'rw' ? 'Emeza Kwishyura' : 'Confirm Payment'}
                </button>
                <button type="button" onClick={() => setSelectedPropertyForPayment(null)} style={{ ...styles.closeModalBtn, marginTop: 0, flex: 1 }}>
                  {t.close || 'Funga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalMedia && (
        <div style={styles.modalOverlay} onClick={() => setModalMedia(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {modalMedia.type === 'image' ? (
              <img src={modalMedia.url} alt="Zoomed" style={styles.zoomedMedia} />
            ) : (
              <video src={modalMedia.url} controls autoPlay style={styles.zoomedMedia} />
            )}
            <br />
            <button onClick={() => setModalMedia(null)} style={styles.closeModalBtn}>{t.close || 'Funga'}</button>
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
  
  mainLayout: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' },
  leftSection: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  rightSection: { display: 'flex', flexDirection: 'column', gap: '15px' },

  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '15px' },
  propertyCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
  propertyImg: { width: '100%', height: '110px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s' },
  propertyVideo: { width: '100%', height: '80px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px' },
  expandVideoBtn: { background: '#007bff', color: '#fff', border: 'none', width: '100%', padding: '3px', fontSize: '10px', cursor: 'pointer', borderRadius: '3px', marginTop: '2px', fontWeight: 'bold' },
  
  propertyInfo: { padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  price: { color: '#28a745', fontWeight: 'bold', fontSize: '13px', margin: 0 },
  location: { color: '#666', fontSize: '11px', margin: 0 },

  likeBtn: { border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', flex: 1 },
  payBtn: { background: '#28a745', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', flex: 1 },

  card: { background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  toggleChatBtn: { background: '#007bff', color: '#fff', width: '100%', padding: '12px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', position: 'relative' },
  badge: { background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '11px', position: 'absolute', right: '10px', top: '10px' },

  input: { padding: '9px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px', width: '100%', boxSizing: 'border-box' },
  sendBtn: { background: '#007bff', color: '#fff', padding: '9px 12px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  chatBox: { height: '240px', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '5px', padding: '10px', overflowY: 'scroll', marginTop: '10px' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', padding: '20px', borderRadius: '10px', textAlign: 'center', maxWidth: '85%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  paymentModalContent: { background: '#fff', padding: '25px', borderRadius: '10px', textAlign: 'center', width: '100%', maxWidth: '380px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
  zoomedMedia: { maxWidth: '100%', maxHeight: '65vh', borderRadius: '6px', objectFit: 'contain' },
  closeModalBtn: { background: '#dc3545', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold', fontSize: '14px' }
};