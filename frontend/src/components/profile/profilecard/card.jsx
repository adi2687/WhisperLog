import React from 'react';
import './ProfileCard.css';
import TiltedCard from './ProfileCard';

export default function Card() {
  console.log('in card')
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}>
      <TiltedCard
    imageSrc="https://res.cloudinary.com/drwafvrxw/image/upload/v1750557058/whisperlog/profile-pictures/codqxopsyai9t4ix3eiy.png"
    altText="Kendrick Lamar - GNX Album Cover"
    captionText="Aditya Kurani"
    containerHeight="400px"
    containerWidth="400px"
    imageHeight="400px"
    imageWidth="400px"
    rotateAmplitude={12}
    scaleOnHover={1.2}
    showMobileWarning={false}
    showTooltip={true}
    displayOverlayContent={true}
    overlayContent={
        <p className="tilted-card-demo-text">
            Aditya Kurani
        </p>
    }
/>
    </div>
  );
}