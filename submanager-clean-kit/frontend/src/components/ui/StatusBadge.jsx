const variantStyles = {
  active: "status-badge--active",
  inactive: "status-badge--inactive",
  success: "status-badge--success",
  warning: "status-badge--warning",
  danger: "status-badge--danger",
  neutral: "status-badge--neutral",
};

function StatusBadge({ variant = "neutral", children, className = "", ...props }) {
  const variantClass = variantStyles[variant] || variantStyles.neutral;

  return (
    <span className={`status-badge ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export default StatusBadge;
