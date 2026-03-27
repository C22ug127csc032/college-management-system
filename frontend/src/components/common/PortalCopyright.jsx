import React from 'react';

export default function PortalCopyright({ className = '', textClassName = '' }) {
  return (
    <p className={`text-center text-xs leading-relaxed text-white/85 sm:text-sm ${className}`.trim()}>
      <span className={textClassName}>
        &copy; All Rights Reserved. Powered by EMATIX Embedded and Software Solutions Inc.
      </span>
    </p>
  );
}
