import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorMessage, ProgressBar, StatusBadge } from '../components/ui.jsx';

const STATUSES = ['onboarding', 'active', 'offboarding', 'exited'];

export default function EmployeeList() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const search = params.get('search') || '';
  const [employees, setEmployees] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listEmployees({ status, search }).then(setEmployees).catch((e) => setError(e.message));
  }, [status, search]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <>
      <h1>Employees</h1>
      <div className="filters">
        <input
          type="search"
          placeholder="Search name, email, department…"
          value={search}
          onChange={(e) => update('search', e.target.value)}
        />
        <select value={status} onChange={(e) => update('status', e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <ErrorMessage error={error} />
      {!employees ? (
        <p>Loading…</p>
      ) : employees.length === 0 ? (
        <p className="muted">
          No employees found. <Link to="/employees/new">Onboard someone</Link>.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Department</th><th>Job title</th><th>Start</th>
              <th>Status</th><th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => {
              const offboarding = ['offboarding', 'exited'].includes(e.status);
              return (
                <tr key={e.id}>
                  <td><Link to={`/employees/${e.id}`}>{e.fullName}</Link><div className="muted small">{e.email}</div></td>
                  <td>{e.department}</td>
                  <td>{e.jobTitle}</td>
                  <td>{e.startDate}</td>
                  <td><StatusBadge status={e.status} /></td>
                  <td>
                    <ProgressBar
                      value={offboarding ? e.offboardingProgress : e.onboardingProgress}
                      label={offboarding ? 'Offboarding' : 'Onboarding'}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
