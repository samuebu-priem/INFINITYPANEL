import { forwardRef } from "react";

const PageShell = forwardRef(function PageShell(
  { children, className = "", style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      {...props}
      className={`page-shell ${className}`.trim()}
      style={style}
    >
      <div className="page-shell__glow" aria-hidden="true" />
      <div className="page-shell__content">{children}</div>
    </div>
  );
});

export default PageShell;
