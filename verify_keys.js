const weatherService = require('./services/weatherService');

async function verify() {
    console.log('Verifying API keys...');
    // Allow time for async load in constructor if any (though loadApiKeys is async, constructor doesn't await it, but it starts it)
    // We might need to wait a bit or call loadApiKeys explicitly if we want to be sure, 
    // but the service calls loadApiKeys in constructor. 
    // Let's wait a small amount to ensure file read completes.
    await new Promise(resolve => setTimeout(resolve, 1000));

    const key = weatherService.getApiKey('openweather');
    if (key) {
        console.log('✅ OpenWeather key found:', key);
    } else {
        console.error('❌ OpenWeather key NOT found');
        process.exit(1);
    }
}
verify();
