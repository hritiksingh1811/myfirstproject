// Default onboarding / offboarding checklists.
// `offset` is days relative to the start date (onboarding) or last working
// day (offboarding). Negative numbers mean "before" that date.

export const ONBOARDING_CHECKLIST = [
  { title: 'Send offer letter and collect signed contract', owner: 'HR', offset: -14 },
  { title: 'Collect ID, tax and bank details', owner: 'HR', offset: -7 },
  { title: 'Create company email and accounts', owner: 'IT', offset: -3 },
  { title: 'Prepare laptop and equipment', owner: 'IT', offset: -2 },
  { title: 'Grant access to required tools and systems', owner: 'IT', offset: -1 },
  { title: 'Assign onboarding buddy', owner: 'Manager', offset: -1 },
  { title: 'Welcome meeting and office tour', owner: 'Manager', offset: 0 },
  { title: 'Complete compliance and security training', owner: 'Employee', offset: 5 },
  { title: 'Set 30/60/90-day goals', owner: 'Manager', offset: 7 },
  { title: '30-day check-in', owner: 'Manager', offset: 30 },
];

export const OFFBOARDING_CHECKLIST = [
  { title: 'Receive and record resignation / termination letter', owner: 'HR', offset: -14 },
  { title: 'Plan knowledge transfer and handover', owner: 'Manager', offset: -10 },
  { title: 'Complete handover documentation', owner: 'Employee', offset: -3 },
  { title: 'Conduct exit interview', owner: 'HR', offset: -2 },
  { title: 'Collect laptop, ID badge and equipment', owner: 'IT', offset: 0 },
  { title: 'Revoke system, email and building access', owner: 'IT', offset: 0 },
  { title: 'Process final payroll and settlement', owner: 'HR', offset: 3 },
  { title: 'Issue experience / relieving letter', owner: 'HR', offset: 5 },
];
