import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorMessage } from '../components/ui.jsx';

const CARDS = [
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'active', label: 'Active' },
  { key: 'offboarding', label: 'Offboarding' },
  { key: 'exited', label: 'Exited' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorMessage error={error} />;
  if (!stats) return <p>Loading…</p>;

  return (
    <>
      <h1>Dashboard</h1>
      <div className="cards">
        {CARDS.map((c) => (
          <Link key={c.key} to={`/employees?status=${c.key}`} className={`card card-${c.key}`}>
            <div className="card-value">{stats.counts[c.key]}</div>
            <div className="card-label">{c.label}</div>
          </Link>
        ))}
        <div className="card">
          <div className="card-value">{stats.openTasks}</div>
          <div className="card-label">Open tasks</div>
        </div>
      </div>

      <h2>Overdue tasks ({stats.overdue.length})</h2>
      {stats.overdue.length === 0 ? (
        <p className="muted">Nothing overdue. 🎉</p>
      ) : (
        <table>
          <thead>
            <tr><th>Due</th><th>Employee</th><th>Task</th><th>Process</th><th>Owner</th></tr>
          </thead>
          <tbody>
            {stats.overdue.map((t) => (
              <tr key={t.id}>
                <td className="overdue">{t.dueDate}</td>
                <td><Link to={`/employees/${t.employeeId}`}>{t.employeeName}</Link></td>
                <td>{t.title}</td>
                <td>{t.process}</td>
                <td>{t.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
