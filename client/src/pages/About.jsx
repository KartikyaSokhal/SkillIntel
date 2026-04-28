import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
export default function About() {
    return (
        <>
            <Navbar />
            <main className="content-page">
                <h1>About SkillIntel</h1>
                <p className="lead">
                    SkillIntel is a real-time skill market intelligence engine for engineers,
                    students, and hiring teams. We measure what the market actually wants — not
                    what surveys claim it wants — by aggregating live signals from job boards,
                    open-source momentum, developer Q&amp;A, and global search interest.
                </p>
                <h2>What we do</h2>
                <ul>
                    <li>Track demand for hundreds of technical skills across India and global markets.</li>
                    <li>Score every skill on a unified 0–100 trend index that updates every six hours.</li>
                    <li>Surface salary benchmarks, regional demand, and recommended companion skills.</li>
                    <li>Help users plan careers and roadmaps grounded in live data, not opinion.</li>
                </ul>
                <h2>Why it matters</h2>
                <p>
                    Career and hiring decisions are too often made on stale data. Bootcamp curriculums
                    lag the market by 18 months; recruiter intuition lags by 6. SkillIntel closes that
                    loop by exposing the same data signals that the most informed hiring managers
                    already use — but in a single, transparent dashboard.
                </p>
                <h2>How to use it</h2>
                <ul>
                    <li><strong>Explorer</strong> — browse the full skill catalog with filters.</li>
                    <li><strong>Compare</strong> — diff up to three skills side-by-side.</li>
                    <li><strong>Profile</strong> — store your career context for personalized recommendations.</li>
                </ul>
            </main>
            <Footer />
        </>
    );
}
