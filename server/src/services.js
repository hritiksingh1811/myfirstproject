// Business rules for the employee lifecycle.
import { OFFBOARDING_CHECKLIST, ONBOARDING_CHECKLIST } from './checklists.js';

export const STATUS = {
  ONBOARDING: 'onboarding',
  ACTIVE: 'active',
  OFFBOARDING: 'offboarding',
  EXITED: 'exited',
};

export class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const REQUIRED = ['firstName', 'lastName', 'email', 'department', 'jobTitle', 'startDate'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const today = () => new Date().toISOString().slice(0, 10);

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isValidDate(value) {
  return DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

export class EmployeeService {
  /** @param {import('./store.js').Store} store */
  constructor(store) {
    this.store = store;
  }

  get db() {
    return this.store.data;
  }

  // ---- helpers -----------------------------------------------------------

  tasksFor(employeeId, process) {
    return this.db.tasks.filter(
      (t) => t.employeeId === employeeId && (!process || t.process === process),
    );
  }

  progress(employeeId, process) {
    const tasks = this.tasksFor(employeeId, process);
    if (!tasks.length) return 0;
    return Math.round((100 * tasks.filter((t) => t.done).length) / tasks.length);
  }

  serialize(employee) {
    const tasks = this.tasksFor(employee.id).map((t) => ({
      ...t,
      overdue: !t.done && t.dueDate < today(),
    }));
    return {
      ...employee,
      fullName: `${employee.firstName} ${employee.lastName}`,
      onboardingProgress: this.progress(employee.id, 'onboarding'),
      offboardingProgress: this.progress(employee.id, 'offboarding'),
      tasks,
    };
  }

  createTasks(employeeId, process, checklist, anchorDate) {
    for (const item of checklist) {
      this.db.tasks.push({
        id: this.db.nextTaskId++,
        employeeId,
        process,
        title: item.title,
        owner: item.owner,
        dueDate: addDays(anchorDate, item.offset),
        done: false,
        completedAt: null,
      });
    }
  }

  // ---- queries -----------------------------------------------------------

  list({ status, search } = {}) {
    let list = this.db.employees;
    if (status) list = list.filter((e) => e.status === status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        [e.firstName, e.lastName, e.email, e.department, e.jobTitle]
          .join(' ')
          .toLowerCase()
          .includes(q),
      );
    }
    return list.map((e) => this.serialize(e));
  }

  get(id) {
    const employee = this.db.employees.find((e) => e.id === Number(id));
    if (!employee) throw new ServiceError('Employee not found', 404);
    return employee;
  }

  stats() {
    const counts = Object.fromEntries(Object.values(STATUS).map((s) => [s, 0]));
    for (const e of this.db.employees) counts[e.status] += 1;
    const open = this.db.tasks.filter((t) => !t.done);
    const overdue = open
      .filter((t) => t.dueDate < today())
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((t) => {
        const e = this.get(t.employeeId);
        return { ...t, employeeName: `${e.firstName} ${e.lastName}` };
      });
    return { total: this.db.employees.length, counts, openTasks: open.length, overdue };
  }

  // ---- commands ----------------------------------------------------------

  onboard(input) {
    const missing = REQUIRED.filter((f) => !String(input[f] ?? '').trim());
    if (missing.length) throw new ServiceError(`Missing required fields: ${missing.join(', ')}`);
    if (!EMAIL_RE.test(input.email)) throw new ServiceError('Invalid email address');
    if (!isValidDate(input.startDate)) throw new ServiceError('startDate must be YYYY-MM-DD');

    const email = input.email.trim().toLowerCase();
    if (this.db.employees.some((e) => e.email === email)) {
      throw new ServiceError(`An employee with email ${email} already exists`, 409);
    }

    const employee = {
      id: this.db.nextEmployeeId++,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      department: input.department.trim(),
      jobTitle: input.jobTitle.trim(),
      manager: (input.manager || '').trim(),
      startDate: input.startDate,
      endDate: null,
      exitReason: null,
      status: STATUS.ONBOARDING,
      createdAt: new Date().toISOString(),
    };
    this.db.employees.push(employee);
    this.createTasks(employee.id, 'onboarding', ONBOARDING_CHECKLIST, employee.startDate);
    this.store.save();
    return this.serialize(employee);
  }

  startOffboarding(id, { endDate, exitReason } = {}) {
    const employee = this.get(id);
    if ([STATUS.OFFBOARDING, STATUS.EXITED].includes(employee.status)) {
      throw new ServiceError(`${employee.firstName} ${employee.lastName} is already ${employee.status}`);
    }
    if (!isValidDate(endDate || '')) throw new ServiceError('endDate must be YYYY-MM-DD');
    if (endDate < employee.startDate) {
      throw new ServiceError('Last working day cannot be before the start date');
    }
    employee.endDate = endDate;
    employee.exitReason = (exitReason || '').trim() || null;
    employee.status = STATUS.OFFBOARDING;
    this.createTasks(employee.id, 'offboarding', OFFBOARDING_CHECKLIST, endDate);
    this.store.save();
    return this.serialize(employee);
  }

  setTaskDone(taskId, done) {
    const task = this.db.tasks.find((t) => t.id === Number(taskId));
    if (!task) throw new ServiceError('Task not found', 404);
    task.done = Boolean(done);
    task.completedAt = task.done ? new Date().toISOString() : null;
    const employee = this.get(task.employeeId);
    this.refreshStatus(employee);
    this.store.save();
    return this.serialize(employee);
  }

  remove(id) {
    const employee = this.get(id);
    this.db.employees = this.db.employees.filter((e) => e.id !== employee.id);
    this.db.tasks = this.db.tasks.filter((t) => t.employeeId !== employee.id);
    this.store.save();
  }

  // Status moves forward automatically when a checklist is completed,
  // and back again if a task is un-ticked.
  refreshStatus(employee) {
    const on = this.progress(employee.id, 'onboarding');
    const off = this.progress(employee.id, 'offboarding');
    if (employee.status === STATUS.ONBOARDING && on === 100) employee.status = STATUS.ACTIVE;
    else if (employee.status === STATUS.ACTIVE && on < 100) employee.status = STATUS.ONBOARDING;
    else if (employee.status === STATUS.OFFBOARDING && off === 100) employee.status = STATUS.EXITED;
    else if (employee.status === STATUS.EXITED && off < 100) employee.status = STATUS.OFFBOARDING;
  }
}
