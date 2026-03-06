import { Link } from 'react-router-dom';

export default function Footer({ cols }) {
    return (
        <footer>
            <div className="footer-inner">
                <div className="footer-brand">
                    <div className="footer-logo">
                        <div className="footer-logo-icon">⚡</div>
                        SkillIndex
                    </div>
                    <p className="footer-desc">
                        The global standard for real-time technical skill analysis and professional growth benchmarking.
                    </p>
                </div>
                <div>
                    <div className="footer-col-title">Platform</div>
                    <div className="footer-col-items">
                        <Link to="/explorer">Skills Explorer</Link>
                        <Link to="/compare">Compare Skills</Link>
                        <Link to="/explorer">Global Trends</Link>
                        <a href="#">API Docs</a>
                    </div>
                </div>
                <div>
                    <div className="footer-col-title">Company</div>
                    <div className="footer-col-items">
                        <a href="#">About Us</a>
                        <a href="#">Methodology</a>
                        <a href="#">Contact</a>
                    </div>
                </div>
                <div>
                    <div className="footer-col-title">Connect</div>
                    <div className="footer-col-items">
                        <a href="#">LinkedIn</a>
                        <a href="#">GitHub</a>
                        <a href="#">Support</a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <span>© 2024 SkillIndex Market Intelligence. All rights reserved.</span>
                <span>All data is benchmarked to ISO-2020 standards.</span>
            </div>
        </footer>
    );
}
