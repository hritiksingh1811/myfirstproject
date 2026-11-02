import { NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import EmployeeDetail from './pages/EmployeeDetail.jsx';
import EmployeeList from './pages/EmployeeList.jsx';
import NewEmployee from './pages/NewEmployee.jsx';

export default function App() {
  return (
    <>
      <header className="topbar">
        <div className="brand">Employee Lifecycle</div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/employees">Employees</NavLink>
          <NavLink to="/employees/new" className="btn btn-primary">+ Onboard</NavLink>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/employees/new" element={<NewEmployee />} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
