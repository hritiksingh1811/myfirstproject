import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorMessage, ProgressBar, StatusBadge } from '../components/ui.jsx';

function Checklist({ title, tasks, progress, onToggle }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <ProgressBar value={progress} label={title} />
      </div>
      <ul className="tasks">
        {tasks.map((t) => (
          <li key={t.id} className={t.done ? 'done' : ''}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => onToggle(t)} />
              <span className="task-title">{t.title}</span>
            </label>
            <span className="tag">{t.owner}</span>
            <span className={`due ${t.overdue ? 'overdue' : ''}`}>Due {t.dueDate}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OffboardForm({ onSubmit }) {
  const [endDate, setEndDate] = useState('');
  const [exitReason, setExitReason] = useState('');
  return (
    <form
      className="form inline"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ endDate, exitReason });
      }}
    >
      <label>
        Last working day *
        <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </label>
      <label>
        Reason
        <input
          type="text"
          placeholder="Resignation, relocation, …"
          value={exitReason}
          onChange={(e) => setExitReason(e.target.value)}
        />
      </label>
      <button className="btn btn-danger">Start offboarding</button>
    </form>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getEmployee(id).then(setEmployee).catch((e) => setError(e.message));
  }, [id]);

  const run = async (fn) => {
    setError('');
    try {
      setEmployee(await fn());
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${employee.fullName} and all their tasks?`)) return;
    await api.deleteEmployee(id);
    navigate('/employees');
  };

  if (!employee) return error ? <ErrorMessage error={error} /> : <p>Loading…</p>;

  const onTasks = employee.tasks.filter((t) => t.process === 'onboarding');
  const offTasks = employee.tasks.filter((t) => t.process === 'offboarding');
  const toggle = (t) => run(() => api.setTaskDone(t.id, !t.done));

  return (
    <>
      <div className="title-row">
        <h1>{employee.fullName}</h1>
        <StatusBadge status={employee.status} />
        <button className="btn btn-link" onClick={remove}>Delete</button>
      </div>
      <ErrorMessage error={error} />

      <dl className="details">
        <dt>Email</dt><dd>{employee.email}</dd>
        <dt>Department</dt><dd>{employee.department}</dd>
        <dt>Job title</dt><dd>{employee.jobTitle}</dd>
        <dt>Manager</dt><dd>{employee.manager || '—'}</dd>
        <dt>Start date</dt><dd>{employee.startDate}</dd>
        {employee.endDate && (<><dt>Last working day</dt><dd>{employee.endDate}</dd></>)}
        {employee.exitReason && (<><dt>Exit reason</dt><dd>{employee.exitReason}</dd></>)}
      </dl>

      {offTasks.length > 0 && (
        <Checklist title="Offboarding" tasks={offTasks} progress={employee.offboardingProgress} onToggle={toggle} />
      )}
      <Checklist title="Onboarding" tasks={onTasks} progress={employee.onboardingProgress} onToggle={toggle} />

      {['onboarding', 'active'].includes(employee.status) && (
        <section className="panel">
          <h2>Offboard employee</h2>
          <OffboardForm onSubmit={(body) => run(() => api.offboard(id, body))} />
        </section>
      )}
    </>
  );
}
