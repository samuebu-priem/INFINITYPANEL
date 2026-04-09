import { forwardRef } from "react";

const SectionCard = forwardRef(function SectionCard(
  { title, subtitle, action, children, className = "", style, ...props },
  ref,
) {
  return (
    <section
      ref={ref}
      {...props}
      className={`section-card ${className}`.trim()}
      style={style}
    >
      {(title || subtitle || action) && (
        <div className="section-card__header">
          <div className="section-card__heading">
            {title ? <h2 className="section-card__title">{title}</h2> : null}
            {subtitle ? (
              <p className="section-card__subtitle">{subtitle}</p>
            ) : null}
          </div>

          {action ? <div className="section-card__action">{action}</div> : null}
        </div>
      )}

      <div className="section-card__body">{children}</div>
    </section>
  );
});

export default SectionCard;
