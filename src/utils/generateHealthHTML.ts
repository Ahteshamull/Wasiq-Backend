/**
 * Generates a premium HTML dashboard for system health monitoring.
 */
export const generateHealthHTML = (data: any) => {
  const { systemInfo, timestamp, status, message } = data;
  const { ram, storage, nodeHeap, uptime, environment } = systemInfo;

  const storageAvailable = typeof storage !== "string";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wasiq API - System Health</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        :root {
            --primary: #6366f1;
            --secondary: #a855f7;
            --bg: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --text-main: #f1f5f9;
            --text-dim: #94a3b8;
            --success: #22c55e;
            --warning: #f59e0b;
            --danger: #ef4444;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg);
            background-image: 
                radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 2rem 1rem;
        }

        .container {
            max-width: 1000px;
            width: 100%;
        }

        header {
            text-align: center;
            margin-bottom: 3rem;
            animation: fadeInDown 0.8s ease-out;
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(to right, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 1rem;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.2);
            border-radius: 99px;
            color: var(--success);
            font-size: 0.9rem;
            font-weight: 500;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background-color: var(--success);
            border-radius: 50%;
            margin-right: 8px;
            box-shadow: 0 0 10px var(--success);
            animation: pulse 2s infinite;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .card {
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 1.5rem;
            padding: 1.5rem;
            transition: transform 0.3s ease, border-color 0.3s ease;
            animation: fadeIn 0.8s ease-out forwards;
            opacity: 0;
        }

        .card:hover {
            transform: translateY(-5px);
            border-color: rgba(99, 102, 241, 0.3);
        }

        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
            gap: 0.75rem;
        }

        .icon-box {
            padding: 0.75rem;
            background: rgba(99, 102, 241, 0.1);
            border-radius: 1rem;
            color: var(--primary);
        }

        .card-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-main);
        }

        .stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
            font-size: 0.95rem;
        }

        .stat-label {
            color: var(--text-dim);
        }

        .stat-value {
            font-weight: 600;
        }

        .progress-container {
            height: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }

        .progress-bar {
            height: 100%;
            background: linear-gradient(to right, var(--primary), var(--secondary));
            border-radius: 4px;
            transition: width 1s ease-in-out;
        }

        .env-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        footer {
            text-align: center;
            margin-top: 3rem;
            color: var(--text-dim);
            font-size: 0.85rem;
        }

        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        .card:nth-child(1) { animation-delay: 0.1s; }
        .card:nth-child(2) { animation-delay: 0.2s; }
        .card:nth-child(3) { animation-delay: 0.3s; }
        .card:nth-child(4) { animation-delay: 0.4s; }
        .card:nth-child(5) { animation-delay: 0.5s; }

        @media (max-width: 640px) {
            .grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Wasiq API Dashboard</h1>
            <div class="status-badge">
                <div class="status-dot"></div>
                ${status}
            </div>
            <p style="margin-top: 1rem; color: var(--text-dim);">${message}</p>
        </header>

        <div class="grid">
            <!-- RAM Card -->
            <div class="card">
                <div class="card-header">
                    <div class="icon-box"><i data-lucide="cpu"></i></div>
                    <div class="card-title">Memory (RAM)</div>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total Memory</span>
                    <span class="stat-value">${ram.total}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Used Memory</span>
                    <span class="stat-value">${ram.used}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Free Memory</span>
                    <span class="stat-value">${ram.free}</span>
                </div>
                <div class="stat-label" style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>Usage</span>
                    <span>${ram.usagePercentage}</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${ram.usagePercentage}"></div>
                </div>
            </div>

            <!-- Storage Card -->
            <div class="card">
                <div class="card-header">
                    <div class="icon-box"><i data-lucide="hard-drive"></i></div>
                    <div class="card-title">Storage (ROM)</div>
                </div>
                ${storageAvailable ? `
                    <div class="stat-row">
                        <span class="stat-label">Total Space</span>
                        <span class="stat-value">${storage.total}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Used Space</span>
                        <span class="stat-value">${storage.used}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Available</span>
                        <span class="stat-value">${storage.free}</span>
                    </div>
                    <div class="stat-label" style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>Usage</span>
                        <span>${storage.usagePercentage}</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${storage.usagePercentage}; background: linear-gradient(to right, #3b82f6, #2dd4bf);"></div>
                    </div>
                ` : `
                    <p style="color: var(--danger); font-size: 0.9rem;">${storage}</p>
                `}
            </div>

            <!-- Node Heap Card -->
            <div class="card">
                <div class="card-header">
                    <div class="icon-box"><i data-lucide="layers"></i></div>
                    <div class="card-title">Node.js Process</div>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Heap Total</span>
                    <span class="stat-value">${nodeHeap.total}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Heap Used</span>
                    <span class="stat-value">${nodeHeap.used}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">RSS</span>
                    <span class="stat-value">${nodeHeap.rss}</span>
                </div>
                <div class="stat-row" style="margin-top: 1rem;">
                    <span class="stat-label">Node Version</span>
                    <span class="stat-value" style="color: var(--primary);">${environment.nodeVersion}</span>
                </div>
            </div>

            <!-- Uptime Card -->
            <div class="card">
                <div class="card-header">
                    <div class="icon-box"><i data-lucide="clock"></i></div>
                    <div class="card-title">Uptime</div>
                </div>
                <div class="stat-row">
                    <span class="stat-label">System Uptime</span>
                </div>
                <div class="stat-value" style="margin-bottom: 1rem; color: var(--primary); font-size: 0.9rem;">${uptime.system}</div>
                <div class="stat-row">
                    <span class="stat-label">Application Uptime</span>
                </div>
                <div class="stat-value" style="color: var(--secondary); font-size: 0.9rem;">${uptime.app}</div>
            </div>

            <!-- Environment Card -->
            <div class="card">
                <div class="card-header">
                    <div class="icon-box"><i data-lucide="server"></i></div>
                    <div class="card-title">System Specs</div>
                </div>
                <div class="env-grid">
                    <div>
                        <div class="stat-label">OS</div>
                        <div class="stat-value" style="text-transform: capitalize;">${environment.platform}</div>
                    </div>
                    <div>
                        <div class="stat-label">Arch</div>
                        <div class="stat-value">${environment.arch}</div>
                    </div>
                    <div>
                        <div class="stat-label">CPUs</div>
                        <div class="stat-value">${environment.cpus} Cores</div>
                    </div>
                    <div>
                        <div class="stat-label">Load</div>
                        <div class="stat-value">${environment.loadAverage}</div>
                    </div>
                </div>
            </div>
        </div>

        <footer>
            <p>Last Updated: ${new Date(timestamp).toLocaleString()}</p>
            <p style="margin-top: 0.5rem;">&copy; ${new Date().getFullYear()} Wasiq API Infrastructure</p>
        </footer>
    </div>

    <script>
        lucide.createIcons();
    </script>
</body>
</html>
  `;
};
