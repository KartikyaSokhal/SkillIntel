export default function Spinner({ message = 'Loading…' }) {
    return (
        <div className="loading">
            <div className="spinner" />
            <span>{message}</span>
        </div>
    );
}
