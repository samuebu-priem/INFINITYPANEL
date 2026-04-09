import { forwardRef } from "react";

const variantStyles = {
  primary: "action-button--primary",
  secondary: "action-button--secondary",
};

const ActionButton = forwardRef(function ActionButton(
  { variant = "secondary", className = "", type = "button", children, ...props },
  ref,
) {
  const variantClass = variantStyles[variant] || variantStyles.secondary;

  return (
    <button
      ref={ref}
      type={type}
      className={`action-button ${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
});

export default ActionButton;
