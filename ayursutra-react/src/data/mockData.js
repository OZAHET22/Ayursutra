// ============ CENTRES ============
export const CENTRES = [
    { id: 'delhi', name: 'Delhi Ayurvedic Centre' },
    { id: 'mumbai', name: 'Mumbai Panchakarma Clinic' },
    { id: 'bangalore', name: 'Bangalore Wellness Hub' },
    { id: 'pune', name: 'Pune Healing Centre' },
    { id: 'mehsana', name: 'Mehsana Healing Centre' },
    { id: 'ahmadabad', name: 'Ahmadabad Healing Centre' },
    { id: 'gandhinagar', name: 'Gandhinagar Healing Centre' },
];

// ============ DOCTORS ============
export const DOCTORS = [
    { id: 1, name: 'Dr. Rajesh Sharma', speciality: 'Panchakarma Specialist', centre: 'pune', experience: '12 years', rating: 4.8, avatar: '👨‍⚕️', available: true, therapies: ['Panchakarma', 'Abhyanga', 'Shirodhara'] },
    { id: 2, name: 'Dr. Priya Gupta', speciality: 'Ayurvedic Physician', centre: 'pune', experience: '8 years', rating: 4.6, avatar: '👩‍⚕️', available: true, therapies: ['Vamana', 'Virechana', 'Nasya'] },
    { id: 3, name: 'Dr. Amit Patel', speciality: 'Detox Specialist', centre: 'mumbai', experience: '10 years', rating: 4.9, avatar: '👨‍⚕️', available: true, therapies: ['Basti', 'Raktamokshana'] },
    { id: 4, name: 'Dr. Sunita Joshi', speciality: 'Stress Management', centre: 'mumbai', experience: '6 years', rating: 4.5, avatar: '👩‍⚕️', available: false, therapies: ['Shirodhara', 'Abhyanga'] },
    { id: 5, name: 'Dr. Vikram Singh', speciality: 'Joint Pain Specialist', centre: 'delhi', experience: '15 years', rating: 4.7, avatar: '👨‍⚕️', available: true, therapies: ['Basti', 'Abhyanga', 'Panchakarma'] },
    { id: 6, name: 'Dr. Anita Rao', speciality: 'Digestive Health', centre: 'bangalore', experience: '9 years', rating: 4.8, avatar: '👩‍⚕️', available: true, therapies: ['Virechana', 'Nasya', 'Vamana'] },
    { id: 7, name: 'Dr. Kiran Mehta', speciality: 'Ayurvedic Dermatology', centre: 'ahmadabad', experience: '7 years', rating: 4.4, avatar: '👨‍⚕️', available: true, therapies: ['Raktamokshana', 'Virechana'] },
    { id: 8, name: 'Dr. Pooja Desai', speciality: 'Respiratory Health', centre: 'gandhinagar', experience: '11 years', rating: 4.6, avatar: '👩‍⚕️', available: true, therapies: ['Vamana', 'Nasya'] },
    { id: 9, name: 'Dr. Suresh Nair', speciality: 'Pain Management', centre: 'mehsana', experience: '13 years', rating: 4.9, avatar: '👨‍⚕️', available: true, therapies: ['Basti', 'Abhyanga'] },
];

// ============ PATIENTS ============
export const PATIENTS = [
    { id: 1, name: 'Priya Sharma', age: 35, centre: 'pune', doctor: 1, phone: '9876543210', email: 'patient@demo.com', status: 'active', condition: 'Stress & Insomnia', joinDate: '2023-10-01', dosha: { vata: 60, pitta: 25, kapha: 15 } },
    { id: 2, name: 'Rahul Verma', age: 42, centre: 'pune', doctor: 1, phone: '9876543211', email: 'rahul@demo.com', status: 'active', condition: 'Joint Pain', joinDate: '2023-10-15', dosha: { vata: 30, pitta: 40, kapha: 30 } },
    { id: 3, name: 'Sita Patel', age: 28, centre: 'pune', doctor: 2, phone: '9876543212', email: 'sita@demo.com', status: 'completed', condition: 'Digestive Issues', joinDate: '2023-09-01', dosha: { vata: 20, pitta: 60, kapha: 20 } },
    { id: 4, name: 'Mohan Gupta', age: 50, centre: 'mumbai', doctor: 3, phone: '9876543213', email: 'mohan@demo.com', status: 'active', condition: 'Hypertension', joinDate: '2023-11-01', dosha: { vata: 25, pitta: 55, kapha: 20 } },
    { id: 5, name: 'Lakshmi Nair', age: 38, centre: 'delhi', doctor: 5, phone: '9876543214', email: 'lakshmi@demo.com', status: 'active', condition: 'Arthritis', joinDate: '2023-10-20', dosha: { vata: 50, pitta: 30, kapha: 20 } },
];

// ============ APPOINTMENTS ============
export const APPOINTMENTS = [
    { id: 1, patientId: 1, patientName: 'Priya Sharma', doctorId: 1, doctorName: 'Dr. Rajesh Sharma', type: 'Panchakarma', date: '2026-03-05T10:00:00', status: 'confirmed', duration: 60, centre: 'pune', notes: '' },
    { id: 2, patientId: 1, patientName: 'Priya Sharma', doctorId: 1, doctorName: 'Dr. Rajesh Sharma', type: 'Abhyanga', date: '2026-03-08T14:00:00', status: 'pending', duration: 45, centre: 'pune', notes: '' },
    { id: 3, patientId: 1, patientName: 'Priya Sharma', doctorId: 2, doctorName: 'Dr. Priya Gupta', type: 'Shirodhara', date: '2026-03-12T11:00:00', status: 'confirmed', duration: 60, centre: 'pune', notes: '' },
    { id: 4, patientId: 2, patientName: 'Rahul Verma', doctorId: 1, doctorName: 'Dr. Rajesh Sharma', type: 'Consultation', date: '2026-03-06T09:30:00', status: 'pending', duration: 30, centre: 'pune', notes: '' },
    { id: 5, patientId: 2, patientName: 'Rahul Verma', doctorId: 1, doctorName: 'Dr. Rajesh Sharma', type: 'Basti', date: '2026-02-25T15:00:00', status: 'completed', duration: 90, centre: 'pune', notes: '' },
    { id: 6, patientId: 3, patientName: 'Sita Patel', doctorId: 2, doctorName: 'Dr. Priya Gupta', type: 'Nasya', date: '2026-02-20T10:30:00', status: 'completed', duration: 30, centre: 'pune', notes: '' },
    { id: 7, patientId: 4, patientName: 'Mohan Gupta', doctorId: 3, doctorName: 'Dr. Amit Patel', type: 'Virechana', date: '2026-03-07T11:00:00', status: 'confirmed', duration: 60, centre: 'mumbai', notes: '' },
    { id: 8, patientId: 5, patientName: 'Lakshmi Nair', doctorId: 5, doctorName: 'Dr. Vikram Singh', type: 'Abhyanga', date: '2026-03-09T14:00:00', status: 'pending', duration: 45, centre: 'delhi', notes: '' },
];

// ============ THERAPIES ============
export const THERAPIES = [
    { id: 1, name: 'Panchakarma Detox', patientId: 1, patientName: 'Priya Sharma', doctorId: 1, description: 'Complete detoxification therapy', status: 'active', sessions: 12, completed: 8, progress: 66, startDate: '2026-01-01', endDate: '2026-04-15', centre: 'pune', type: 'panchakarma' },
    { id: 2, name: 'Stress Management', patientId: 1, patientName: 'Priya Sharma', doctorId: 1, description: 'Shirodhara based stress relief', status: 'upcoming', sessions: 8, completed: 0, progress: 0, startDate: '2026-04-01', endDate: '2026-04-30', centre: 'pune', type: 'shirodhara' },
    { id: 3, name: 'Joint Pain Relief', patientId: 2, patientName: 'Rahul Verma', doctorId: 1, description: 'Basti therapy for joint pain', status: 'active', sessions: 10, completed: 3, progress: 30, startDate: '2026-02-01', endDate: '2026-05-01', centre: 'pune', type: 'basti' },
    { id: 4, name: 'Digestive Reset', patientId: 3, patientName: 'Sita Patel', doctorId: 2, description: 'Virechana for digestive health', status: 'completed', sessions: 6, completed: 6, progress: 100, startDate: '2026-01-01', endDate: '2026-02-15', centre: 'pune', type: 'abhyanga' },
    { id: 5, name: 'Hypertension Protocol', patientId: 4, patientName: 'Mohan Gupta', doctorId: 3, description: 'Panchakarma for hypertension', status: 'active', sessions: 15, completed: 5, progress: 33, startDate: '2026-02-15', endDate: '2026-05-15', centre: 'mumbai', type: 'panchakarma' },
];

// ============ PATIENT DOCUMENTS ============
export const PATIENT_DOCUMENTS = [
    { id: 1, patientId: 1, name: 'Initial Health Assessment', date: '2026-01-10', type: 'pdf', fileType: 'pdf', reviewed: true },
    { id: 2, patientId: 1, name: 'Therapy Plan', date: '2026-01-15', type: 'pdf', fileType: 'pdf', reviewed: true },
    { id: 3, patientId: 1, name: 'Lab Results - Jan 2026', date: '2026-01-20', type: 'pdf', fileType: 'pdf', reviewed: false },
    { id: 4, patientId: 1, name: 'Progress Report', date: '2026-02-01', type: 'doc', fileType: 'word', reviewed: false },
    { id: 5, patientId: 2, name: 'X-Ray Report', date: '2026-02-10', type: 'image', fileType: 'image', reviewed: true },
];

// ============ PATIENT FEEDBACK ============
export const FEEDBACK = [
    { id: 1, patientId: 1, patientName: 'Priya Sharma', doctorId: 1, date: '2026-01-20', content: 'Feeling much more relaxed after the Shirodhara session. My sleep quality has improved dramatically.', rating: 5, replied: true, reply: 'Thank you for sharing. Continue the diet plan for best results.' },
    { id: 2, patientId: 1, patientName: 'Priya Sharma', doctorId: 1, date: '2026-02-01', content: 'The Abhyanga massage was very soothing. Experiencing less joint stiffness.', rating: 4, replied: false, reply: '' },
    { id: 3, patientId: 2, patientName: 'Rahul Verma', doctorId: 1, date: '2026-02-05', content: 'Noticed improvement in digestion. Following the diet recommendations carefully.', rating: 4, replied: true, reply: 'Great progress Rahul!' },
    { id: 4, patientId: 3, patientName: 'Sita Patel', doctorId: 2, date: '2026-01-15', content: 'The Basti treatment was effective but intense. Feeling lighter afterwards.', rating: 3, replied: false, reply: '' },
    { id: 5, patientId: 2, patientName: 'Rahul Verma', doctorId: 1, date: '2026-02-18', content: 'Energy levels have significantly improved. Feeling more balanced throughout the day.', rating: 5, replied: false, reply: '' },
];

// ============ PATIENT MILESTONES ============
export const MILESTONES = [
    { id: 1, patientId: 1, name: 'Phase 1 Complete', date: '2026-01-31', description: 'Completed purification therapies', icon: '🎯' },
    { id: 2, patientId: 1, name: '50% Recovery', date: '2026-02-10', description: 'Achieved 50% improvement in primary symptoms', icon: '⭐' },
    { id: 3, patientId: 1, name: 'Diet Adaptation', date: '2026-02-15', description: 'Successfully adapted to Ayurvedic diet', icon: '🌱' },
    { id: 4, patientId: 1, name: 'Sleep Improvement', date: '2026-02-20', description: 'Sleep quality improved by 40%', icon: '😴' },
];

// ============ KNOWLEDGE BASE ============
export const HERBS = [
    { id: 1, name: 'Ashwagandha', category: 'nervous', uses: 'Stress relief, energy booster, adaptogen', dosha: 'Vata, Kapha' },
    { id: 2, name: 'Triphala', category: 'digestive', uses: 'Digestive health, detoxification, rejuvenation', dosha: 'All Doshas' },
    { id: 3, name: 'Brahmi', category: 'nervous', uses: 'Brain tonic, memory enhancer, anxiety relief', dosha: 'Pitta, Vata' },
    { id: 4, name: 'Tulsi', category: 'respiratory', uses: 'Respiratory health, immunity booster, anti-stress', dosha: 'Kapha, Vata' },
    { id: 5, name: 'Turmeric', category: 'immunity', uses: 'Anti-inflammatory, immunity, wound healing', dosha: 'All Doshas' },
    { id: 6, name: 'Shatavari', category: 'immunity', uses: 'Female health, hormonal balance, digestive', dosha: 'Pitta, Vata' },
    { id: 7, name: 'Guduchi', category: 'immunity', uses: 'Immunity booster, fever, anti-inflammatory', dosha: 'All Doshas' },
    { id: 8, name: 'Neem', category: 'digestive', uses: 'Blood purifier, skin health, anti-bacterial', dosha: 'Pitta, Kapha' },
];

// ============ INVOICES ============
export const INVOICES = [
    { id: 'INV-001', patientId: 2, patientName: 'Rahul Verma', date: '2026-02-01', type: 'OPD', items: [{ name: 'Consultation', qty: 1, price: 500, gst: 0 }], grandTotal: 500, status: 'Paid', paidAmount: 500 },
    { id: 'INV-002', patientId: 1, patientName: 'Priya Sharma', date: '2026-02-10', type: 'Therapy', items: [{ name: 'Shirodhara (60 min)', qty: 1, price: 1500, gst: 18 }], grandTotal: 1770, status: 'Pending', paidAmount: 0 },
    { id: 'INV-003', patientId: 3, patientName: 'Sita Patel', date: '2026-02-15', type: 'IPD', items: [{ name: 'Panchakarma Package', qty: 1, price: 12000, gst: 18 }], grandTotal: 14160, status: 'Partial', paidAmount: 7000 },
];

// ============ DIET FOOD DATA ============
export const DIET_CATEGORIES = {
    'અનાજ (Grains)': ['ઘઉં', 'બાજરી', 'સામો', 'સાબુદાણા', 'ચોખા', 'જુવાર', 'મકાઈ', 'રાજગરો'],
    'કઠોળ (Pulses)': ['જવ', 'તાંદરા', 'સોજી', 'મોરૈયો', 'ભગ', 'રાજમા', 'વટાણા', 'અડદ', 'મઠ', 'સોયાબીન', 'ચોળી', 'ચણા', 'વાલ', 'તુવેર'],
    'દાળ (Lentils)': ['મગની દાળ', 'તુવેરની દાળ', 'ચણાની દાળ', 'મઠની દાળ', 'અડદની દાળ', 'ચોળાની દાળ', 'મસુરની દાળ'],
    'શાકભાજી (Vegetables)': ['બટાકા', 'લસણ', 'વાલોળ', 'મેથી ભાજી', 'લીંબુ', 'ગાજર', 'રીંગણ', 'તુરિયા', 'ઘીલોડી', 'લીલી હળદર', 'ટામેટાં', 'તાંદળજો', 'કોથમીર', 'વટાણા', 'કોબીજ', 'ગલકા', 'દૂધી', 'મુળા', 'પરવળ', 'પાલક', 'ડુંગળી', 'તુવેર', 'ફુદીનો', 'સરગવો', 'ફલાવર', 'મોગરી', 'કારેલા', 'અળવી', 'લીલા મરચાં', 'ફણસી', 'ચોળી', 'બીટ', 'મીઠો લીમડો'],
    'મૂળ શાક (Root Vegetables)': ['સુરણ', 'ગુવાર', 'આદું', 'નાગરવેલ', 'પાપડી', 'શકકરીયાં', 'ગરમર'],
    'ડ્રાયફ્રૂટ (Dry Fruits)': ['કાજુ', 'પીસ્તા', 'ખારેક', 'કીસમીસ', 'અંજીર', 'ખજૂર', 'બદામ', 'અખરોટ', 'ટોપરું', 'કાળી દ્રાક્ષ'],
    'ફળ (Fruits)': ['સફરજન', 'ચીકુ', 'પપૈયું', 'નારીયેળ', 'દ્રાક્ષ', 'દાડમ', 'સીતાફળ', 'નાસપતી', 'તડબુચ', 'અનાનસ', 'આમળા', 'કેળાં', 'સંતરા', 'ચેરી', 'જામફળ', 'કેરી', 'મોસંબી', 'ટેટી', 'જાંબુ', 'કીવી', 'શેરડી', 'બોર', 'સ્ટ્રોબેરી', 'ખારેક'],
    'મસાલા (Spices)': ['મીઠું', 'રાઈ', 'તમાલપત્ર', 'ચારોડી', 'સંચળ', 'મેથી', 'તલ', 'ખસખસ', 'સીંધવ', 'સુવા', 'વરીયાળી', 'સુંઠ', 'લાલ મરચું', 'અજમો', 'અળસી', 'મરી', 'હળદર', 'તજ', 'જાયફળ', 'કોકમ', 'ધાણાજીરૂ', 'જાવંત્રી', 'કેસર', 'હિંગ', 'લવિંગ', 'ઇલાયચી', 'કાળી જીરી', 'અસેળીયો'],
    'અન્ય (Others)': ['દહી', 'લસ્સી', 'મેંદાની વસ્તુ', 'શીંગ', 'આઇસક્રિમ', 'બેકરી ની વસ્તુ', 'ચણા', 'છાસ', 'માવાની મીઠાઇ', 'ચોકલેટ', 'મગફળી', 'ઘી', 'ખાંડ', 'કેક', 'ઠંડા પીણાં', 'માખણ', 'મધ', 'આથાવાળી વસ્તુઓ', 'ઠંડુ પાણી', 'ચીઝ', 'ગોળ', 'મમરા', 'પનીર', 'ચા', 'પૌઆ', 'શ્રીખંડ', 'કોફી', 'ખાખરા'],
};

// ============ SCHEDULE SLOTS ============
export const TIME_SLOTS = [
    { time: '8:00 AM', patient: 'Priya Sharma', type: 'Abhyanga', duration: 45, status: 'confirmed' },
    { time: '9:00 AM', patient: 'Rahul Verma', type: 'Consultation', duration: 30, status: 'confirmed' },
    { time: '10:30 AM', patient: '', type: '', duration: 60, status: 'available' },
    { time: '11:30 AM', patient: 'Sita Patel', type: 'Nasya', duration: 30, status: 'confirmed' },
    { time: '1:00 PM', patient: '', type: '', duration: 60, status: 'break' },
    { time: '2:00 PM', patient: 'Ananya Roy', type: 'Shirodhara', duration: 60, status: 'pending' },
    { time: '3:30 PM', patient: '', type: '', duration: 60, status: 'available' },
    { time: '4:30 PM', patient: 'Kishan Lal', type: 'Basti', duration: 90, status: 'confirmed' },
];
