const errorEngine = require('../dist/index');

errorEngine.init({
    mode: 'dev',
    format: 'pretty',
    breadcrumbs: { enabled: true, maxItems: 10 }
});

function runBreadcrumbCrash() {
    console.log("Testing Breadcrumbs (Action Timeline)...");
    
    // Simulating user journey
    errorEngine.addBreadcrumb("User navigated to /dashboard", "ui");
    errorEngine.addBreadcrumb("Component <ChartWidget> mounted successfully", "lifecycle");
    
    setTimeout(() => {
        errorEngine.addBreadcrumb("Initializing fetch to /api/metrics", "network");
        
        setTimeout(() => {
            errorEngine.addBreadcrumb("fetch() resolved with status 500", "network");
            
            // Crash now
            throw new Error("Failed to parse chart metrics from payload!");
        }, 100);
    }, 100);
}

runBreadcrumbCrash();
