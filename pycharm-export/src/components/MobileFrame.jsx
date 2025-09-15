import React from 'react';
import './MobileFrame.css';

const MobileFrame = ({ 
  children, 
  frameNumber = 1, 
  backgroundColor = 'var(--color-background)',
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={`mobile-frame mobile-frame--${frameNumber} ${className}`}
      style={{ backgroundColor }}
      {...props}
    >
      <div className="mobile-frame__content">
        {children}
      </div>
    </div>
  );
};

export default MobileFrame;
