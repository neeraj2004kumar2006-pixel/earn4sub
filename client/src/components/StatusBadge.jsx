// components/StatusBadge.jsx - Reusable status badge for Sub4Earn
export default function StatusBadge({ status }) {
  const map = {
    approved:      { cls: 'badge-green',  label: 'Approved' },
    pending:       { cls: 'badge-yellow', label: 'Pending Review' },
    rejected:      { cls: 'badge-red',    label: 'Rejected' },
    not_submitted: { cls: 'badge-gray',   label: 'Not Submitted' },
    not_started:   { cls: 'badge-gray',   label: 'Not Started' },
    credit:        { cls: 'badge-green',  label: 'Credit' },
    debit:         { cls: 'badge-red',    label: 'Debit' },
    paid:          { cls: 'badge-green',  label: 'Paid' },
  };
  const { cls, label } = map[status] || { cls: 'badge-gray', label: status };
  return <span className={cls}>{label}</span>;
}
