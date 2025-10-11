import React, { useState } from 'react';
import './IpfsInfo.css';

const IpfsInfo = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="ipfs-info-overlay" onClick={onClose}>
      <div className="ipfs-info-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ipfs-info-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        
        <div className="ipfs-info-header">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="ipfs-info-icon"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <h2>🔐 IPFS Secure Upload</h2>
        </div>

        <div className="ipfs-info-content">
          <div className="ipfs-info-section">
            <h3>What is IPFS?</h3>
            <p>
              IPFS (InterPlanetary File System) is a decentralized file storage system that stores your files 
              permanently and securely across a distributed network.
            </p>
          </div>

          <div className="ipfs-info-section">
            <h3>✨ Benefits</h3>
            <ul className="ipfs-benefits-list">
              <li>
                <span className="benefit-icon">🔒</span>
                <div>
                  <strong>Permanent Storage</strong>
                  <p>Files are stored permanently and cannot be deleted</p>
                </div>
              </li>
              <li>
                <span className="benefit-icon">🌐</span>
                <div>
                  <strong>Decentralized</strong>
                  <p>No single point of failure, distributed across the network</p>
                </div>
              </li>
              <li>
                <span className="benefit-icon">✅</span>
                <div>
                  <strong>Verifiable</strong>
                  <p>Content-addressed ensures file integrity</p>
                </div>
              </li>
              <li>
                <span className="benefit-icon">🚀</span>
                <div>
                  <strong>Fast Access</strong>
                  <p>Files served from nearest node for faster loading</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="ipfs-info-section ipfs-warning">
            <h3>⚠️ Important to Know</h3>
            <ul className="ipfs-warning-list">
              <li>
                <strong>Public by Default:</strong> Anyone with the file link (CID) can access it
              </li>
              <li>
                <strong>Cannot Delete:</strong> Once uploaded, files are permanent and cannot be removed
              </li>
              <li>
                <strong>IPFS Daemon Required:</strong> Server must have IPFS daemon running
              </li>
              <li>
                <strong>Slower Initial Upload:</strong> First upload may take longer than normal uploads
              </li>
              <li>
                <strong>File Size Limit:</strong> Currently limited to 5MB per file
              </li>
            </ul>
          </div>

          <div className="ipfs-info-section">
            <h3>📝 How to Use</h3>
            <ol className="ipfs-steps-list">
              <li>Click the <strong>IPFS/Normal</strong> toggle button</li>
              <li>When active (purple gradient), IPFS mode is enabled</li>
              <li>Select your file (image, video, or document)</li>
              <li>File will be uploaded to IPFS network</li>
              <li>You'll receive a unique CID (Content Identifier)</li>
              <li>File accessible via multiple IPFS gateways</li>
            </ol>
          </div>

          <div className="ipfs-info-section ipfs-recommendation">
            <h3>💡 When to Use IPFS</h3>
            <div className="recommendation-grid">
              <div className="recommendation-card">
                <h4>✅ Use IPFS For:</h4>
                <ul>
                  <li>Important documents</li>
                  <li>Legal records</li>
                  <li>Permanent archives</li>
                  <li>Public content</li>
                  <li>Decentralized apps</li>
                </ul>
              </div>
              <div className="recommendation-card">
                <h4>❌ Use Normal For:</h4>
                <ul>
                  <li>Temporary files</li>
                  <li>Private content</li>
                  <li>Large files (&gt;5MB)</li>
                  <li>Quick sharing</li>
                  <li>Deletable content</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="ipfs-info-footer">
            <p>
              <strong>Need Help?</strong> Check the{' '}
              <a 
                href="https://docs.ipfs.tech" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ipfs-link"
              >
                IPFS Documentation
              </a>
            </p>
          </div>
        </div>

        <div className="ipfs-info-actions">
          <button className="ipfs-info-btn primary" onClick={onClose}>
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};

export default IpfsInfo;
