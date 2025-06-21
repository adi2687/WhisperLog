import { Lock, Zap, Palette, Users, Shield, Clock, MessageSquare, Bell, Check, Code, Smartphone, Globe, Database, Key } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Features.css';

const Features = () => {
  const [visibleCards, setVisibleCards] = useState(Array(6).fill(false));
  const observerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index, 10);
            setVisibleCards(prev => {
              const newVisible = [...prev];
              newVisible[index] = true;
              return newVisible;
            });
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (observerRef.current) {
      const cards = observerRef.current.querySelectorAll('.feature-card');
      cards.forEach((card, index) => {
        card.dataset.index = index;
        observer.observe(card);
      });
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <MessageSquare className="feature-icon" size={24} />,
      title: "AI Memory & Chat Insights",
      description: "One-click summaries and topic extraction to keep track of key conversation points with our intelligent AI assistant.",
      type: 'ai',
      className: 'ai',
      features: [
        "One-click conversation summaries",
        "'What did I miss?' quick catch-up",
        "Automatic topic extraction"
      ]
    },
    {
      icon: <Users className="feature-icon" size={24} />,
      title: "Anonymous Identity Mode",
      description: "Toggle between your named profile and anonymous mode for safe-space chats or stealth participation in conversations.",
      type: 'privacy',
      className: 'privacy',
      features: [
        "Seamless identity switching",
        "Anonymous participation",
        "Profile privacy controls"
      ]
    },
    {
      icon: <Code className="feature-icon" size={24} />,
      title: "Smart Time Travel",
      description: "AI bookmarks and highlights important messages like questions or decisions, allowing fast navigation to key points.",
      type: 'productivity',
      className: 'productivity',
      features: [
        "AI-powered message bookmarks",
        "Quick jump to key moments",
        "Decision tracking"
      ]
    },
    {
      icon: <Check className="feature-icon" size={24} />,
      title: "Conversation Goals & Tasks",
      description: "Transform messages into actionable tasks with deadlines and maintain organized task lists per chat room.",
      type: 'productivity',
      className: 'tasks',
      features: [
        "Message to task conversion",
        "Deadline tracking",
        "Per-room task management"
      ]
    },
    {
      icon: <Globe className="feature-icon" size={24} />,
      title: "Multilingual Auto-Translate",
      description: "Break language barriers with real-time translation that supports seamless communication across different languages.",
      type: 'accessibility',
      className: 'translation',
      features: [
        "Real-time message translation",
        "Toggle original/translated views",
        "Multiple language support"
      ]
    },
    {
      icon: <Lock className="feature-icon" size={24} />,
      title: "End-to-End Encryption",
      description: "Military-grade encryption ensures your conversations remain private and secure, accessible only to intended recipients.",
      type: 'security',
      className: 'security',
      title: "Self-Destructing Messages",
      description: "Set messages to automatically delete after being read or after a set time period for extra security and privacy.",
      type: 'selfDestruct',
      className: 'self-destruct',
      features: [
        "Timer-based deletion",
        "Read receipts",
        "Screenshot protection"
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <section className="features-section">
      <div className="features-bg"></div>
      
      <div className="features-container">
        <motion.div 
          className="features-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="features-badge">
            <span className="badge-icon"><Check size={16} /></span>
            WHY CHOOSE US
          </span>
          <h2 className="features-title">
            Secure. Private. <span className="gradient-text">WhisperLog</span>
          </h2>
          <p className="features-subtitle">
            Experience the next generation of secure messaging with features designed to protect your privacy without compromising on speed or usability.
          </p>
        </motion.div>

        <motion.div 
          ref={observerRef} 
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className={`feature-card ${feature.className} ${visibleCards[index] ? 'visible' : ''}`}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.3 }
              }}
            >
              <div className="feature-icon-container">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-list">
                {feature.features.map((item, i) => (
                  <div key={i} className="feature-list-item">
                    <Check size={16} className="feature-check" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="feature-glow" />
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default Features;