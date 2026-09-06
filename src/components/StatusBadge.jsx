const LABEL = {
  pending: "Pending",
  signed: "Signed",
  expired: "Expired",
  cancelled: "Cancelled",
};

const CLASS = {
  pending: "badge-pending",
  signed: "badge-signed",
  expired: "badge-cancelled",
  cancelled: "badge-cancelled",
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${CLASS[status] || "badge-pending"}`}>{LABEL[status] || status}</span>;
}
