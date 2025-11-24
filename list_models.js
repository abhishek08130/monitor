const axios = require('axios');
const fs = require('fs').promises;

async function listModels() {
    try {
        const data = await fs.readFile('api_keys.csv', 'utf8');
        const lines = data.trim().split('\n');
        let apiKey = '';

        lines.forEach(line => {
            const [service, key] = line.split(',');
            if (service && service.trim() === 'gemini') {
                apiKey = key.trim();
            }
        });

        if (!apiKey) {
            console.error('Gemini API key not found in api_keys.csv');
            return;
        }

        console.log('Fetching available models...');
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        console.log('Available Models:');
        response.data.models.forEach(model => {
            if (model.supportedGenerationMethods.includes('generateContent')) {
                console.log(model.name);
            }
        });

    } catch (error) {
        console.error('Error listing models:', error.response?.data || error.message);
    }
}

listModels();
