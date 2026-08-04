import React, { useState, useEffect } from 'react';
import { db } from './js/firebase';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';

// ==========================================
// 0. TRANSLATIONS OBJECT
// ==========================================
const translations = {
  rw: {
    welcome: "Muraho",
    tenant: "Umukodesha",
    myMessages: "Ubutumwa bwanjye",
    logout: "Sohoka",
    chatHistoryTitle: "Amateka y'ibiganiro byawe na ba nyir'inzu",
    noMessages: "Nta butumwa burabaho.",
    searchPlaceholder: "Shakisha inzu ukoresha izina cyangwa aho iherereye...",
    availableProperties: "Amazu aboneka",
    noProperties: "Nta nzu zibonetse.",
    landlord: "Nyir'inzu",
    notSpecified: "Ntabwo yashyizweho",
    rentedNotice: "Yamaze Kwishyurwa / Ifite Umukodesha",
    futureRentNotice: "⚠️ Iyi nzu ifite umukodesha ariko uzavamo nyuma y'integuza. Ushobora kuyishyura ukayinjyamo nyuma.",
    rentBtn: "Kodesha / Ishyura (MoMo & Bank)",
    disabledRentBtn: "Ifite Umukodesha (Yishyuwe)",
    moveOutBtn: "Tanga Integuza y'iminsi 15 yo Kwimuka",
    noticeAlreadySubmittedMsg: "ℹ️ Wamaze gutanga integuza y'iminsi 15 kuri iyi nzu.",
    chatBtn: "Vugana na nyir'inzu",
    payModalTitle: "Kwishyura Inzu",
    monthlyPrice: "Igiciro ku kwezi",
    selectMonths: "Hitamo amezi yo kwishyura:",
    paymentMethod: "Uburyo bwo Kwishyura:",
    mtnOption: "MTN Mobile Money",
    tigoOption: "Tigo / Airtel Money",
    bankOption: "Banki (Bank Transfer)",
    phoneNumberLabel: "Nimero ya Telefone:",
    bankAccountLabel: "Nimero ya Konti ya Banki:",
    totalAmount: "Amafaranga yose hamwe",
    confirmPayment: "Emeza Kwishyura",
    cancel: "Hagarika",
    moveOutModalTitle: "Gutanga Integuza yo Kuva mu Nzu (Iminsi 15)",
    moveOutReasonLabel: "Andika Impamvu yo kuva mu nzu:",
    moveOutWarning: "⚠️ Iyi nteguro izaha nyir'inzu iminsi 15 yo kumenya ko ugiye.",
    sendNotice: "Ohereza Integuza",
    typeMessage: "Andika ubutumwa...",
    send: "Ohereza",
    successPayment: "Wishyuye neza inzu",
    successNotice: "Impamvu yawe yo kuva mu nzu n'integuza y'iminsi 15 byoherejwe kuri nyir'inzu neza!"
  },
  en: {
    welcome: "Hello",
    tenant: "Tenant",
    myMessages: "My Messages",
    logout: "Logout",
    chatHistoryTitle: "Chat History with Landlords",
    noMessages: "No messages yet.",
    searchPlaceholder: "Search property by name or location...",
    availableProperties: "Available Properties",
    noProperties: "No properties found.",
    landlord: "Landlord",
    notSpecified: "Not specified",
    rentedNotice: "Already Rented / Occupied",
    futureRentNotice: "⚠️ This property has a current tenant leaving after notice. You can pay now and move in later.",
    rentBtn: "Rent / Pay (MoMo & Bank)",
    disabledRentBtn: "Occupied (Paid)",
    moveOutBtn: "Give 15-Day Move-Out Notice",
    noticeAlreadySubmittedMsg: "ℹ️ You have already submitted a 15-day notice for this property.",
    chatBtn: "Chat with Landlord",
    payModalTitle: "Pay Property Rent",
    monthlyPrice: "Monthly Price",
    selectMonths: "Select months to pay:",
    paymentMethod: "Payment Method:",
    mtnOption: "MTN Mobile Money",
    tigoOption: "Tigo / Airtel Money",
    bankOption: "Bank Transfer",
    phoneNumberLabel: "Phone Number:",
    bankAccountLabel: "Bank Account Number:",
    totalAmount: "Total Amount",
    confirmPayment: "Confirm Payment",
    cancel: "Cancel",
    moveOutModalTitle: "Give 15-Day Move-Out Notice",
    moveOutReasonLabel: "Enter reason for moving out:",
    moveOutWarning: "⚠️ This notice will give the landlord 15 days advance notice.",
    sendNotice: "Send Notice",
    typeMessage: "Type a message...",
    send: "Send",
    successPayment: "Successfully paid for property",
    successNotice: "Your move-out reason and 15-day notice were sent successfully!"
  }
};

// ==========================================
// 1. TENANT CHAT COMPONENT
// ==========================================
function TenantChatComponent({ property, t }) {
  const [chatText, setChatText] = useState('');
  const [showChatBox, setShowChatBox] = useState(false);

  const currentTenant = JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('user')) || { name: 'Umukodesha', email: 'tenant@example.com' };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    if (!property.landlordEmail) {
      alert("Iyi nzu nta email ya nyir'ayo ifite, ntushobora kohereza ubutumwa.");
      return;
    }

    try {
      await addDoc(collection(db, "chatMessages"), {
        sender: currentTenant.name,
        tenantEmail: currentTenant.email,
        landlordEmail: property.landlordEmail,
        propertyTitle: property.title,
        role: 'tenant',
        text: chatText,
        read: false,
        createdAt: new Date()
      });

      setChatText('');
      alert("Ubutumwa bwohererejwe nyir'inzu neza!");
    } catch (error) {
      console.error("Error sending message: ", error);
      alert("Habaye ikibazo mu kohereza ubutumwa.");
    }
  };

  return (
    <div style={{ marginTop: '5px' }}>
      {!showChatBox ? (
        <button onClick={() => setShowChatBox(true)} style={styles.chatBtn}>
          💬 {t.chatBtn}
        </button>
      ) : (
        <div style={styles.chatContainer}>
          <div style={styles.infoBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#007bff' }}>💬 {t.chatBtn}</span>
              <button onClick={() => setShowChatBox(false)} style={styles.closeBtn}>✕</button>
            </div>
            <p style={{ fontSize: '11px', margin: '4px 0 2px 0', color: '#333' }}>
              🏠 Inzu: <b>{property.title}</b>
            </p>
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
            <input 
              type="text" 
              placeholder={t.typeMessage} 
              value={chatText} 
              onChange={(e) => setChatText(e.target.value)} 
              style={styles.input} 
              required
            />
            <button type="submit" style={styles.sendBtn}>{t.send}</button>
          </form>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. MAIN TENANT DASHBOARD COMPONENT
// ==========================================
export default function TenantDashboard() {
  const [lang, setLang] = useState('rw');
  const t = translations[lang];

  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [myChats, setMyChats] = useState([]);
  const [showMyMessages, setShowMyMessages] = useState(false);
  const [rentedPropertiesList, setRentedPropertiesList] = useState([]);
  const [propertyNotices, setPropertyNotices] = useState([]);

  // States zo kwishyura inzu
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [months, setMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  // States z'impamvu zo kuva mu nzu cyangwa integuza (Préavis)
  const [showMoveOutModal, setShowMoveOutModal] = useState(false);
  const [moveOutReason, setMoveOutReason] = useState('');
  const [targetPropertyToLeave, setTargetPropertyToLeave] = useState(null);

  const currentTenant = JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('user')) || { name: 'Umukodesha', email: 'tenant@example.com' };

  useEffect(() => {
    const unsubscribeProps = onSnapshot(collection(db, "properties"), (snapshot) => {
      const propsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProperties(propsList);
    });

    const qChat = query(collection(db, "chatMessages"));
    const unsubscribeChat = onSnapshot(qChat, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const tenantMessages = chatList.filter(m => m.tenantEmail === currentTenant.email);
      setMyChats(tenantMessages);
    });

    const loadRentedData = () => {
      const savedRented = JSON.parse(localStorage.getItem('rentedProperties')) || [];
      setRentedPropertiesList(savedRented);

      const savedNotices = JSON.parse(localStorage.getItem('propertyNotices')) || [];
      setPropertyNotices(savedNotices);
    };
    loadRentedData();

    window.addEventListener('storage', loadRentedData);

    return () => {
      unsubscribeProps();
      unsubscribeChat();
      window.removeEventListener('storage', loadRentedData);
    };
  }, [currentTenant.email]);

  const handleLogout = () => {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedProperty) return;

    if (paymentMethod === 'MTN' || paymentMethod === 'TIGO') {
      if (!phoneNumber || phoneNumber.length < 10) {
        alert("Nyamuneka shyiramo nimero ya telefone yuzuye.");
        return;
      }
    } else if (paymentMethod === 'BANK') {
      if (!bankAccountNumber) {
        alert("Nyamuneka shyiramo nimero ya konti ya banki.");
        return;
      }
    }

    const totalAmount = selectedProperty.price * Number(months);
    const paymentRecord = {
      propertyId: selectedProperty.id,
      tenantName: currentTenant.name,
      tenantEmail: currentTenant.email,
      propertyTitle: selectedProperty.title,
      landlordEmail: selectedProperty.landlordEmail || '',
      months: Number(months),
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      accountDetails: paymentMethod === 'BANK' ? bankAccountNumber : phoneNumber,
      date: new Date().toLocaleDateString(),
      status: 'Active'
    };

    const existingRented = JSON.parse(localStorage.getItem('rentedProperties')) || [];
    localStorage.setItem('rentedProperties', JSON.stringify([paymentRecord, ...existingRented]));
    
    setRentedPropertiesList([paymentRecord, ...existingRented]);
    window.dispatchEvent(new Event('storage'));

    alert(`${t.successPayment} "${selectedProperty.title}" (${months} ${lang === 'rw' ? 'amezi' : 'months'})!`);
    setSelectedProperty(null);
    setMonths(1);
    setPhoneNumber('');
    setBankAccountNumber('');
  };

  const handleMoveOutSubmit = (e) => {
    e.preventDefault();
    if (!moveOutReason.trim() || !targetPropertyToLeave) return;

    const noticeRecord = {
      propertyTitle: targetPropertyToLeave.propertyTitle,
      tenantName: currentTenant.name,
      tenantEmail: currentTenant.email,
      reason: moveOutReason,
      noticeDays: 15,
      requestedBy: 'Tenant',
      isOpened: false,
      date: new Date().toLocaleDateString()
    };

    const existingNotices = JSON.parse(localStorage.getItem('propertyNotices')) || [];
    const updatedNotices = [noticeRecord, ...existingNotices];
    localStorage.setItem('propertyNotices', JSON.stringify(updatedNotices));
    setPropertyNotices(updatedNotices);
    window.dispatchEvent(new Event('storage'));

    alert(t.successNotice);
    setShowMoveOutModal(false);
    setMoveOutReason('');
    setTargetPropertyToLeave(null);
  };

  const getPropertyPaymentInfo = (propertyTitle) => {
    return rentedPropertiesList.find(item => item.propertyTitle === propertyTitle && item.tenantEmail === currentTenant.email);
  };

  const hasActiveNotice = (propertyTitle) => {
    return propertyNotices.some(n => n.propertyTitle === propertyTitle && n.tenantEmail === currentTenant.email && n.requestedBy === 'Tenant');
  };

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>🏠 {t.welcome}, {currentTenant.name} ({t.tenant})</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => setLang(lang === 'rw' ? 'en' : 'rw')} 
            style={styles.langBtn}
          >
            {lang === 'rw' ? '🇺🇸 English' : '🇷🇼 Kinyarwanda'}
          </button>
          <button onClick={() => setShowMyMessages(!showMyMessages)} style={styles.msgToggleBtn}>
            📬 {t.myMessages} ({myChats.length})
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>{t.logout}</button>
        </div>
      </header>

      {showMyMessages && (
        <div style={styles.card}>
          <h3>📬 {t.chatHistoryTitle}</h3>
          <div style={styles.chatHistoryBox}>
            {myChats.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#666', textAlign: 'center' }}>{t.noMessages}</p>
            ) : (
              myChats.map((m) => (
                <div key={m.id} style={{ textAlign: m.role === 'tenant' ? 'right' : 'left', margin: '8px 0' }}>
                  <div style={{ display: 'inline-block', background: m.role === 'tenant' ? '#d1e7dd' : '#cfe2ff', padding: '8px 12px', borderRadius: '8px', maxWidth: '75%', textAlign: 'left', fontSize: '13px' }}>
                    <strong style={{ display: 'block', fontSize: '10px', color: '#333' }}>
                      {m.role === 'tenant' ? (lang === 'rw' ? 'Wowe' : 'You') : (lang === 'rw' ? "Nyir'inzu" : 'Landlord')} ({m.propertyTitle || 'Inzu'})
                    </strong>
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL YO KWISHYURA */}
      {selectedProperty && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3>💳 {t.payModalTitle}: {selectedProperty.title}</h3>
            <p style={{ fontSize: '13px', color: '#555', margin: '5px 0' }}>{t.monthlyPrice}: <b>{Number(selectedProperty.price).toLocaleString()} Frw</b></p>
            
            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{t.selectMonths}</label>
              <input type="number" min="1" max="24" value={months} onChange={(e) => setMonths(e.target.value)} style={styles.inputModal} required />

              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{t.paymentMethod}</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={styles.inputModal}>
                <option value="MTN">{t.mtnOption}</option>
                <option value="TIGO">{t.tigoOption}</option>
                <option value="BANK">{t.bankOption}</option>
              </select>

              {(paymentMethod === 'MTN' || paymentMethod === 'TIGO') && (
                <>
                  <label style={{ fontSize: '11px', color: '#555' }}>{t.phoneNumberLabel}</label>
                  <input type="text" placeholder="078/072..." value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={styles.inputModal} required />
                </>
              )}

              {paymentMethod === 'BANK' && (
                <>
                  <label style={{ fontSize: '11px', color: '#555' }}>{t.bankAccountLabel}</label>
                  <input type="text" placeholder="..." value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} style={styles.inputModal} required />
                </>
              )}

              <p style={{ fontSize: '14px', color: '#28a745', fontWeight: 'bold', margin: '2px 0' }}>
                {t.totalAmount}: {(selectedProperty.price * Number(months)).toLocaleString()} Frw
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button type="submit" style={styles.payConfirmBtn}>{t.confirmPayment}</button>
                <button type="button" onClick={() => setSelectedProperty(null)} style={styles.cancelBtn}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL YO GUTANGA IMPAMVU YO KUVA MU NZU (PREAVIS) */}
      {showMoveOutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3>📋 {t.moveOutModalTitle}</h3>
            <p style={{ fontSize: '12px', color: '#666' }}>Inzu: <b>{targetPropertyToLeave?.propertyTitle}</b></p>
            
            <form onSubmit={handleMoveOutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{t.moveOutReasonLabel}</label>
              <textarea 
                rows="4" 
                placeholder="..." 
                value={moveOutReason} 
                onChange={(e) => setMoveOutReason(e.target.value)} 
                style={styles.inputModal} 
                required 
              />
              <p style={{ fontSize: '11px', color: '#d9534F', fontWeight: 'bold' }}>
                {t.moveOutWarning}
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button type="submit" style={styles.payConfirmBtn}>{t.sendNotice}</button>
                <button type="button" onClick={() => setShowMoveOutModal(false)} style={styles.cancelBtn}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.searchContainer}>
        <input 
          type="text" 
          placeholder={t.searchPlaceholder} 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={styles.searchInput}
        />
      </div>

      <h3>{t.availableProperties} ({filteredProperties.length})</h3>
      
      <div style={styles.gridContainer}>
        {filteredProperties.length === 0 ? (
          <p style={{ color: '#666' }}>{t.noProperties}</p>
        ) : (
          filteredProperties.map(p => {
            const myPayment = getPropertyPaymentInfo(p.title);
            const generalPayment = rentedPropertiesList.find(item => item.propertyTitle === p.title);
            const isNoticeGiven = hasActiveNotice(p.title);

            // Gukumira gusa niba yarishyuwe n'abandi bantu kandi nta préavis yatanzwe
            const isRentedBySomeoneElse = Boolean(generalPayment) && !isNoticeGiven && (!myPayment);

            return (
              <div key={p.id} style={{ ...styles.propertyCard, borderColor: isRentedBySomeoneElse ? '#ffc107' : '#e0e0e0' }}>
                {p.image ? (
                  <img src={p.image} alt={p.title} style={styles.propertyImg} />
                ) : (
                  <div style={styles.noImageView}>{lang === 'rw' ? 'Nta foto ihari' : 'No Image'}</div>
                )}
                <div style={styles.propertyInfo}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '15px' }}>{p.title}</h4>
                  <p style={styles.price}>{Number(p.price).toLocaleString()} Frw / {lang === 'rw' ? 'ukwezi' : 'month'}</p>
                  <p style={styles.location}>📍 {p.location}</p>
                  <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>{t.landlord}: <b>{p.landlordName || t.notSpecified}</b></p>

                  {isRentedBySomeoneElse && (
                    <div style={styles.rentedNoticeBox}>
                      <span style={{ color: '#856404', fontWeight: 'bold', fontSize: '11px' }}>
                        🔒 {t.rentedNotice}
                      </span>
                    </div>
                  )}

                  {!isRentedBySomeoneElse ? (
                    <button onClick={() => setSelectedProperty(p)} style={styles.rentBtn}>
                      💳 {t.rentBtn}
                    </button>
                  ) : (
                    <button style={styles.disabledRentBtn} disabled>
                      🚫 {t.disabledRentBtn}
                    </button>
                  )}

                  {/* AKABUTO KA PREAVIS KIGARAGARA KU BURI NZU KUGIRA NGO GIKORE NEZA */}
                  {isNoticeGiven ? (
                    <div style={styles.noticeStatusBox}>
                      <p style={styles.noticeInfoText}>{t.noticeAlreadySubmittedMsg}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { 
                        setTargetPropertyToLeave(myPayment || { propertyTitle: p.title }); 
                        setShowMoveOutModal(true); 
                      }} 
                      style={styles.moveOutBtn}
                    >
                      🚪 {t.moveOutBtn}
                    </button>
                  )}

                  <TenantChatComponent property={p} t={t} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. STYLES
// ==========================================
const styles = {
  container: { padding: '20px', background: '#f4f6f9', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px' },
  logoutBtn: { background: '#dc3545', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  msgToggleBtn: { background: '#17a2b8', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  langBtn: { background: '#6c757d', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  
  card: { background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px' },
  chatHistoryBox: { height: '200px', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '5px', padding: '10px', overflowY: 'scroll', marginTop: '10px' },

  searchContainer: { marginBottom: '20px' },
  searchInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' },

  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' },
  propertyCard: { background: '#fff', border: '2px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
  propertyImg: { width: '100%', height: '130px', objectFit: 'cover' },
  noImageView: { width: '100%', height: '130px', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d', fontSize: '12px' },
  propertyInfo: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 },
  price: { color: '#28a745', fontWeight: 'bold', fontSize: '14px', margin: 0 },
  location: { color: '#666', fontSize: '12px', margin: 0 },

  rentedNoticeBox: { background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px', padding: '6px', marginTop: '4px', textAlign: 'center' },
  
  rentBtn: { background: '#28a745', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', width: '100%', marginTop: '8px' },
  disabledRentBtn: { background: '#e9ecef', color: '#6c757d', border: '1px solid #ced4da', padding: '8px 12px', borderRadius: '5px', cursor: 'not-allowed', fontSize: '12px', fontWeight: 'bold', width: '100%', marginTop: '8px' },
  moveOutBtn: { background: '#d9534f', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', width: '100%', marginTop: '5px' },
  
  noticeStatusBox: { background: '#f8f9fa', border: '1px dashed #ced4da', padding: '6px', borderRadius: '4px', marginTop: '5px' },
  noticeInfoText: { fontSize: '11px', color: '#495057', margin: 0, fontWeight: 'bold', textAlign: 'center' },

  chatBtn: { background: '#007bff', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', width: '100%', marginTop: '5px' },
  
  chatContainer: { background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' },
  infoBox: { background: '#f8f9fa', padding: '6px 8px', borderRadius: '5px', borderLeft: '3px solid #007bff', marginBottom: '8px' },
  closeBtn: { background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  input: { flex: 1, padding: '7px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' },
  sendBtn: { background: '#28a745', color: '#fff', border: 'none', padding: '7px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { background: '#fff', padding: '20px', borderRadius: '8px', width: '360px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
  inputModal: { width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px', boxSizing: 'border-box', marginTop: '3px' },
  payConfirmBtn: { background: '#28a745', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: 1 },
  cancelBtn: { background: '#6c757d', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }
};