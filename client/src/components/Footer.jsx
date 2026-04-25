import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer>
            <div className="footer-inner">
                <div className="footer-brand">
                    <div className="footer-logo">
                        <div className="footer-logo-icon">⚡</div>
                        SkillIntel
                    </div>
                    <p className="footer-desc">
                        The global standard for real-time technical skill analysis and professional growth benchmarking.
                    </p>
                </div>
                <div>
                    <div className="footer-col-title">Company</div>
                    <div className="footer-col-items">
                        <Link to="/about">About Us</Link>
                        <Link to="/methodology">Methodology</Link>
                        <Link to="/contact">Contact</Link>
                    </div>
                </div>
                <div>
                    <div className="footer-col-title">Connect</div>
                    <div className="footer-col-items">
                        <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
                        <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
                        <Link to="/contact" className="footer-support-btn">Support</Link>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <span>© 2026 Skill Intel Market Intelligence. All rights reserved.</span>
                <span>All data is benchmarked to ISO-2026 standards.</span>
            </div>
        </footer>
    );
}
