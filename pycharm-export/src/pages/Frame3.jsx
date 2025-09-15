import React from 'react';
import MobileFrame from '../components/MobileFrame';
import frame3Image from '../assets/frame3.png';
import './Frame3.css';

const Frame3 = () => {
  return (
    <MobileFrame frameNumber={3}>
      <div className="frame3-container">
        <img 
          src={frame3Image} 
          alt="Frame 3 from Figma" 
          className="frame3-image"
        />
      </div>
    </MobileFrame>
  );
};

export default Frame3;
