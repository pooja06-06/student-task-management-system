function WelcomeBanner({ studentName = "Pooja" }) {
    return (
        <section className="welcome-banner">
            <div className="welcome-content">
                <span className="welcome-label">STUDENT DASHBOARD</span>

                <h1>
                    Welcome back, {studentName}! 👋
                </h1>

                <p>
                    Stay organized, manage your tasks, and keep moving
                    towards your academic goals.
                </p>
            </div>

            <div className="welcome-illustration">
                📚
            </div>
        </section>
    );
}

export default WelcomeBanner;