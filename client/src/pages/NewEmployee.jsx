import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorMessage } from '../components/ui.jsx';

const EMPTY = {
  firstName: '', lastName: '', email: '', department: '',
  jobTitle: '', manager: '', startDate: new Date().toISOString().slice(0, 10),
};

const FIELDS = [
  ['firstName', 'First name', 'text', true],
  ['lastName', 'Last name', 'text', true],
  ['email', 'Work email', 'email', true],
  ['department', 'Department', 'text', true],
  ['jobTitle', 'Job title', 'text', true],
  ['manager', 'Manager', 'text', false],
  ['startDate', 'Start date', 'date', true],
];

export default function NewEmployee() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const employee = await api.createEmployee(form);
      navigate(`/employees/${employee.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <h1>Onboard a new employee</h1>
      <p className="muted">An onboarding checklist will be generated automatically from the start date.</p>
      <ErrorMessage error={error} />
      <form className="form" onSubmit={submit}>
        {FIELDS.map(([name, label, type, required]) => (
          <label key={name}>
            {label}{required && ' *'}
            <input
              type={type}
              required={required}
              value={form[name]}
              onChange={(e) => setForm({ ...form, [name]: e.target.value })}
            />
          </label>
        ))}
        <button className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Start onboarding'}
        </button>
      </form>
    </>
  );
}
