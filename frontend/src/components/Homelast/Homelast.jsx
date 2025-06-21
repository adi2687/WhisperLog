import { Link } from "react-router-dom";
import './HomeLast.css';
function HomeLast(){
    return(
    <section className="cta">
        <div className="cta-content" >
          <h2>Ready to experience secure messaging?</h2>
          <p>Join thousands of users who trust WhisperLog for their private conversations. No credit card required.</p>
          <div className="cta-buttons" >
            <Link to="/auth" >
              <button>Create Free Account</button>
            </Link>
            <Link to="/features">
              <button>Learn More</button>
            </Link>
          </div>
        </div>   
      </section>
    )
}

export default HomeLast;