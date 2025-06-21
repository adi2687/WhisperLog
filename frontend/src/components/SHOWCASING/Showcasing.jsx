import './Showcasing.css';

export default function Showcasing() {
    return (
        <section className="showcasing">
            <div className="feature">
                <img src="/Calls.png" alt="Say Anything" />
                <h2>Say Anything</h2>
                <p>WhisperLog lets you speak your mind freely — messages are encrypted and safe from prying eyes.</p>
            </div>
            <div className="feature">
                <img src="/Media.png" alt="Make Privacy Stick" />
                <h2>Make Privacy Stick</h2>
                <p>Share securely with self-destructing media, encrypted logs, and zero tracking.</p>
            </div>
        </section>
    );
}
