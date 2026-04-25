import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        const subject = encodeURIComponent(`SkillIntel inquiry from ${form.name || 'a visitor'}`);
        const body = encodeURIComponent(`${form.message}\n\n— ${form.name} <${form.email}>`);
        window.location.href = `mailto:hello@skillintel.dev?subject=${subject}&body=${body}`;
        setSent(true);
    };

    const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    return (
        <>
            <Navbar />
            <main className="content-page">
                <h1>Contact</h1>
                <p className="lead">
                    Have a question, a partnership idea, or a data correction? Reach us at
                    {' '}<a href="mailto:hello@skillintel.dev">hello@skillintel.dev</a> or use the
                    form below — it opens your mail client with the message pre-filled.
                </p>

                <h2>Send a message</h2>
                <form onSubmit={handleSubmit}>
                    <label className="profile-label" htmlFor="contact-name">Your name</label>
                    <input
                        id="contact-name"
                        className="profile-input"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        required
                    />

                    <label className="profile-label" htmlFor="contact-email">Email</label>
                    <input
                        id="contact-email"
                        type="email"
                        className="profile-input"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        required
                    />

                    <label className="profile-label" htmlFor="contact-message">Message</label>
                    <textarea
                        id="contact-message"
                        className="profile-textarea"
                        rows={5}
                        value={form.message}
                        onChange={(e) => update('message', e.target.value)}
                        required
                    />

                    <div>
                        <button type="submit" className="btn btn-primary">Open in mail client</button>
                    </div>
                    {sent && (
                        <p className="profile-toast success">
                            Mail draft opened — if nothing happened, copy the message and email it directly.
                        </p>
                    )}
                </form>
            </main>
            <Footer />
        </>
    );
}
