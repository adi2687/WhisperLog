import React from 'react';
import './ProfileCard.css';
import TiltedCard from './ProfileCard';
import { FaTimes } from 'react-icons/fa';
export default function Card({receiverdetails,setviewcard}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      position: 'relative',
    }}>
      <FaTimes onClick={()=>setviewcard(false)} style={{position:'absolute',top:'28%',left:'100%',cursor:'pointer',zIndex:"1"}}/>
      <TiltedCard
        imageSrc={receiverdetails.profilePicture || '/default-avatar.svg'}
        altText={receiverdetails.username}
        captionText={receiverdetails.username}
        containerHeight="400px"
        containerWidth="300px"
        imageHeight="300px"
        imageWidth="300px"
        rotateAmplitude={12}
        scaleOnHover={1.2}
        showMobileWarning={false}
        showTooltip={true}
        displayOverlayContent={true}
        overlayContent={
          <div className="profile-overlay-content">
            <div className="profile-info">
              <div>
              <h3>{receiverdetails.username}</h3>
              {receiverdetails.bio && <p className="bio">{receiverdetails.bio}</p>}
              </div>
              {receiverdetails?.hobbies?.length > 0 && (
                <div className="hobbies">
                  <strong>Hobbies: </strong>
                  {receiverdetails.hobbies.join(', ')}
                </div>
              )}
            </div>
            <style jsx>{`
              .profile-overlay-content {
                padding: 1.5rem;
                color: white;
                text-align: center;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
              }
              .profile-info {
                margin-top: auto;
              }
                .profile-info div:nth-child(1){
                width:100%;
                margin-left:0%;
                border-radius:20%;
                  background: linear-gradient(transparent, rgba(0,0,0,0.7));
                }
              h3 {
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
              }
              .bio {
                margin: 0.5rem 0;
                font-size: 1rem;
                line-height: 1.4;
              }
              .hobbies {
                margin-top: 10rem;
                padding-top: 0.75rem;
                border-top: 1px solid rgba(255,255,255,0.2);
                font-size: 0.95rem;
              }
            `}</style>
          </div>
        }
      />
    </div>
  );
}