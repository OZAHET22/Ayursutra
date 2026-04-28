import { useState, useEffect, useCallback } from 'react';
import * as blockService from '../../services/blockService';
import '../doctor/AvailabilityTab.css';

export default function AvailabilityTab({ user, showNotification }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    isRecurring: false,
    date: '',
    dayOfWeek: '',
    startHour: '10',
    startMinute: '0',
    endHour: '11',
    endMinute: '0',
    reason: 'Unavailable',
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  // Load blocks
  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await blockService.getAllBlocks();
      setBlocks(response?.data || []);
    } catch (err) {
      console.error('Failed to load availability blocks:', err);
      showNotification('Failed to load availability blocks.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Auto-refresh
  useEffect(() => {
    loadBlocks();
    const interval = setInterval(loadBlocks, 30000);
    return () => clearInterval(interval);
  }, [loadBlocks]);

  // Validate form
  const validateForm = () => {
    if (!formData.reason?.trim()) {
      showNotification('Please enter a reason for unavailability.', 'error');
      return false;
    }
    if (formData.isRecurring && formData.dayOfWeek === '') {
      showNotification('Please select a day of week.', 'error');
      return false;
    }
    if (!formData.isRecurring && !formData.date) {
      showNotification('Please select a date.', 'error');
      return false;
    }
    const startMinutes = Number(formData.startHour) * 60 + Number(formData.startMinute);
    const endMinutes = Number(formData.endHour) * 60 + Number(formData.endMinute);
    if (endMinutes <= startMinutes) {
      showNotification('End time must be after start time.', 'error');
      return false;
    }
    return true;
  };

  // Create/update block
  const handleSaveBlock = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        // Update existing block
        await blockService.updateBlock(editingId, formData);
        showNotification('Availability block updated!', 'success');
        setEditingId(null);
      } else {
        // Create new block
        await blockService.createBlock(formData);
        showNotification('Availability block created!', 'success');
      }
      setShowForm(false);
      resetForm();
      loadBlocks();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save availability block.';
      showNotification(message, 'error');
    }
  };

  // Edit block
  const handleEditBlock = (block) => {
    setEditingId(block._id);
    setFormData({
      isRecurring: block.isRecurring,
      date: block.date || '',
      dayOfWeek: block.dayOfWeek !== undefined ? String(block.dayOfWeek) : '',
      startHour: String(block.startHour),
      startMinute: String(block.startMinute || 0),
      endHour: String(block.endHour),
      endMinute: String(block.endMinute || 0),
      reason: block.reason || 'Unavailable',
    });
    setShowForm(true);
  };

  // Delete block
  const handleDeleteBlock = async (id) => {
    if (!confirm('Are you sure you want to delete this availability block?')) return;
    try {
      await blockService.deleteBlock(id);
      showNotification('Availability block deleted!', 'success');
      loadBlocks();
    } catch (err) {
      showNotification('Failed to delete block.', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      isRecurring: false,
      date: '',
      dayOfWeek: '',
      startHour: '10',
      startMinute: '0',
      endHour: '11',
      endMinute: '0',
      reason: 'Unavailable',
    });
    setEditingId(null);
  };

  // Cancel edit
  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  // Format time
  const formatTime = (hour, minute) => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  // Format block display
  const formatBlock = (block) => {
    const time = `${formatTime(block.startHour, block.startMinute)} - ${formatTime(block.endHour, block.endMinute)}`;
    if (block.isRecurring) {
      const day = daysOfWeek.find(d => d.value === block.dayOfWeek)?.label || 'Unknown';
      return `${day}s - ${time}`;
    } else {
      const date = new Date(block.date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      return `${date} - ${time}`;
    }
  };

  if (loading) {
    return <div className="availability-tab"><p>Loading availability...</p></div>;
  }

  return (
    <div className="availability-tab">
      <div className="availability-header">
        <h2>📅 My Availability</h2>
        <button
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? '✕ Close' : '+ Add Unavailable Time'}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="availability-form-container">
          <form className="availability-form" onSubmit={handleSaveBlock}>
            <div className="form-section">
              <h3>{editingId ? 'Edit Availability Block' : 'New Availability Block'}</h3>

              {/* Block Type */}
              <div className="form-group">
                <label>Block Type</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      checked={!formData.isRecurring}
                      onChange={() =>
                        setFormData(prev => ({
                          ...prev,
                          isRecurring: false,
                          date: new Date().toISOString().split('T')[0],
                        }))
                      }
                    />
                    One-Time Block (Specific Date)
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={formData.isRecurring}
                      onChange={() =>
                        setFormData(prev => ({
                          ...prev,
                          isRecurring: true,
                          dayOfWeek: '1',
                        }))
                      }
                    />
                    Recurring Block (Every Week)
                  </label>
                </div>
              </div>

              {/* Date or Day of Week */}
              {!formData.isRecurring ? (
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="dayOfWeek">Day of Week</label>
                  <select
                    id="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={e => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                    required
                  >
                    <option value="">Select day...</option>
                    {daysOfWeek.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time Range */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startHour">Start Time</label>
                  <div className="time-picker">
                    <select
                      id="startHour"
                      value={formData.startHour}
                      onChange={e => setFormData(prev => ({ ...prev, startHour: e.target.value }))}
                    >
                      {hours.map(h => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span>:</span>
                    <select
                      value={formData.startMinute}
                      onChange={e => setFormData(prev => ({ ...prev, startMinute: e.target.value }))}
                    >
                      {minutes.map(m => (
                        <option key={m} value={m}>
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="endHour">End Time</label>
                  <div className="time-picker">
                    <select
                      id="endHour"
                      value={formData.endHour}
                      onChange={e => setFormData(prev => ({ ...prev, endHour: e.target.value }))}
                    >
                      {hours.map(h => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span>:</span>
                    <select
                      value={formData.endMinute}
                      onChange={e => setFormData(prev => ({ ...prev, endMinute: e.target.value }))}
                    >
                      {minutes.map(m => (
                        <option key={m} value={m}>
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="form-group">
                <label htmlFor="reason">Reason</label>
                <input
                  id="reason"
                  type="text"
                  placeholder="e.g., Lunch Break, Meeting, Day Off"
                  value={formData.reason}
                  onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  required
                />
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button type="submit" className="btn-success">
                  {editingId ? '💾 Update Block' : '➕ Create Block'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancel}
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Blocks List */}
      <div className="availability-list">
        <h3>
          {blocks.length === 0
            ? '✅ You are always available'
            : `📌 ${blocks.length} Unavailable Time${blocks.length !== 1 ? 's' : ''}`}
        </h3>

        {blocks.length > 0 && (
          <div className="blocks-grid">
            {blocks
              .sort((a, b) => {
                // Recurring blocks first, then by date/day
                if (a.isRecurring !== b.isRecurring) {
                  return a.isRecurring ? -1 : 1;
                }
                if (a.isRecurring) {
                  return a.dayOfWeek - b.dayOfWeek;
                }
                return new Date(b.date) - new Date(a.date);
              })
              .map(block => (
                <div key={block._id} className="block-card">
                  <div className="block-info">
                    <div className="block-type">
                      {block.isRecurring ? '🔄 Recurring' : '📅 One-Time'}
                    </div>
                    <div className="block-time">{formatBlock(block)}</div>
                    <div className="block-reason">{block.reason}</div>
                  </div>
                  <div className="block-actions">
                    <button
                      className="btn-icon edit"
                      onClick={() => handleEditBlock(block)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDeleteBlock(block._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h4>💡 How It Works</h4>
        <ul>
          <li>
            <strong>One-Time Blocks:</strong> Mark yourself unavailable on a specific date (e.g.,
            Medical leave, Emergency)
          </li>
          <li>
            <strong>Recurring Blocks:</strong> Mark yourself unavailable every week on a specific
            day (e.g., Every Monday lunch 1-2 PM)
          </li>
          <li>
            <strong>Blocked Times:</strong> Patients won't see appointments during these times when
            booking
          </li>
          <li>
            <strong>Reason:</strong> Helps you track why you were unavailable (shown in system logs)
          </li>
        </ul>
      </div>
    </div>
  );
}
