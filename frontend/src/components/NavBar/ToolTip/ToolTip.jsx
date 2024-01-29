import React, { useState } from 'react';
import './ToolTip.css';

function Tooltip({ children, text }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="tooltip-container">
      <div
        className="tooltip-text"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      {showTooltip && <div className="tooltip-bubble">{text}</div>}
    </div>
  );
}

export default Tooltip;
