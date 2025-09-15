import React from 'react';
import MobileFrame from '../components/MobileFrame';
import frame2Image from '../assets/frame2.png';
import './Frame2.css';

const Frame2 = () => {
  return (
    <MobileFrame frameNumber={2}>
      <div className="frame2-container">
        <img 
          src={frame2Image} 
          alt="Frame 2 from Figma" 
          className="frame2-image"
        />
      </div>
    </MobileFrame>
  );
};

export default Frame2;
