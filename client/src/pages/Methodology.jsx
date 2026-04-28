import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
export default function Methodology() {
    return (
        <>
            <Navbar />
            <main className="content-page">
                <h1>Methodology</h1>
                <p className="lead">
                    Every score on SkillIntel is reproducible from the four signal sources below.
                    The pipeline runs every six hours; we keep at least seven days of history so
                    we can compute change vs. the previous snapshot.
                </p>
                <h2>The trend score formula</h2>
                <p>For each skill, the unified <code>trend_score</code> (0–100) is:</p>
                <ul>
                    <li><strong>Job market growth</strong> — 50% weight. Computed from JSearch + Adzuna postings.</li>
                    <li><strong>GitHub momentum</strong> — 20% weight. Mentions across trending repos created in the last 14 days.</li>
                    <li><strong>Stack Overflow growth</strong> — 20% weight. New tagged questions in the last 7 days.</li>
                    <li><strong>Google search interest</strong> — 10% weight. Mean of the last 4 weeks via pytrends.</li>
                </ul>
                <p>
                    If a source is unavailable for a given run, its weight is redistributed
                    proportionally across the remaining sources, so the final score always
                    reflects the best available signal.
                </p>
                <h2>Direction and percent change</h2>
                <p>
                    Movement is computed against the previous snapshot stored in
                    <code> skill_trends</code>. We label a skill <code>UP</code> if its score moved
                    up by more than 5%, <code>DOWN</code> if it moved down by more than 5%, and
                    <code> STABLE</code> otherwise.
                </p>
                <h2>Refresh cadence</h2>
                <ul>
                    <li>Cron schedule: <code>0 */6 * * *</code> — four runs per day.</li>
                    <li>Each run inserts one historical document per skill into <code>skill_trends</code> and updates the latest snapshot fields on the <code>Skill</code> document.</li>
                    <li>An on-demand admin endpoint (<code>POST /api/admin/trends/refresh</code>) is available for QA.</li>
                </ul>
                <h2>What we don't claim</h2>
                <p>
                    Our scores measure <em>market signal</em>, not <em>career fit</em>. A skill
                    trending UP is not automatically the right next skill for you — that depends
                    on your context, which we capture in your Profile.
                </p>
            </main>
            <Footer />
        </>
    );
}
