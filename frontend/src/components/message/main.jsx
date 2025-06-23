// In main.jsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Chat from './chat'; 
import Contacts from './contacts';

export default function Main() {
    const { id } = useParams();
    const [receiver, setReceiver] = useState(null);

    return (
        <div style={{display: 'flex'}}>
            <Contacts onContactSelect={setReceiver} />
            <Chat chatId={id} receiver={receiver} />
        </div>
    );
}