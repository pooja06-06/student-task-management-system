function StatCard({ title, value, icon, type }) {
    return (
        <div className={`stat-card ${type || ""}`}>
            <div className="stat-card-content">
                <span className="stat-title">{title}</span>
                <strong className="stat-value">{value}</strong>
            </div>

            <div className="stat-icon">
                {icon}
            </div>
        </div>
    );
}

export default StatCard;