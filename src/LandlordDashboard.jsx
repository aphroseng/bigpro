import React, { useState, useEffect } from 'react';
import { translations } from './translations';
import { db } from './js/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';

export default function LandlordDashboard() {
  const [lang, setLang] = useState('rw');
  const [properties, setProperties] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [rentedAlerts, setRentedAlerts] = useState([]);
  
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [showReceivedNoticesModal, setShowReceivedNoticesModal] = useState(false);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(''); 
  const [video, setVideo] = useState(''); 
  const [videoDuration, setVideoDuration] = useState(0);
  const [propertyLandlordEmail, setPropertyLandlordEmail] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [targetProperty, setTargetProperty] = useState(null);
  const [noticeReason, setNoticeReason] = useState('');
  const [propertyNotices, setPropertyNotices] = useState([]);

  const [activeTenantEmail, setActiveTenantEmail] = useState(null);
  const [unopenedNoticesCount, setUnopenedNoticesCount] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('user')) || { name: 'Nyir\'inzu', email: 'landlord@example.com' };
  const t = translations[lang] || {};

  useEffect(() => {
    const unsubscribeProps = onSnapshot(collection(db, "properties"), (snapshot) => {
      const propsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const myProps = propsList.filter(p => 
        p.landlordEmail === currentUser.email || 
        p.landlordName === currentUser.name ||
        p.email === currentUser.email
      );
      setProperties(myProps);
    });

    const qChat = query(collection(db, "chatMessages"), where("landlordEmail", "==", currentUser.email));
    const unsubscribeChat = onSnapshot(qChat, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(chatList);
      
      const unread = chatList.filter(m => m.role === 'tenant' && !m.read).length;
      setUnreadCount(unread);
    });

    const loadRentedData = () => {
      const savedRented = JSON.parse(localStorage.getItem('rentedProperties')) || [];
      const myPropertiesTitles = properties.map(p => p.title);
      const filteredRented = savedRented.filter(item => 
        myPropertiesTitles.includes(item.propertyTitle) || item.landlordEmail === currentUser.email
      );
      setRentedAlerts(filteredRented);

      const savedNotices = JSON.parse(localStorage.getItem('propertyNotices')) || [];
      setPropertyNotices(savedNotices);

      const unopened = savedNotices.filter(n => n.requestedBy === 'Tenant' && !n.isOpened).length;
      setUnopenedNoticesCount(unopened);
    };

    loadRentedData();
    window.addEventListener('storage', loadRentedData);

    return () => {
      unsubscribeProps();
      unsubscribeChat();
      window.removeEventListener('storage', loadRentedData);
    };
  }, [currentUser.email, currentUser.name, properties.length]);

  const handleOpenNotice = (noticeIndex) => {
    const savedNotices = JSON.parse(localStorage.getItem('propertyNotices')) || [];
    
    const updatedNotices = savedNotices.map((n, idx) => {
      if (idx === noticeIndex) {
        return { ...n, isOpened: true };
      }
      return n;
    });

    localStorage.setItem('propertyNotices', JSON.stringify(updatedNotices));
    setPropertyNotices(updatedNotices);

    const unopened = updatedNotices.filter(n => n.requestedBy === 'Tenant' && !n.isOpened).length;
    setUnopenedNoticesCount(unopened);
  };

  const handleDeleteNotice = (noticeIndex) => {
    if (window.confirm(lang === 'rw' ? "Uremeza ko ushaka gusiba iyi nzu/integuza?" : "Are you sure you want to delete this notice?")) {
      const savedNotices = JSON.parse(localStorage.getItem('propertyNotices')) || [];
      const updatedNotices = savedNotices.filter((_, idx) => idx !== noticeIndex);
      
      localStorage.setItem('propertyNotices', JSON.stringify(updatedNotices));
      setPropertyNotices(updatedNotices);

      const unopened = updatedNotices.filter(n => n.requestedBy === 'Tenant' && !n.isOpened).length;
      setUnopenedNoticesCount(unopened);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setVideo('');
      setVideoDuration(0);
      return;
    }

    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    
    videoElement.onloadedmetadata = function() {
      window.URL.revokeObjectURL(videoElement.src);
      const durationInSeconds = videoElement.duration;
      
      if (durationInSeconds > 300) {
        alert(lang === 'rw' ? "Videwo ntishobora kurenza iminota 5!" : "Video cannot exceed 5 minutes!");
        setVideo('');
        setVideoDuration(0);
        e.target.value = null;
      } else {
        setVideoDuration(durationInSeconds);
        setVideo(URL.createObjectURL(file));
      }
    }
    
    videoElement.src = URL.createObjectURL(file);
  };

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    if (!title || !price || !location) {
      alert(lang === 'rw' ? "Nyamuneka yuzuza amazina y'inzu, igiciro n'aho iherereye!" : "Please fill in the title, price, and location!");
      return;
    }

    const finalEmail = propertyLandlordEmail.trim() ? propertyLandlordEmail : currentUser.email;

    try {
      if (editingId) {
        const propRef = doc(db, "properties", editingId);
        await updateDoc(propRef, {
          title,
          price: Number(price),
          location,
          image: image || '',
          video: video || '',
          landlordEmail: finalEmail
        });
        setEditingId(null);
        alert(lang === 'rw' ? "Inzu yavuguruwe neza!" : "Property updated successfully!");
      } else {
        await addDoc(collection(db, "properties"), {
          title,
          price: Number(price),
          location,
          image: image || '',
          video: video || '',
          landlordName: currentUser.name,
          landlordEmail: finalEmail,
          createdAt: new Date()
        });
        alert(lang === 'rw' ? "Inzu yongeweho neza!" : "Property added successfully!");
      }

      setTitle('');
      setPrice('');
      setLocation('');
      setImage('');
      setVideo('');
      setPropertyLandlordEmail('');
      setVideoDuration(0);
    } catch (error) {
      console.error("Error saving property: ", error);
      alert("Habaye ikibazo mu kubika inzu.");
    }
  };

  const handleEdit = (prop) => {
    setEditingId(prop.id);
    setTitle(prop.title);
    setPrice(prop.price);
    setLocation(prop.location);
    setImage(prop.image || '');
    setVideo(prop.video || '');
    setPropertyLandlordEmail(prop.landlordEmail || currentUser.email);
  };

  const handleDelete = async (id) => {
    if (window.confirm(lang === 'rw' ? "Uremeza ko ushaka gusiba iyi nzu?" : "Are you sure you want to delete this property?")) {
      try {
        await deleteDoc(doc(db, "properties", id));
      } catch (error) {
        console.error("Error deleting property: ", error);
      }
    }
  };

  const handleSendLandlordNotice = (e) => {
    e.preventDefault();
    if (!noticeReason.trim() || !targetProperty) return;

    const noticeRecord = {
      propertyTitle: targetProperty.propertyTitle || targetProperty.title,
      tenantName: targetProperty.tenantName || 'Umukodesha',
      tenantEmail: targetProperty.tenantEmail || 'N/A',
      reason: noticeReason,
      noticeDays: 15,
      requestedBy: 'Landlord',
      isOpened: true,
      date: new Date().toLocaleDateString()
    };

    const existingNotices = JSON.parse(localStorage.getItem('propertyNotices')) || [];
    const updatedNotices = [noticeRecord, ...existingNotices];
    localStorage.setItem('propertyNotices', JSON.stringify(updatedNotices));
    setPropertyNotices(updatedNotices);

    alert(lang === 'rw' ? "Integuza y'iminsi 15 n'impamvu byoherejwe neza!" : "15-day notice and reason sent successfully!");
    setShowNoticeModal(false);
    setNoticeReason('');
    setTargetProperty(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!activeTenantEmail) {
      alert(lang === 'rw' ? "Nyamuneka banza uhitemo umukodesha wifuza gusubiza!" : "Please select a tenant to reply to!");
      return;
    }

    try {
      await addDoc(collection(db, "chatMessages"), {
        sender: currentUser.name,
        role: 'landlord',
        text,
        tenantEmail: activeTenantEmail,
        landlordEmail: currentUser.email,
        createdAt: new Date()
      });
      setText('');
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const toggleLanguage = () => {
    setLang(lang === 'rw' ? 'en' : 'rw');
  };

  const uniqueTenants = Array.from(
    new Set(messages.map(m => m.tenantEmail).filter(Boolean))
  );

  const activeChatMessages = activeTenantEmail 
    ? messages.filter(m => m.tenantEmail === activeTenantEmail)
    : [];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>🏢 {t.landlordDashboard || "Landlord Dashboard"}: {currentUser.name}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* 1. TANGA INTEGUZA */}
          <button 
            onClick={() => {
              if (rentedAlerts.length > 0) {
                setTargetProperty(rentedAlerts[0]);
                setShowNoticeModal(true);
              } else {
                alert(lang === 'rw' ? "Nta mukodesha uraboneka wo guha integuza." : "No rented properties available to give notice for.");
              }
            }} 
            style={styles.globalNoticeBtn}
          >
            ⚠️ {lang === 'rw' ? 'Tanga Integuza' : 'Send Notice'}
          </button>

          {/* 2. AKIRA INTEGUZA */}
          <button 
            onClick={() => setShowReceivedNoticesModal(true)} 
            style={styles.receivedNoticesHeaderBtn}
          >
            📥 {lang === 'rw' ? 'Akira Integuza' : 'Received Notices'}
            {unopenedNoticesCount > 0 && (
              <span style={styles.headerBadge}>{unopenedNoticesCount}</span>
            )}
          </button>

          {/* 3. ABISHYUYE INZU */}
          <button 
            onClick={() => setShowPaymentsModal(true)} 
            style={styles.viewPaymentsBtn}
          >
            📋 {lang === 'rw' ? 'Abishyuye Inzu' : 'View Payments'} ({rentedAlerts.length})
          </button>

          {/* 4. CHAT BUTTON YASHYIZWE KU MURUMGO W'IZINDI BUTTONS */}
          <button 
            onClick={() => { setShowChat(!showChat); setUnreadCount(0); }} 
            style={styles.chatHeaderBtn}
          >
            💬 {showChat ? (lang === 'rw' ? 'Funga Chat' : 'Hide Chat') : (lang === 'rw' ? 'Chat n\'Abakodesha' : 'Chat Tenants')}
            {unreadCount > 0 && !showChat && (
              <span style={styles.headerBadge}>{unreadCount}</span>
            )}
          </button>
          
          <button onClick={toggleLanguage} style={styles.langBtn}>
            {lang === 'rw' ? 'English 🇺🇸' : 'Kinyarwanda 🇷🇼'}
          </button>
          
          <button onClick={handleLogout} style={styles.logoutBtn}>{t.logout || "Sohoka"}</button>
        </div>
      </header>

      {/* MODAL Y'INTEGUZA ZAKIRIWE (RECEIVED NOTICES MODAL) */}
      {showReceivedNoticesModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
                📥 {lang === 'rw' ? 'Integuza Wakiriye mu Zindi Nzu (Received Notices)' : 'Received Notices from Tenants'}
              </h3>
              <button onClick={() => setShowReceivedNoticesModal(false)} style={styles.closeModalBtn}>✕</button>
            </div>

            <div style={styles.modalBody}>
              {propertyNotices.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', fontSize: '13px' }}>
                  {lang === 'rw' ? 'Nta nteguza cyangwa impamvu z\'ubwimukiro zirabaho.' : 'No notices recorded yet.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {propertyNotices.map((notice, index) => {
                    const isTenantNotice = notice.requestedBy === 'Tenant';
                    const isOpened = notice.isOpened;

                    return (
                      <div key={index} style={{ background: isOpened ? '#fff3cd' : '#e2e3e5', border: '1px solid #ffeeba', padding: '12px', borderRadius: '6px', position: 'relative' }}>
                        
                        <button 
                          onClick={() => handleDeleteNotice(index)} 
                          style={styles.deleteNoticeBtn}
                          title={lang === 'rw' ? 'Siba iyi nteguza' : 'Delete notice'}
                        >
                          ✕
                        </button>

                        <p style={{ fontSize: '13px', margin: '0 0 5px 0' }}>
                          🏠 Inzu: <b>{notice.propertyTitle}</b> | Yatanwe na: <b>{isTenantNotice ? (lang === 'rw' ? 'Umukodesha' : 'Tenant') : (lang === 'rw' ? 'Nyir\'inzu' : 'Landlord')}</b>
                        </p>
                        <p style={{ fontSize: '12px', margin: '0 0 5px 0', color: '#333' }}>
                          👤 Umukodesha: <b>{notice.tenantName}</b> ({notice.tenantEmail})
                        </p>

                        {isTenantNotice && !isOpened ? (
                          <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px dashed #ccc', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#856404', fontWeight: 'bold' }}>
                              ⚠️ {lang === 'rw' ? 'Wahawe integuza n\'uyu mukodesha. Kanda hano ngo uyakire uyifungure:' : 'You received a notice. Click to receive & open:'}
                            </span>
                            <button 
                              onClick={() => handleOpenNotice(index)} 
                              style={styles.receiveNoticeBtn}
                            >
                              📩 {lang === 'rw' ? 'Received Notice (Fungura)' : 'Received Notice'}
                            </button>
                          </div>
                        ) : (
                          <>
                            <p style={{ fontSize: '12px', margin: '0 0 5px 0', color: '#856404' }}>
                              ⏳ Integuza: <b>Iminsi {notice.noticeDays || 15}</b>
                            </p>
                            <p style={{ fontSize: '12px', margin: '0', color: '#555' }}>
                              💬 Impamvu: <b>{notice.reason}</b>
                            </p>
                            <span style={{ fontSize: '10px', color: '#28a745', display: 'block', marginTop: '5px', fontWeight: 'bold' }}>
                              ✓ {lang === 'rw' ? 'Yarakiriwe kandi yafunguwe (Received & Opened)' : 'Received & Opened'}
                            </span>
                          </>
                        )}
                        <span style={{ fontSize: '10px', color: '#999', display: 'block', marginTop: '5px' }}>
                          Tariki: {notice.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL Y'ABISHYUYE INZU */}
      {showPaymentsModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
                📋 {lang === 'rw' ? 'Urutonde rw\'abishyuye amazu yawe n\'Igikorwa cy\'Integuza' : 'List of Tenants Who Paid'}
              </h3>
              <button onClick={() => setShowPaymentsModal(false)} style={styles.closeModalBtn}>✕</button>
            </div>

            <div style={styles.modalBody}>
              {rentedAlerts.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', fontSize: '13px' }}>
                  {lang === 'rw' ? 'Nta muntu urishyura inzu yawe.' : 'No payments recorded yet.'}
                </p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr style={{ background: '#f1f3f5', textAlign: 'left', fontSize: '12px' }}>
                      <th style={styles.th}>Umukodesha</th>
                      <th style={styles.th}>Inzu</th>
                      <th style={styles.th}>Amezi</th>
                      <th style={styles.th}>Amafaranga</th>
                      <th style={styles.th}>Uburyo</th>
                      <th style={styles.th}>Itariki</th>
                      <th style={styles.th}>Igikorwa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentedAlerts.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee', fontSize: '12px' }}>
                        <td style={styles.td}><b>{item.tenantName}</b><br/><span style={{ fontSize: '10px', color: '#666' }}>{item.tenantEmail}</span></td>
                        <td style={styles.td}>{item.propertyTitle}</td>
                        <td style={styles.td}>{item.months} {lang === 'rw' ? 'Amezi' : 'Months'}</td>
                        <td style={{ ...styles.td, color: '#28a745', fontWeight: 'bold' }}>{Number(item.totalAmount).toLocaleString()} Frw</td>
                        <td style={styles.td}>{item.paymentMethod || 'MoMo'}</td>
                        <td style={styles.td}>{item.date}</td>
                        <td style={styles.td}>
                          <button 
                            onClick={() => { setTargetProperty(item); setShowNoticeModal(true); }} 
                            style={styles.noticeActionBtn}
                          >
                            ⚠️ {lang === 'rw' ? 'Integuza (Iminsi 15)' : '15-Day Notice'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHAT SECTION FUNGURWA/FUNGA (Niba showChat ari true iragaragara) */}
      {showChat && (
        <div style={styles.chatSectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>💬 {lang === 'rw' ? 'Ibiganiro n\'Abakodesha (Chat with Tenants)' : 'Chat with Tenants'}</h3>
            <button onClick={() => setShowChat(false)} style={styles.closeModalBtn}>✕</button>
          </div>

          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '5px' }}>
            {lang === 'rw' ? 'Hitamo umukodesha wifuza gusubiza:' : 'Select tenant to reply:'}
          </label>
          <select 
            value={activeTenantEmail || ''} 
            onChange={(e) => setActiveTenantEmail(e.target.value)} 
            style={{ ...styles.input, marginBottom: '10px' }}
          >
            <option value="">-- {lang === 'rw' ? 'Hitamo umukodesha' : 'Select tenant'} --</option>
            {uniqueTenants.map((email, idx) => (
              <option key={idx} value={email}>{email}</option>
            ))}
          </select>

          {activeTenantEmail ? (
            <>
              <div style={styles.chatBox}>
                {activeChatMessages.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginTop: '40px' }}>{t.noMessages || "Nta butumwa burabaho n'uyu mukodesha"}</p>
                ) : (
                  activeChatMessages.map((m) => (
                    <div key={m.id} style={{ textAlign: m.role === 'landlord' ? 'right' : 'left', margin: '5px 0' }}>
                      <span style={{ 
                        background: m.role === 'landlord' ? '#28a745' : '#fff', 
                        color: m.role === 'landlord' ? '#fff' : '#000',
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        display: 'inline-block', 
                        border: '1px solid #ddd', 
                        fontSize: '13px',
                        maxWidth: '80%',
                        textAlign: 'left'
                      }}>
                        <strong style={{ display: 'block', fontSize: '10px', opacity: 0.8 }}>{m.sender} ({m.propertyTitle || ''})</strong>
                        {m.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
              
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder={t.typeMessage || 'Andika ubutumwa bwo gusubiza...'}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                />
                <button type="submit" style={styles.sendBtn}>{t.send || "Ohereza"}</button>
              </form>
            </>
          ) : (
            <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', padding: '20px', background: '#f9f9f9', borderRadius: '5px' }}>
              {lang === 'rw' ? "Nyamuneka banza uhitemo umukodesha mu rutonde ruri hejuru kugira ngo osome cyangwa umusubize." : "Please select a tenant above to view or reply to messages."}
            </p>
          )}
        </div>
      )}

      {/* MAIN LAYOUT (GUTANGA INZU N'AMAZU WANDITSE) */}
      <div style={styles.mainLayoutSingle}>
        
        <div style={styles.card}>
          <h3>{editingId ? (lang === 'rw' ? "Vugurura Inzu" : "Edit Property") : (lang === 'rw' ? "Ongeraho Inzu Nshya" : "Add New Property")}</h3>
          <form onSubmit={handleSaveProperty} style={styles.formGrid}>
            <input 
              type="text" 
              placeholder={t.propertyTitle || "Izina ry'inzu (Urugero: Apartment Kicukiro)"} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              style={styles.input} 
              required 
            />
            <input 
              type="number" 
              placeholder={t.pricePerMonth || "Igiciro ku kwezi (Frw)"} 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              style={styles.input} 
              required 
            />
            <input 
              type="text" 
              placeholder={t.location || "Aho iherereye (Urugero: Kigali, Gasabo)"} 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              style={styles.input} 
              required 
            />
            <input 
              type="text" 
              placeholder={t.imageUrl || "URL y'Ifoto y'inzu (Si itegeko)"} 
              value={image} 
              onChange={(e) => setImage(e.target.value)} 
              style={styles.input} 
            />
            <input 
              type="email" 
              placeholder="Email ya Nyir'inzu (Urugero: landlord@example.com)" 
              value={propertyLandlordEmail} 
              onChange={(e) => setPropertyLandlordEmail(e.target.value)} 
              style={{ ...styles.input, gridColumn: '1 / -1' }} 
            />
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#666' }}>
                {lang === 'rw' ? "Hitamo Videwo y'inzu (Ntirenze iminota 5 - Si itegeko):" : "Select Property Video (Max 5 mins - Optional):"}
              </label>
              <input 
                type="file" 
                accept="video/*" 
                onChange={handleVideoChange} 
                style={{ ...styles.input, background: '#fff' }} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', gridColumn: '1 / -1' }}>
              <button type="submit" style={styles.submitBtn}>
                {editingId ? (lang === 'rw' ? "Hindura Inzu" : "Update Property") : (lang === 'rw' ? "Emeza / Shyiraho" : "Save Property")}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setTitle(''); setPrice(''); setLocation(''); setImage(''); setVideo(''); setPropertyLandlordEmail(''); }} style={styles.cancelBtn}>
                  {lang === 'rw' ? "Hagarika" : "Cancel"}
                </button>
              )}
            </div>
          </form>
        </div>

        <h3 style={{ marginTop: '25px' }}>{t.myProperties || "Amazu Wewe Washyizeho Gusa"} ({properties.length})</h3>
        <div style={styles.gridContainer}>
          {properties.map(p => (
            <div key={p.id} style={styles.propertyCard}>
              {p.image ? (
                <img src={p.image} alt={p.title} style={styles.propertyImg} />
              ) : (
                <div style={styles.noImageView}>{lang === 'rw' ? 'Nta foto ihari' : 'No Image'}</div>
              )}
              <div style={styles.propertyInfo}>
                <h4 style={{ margin: '0 0 5px 0' }}>{p.title}</h4>
                <p style={styles.price}>{Number(p.price).toLocaleString()} Frw / {lang === 'rw' ? 'ukwezi' : 'month'}</p>
                <p style={styles.location}>📍 {p.location}</p>
                <p style={{ fontSize: '10px', color: '#007bff', margin: 0 }}>📧 {p.landlordEmail}</p>
                <div style={{ display: 'flex', gap: '5px', marginTop: 'auto' }}>
                  <button onClick={() => handleEdit(p)} style={styles.editBtn}>{lang === 'rw' ? 'Hindura' : 'Edit'}</button>
                  <button onClick={() => handleDelete(p.id)} style={styles.deleteBtn}>{lang === 'rw' ? 'Siba' : 'Delete'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {showNoticeModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardNotice}>
            <h3>⚠️ {lang === 'rw' ? 'Gutanga Integuza y\'Iminsi 15 y\'Ukwirukana' : 'Give 15-Day Notice'}</h3>
            <p style={{ fontSize: '12px', color: '#555' }}>Inzu: <b>{targetProperty?.propertyTitle}</b></p>
            <p style={{ fontSize: '12px', color: '#555' }}>Umukodesha: <b>{targetProperty?.tenantName}</b></p>
            
            <form onSubmit={handleSendLandlordNotice} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{lang === 'rw' ? 'Impamvu yo kwirukana / gutanga integuza:' : 'Reason for notice:'}</label>
              <textarea 
                rows="4" 
                placeholder={lang === 'rw' ? "Andika impamvu (Urugero: Kwishyura nabi, gusana inzu...)" : "Enter reason..."} 
                value={noticeReason} 
                onChange={(e) => setNoticeReason(e.target.value)} 
                style={styles.inputModal} 
                required 
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button type="submit" style={styles.payConfirmBtn}>{lang === 'rw' ? 'Ohereza Integuza' : 'Send Notice'}</button>
                <button type="button" onClick={() => setShowNoticeModal(false)} style={styles.cancelBtn}>{lang === 'rw' ? 'Hagarika' : 'Cancel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px', background: '#f4f6f9', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  logoutBtn: { background: '#dc3545', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
  langBtn: { background: '#6c757d', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  viewPaymentsBtn: { background: '#17a2b8', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  globalNoticeBtn: { background: '#ffc107', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  receivedNoticesHeaderBtn: { background: '#007bff', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', position: 'relative', display: 'flex', alignItems: 'center', gap: '5px' },
  chatHeaderBtn: { background: '#6610f2', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', position: 'relative', display: 'flex', alignItems: 'center', gap: '5px' },
  headerBadge: { background: 'red', color: 'white', borderRadius: '50%', padding: '1px 6px', fontSize: '10px', fontWeight: 'bold', marginLeft: '5px' },
  receiveNoticeBtn: { background: '#007bff', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  deleteNoticeBtn: { position: 'absolute', top: '10px', right: '10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { background: '#fff', padding: '20px', borderRadius: '8px', width: '650px', maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' },
  modalCardNotice: { background: '#fff', padding: '20px', borderRadius: '8px', width: '380px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
  closeModalBtn: { background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', color: '#888' },
  modalBody: { overflowY: 'scroll', flex: 1, marginTop: '10px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px', borderBottom: '2px solid #ddd', color: '#441' },
  td: { padding: '8px', borderBottom: '1px solid #eee' },
  noticeActionBtn: { background: '#ffc107', color: '#000', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  mainLayoutSingle: { display: 'flex', flexDirection: 'column', gap: '15px' },
  chatSectionCard: { background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #6610f2' },
  card: { background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' },
  input: { padding: '9px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px', width: '100%', boxSizing: 'border-box' },
  inputModal: { width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px', boxSizing: 'border-box', marginTop: '3px' },
  submitBtn: { background: '#28a745', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: 1 },
  cancelBtn: { background: '#6c757d', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: 1 },
  payConfirmBtn: { background: '#d9534f', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: 1 },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '15px' },
  propertyCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
  propertyImg: { width: '100%', height: '110px', objectFit: 'cover' },
  noImageView: { width: '100%', height: '110px', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d', fontSize: '12px' },
  propertyInfo: { padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  price: { color: '#28a745', fontWeight: 'bold', fontSize: '13px', margin: 0 },
  location: { color: '#666', fontSize: '11px', margin: 0 },
  editBtn: { background: '#ffc107', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', flex: 1 },
  deleteBtn: { background: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', flex: 1 },
  sendBtn: { background: '#007bff', color: '#fff', padding: '9px 12px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  chatBox: { height: '240px', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '5px', padding: '10px', overflowY: 'scroll', marginTop: '10px' }
};