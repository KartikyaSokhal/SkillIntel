import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Avatar from '../components/Avatar';
import { apiFetch, getStoredUser } from '../utils/api';

const cardMotion = (delay = 0) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay, ease: 'easeOut' }
});

const DRAFT_KEY = 'skillintel_profile_draft';
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const LEVEL_SCORE = { Beginner: 25, Intermediate: 55, Advanced: 80, Expert: 95 };

const emptyProfile = {
    name: '',
    email: '',
    status: 'Student',
    headline: '',
    location: '',
    currentRole: '',
    organization: '',
    bio: '',
    avatarUrl: '',
    interestsTechnical: [],
    interestsStrategic: [],
    skillsDetailed: [],
    resume: { fileName: '', mimeType: '', uploadedAt: null, sizeBytes: 0, hasFile: false },
    resumeAnalysis: { atsScore: 0, matchedKeywords: [], missingSkills: [], suggestions: [], parserStatus: 'not_run' }
};

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function computeIntegrityScore(profile) {
    let filled = 0;
    let total = 0;
    const checks = [
        !!profile.name,
        !!profile.headline,
        !!profile.location,
        !!profile.currentRole,
        !!profile.organization,
        !!profile.bio && profile.bio.length > 40,
        (profile.interestsTechnical || []).length >= 2,
        (profile.interestsStrategic || []).length >= 1,
        (profile.skillsDetailed || []).length >= 3,
        !!(profile.resume && profile.resume.hasFile)
    ];
    checks.forEach((ok) => {
        total += 1;
        if (ok) filled += 1;
    });
    return Math.round((filled / Math.max(total, 1)) * 100);
}

function ChipRow({ label, items, onAdd, onRemove, placeholder }) {
    const [draft, setDraft] = useState('');
    const inputRef = useRef(null);
    const [adding, setAdding] = useState(false);

    const commit = () => {
        const value = draft.trim();
        if (value) onAdd(value);
        setDraft('');
        setAdding(false);
    };

    return (
        <div>
            <div className="profile-label">{label}</div>
            <div className="chip-row">
                {items.map((item) => (
                    <span key={item} className="chip">
                        {item}
                        <button type="button" aria-label={`Remove ${item}`} onClick={() => onRemove(item)}>×</button>
                    </span>
                ))}
                {adding ? (
                    <input
                        ref={inputRef}
                        autoFocus
                        className="chip-input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); commit(); }
                            if (e.key === 'Escape') { setDraft(''); setAdding(false); }
                        }}
                        placeholder={placeholder || 'Add and press Enter'}
                    />
                ) : (
                    <button type="button" className="chip-add" onClick={() => setAdding(true)}>+ Add</button>
                )}
            </div>
        </div>
    );
}

function IntegrityRing({ score }) {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
    const keywordMatch = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
    const formatting = score >= 60 ? 'Optimal' : 'Needs Work';
    return (
        <div className="integrity-ring-wrap">
            <div className="integrity-ring">
                <svg viewBox="0 0 160 160">
                    <circle className="integrity-ring-track" cx="80" cy="80" r={radius} />
                    <circle
                        className="integrity-ring-fill"
                        cx="80"
                        cy="80"
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <div className="integrity-ring-center">
                    <div className="integrity-ring-score">{score}</div>
                    <div className="integrity-ring-label">SCORE</div>
                </div>
            </div>
            <div className="integrity-rows" style={{ width: '100%' }}>
                <div className="integrity-row"><span>Keyword Match</span><strong>{keywordMatch}</strong></div>
                <div className="integrity-row"><span>Formatting</span><strong>{formatting}</strong></div>
            </div>
        </div>
    );
}

function ResumeDropZone({ resume, uploading, onUpload }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = (files) => {
        if (!files || !files.length) return;
        onUpload(files[0]);
    };

    return (
        <div
            className={`resume-drop ${dragging ? 'dragging' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFiles(e.dataTransfer.files);
            }}
        >
            <div className="resume-drop-icon">📄</div>
            <div className="resume-drop-title">
                {uploading ? 'Uploading…' : resume.hasFile ? 'Replace Updated Resume' : 'Upload Updated Resume'}
            </div>
            <div className="resume-drop-meta">
                {resume.hasFile
                    ? `${resume.fileName || 'resume'} • ${formatBytes(resume.sizeBytes)}`
                    : 'PDF, DOC, DOCX (Max 5MB)'}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => handleFiles(e.target.files)}
                style={{ display: 'none' }}
            />
        </div>
    );
}

export default function Profile() {
    const [profile, setProfile] = useState(emptyProfile);
    const [originalProfile, setOriginalProfile] = useState(emptyProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState(null);
    const [skillDraft, setSkillDraft] = useState({ name: '', level: 'Intermediate' });

    const storedUser = useMemo(() => getStoredUser(), []);

    useEffect(() => {
        let mounted = true;
        const draftRaw = localStorage.getItem(DRAFT_KEY);
        if (draftRaw) {
            try {
                const draft = JSON.parse(draftRaw);
                setProfile((prev) => ({ ...prev, ...draft }));
            } catch { /* ignore */ }
        }

        apiFetch('/auth/profile')
            .then((response) => {
                if (!mounted) return;
                const u = response.user || {};
                const p = u.profile || {};
                const merged = {
                    ...emptyProfile,
                    name: u.name || storedUser?.name || '',
                    email: u.email || storedUser?.email || '',
                    status: p.status || 'Student',
                    headline: p.headline || '',
                    location: p.location || '',
                    currentRole: p.currentRole || '',
                    organization: p.organization || '',
                    bio: p.bio || '',
                    avatarUrl: p.avatarUrl || '',
                    interestsTechnical: Array.isArray(p.interestsTechnical) ? p.interestsTechnical : [],
                    interestsStrategic: Array.isArray(p.interestsStrategic) ? p.interestsStrategic : [],
                    skillsDetailed: Array.isArray(p.skillsDetailed) && p.skillsDetailed.length
                        ? p.skillsDetailed
                        : (Array.isArray(p.skills) ? p.skills.map((n) => ({ name: n, level: 'Intermediate', score: LEVEL_SCORE.Intermediate })) : []),
                    resume: {
                        fileName: p.resume?.fileName || '',
                        mimeType: p.resume?.mimeType || '',
                        uploadedAt: p.resume?.uploadedAt || null,
                        sizeBytes: p.resume?.sizeBytes || 0,
                        hasFile: !!p.resume?.hasFile
                    },
                    resumeAnalysis: {
                        atsScore: p.resumeAnalysis?.atsScore || 0,
                        matchedKeywords: Array.isArray(p.resumeAnalysis?.matchedKeywords) ? p.resumeAnalysis.matchedKeywords : [],
                        missingSkills: Array.isArray(p.resumeAnalysis?.missingSkills) ? p.resumeAnalysis.missingSkills : [],
                        suggestions: Array.isArray(p.resumeAnalysis?.suggestions) ? p.resumeAnalysis.suggestions : [],
                        parserStatus: p.resumeAnalysis?.parserStatus || 'not_run'
                    },
                };
                setProfile(merged);
                setOriginalProfile(merged);
            })
            .catch(() => {
                if (!mounted) return;
                setProfile((prev) => ({ ...prev, name: prev.name || storedUser?.name || '', email: storedUser?.email || '' }));
            })
            .finally(() => mounted && setLoading(false));

        return () => { mounted = false; };
    }, [storedUser?.name, storedUser?.email]);

    useEffect(() => {
        if (loading) return;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(profile));
    }, [profile, loading]);

    const update = (field, value) => setProfile((prev) => ({ ...prev, [field]: value }));

    const integrityScore = useMemo(() => computeIntegrityScore(profile), [profile]);

    const addInterest = (key) => (value) => {
        if (!value) return;
        const list = profile[key] || [];
        if (list.includes(value)) return;
        update(key, [...list, value]);
    };

    const removeInterest = (key) => (value) => {
        update(key, (profile[key] || []).filter((item) => item !== value));
    };

    const addSkill = () => {
        const name = skillDraft.name.trim();
        if (!name) return;
        if ((profile.skillsDetailed || []).some((s) => s.name.toLowerCase() === name.toLowerCase())) {
            setSkillDraft({ name: '', level: 'Intermediate' });
            return;
        }
        const level = skillDraft.level || 'Intermediate';
        const next = [...profile.skillsDetailed, { name, level, score: LEVEL_SCORE[level] }];
        update('skillsDetailed', next);
        setSkillDraft({ name: '', level: 'Intermediate' });
    };

    const removeSkill = (name) => {
        update('skillsDetailed', profile.skillsDetailed.filter((s) => s.name !== name));
    };

    const changeSkillLevel = (name, level) => {
        update('skillsDetailed', profile.skillsDetailed.map((s) => (
            s.name === name ? { ...s, level, score: LEVEL_SCORE[level] || s.score } : s
        )));
    };

    const handleSave = async (event) => {
        event?.preventDefault();
        setSaving(true);
        setToast(null);

        try {
            const payload = {
                name: profile.name,
                status: profile.status,
                headline: profile.headline,
                location: profile.location,
                currentRole: profile.currentRole,
                organization: profile.organization,
                bio: profile.bio,
                avatarUrl: profile.avatarUrl,
                interestsTechnical: profile.interestsTechnical,
                interestsStrategic: profile.interestsStrategic,
                skillsDetailed: profile.skillsDetailed,
                skills: profile.skillsDetailed.map((s) => s.name)
            };
            const response = await apiFetch('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            if (response?.user?.profile) {
                const p = response.user.profile;
                const fresh = {
                    ...profile,
                    resume: {
                        fileName: p.resume?.fileName || profile.resume.fileName,
                        mimeType: p.resume?.mimeType || profile.resume.mimeType,
                        uploadedAt: p.resume?.uploadedAt || profile.resume.uploadedAt,
                        sizeBytes: p.resume?.sizeBytes || profile.resume.sizeBytes,
                        hasFile: !!p.resume?.hasFile || profile.resume.hasFile
                    },
                    resumeAnalysis: {
                        atsScore: p.resumeAnalysis?.atsScore || profile.resumeAnalysis?.atsScore || 0,
                        matchedKeywords: Array.isArray(p.resumeAnalysis?.matchedKeywords) ? p.resumeAnalysis.matchedKeywords : (profile.resumeAnalysis?.matchedKeywords || []),
                        missingSkills: Array.isArray(p.resumeAnalysis?.missingSkills) ? p.resumeAnalysis.missingSkills : (profile.resumeAnalysis?.missingSkills || []),
                        suggestions: Array.isArray(p.resumeAnalysis?.suggestions) ? p.resumeAnalysis.suggestions : (profile.resumeAnalysis?.suggestions || []),
                        parserStatus: p.resumeAnalysis?.parserStatus || profile.resumeAnalysis?.parserStatus || 'not_run'
                    },
                };
                setProfile(fresh);
                setOriginalProfile(fresh);
            }
            const nextUser = { ...(storedUser || {}), name: payload.name };
            localStorage.setItem('skillintel_user', JSON.stringify(nextUser));
            localStorage.removeItem(DRAFT_KEY);
            setToast({ type: 'success', message: 'Configuration saved.' });
        } catch (err) {
            setToast({ type: 'error', message: err?.message || 'Unable to save profile right now.' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setProfile(originalProfile);
        setToast(null);
    };

    const handleResumeUpload = async (file) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setToast({ type: 'error', message: 'Resume must be 5MB or smaller.' });
            return;
        }
        setUploading(true);
        setToast(null);
        try {
            const fd = new FormData();
            fd.append('resume', file);
            const response = await apiFetch('/auth/profile/resume', { method: 'POST', body: fd });
            const r = response?.resume || {};
            const a = response?.resumeAnalysis || {};
            setProfile((prev) => ({
                ...prev,
                resume: {
                    fileName: r.fileName || file.name,
                    mimeType: r.mimeType || file.type,
                    sizeBytes: r.sizeBytes || file.size,
                    uploadedAt: r.uploadedAt || new Date().toISOString(),
                    hasFile: true
                },
                resumeAnalysis: {
                    atsScore: a.atsScore || 0,
                    matchedKeywords: Array.isArray(a.matchedKeywords) ? a.matchedKeywords : [],
                    missingSkills: Array.isArray(a.missingSkills) ? a.missingSkills : [],
                    suggestions: Array.isArray(a.suggestions) ? a.suggestions : [],
                    parserStatus: a.parserStatus || 'not_run'
                },
            }));
            setToast({ type: 'success', message: 'Resume uploaded.' });
        } catch (err) {
            setToast({ type: 'error', message: err?.message || 'Resume upload failed.' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="profile-shell">
                <aside className="profile-sidebar">
                    <Link to="/dashboard" className="profile-sidebar-link">
                        <span className="profile-sidebar-icon">▦</span> Dashboard
                    </Link>
                    <Link to="/roadmap" className="profile-sidebar-link">
                        <span className="profile-sidebar-icon">⌁</span> Roadmap
                    </Link>
                    <span className="profile-sidebar-link active">
                        <span className="profile-sidebar-icon">◉</span> Profile
                    </span>
                </aside>

                <main className="profile-main">
                    <div className="profile-header-row">
                        <div className="profile-header-text">
                            <h1>Profile &amp; Intelligence</h1>
                            <p>
                                Manage your core identity and operational parameters. The analytical
                                engine uses these metrics to calibrate your career trajectory.
                            </p>
                        </div>
                        <div className="profile-header-actions">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancel} disabled={saving || loading}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || loading}>
                                {saving ? 'Saving…' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="profile-card"><p className="text-muted">Loading profile…</p></div>
                    ) : (
                        <>
                            <div className="profile-grid">
                                <motion.section className="profile-card" {...cardMotion(0)}>
                                    <div className="profile-card-title">
                                        <span className="profile-card-title-icon">◈</span>
                                        Personal Intelligence
                                    </div>
                                    <div className="profile-personal">
                                        <Avatar size="lg" name={profile.name} src={profile.avatarUrl} />
                                        <div className="profile-fields">
                                            <div>
                                                <div className="profile-label">Full Legal Name</div>
                                                <input
                                                    className="profile-input"
                                                    value={profile.name}
                                                    onChange={(e) => update('name', e.target.value)}
                                                />
                                            </div>
                                            <div className="field-grid-2">
                                                <div>
                                                    <div className="profile-label">Primary Designation (Email)</div>
                                                    <div className="profile-readonly-pill">
                                                        {profile.email || '—'}
                                                        <span className="profile-verified-dot" title="Verified" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="profile-label">Geographic Node</div>
                                                    <input
                                                        className="profile-input"
                                                        placeholder="e.g. San Francisco, CA"
                                                        value={profile.location}
                                                        onChange={(e) => update('location', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="profile-label">Current Status</div>
                                                <select
                                                    className="profile-select"
                                                    value={profile.status}
                                                    onChange={(e) => update('status', e.target.value)}
                                                >
                                                    <option value="Student">Student</option>
                                                    <option value="Working Professional">Working Professional</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </motion.section>

                                <motion.section className="profile-card" {...cardMotion(0.05)}>
                                    <div className="profile-card-title">
                                        <span className="profile-card-title-icon">◎</span>
                                        Document Integrity
                                    </div>
                                    <IntegrityRing score={integrityScore} />
                                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.75rem' }}>
                                        <div className="profile-label">ATS SCORE</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                                            {profile.resumeAnalysis?.atsScore || 0}/100
                                        </div>
                                        {profile.resumeAnalysis?.parserStatus === 'doc_not_supported' && (
                                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>DOC parsing is limited. Upload PDF or DOCX for better ATS analysis.</p>
                                        )}
                                        {!!profile.resumeAnalysis?.suggestions?.length && (
                                            <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem', color: 'var(--text-secondary)' }}>
                                                {profile.resumeAnalysis.suggestions.slice(0, 3).map((s) => <li key={s}>{s}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                    <ResumeDropZone resume={profile.resume} uploading={uploading} onUpload={handleResumeUpload} />
                                </motion.section>
                            </div>

                            <motion.section className="profile-card" {...cardMotion(0.1)}>
                                <div className="profile-card-title">
                                    <span className="profile-card-title-icon">⌖</span>
                                    Professional Vector
                                </div>
                                <div className="profile-fields">
                                    <div className="field-grid-2">
                                        <div>
                                            <div className="profile-label">Current Role</div>
                                            <input
                                                className="profile-input"
                                                placeholder="Senior Machine Learning Engineer"
                                                value={profile.currentRole}
                                                onChange={(e) => update('currentRole', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <div className="profile-label">Current Organization</div>
                                            <input
                                                className="profile-input"
                                                placeholder="Organization name"
                                                value={profile.organization}
                                                onChange={(e) => update('organization', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="profile-label">Headline</div>
                                        <input
                                            className="profile-input"
                                            placeholder="One-line summary, e.g. ML platform engineer focused on real-time inference."
                                            value={profile.headline}
                                            onChange={(e) => update('headline', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <div className="profile-label">Operational Biography</div>
                                        <textarea
                                            className="profile-textarea"
                                            rows={4}
                                            value={profile.bio}
                                            maxLength={1000}
                                            placeholder="What you specialize in, what you optimize for, what you're trying to build next."
                                            onChange={(e) => update('bio', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </motion.section>

                            <div className="profile-grid">
                                <motion.section className="profile-card" {...cardMotion(0.15)}>
                                    <div className="profile-card-title">
                                        <span className="profile-card-title-icon">✱</span>
                                        Interest Matrix
                                    </div>
                                    <div className="profile-fields">
                                        <ChipRow
                                            label="Technical Vectors"
                                            items={profile.interestsTechnical}
                                            onAdd={addInterest('interestsTechnical')}
                                            onRemove={removeInterest('interestsTechnical')}
                                            placeholder="e.g. Deep Learning"
                                        />
                                        <ChipRow
                                            label="Strategic Goals"
                                            items={profile.interestsStrategic}
                                            onAdd={addInterest('interestsStrategic')}
                                            onRemove={removeInterest('interestsStrategic')}
                                            placeholder="e.g. Technical Leadership"
                                        />
                                    </div>
                                </motion.section>

                                <motion.section className="profile-card" {...cardMotion(0.2)}>
                                    <div className="profile-card-title" style={{ justifyContent: 'space-between', display: 'flex', width: '100%' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
                                            <span className="profile-card-title-icon">♕</span>
                                            Verified Skills
                                        </span>
                                        <span className="text-muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                            {profile.skillsDetailed.length} tracked
                                        </span>
                                    </div>

                                    <div className="verified-skills">
                                        {profile.skillsDetailed.length === 0 && (
                                            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                Add your first skill below to start tracking proficiency.
                                            </p>
                                        )}
                                        {profile.skillsDetailed.map((skill) => (
                                            <div key={skill.name} className="verified-skill">
                                                <div className="verified-skill-icon">
                                                    {(skill.name || '?').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="verified-skill-body">
                                                    <div className="verified-skill-name">{skill.name}</div>
                                                    <div className="verified-skill-level">
                                                        <select
                                                            className="profile-select"
                                                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.72rem', width: 'auto', background: 'transparent', border: 'none', color: 'inherit' }}
                                                            value={skill.level}
                                                            onChange={(e) => changeSkillLevel(skill.name, e.target.value)}
                                                        >
                                                            {LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <div className="verified-skill-bar">
                                                        <div className="verified-skill-bar-fill" style={{ width: `${skill.score}%` }} />
                                                    </div>
                                                    <button type="button" className="verified-skill-remove" onClick={() => removeSkill(skill.name)} aria-label={`Remove ${skill.name}`}>×</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr auto', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <input
                                            className="profile-input"
                                            placeholder="Add a skill, e.g. PyTorch"
                                            value={skillDraft.name}
                                            onChange={(e) => setSkillDraft((prev) => ({ ...prev, name: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                                        />
                                        <select
                                            className="profile-select"
                                            value={skillDraft.level}
                                            onChange={(e) => setSkillDraft((prev) => ({ ...prev, level: e.target.value }))}
                                        >
                                            {LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                                        </select>
                                        <button type="button" className="btn btn-primary btn-sm" onClick={addSkill}>Add</button>
                                    </div>
                                </motion.section>
                            </div>

                            {toast && (
                                <div className={`profile-toast ${toast.type}`}>{toast.message}</div>
                            )}
                        </>
                    )}
                </main>
            </div>
            <Footer />
        </>
    );
}
