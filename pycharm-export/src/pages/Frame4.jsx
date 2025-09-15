import React from 'react';
import MobileFrame from '../components/MobileFrame';
import frame4Image from '../assets/frame4.png';
import './Frame4.css';

const Frame4 = () => {
  return (
    <MobileFrame frameNumber={4}>
      <div className="frame4-container">
        <img 
          src={frame4Image} 
          alt="Frame 4 from Figma" 
          className="frame4-image"
        />
      </div>
    </MobileFrame>
  );
};

export default Frame4;
