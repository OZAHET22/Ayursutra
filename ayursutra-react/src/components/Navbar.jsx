import { useState, useEffect, useRef } from 'react';

function Navbar({ showPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLoginDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-container">
        <div className="logo" onClick={() => showPage('home')}>
          <div className="logo-icon">🌿</div>
          <span className="logo-text">Ayursutra</span>
        </div>
        <div className="nav-links">
          <a onClick={() => showPage('home')}>Home</a>

          {/* Login dropdown — Patient & Doctor only */}
          <div className="login-dropdown-wrapper" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <a
              onClick={() => setShowLoginDropdown(prev => !prev)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              Login <span style={{ fontSize: '0.7rem' }}>▼</span>
            </a>
            {showLoginDropdown && (
              <div style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                background: '#fff',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                minWidth: 180,
                zIndex: 1000,
                overflow: 'hidden',
                border: '1px solid #e0e0e0',
              }}>
                <div
                  style={{ padding: '0.85rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f7f0'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => { showPage('login'); setShowLoginDropdown(false); }}
                >
                  <span style={{ fontSize: '1.2rem' }}>🧑‍⚕️</span>
                  <div>
                    <div style={{ fontWeight: 600, color: '#2a7d2e', fontSize: '0.95rem' }}>Patient Login</div>
                    <div style={{ fontSize: '0.78rem', color: '#777' }}>Book appointments & track health</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0' }} />
                <div
                  style={{ padding: '0.85rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f7f0'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => { showPage('login'); setShowLoginDropdown(false); }}
                >
                  <span style={{ fontSize: '1.2rem' }}>👨‍⚕️</span>
                  <div>
                    <div style={{ fontWeight: 600, color: '#2a7d2e', fontSize: '0.95rem' }}>Doctor Login</div>
                    <div style={{ fontSize: '0.78rem', color: '#777' }}>Manage patients & consultations</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <a onClick={() => showPage('signup')}>Sign Up</a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
