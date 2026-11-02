export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export function ProgressBar({ value, label }) {
  return (
    <div className="progress" title={`${label ?? ''} ${value}%`}>
      <div className="progress-fill" style={{ width: `${value}%` }} />
      <span className="progress-text">{value}%</span>
    </div>
  );
}

export function ErrorMessage({ error }) {
  return error ? <div className="alert">{error}</div> : null;
}
