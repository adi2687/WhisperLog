import FuzzyText from './FuzzyText';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Notfound() {
    const navigate = useNavigate();
    const [count, setCount] = useState(5);

    useEffect(() => {
        if (count === 0) {
            navigate('/');
            return;
        }

        const timer = setTimeout(() => {
            setCount(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [count, navigate]);

    return (
        <>
            <style>
                {`
                    .notfound-container {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #0b1120;
                        color: white;
                        text-align: center;
                        padding: 0 1rem;
                    }

                    .notfound-404 {
                        font-size: clamp(2.5rem, 8vw, 6rem);
                        font-weight: bold;
                    }

                    .notfound-text {
                        font-size: clamp(1.2rem, 4vw, 2rem);
                        margin-top: 1rem;
                    }

                    .notfound-redirect {
                        font-size: clamp(0.9rem, 2vw, 1.5rem);
                        margin-top: 2rem;
                        opacity: 0.8;
                    }
                `}
            </style>

            <div className="notfound-container">
                <FuzzyText
                    baseIntensity={0.4}
                    hoverIntensity={0.9}
                    enableHover={true}
                    className="notfound-404"
                >
                    404
                </FuzzyText>

                <FuzzyText
                    baseIntensity={0.4}
                    hoverIntensity={0.9}
                    enableHover={true}
                    className="notfound-text"
                >
                    Not Found
                </FuzzyText>

                <p className="notfound-redirect">
                    Redirecting to home page in {count}
                </p>
            </div>
        </>
    );
}
