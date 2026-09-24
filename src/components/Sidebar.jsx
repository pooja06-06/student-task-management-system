function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">✓</div>

                <div>
                    <h2>TaskFlow</h2>
                    <span>Student Portal</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <button className="nav-item active">
                    <span className="nav-icon">▦</span>
                    <span>Dashboard</span>
                </button>
            </nav>

            <div className="sidebar-bottom">
                <div className="sidebar-quote">
                    <span className="quote-icon">✦</span>

                    <p>
                        Stay organized,
                        <br />
                        stay ahead.
                    </p>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;