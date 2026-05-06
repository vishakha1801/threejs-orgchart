// Mock org structure: 1 CEO -> 5 VPs -> 3-5 agents each.
// Department tints kept in a deep, saturated palette.

export const DEPARTMENTS = {
  executive:   { label: 'Executive',  tint: '#1e3a8a', border: '#172554', ink: '#ffffff' },
  engineering: { label: 'Engineering', tint: '#0369a1', border: '#0c4a6e', ink: '#ffffff' },
  product:     { label: 'Product',     tint: '#0f766e', border: '#064e3b', ink: '#ffffff' },
  marketing:   { label: 'Marketing',   tint: '#6d28d9', border: '#4c1d95', ink: '#ffffff' },
  sales:       { label: 'Sales',       tint: '#b91c1c', border: '#7f1d1d', ink: '#ffffff' },
  operations:  { label: 'Operations',  tint: '#059669', border: '#065f46', ink: '#ffffff' }
};

export const ORG = {
  id: 'ceo',
  name: 'Alex Morgan',
  title: 'Chief Executive Officer',
  location: 'San Francisco, CA',
  initials: 'AM',
  dept: null,
  children: [
    {
      id: 'eng',
      name: 'Mark Chen',
      title: 'VP of Engineering',
      location: 'San Francisco, CA',
      initials: 'MC',
      dept: 'engineering',
      agents: [
        { id: 'eng-1', name: 'Code Reviewer Agent', kind: 'review' },
        { id: 'eng-2', name: 'Test Automation Agent', kind: 'test' },
        { id: 'eng-3', name: 'Deploy Orchestrator', kind: 'deploy' },
        { id: 'eng-4', name: 'PR Triage Agent', kind: 'triage' },
        { id: 'eng-5', name: 'Docs Builder Agent', kind: 'docs' }
      ]
    },
    {
      id: 'prod',
      name: 'Priya Patel',
      title: 'VP of Product',
      location: 'New York, NY',
      initials: 'JP',
      dept: 'product',
      agents: [
        { id: 'prod-1', name: 'Market Research Agent', kind: 'research' },
        { id: 'prod-2', name: 'User Feedback Agent', kind: 'feedback' },
        { id: 'prod-3', name: 'Roadmap Analyzer', kind: 'planning' },
        { id: 'prod-4', name: 'A/B Testing Agent', kind: 'test' },
        { id: 'prod-5', name: 'Release Notes Agent', kind: 'docs' }
      ]
    },
    {
      id: 'mkt',
      name: 'David Nguyen',
      title: 'VP of Marketing',
      location: 'Austin, TX',
      initials: 'SN',
      dept: 'marketing',
      agents: [
        { id: 'mkt-1', name: 'Campaign Optimizer', kind: 'optimize' },
        { id: 'mkt-2', name: 'Content Generator', kind: 'content' },
        { id: 'mkt-3', name: 'SEO Monitor Agent', kind: 'monitor' },
        { id: 'mkt-4', name: 'Lead Scoring Agent', kind: 'score' }
      ]
    },
    {
      id: 'sls',
      name: 'Michelle Williams',
      title: 'VP of Sales',
      location: 'Chicago, IL',
      initials: 'MW',
      dept: 'sales',
      agents: [
        { id: 'sls-1', name: 'Deal Intelligence Agent', kind: 'intel' },
        { id: 'sls-2', name: 'Email Outreach Agent', kind: 'outreach' },
        { id: 'sls-3', name: 'Forecasting Agent', kind: 'forecast' },
        { id: 'sls-4', name: 'Proposal Generator', kind: 'docs' },
        { id: 'sls-5', name: 'CRM Data Agent', kind: 'data' }
      ]
    },
    {
      id: 'ops',
      name: 'James Lee',
      title: 'VP of Operations',
      location: 'Seattle, WA',
      initials: 'JL',
      dept: 'operations',
      agents: [
        { id: 'ops-1', name: 'Process Mining Agent', kind: 'mining' },
        { id: 'ops-2', name: 'Vendor Risk Agent', kind: 'risk' },
        { id: 'ops-3', name: 'Spend Analyzer Agent', kind: 'spend' },
        { id: 'ops-4', name: 'Workflow Agent', kind: 'flow' }
      ]
    }
  ]
};
