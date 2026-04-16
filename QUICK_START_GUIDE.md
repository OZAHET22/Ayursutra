# Quick Start Guide - Hospital Forms React App

## 🚀 Get Started in 5 Minutes

### Step 1: Import the App
Add to your main React app or dashboard:

```jsx
import HospitalFormsApp from './pages/HospitalForms/HospitalFormsApp';

// In your routing
<Route path="/hospital/forms" element={<HospitalFormsApp />} />

// Or in tabs
{activeTab === 'forms' && <HospitalFormsApp />}
```

### Step 2: Start the Dev Server
```bash
npm run dev
```

The app will load with the **Initial Consultation** form visible. You should see:
- ✅ Sidebar with 17 page numbers and links
- ✅ Form fields ready to fill
- ✅ Buttons in top right (Dark Mode, Auto-Fill, Save, Print, etc.)
- ✅ Dark theme toggle functionality

### Step 3: Test Core Features

#### 1. Fill Out a Form
```
1. Fill in some patient information
2. Watch for green "Saved" indicator
3. Refresh the page - data persists!
```

#### 2. Test Auto-Save
```
1. Fill a field
2. Wait 45 seconds
3. Check browser console network tab - data saved to localStorage
```

#### 3. Test Dark Mode
```
Click the 🌙 button in top right
All styles should invert to dark theme
```

#### 4. Test Navigation
```
Click different page numbers in sidebar
Forms should switch immediately
```

#### 5. Test Drawing Mode (Bonus)
```
1. Click "✏️ Draw" button (top right)
2. Canvas overlay appears
3. Click stylus toolbar on right
4. Try drawing on the page!
```

---

## 📝 Complete the Remaining Forms

### Quick Pattern
Each form section needs:
1. **Component file** in `FormSections/`
2. **Basic structure** with form fields
3. **Connect to formData** hook

### Minimal Example
```jsx
import React from 'react';
import { FormCard, FormGroup, SectionHeader, RowGrid } from '../components/FormComponents';

const MyForm = ({ formData, updateField }) => {
  return (
    <div className="section" id="sec-myformid">
      <SectionHeader title="My Form Title" />
      <FormCard title="Section 1">
        <RowGrid columns={2}>
          <FormGroup
            label="Name"
            id="field_id"
            value={formData.field_id || ''}
            onChange={updateField}
          />
        </RowGrid>
      </FormCard>
    </div>
  );
};

export default MyForm;
```

### Add to HospitalFormsApp.jsx
```jsx
// Add import at top
import MyForm from './FormSections/MyForm';

// Add to renderSection() switch
case 99:
  return <MyForm {...sectionProps} />;
```

---

## 🎨 Component Usage Examples

### Simple Text Input
```jsx
<FormGroup
  label="Patient Name"
  id="pt_name"
  value={formData.pt_name || ''}
  onChange={updateField}
/>
```

### Radio Buttons (Pills)
```jsx
<div className="fg">
  <label>Gender</label>
  <RadioPillGroup
    id="gender"
    options={['Male', 'Female', 'Other']}
    value={formData.__rp_gender || ''}
    onChange={(id, val) => updateField(`__rp_${id}`, val)}
  />
</div>
```

### Multi-line Text
```jsx
<FormGroup
  label="Comments"
  id="comments"
  type="textarea"
  rows={3}
  value={formData.comments || ''}
  onChange={updateField}
/>
```

### Two-Column Layout
```jsx
<RowGrid columns={2}>
  <FormGroup label="First Name" id="fname" ... />
  <FormGroup label="Last Name" id="lname" ... />
</RowGrid>
```

### Vital Signs Grid
```jsx
<VitalsGrid
  data={{
    bp: formData.c_bp,
    pulse: formData.c_pulse,
    temp: formData.c_temp,
  }}
  onUpdate={(key, val) => updateField(`c_${key}`, val)}
/>
```

---

## 💾 Data Management

### Access Form Data
```jsx
// In any component
const { formData, updateField } = useFormData();

// Get a value
const patientName = formData.c_name;

// Update a value
updateField('c_name', 'John Doe');

// Multiple updates
updateFields({
  c_name: 'John',
  c_age: '35',
  c_date: '2024-04-12',
});

// Save manually
save();
```

### Access Patient Data
```jsx
const { patients, addPatient, loadPatient } = usePatientManagement();

// Load a patient
loadPatient(patientId);

// Add new patient
const newId = addPatient({
  name: 'Jane Doe',
  uhid: 'UH123456',
  diagnosis: 'Hypertension',
});
```

---

## 🗂️ File Organization

```
FormSections/                    ← Your form pages
├── InitialConsultation.jsx      ← Reference example
├── FunctionalEvaluation.jsx     ← Reference with advanced patterns
├── GeneralExamination.jsx       ← Add your forms here...
├── AdmissionForm.jsx
└── DischargeForm.jsx

components/
├── FormComponents.jsx           ← Use these!
├── PatientModal.jsx             ← Ready to enhance
├── PrintManager.jsx             ← Ready to enhance
├── SettingsModal.jsx
├── StylusToolbar.jsx            ← Drawing tools (ready)
├── DrawCanvas.jsx               ← Canvas drawing (ready)
└── ZoomControls.jsx             ← Zoom controls (ready)
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Form loads without errors
- [ ] Can type in all fields
- [ ] Data saves when you click Save
- [ ] Data persists after refresh
- [ ] Sidebar navigation works
- [ ] Dark mode toggles on/off
- [ ] Mobile view is responsive
- [ ] No console errors

### Test on Mobile
1. Open `http://localhost:5173` on your phone
2. Sidebar should move to left (or hamburger menu)
3. Touch inputs should work
4. Drawings should work with finger

---

## 🐛 Debug Tips

### Check Auto-Save Status
```javascript
// In browser console
localStorage.getItem('hosp_forms')
// Should show your form data as JSON
```

### Check Patients Storage
```javascript
// In browser console
JSON.parse(localStorage.getItem('hosp_patients_v2'))
// Should show array of saved patients
```

### Monitor Form Data Changes
```javascript
// Add to component
useEffect(() => {
  console.log('Form updated:', formData);
}, [formData]);
```

### Canvas Not Drawing?
```javascript
// Check if canvas is mounted
document.getElementById('drawCanvas')
// Should return canvas element, not null
```

---

## 📊 Performance Tips

1. **Use FormGroup for all text inputs** - It's optimized
2. **Use RowGrid for layouts** - Better than custom divs
3. **Memoize heavy components** - Use React.memo if needed
4. **Avoid inline functions** - Use useCallback
5. **Split large forms** - Consider sub-components

---

## 🚀 Production Checklist

Before deploying:
- [ ] All 17 form sections completed
- [ ] Patient CRUD fully implemented
- [ ] Print functionality tested
- [ ] Drawing tools tested
- [ ] Mobile responsive verified
- [ ] localStorage quota sufficient
- [ ] Auto-save timing verified
- [ ] No console errors
- [ ] Keyboard shortcuts work
- [ ] Accessibility checked
- [ ] Backend integration done
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Validation rules added
- [ ] User permissions checked

---

## 📚 Reference Docs

Read these for more details:
1. `HOSPITAL_FORMS_IMPLEMENTATION_GUIDE.md` - Comprehensive guide
2. `CONVERSION_COMPLETION_SUMMARY.md` - What's done, what's left
3. `InitialConsultation.jsx` - Simple form example
4. `FunctionalEvaluation.jsx` - Advanced form example

---

## 🆘 Need Help?

### Issue: Component not showing
**Check:** Is it imported in HospitalFormsApp.jsx?

### Issue: Data not persisting
**Check:** Is localStorage enabled? Is quota exceeded?

### Issue: Drawing lag
**Check:** Browser performance. Close other tabs.

### Issue: Mobile layout broken
**Check:** Is viewport meta tag present in HTML?

### Issue: Styling looks wrong
**Check:** Is HospitalForms.css imported correctly?

---

## 💡 Pro Tips

1. **Test on real device** - Mobile testing is important
2. **Use browser DevTools** - Inspect styles, debug data
3. **Check Network tab** - See if data is saving
4. **Use React DevTools** - Inspect component hierarchy
5. **Print to console** - Debug with console.log()
6. **Read error messages** - They usually tell you what's wrong

---

## ✅ You're Ready!

Your Hospital Forms app is ready to use. Start with:
1. Import HospitalFormsApp
2. Add to your routing
3. Test one form
4. Complete remaining forms
5. Add backend integration
6. Deploy! 🎉

**Questions?** Check the guides or examples in the repository.

---

Last updated: April 2026
Version: React 18 + Hooks + Tailwind CSS
