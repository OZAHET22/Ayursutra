import { useEffect } from 'react';

function Notification({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`notification${type === 'error' ? ' error' : ''}`}>
            <span>{message}</span>
            <button onClick={onClose}>×</button>
        </div>
    );
}

export default Notification;
