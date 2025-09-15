import React from 'react';
import MobileFrame from '../components/MobileFrame';
import frame1Image from '../assets/frame1.png';
import './Frame1.css';

const Frame1 = () => {
  return (
    <MobileFrame frameNumber={1}>
      <div className="frame1-container">
        <img 
          src={frame1Image} 
          alt="Frame 1 from Figma" 
          className="frame1-image"
        />
      </div>
    </MobileFrame>
  );
};

export default Frame1;
