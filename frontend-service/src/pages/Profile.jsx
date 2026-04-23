// sneakerhead/frontend-service/src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import userService from '../services/userService';

export default function Profile() {
  const { user, isAuthenticated, updateProfile } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', zip_code: '', country: 'US', is_default: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    loadAddresses();
  }, [isAuthenticated, user]);

  const loadAddresses = async () => {
    try {
      const res = await userService.getAddresses();
      setAddresses(res.data || []);
    } catch {}
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ name, email });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch {}
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ password: newPassword });
      setPassword('');
      setNewPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch {}
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({ ...addressForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAddressSave = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await userService.updateAddress(editingAddress, addressForm);
      } else {
        await userService.addAddress(addressForm);
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({
        full_name: '', phone: '', address_line1: '', address_line2: '',
        city: '', state: '', zip_code: '', country: 'US', is_default: false,
      });
      loadAddresses();
    } catch {}
  };

  const handleEditAddress = (addr) => {
    setEditingAddress(addr.id);
    setAddressForm({
      full_name: addr.full_name,
      phone: addr.phone || '',
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state,
      zip_code: addr.zip_code,
      country: addr.country,
      is_default: addr.is_default,
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    try {
      await userService.deleteAddress(id);
      loadAddresses();
    } catch {}
  };

  return (
    <div className="profile-page">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-grid">
        {/* Profile Info */}
        <div className="profile-card">
          <h3>Personal Information</h3>
          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="save-btn">
              {profileSaved ? '✓ Saved' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="profile-card">
          <h3>Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                minLength={6}
                required
              />
            </div>
            <button type="submit" className="save-btn">
              {passwordSaved ? '✓ Updated' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Addresses */}
        <div className="profile-card full-width">
          <div className="address-header">
            <h3>Address Book</h3>
            <button
              className="add-address-btn"
              onClick={() => {
                setEditingAddress(null);
                setAddressForm({
                  full_name: '', phone: '', address_line1: '', address_line2: '',
                  city: '', state: '', zip_code: '', country: 'US', is_default: false,
                });
                setShowAddressForm(true);
              }}
            >
              + Add Address
            </button>
          </div>

          {showAddressForm && (
            <form className="address-form" onSubmit={handleAddressSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input name="full_name" value={addressForm.full_name} onChange={handleAddressChange} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" value={addressForm.phone} onChange={handleAddressChange} />
                </div>
                <div className="form-group full">
                  <label>Address Line 1 *</label>
                  <input name="address_line1" value={addressForm.address_line1} onChange={handleAddressChange} required />
                </div>
                <div className="form-group full">
                  <label>Address Line 2</label>
                  <input name="address_line2" value={addressForm.address_line2} onChange={handleAddressChange} />
                </div>
                <div className="form-group"><label>City *</label><input name="city" value={addressForm.city} onChange={handleAddressChange} required /></div>
                <div className="form-group"><label>State *</label><input name="state" value={addressForm.state} onChange={handleAddressChange} required /></div>
                <div className="form-group"><label>ZIP *</label><input name="zip_code" value={addressForm.zip_code} onChange={handleAddressChange} required /></div>
                <div className="form-group"><label>Country *</label><input name="country" value={addressForm.country} onChange={handleAddressChange} required /></div>
              </div>
              <label className="filter-checkbox">
                <input type="checkbox" name="is_default" checked={addressForm.is_default} onChange={handleAddressChange} />
                <span>Set as default address</span>
              </label>
              <div className="address-form-actions">
                <button type="submit" className="save-btn">{editingAddress ? 'Update' : 'Add'} Address</button>
                <button type="button" className="cancel-btn" onClick={() => { setShowAddressForm(false); setEditingAddress(null); }}>Cancel</button>
              </div>
            </form>
          )}

          <div className="address-list">
            {addresses.map((addr) => (
              <div key={addr.id} className={`address-card ${addr.is_default ? 'default' : ''}`}>
                {addr.is_default && <span className="default-badge">Default</span>}
                <p className="addr-name">{addr.full_name}</p>
                <p>{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>{addr.city}, {addr.state} {addr.zip_code}</p>
                <p>{addr.country}</p>
                {addr.phone && <p>📞 {addr.phone}</p>}
                <div className="addr-actions">
                  <button onClick={() => handleEditAddress(addr)}>Edit</button>
                  <button onClick={() => handleDeleteAddress(addr.id)} className="delete-btn">Delete</button>
                </div>
              </div>
            ))}
            {addresses.length === 0 && !showAddressForm && (
              <p className="no-addresses">No addresses saved yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
