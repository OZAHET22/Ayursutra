// Canonical specialization list shared between doctor signup and patient booking flow
// Feature 4: Specialization-Based Doctor-Patient Matching System
export const SPECIALIZATIONS = [
    { id: 'panchakarma',     label: 'Panchakarma Specialist',    icon: '🌿', desc: 'Traditional detox & rejuvenation therapies' },
    { id: 'ayurvedic',       label: 'Ayurvedic Physician',       icon: '⚕️', desc: 'General Ayurvedic medicine & consultation' },
    { id: 'detox',           label: 'Detox Specialist',          icon: '💧', desc: 'Body cleansing & purification treatments' },
    { id: 'stress',          label: 'Stress Management',         icon: '🧘', desc: 'Stress relief, anxiety & mental wellness' },
    { id: 'joint',           label: 'Joint Pain Specialist',     icon: '🦴', desc: 'Arthritis, joint pain & musculoskeletal care' },
    { id: 'digestive',       label: 'Digestive Health',          icon: '🫁', desc: 'IBS, gastritis & digestive disorder treatments' },
    { id: 'dermatology',     label: 'Ayurvedic Dermatology',     icon: '✨', desc: 'Skin conditions, eczema & psoriasis care' },
    { id: 'respiratory',     label: 'Respiratory Health',        icon: '🫀', desc: 'Asthma, sinusitis & breathing conditions' },
    { id: 'pain',            label: 'Pain Management',           icon: '💊', desc: 'Chronic pain, migraine & neuralgia relief' },
    { id: 'womens',          label: "Women's Health",            icon: '🌸', desc: 'PCOS, menstrual issues & hormonal balance' },
    { id: 'diabetes',        label: 'Diabetes & Metabolism',     icon: '🩺', desc: 'Diabetes management & metabolic disorders' },
    { id: 'immunity',        label: 'Immunity & Wellness',       icon: '🛡️', desc: 'Immunity boosting & preventive care' },
];

// Returns label from id
export const getSpecializationLabel = (id) => {
    const found = SPECIALIZATIONS.find(s => s.id === id || s.label === id);
    return found ? found.label : id || 'Ayurvedic Physician';
};
