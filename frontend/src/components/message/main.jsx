import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Chat from './chat'; 
import Contacts from './contacts';
import './main.css';

export default function Main() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [receiver, setReceiver] = useState(location.state?.receiver || null);
    const [receiverDetails, setReceiverDetails] = useState(location.state?.receiverUsername || null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const [showChat, setShowChat] = useState(false);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768;
            setIsMobileView(isMobile);
            
            // On mobile, show chat only if we have a chat ID
            if (isMobile) {
                setShowChat(!!id);
            } else {
                setShowChat(true);
            }
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [id]);

    // Handle contact selection
    const handleContactSelect = (contact, receiverData) => {
        setReceiver(contact);
        setReceiverDetails(receiverData);
        
        if (isMobileView) {
            setShowChat(true);
        }
    };

    // Handle back to contacts on mobile
    const handleBackToContacts = () => {
        setShowChat(false);
        navigate('/chat');
    };

    // Update receiver when URL changes (e.g., direct link to chat)
    useEffect(() => {
        if (location.state?.receiver) {
            setReceiver(location.state.receiver);
            setReceiverDetails(location.state.receiverUsername);
            if (isMobileView) setShowChat(true);
        }
    }, [location.state, isMobileView]);

    return (
        <div className="main-container">
            <div className={`main-content ${showChat ? 'chat-active' : ''}`}>
                <div className={`contacts-panel ${!showChat ? 'active' : ''}`}>
                    <Contacts onContactSelect={handleContactSelect} />
                </div>
                <div className={`chat-panel ${showChat ? 'active' : ''}`}>
                    {id && (
                        <Chat 
                            chatId={id} 
                            receiver={receiver}
                            receiverDetails={receiverDetails}
                            onBack={isMobileView ? handleBackToContacts : null}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}