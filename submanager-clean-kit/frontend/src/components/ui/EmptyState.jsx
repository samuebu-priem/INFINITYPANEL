import ActionButton from "./ActionButton";

function EmptyState({
  title,
  description,
  buttonLabel,
  onClick,
  className = "",
  children,
  ...props
}) {
  return (
    <div className={`empty-state ${className}`.trim()} {...props}>
      <div className="empty-state__icon" aria-hidden="true">
        ✦
      </div>

      <h3 className="empty-state__title">{title}</h3>

      {description ? <p className="empty-state__description">{description}</p> : null}

      {children}

      {buttonLabel ? (
        <ActionButton variant="primary" onClick={onClick}>
          {buttonLabel}
        </ActionButton>
      ) : null}
    </div>
  );
}

export default EmptyState;
