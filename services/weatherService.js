const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class WeatherService {
  constructor() {
    this.apiKeys = {};
    this.notificationHistory = new Set(); // Track generated notifications
    this.loadApiKeys();
  }

  async loadApiKeys() {
    try {
      const data = await fs.readFile('api_keys.csv', 'utf8');
      const lines = data.trim().split('\n');
      
      lines.forEach(line => {
        const [service, key] = line.split(',');
        if (service && key) {
          this.apiKeys[service.trim()] = key.trim();
        }
      });
      
      console.log('✅ API keys loaded successfully');
    } catch (error) {
      console.log('⚠️ No API keys file found or error loading keys');
    }
  }

  async saveApiKeys() {
    try {
      const lines = Object.entries(this.apiKeys).map(([service, key]) => `${service},${key}`);
      await fs.writeFile('api_keys.csv', lines.join('\n'));
      console.log('✅ API keys saved successfully');
    } catch (error) {
      console.error('❌ Error saving API keys:', error);
    }
  }

  async setApiKey(service, apiKey) {
    this.apiKeys[service] = apiKey;
    await this.saveApiKeys();
    console.log(`✅ ${service} API key updated`);
  }

  async setMultiApiKeys(keys) {
    if (keys.openweather) {
      this.apiKeys['openweather'] = keys.openweather;
    }
    if (keys.gemini) {
      this.apiKeys['gemini'] = keys.gemini;
    }
    if (keys.openai) {
      this.apiKeys['openai'] = keys.openai;
    }
    await this.saveApiKeys();
    console.log('✅ Multiple API keys updated');
  }

  getApiKey(service) {
    const apiKey = this.apiKeys[service];
    if (!apiKey) {
      console.log(`⚠️ ${service} API key not found`);
      return null;
    }
    
    // Mask API key for logging
    const masked = apiKey.length > 4 ? apiKey.slice(0, -4).replace(/./g, '*') + apiKey.slice(-4) : apiKey;
    console.log(`🔑 Using ${service} API key: ${masked}`);
    return apiKey;
  }

  // Check if notification is unique
  isNotificationUnique(title, body) {
    const notificationKey = `${title}|${body}`;
    if (this.notificationHistory.has(notificationKey)) {
      console.log('⚠️ Duplicate notification detected, will regenerate...');
      return false;
    }
    return true;
  }

  // Add notification to history
  addToHistory(title, body) {
    const notificationKey = `${title}|${body}`;
    this.notificationHistory.add(notificationKey);
    
    // Keep only last 100 notifications to prevent memory issues
    if (this.notificationHistory.size > 100) {
      const firstItem = this.notificationHistory.values().next().value;
      this.notificationHistory.delete(firstItem);
    }
    
    console.log(`✅ Added to history. Total unique notifications: ${this.notificationHistory.size}`);
  }

  async getWeatherData(city = 'Tanakpur') {
    const apiKey = this.getApiKey('openweather');
    if (!apiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    try {
      console.log(`🌤️ Fetching weather data for ${city}...`);
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: city,
          appid: apiKey,
          units: 'metric'
        }
      });

      const weather = response.data;
      console.log(`✅ Weather data received for ${city}: ${weather.weather[0].main} - ${weather.weather[0].description}`);
      
    return {
        city: weather.name,
        temperature: weather.main.temp,
        humidity: weather.main.humidity,
        description: weather.weather[0].description,
        main: weather.weather[0].main,
        isRainy: weather.weather[0].main.toLowerCase().includes('rain') || 
                 weather.weather[0].description.toLowerCase().includes('rain') ||
                 weather.weather[0].main.toLowerCase().includes('drizzle'),
        icon: weather.weather[0].icon
    };
  } catch (error) {
      console.error('❌ Error fetching weather data:', error.response?.data || error.message);
      throw new Error(`Failed to fetch weather data: ${error.response?.data?.message || error.message}`);
    }
  }

  async generateBollywoodNotificationWithGemini(weatherData) {
    const apiKey = this.getApiKey('gemini');
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      console.log('🎬 Generating Bollywood song-style notification with Gemini...');
      
      // Enhanced randomization for maximum variety
      const timestamp = new Date().toISOString();
      const randomSeed = Math.floor(Math.random() * 99999);
      const randomNumber = Math.floor(Math.random() * 1000);
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      
      // More diverse emoji sets
      const emojiSets = [
        ['🌞', '🌡️', '🍦', '🥤', '🍹', '🍉', '🥭', '🍧', '☔', '🌧️', '⛅', '🌤️', '🌈'],
        ['🔥', '❄️', '💧', '☀️', '🌙', '⭐', '🌟', '✨', '💫', '🎉', '🎊', '🎈', '🎁'],
        ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🍜', '🍝', '🍛', '🍚', '🍙'],
        ['🏠', '🏢', '🏪', '🏫', '🏰', '🏯', '🏛️', '⛪', '🕌', '🕍', '🕋', '⛩️', '🗽'],
        ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜']
      ];
      
      const selectedEmojiSet = emojiSets[Math.floor(Math.random() * emojiSets.length)];
      const randomEmoji1 = selectedEmojiSet[Math.floor(Math.random() * selectedEmojiSet.length)];
      const randomEmoji2 = selectedEmojiSet[Math.floor(Math.random() * selectedEmojiSet.length)];
      
      // Bollywood song styles and genres
      const songStyles = [
        'रोमांटिक गाना', 'दोस्ती का गाना', 'फैमिली गाना', 'पार्टी गाना', 'देशभक्ति गाना',
        'सदाबहार गाना', 'डांस नंबर', 'बैलाड', 'पॉप गाना', 'फोक गाना', 'क्लासिक गाना',
        'मॉडर्न गाना', 'रेट्रो गाना', 'इंडी गाना', 'फिल्मी गाना', 'आइटम सॉन्ग'
      ];
      const randomSongStyle = songStyles[Math.floor(Math.random() * songStyles.length)];
      
      // Famous Bollywood song patterns and phrases
      const songPatterns = [
        'ऐसा लगता है जैसे...', 'मेरे दिल में है...', 'आज का दिन है...', 'ये पल है...',
        'जब भी आती है...', 'मौसम है...', 'दिन है...', 'रात है...', 'सुबह है...',
        'शाम है...', 'बारिश है...', 'धूप है...', 'हवा है...', 'गर्मी है...'
      ];
      const randomSongPattern = songPatterns[Math.floor(Math.random() * songPatterns.length)];
      
      // Bollywood song emotions and moods
      const songEmotions = [
        'खुशी', 'उमंग', 'प्यार', 'दोस्ती', 'एकता', 'जोश', 'उत्साह', 'रोमांस',
        'नॉस्टेल्जिया', 'एडवेंचर', 'फ्रीडम', 'हॉप', 'ड्रीम्स', 'पैशन'
      ];
      const randomEmotion = songEmotions[Math.floor(Math.random() * songEmotions.length)];
      
      // Famous Bollywood song references
      const famousSongs = [
        'दिलवाले दुल्हनिया ले जाएंगे - तुझे देखा तो ये जाना संजना',
        'शोले - ये दोस्ती हम नहीं तोड़ेंगे',
        'मदर इंडिया - दुनिया में हम आए हैं',
        'लगान - मितवा बोले कान्हा',
        'रंग दे बसंती - रूबरू',
        '3 इडियट्स - आल इज वेल',
        'दंगल - दंगल',
        'पद्मावत - घूमर',
        'बाजीराव मस्तानी - मल्हार',
        'गुलज़ार - इक याद है मुझे'
      ];
      const randomFamousSong = famousSongs[Math.floor(Math.random() * famousSongs.length)];
      
      // Musical elements and instruments
      const musicalElements = [
        'तबला की थाप', 'सितार की तान', 'हारमोनियम की धुन', 'गिटार की तरंग',
        'पियानो की मधुरता', 'फ्लूट की सुरीली आवाज', 'ड्रम की धड़कन', 'वायलिन की मेलोडी'
      ];
      const randomMusicalElement = musicalElements[Math.floor(Math.random() * musicalElements.length)];
      
      // Weather-based song themes
      const weatherSongThemes = weatherData.isRainy ? [
        'बारिश की रिमझिम', 'बादलों की छाया', 'सुगंधित मिट्टी', 'इंद्रधनुष की रंगत',
        'छतरी के नीचे', 'गरम चाय की महक', 'पकौड़ों की क्रिस्पीनेस'
      ] : [
        'धूप की किरणें', 'आसमान की नीलिमा', 'हवा की ठंडक', 'सूरज की गर्मी',
        'आइसक्रीम की मिठास', 'ठंडे शरबत की ताजगी', 'फलों की रंगत'
      ];
      const randomWeatherTheme = weatherSongThemes[Math.floor(Math.random() * weatherSongThemes.length)];
      
      // Food items with song-like descriptions
      const foodItems = weatherData.isRainy ? 
        ['गरम चाय की महक', 'पकौड़ों की क्रिस्पीनेस', 'समोसों की सुगंध', 'गरम सूप की ताजगी', 'खिचड़ी की गरमाहट', 'दाल चावल की सादगी'] :
        ['आइसक्रीम की मिठास', 'ठंडे शरबत की ताजगी', 'फलों की रंगत', 'सलाद की क्रंचीनेस', 'सैंडविच की फ्रेशनेस', 'बर्गर की जूसीनेस'];
      const randomFood = foodItems[Math.floor(Math.random() * foodItems.length)];
      
      // Time-based song elements
      const timeSongElements = [
        'सुबह की ताज़गी में', 'दोपहर की गर्मी में', 'शाम की ठंडक में', 'रात की शांति में',
        'सप्ताहांत के मज़े में', 'काम के दिन की व्यस्तता में', 'छुट्टी के दिन की आज़ादी में'
      ];
      const randomTimeElement = timeSongElements[Math.floor(Math.random() * timeSongElements.length)];
      
      const prompt = `
आप Pivokart के लिए एक बिल्कुल नया और अनोखा बॉलीवुड सॉन्ग स्टाइल नोटिफिकेशन बनाएं। 

मौसम: ${weatherData.city} में ${weatherData.description}, ${weatherData.temperature}°C${weatherData.isRainy ? ', बारिश' : ''}

नियम:
1. टाइटल: बॉलीवुड गाने के टाइटल जैसा (10-15 शब्द)
2. बॉडी: बॉलीवुड गाने के लिरिक्स जैसा (20-25 शब्द)
3. Pivokart का नाम शामिल करें
4. बिल्कुल नया और अनोखा नोटिफिकेशन बनाएं (समय: ${timestamp}, सीड: ${randomSeed}, नंबर: ${randomNumber})
5. शराब का उल्लेख न करें
6. इस गाने के स्टाइल में बनाएं: ${randomSongStyle}
7. इस गाने के पैटर्न का उपयोग करें: ${randomSongPattern}
8. इस इमोशन में बनाएं: ${randomEmotion}
9. इस फेमस गाने से प्रेरणा लें: ${randomFamousSong}
10. इस म्यूजिकल एलिमेंट का उपयोग करें: ${randomMusicalElement}
11. इस मौसमी थीम का उपयोग करें: ${randomWeatherTheme}
12. इस खाने का उल्लेख करें: ${randomFood}
13. इस समय के अनुसार: ${randomTimeElement}
14. इन इमोजी का उपयोग करें: ${randomEmoji1} ${randomEmoji2}
15. वर्तमान समय: ${currentHour}:${currentMinute}
16. बॉलीवुड गाने जैसा रिदम और फ्लो बनाएं
17. हर बार पूरी तरह अलग गाना स्टाइल नोटिफिकेशन बनाएं

उदाहरण:
- टाइटल: "बारिश में गरम चाय की महक! ☔"
- बॉडी: "मौसम बारिश का है! Pivokart से ऑर्डर करें 🌧️"

JSON फॉर्मेट में जवाब दें:
{
  "title": "टाइटल यहाँ",
  "body": "बॉडी यहाँ"
}
`;

      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const generatedText = response.data.candidates[0].content.parts[0].text;
      console.log('📝 Generated text from Gemini:', generatedText);

      // Extract JSON from response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from Gemini response');
      }

      const notification = JSON.parse(jsonMatch[0]);
      console.log('✅ Bollywood song-style notification generated with Gemini:', notification);
      
      // Check for uniqueness and add to history
      if (this.isNotificationUnique(notification.title, notification.body)) {
        this.addToHistory(notification.title, notification.body);
        return notification;
      } else {
        // If duplicate, regenerate with different random elements
        console.log('🔄 Regenerating due to duplicate...');
        return await this.generateBollywoodNotificationWithGemini(weatherData);
      }
    } catch (error) {
      console.error('❌ Error generating notification with Gemini:', error.response?.data || error.message);
      throw new Error(`Failed to generate notification with Gemini: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateBollywoodNotificationWithOpenAI(weatherData) {
    const apiKey = this.getApiKey('openai');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log('🎬 Generating Bollywood song-style notification with OpenAI...');
      
      // Enhanced randomization for maximum variety
      const timestamp = new Date().toISOString();
      const randomSeed = Math.floor(Math.random() * 99999);
      const randomNumber = Math.floor(Math.random() * 1000);
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      
      // More diverse emoji sets
      const emojiSets = [
        ['🌞', '🌡️', '🍦', '🥤', '🍹', '🍉', '🥭', '🍧', '☔', '🌧️', '⛅', '🌤️', '🌈'],
        ['🔥', '❄️', '💧', '☀️', '🌙', '⭐', '🌟', '✨', '💫', '🎉', '🎊', '🎈', '🎁'],
        ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🍜', '🍝', '🍛', '🍚', '🍙'],
        ['🏠', '🏢', '🏪', '🏫', '🏰', '🏯', '🏛️', '⛪', '🕌', '🕍', '🕋', '⛩️', '🗽'],
        ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜']
      ];
      
      const selectedEmojiSet = emojiSets[Math.floor(Math.random() * emojiSets.length)];
      const randomEmoji1 = selectedEmojiSet[Math.floor(Math.random() * selectedEmojiSet.length)];
      const randomEmoji2 = selectedEmojiSet[Math.floor(Math.random() * selectedEmojiSet.length)];
      
      // Bollywood song styles and genres
      const songStyles = [
        'रोमांटिक गाना', 'दोस्ती का गाना', 'फैमिली गाना', 'पार्टी गाना', 'देशभक्ति गाना',
        'सदाबहार गाना', 'डांस नंबर', 'बैलाड', 'पॉप गाना', 'फोक गाना', 'क्लासिक गाना',
        'मॉडर्न गाना', 'रेट्रो गाना', 'इंडी गाना', 'फिल्मी गाना', 'आइटम सॉन्ग'
      ];
      const randomSongStyle = songStyles[Math.floor(Math.random() * songStyles.length)];
      
      // Famous Bollywood song patterns and phrases
      const songPatterns = [
        'ऐसा लगता है जैसे...', 'मेरे दिल में है...', 'आज का दिन है...', 'ये पल है...',
        'जब भी आती है...', 'मौसम है...', 'दिन है...', 'रात है...', 'सुबह है...',
        'शाम है...', 'बारिश है...', 'धूप है...', 'हवा है...', 'गर्मी है...'
      ];
      const randomSongPattern = songPatterns[Math.floor(Math.random() * songPatterns.length)];
      
      // Bollywood song emotions and moods
      const songEmotions = [
        'खुशी', 'उमंग', 'प्यार', 'दोस्ती', 'एकता', 'जोश', 'उत्साह', 'रोमांस',
        'नॉस्टेल्जिया', 'एडवेंचर', 'फ्रीडम', 'हॉप', 'ड्रीम्स', 'पैशन'
      ];
      const randomEmotion = songEmotions[Math.floor(Math.random() * songEmotions.length)];
      
      // Famous Bollywood song references
      const famousSongs = [
        'दिलवाले दुल्हनिया ले जाएंगे - तुझे देखा तो ये जाना संजना',
        'शोले - ये दोस्ती हम नहीं तोड़ेंगे',
        'मदर इंडिया - दुनिया में हम आए हैं',
        'लगान - मितवा बोले कान्हा',
        'रंग दे बसंती - रूबरू',
        '3 इडियट्स - आल इज वेल',
        'दंगल - दंगल',
        'पद्मावत - घूमर',
        'बाजीराव मस्तानी - मल्हार',
        'गुलज़ार - इक याद है मुझे'
      ];
      const randomFamousSong = famousSongs[Math.floor(Math.random() * famousSongs.length)];
      
      // Musical elements and instruments
      const musicalElements = [
        'तबला की थाप', 'सितार की तान', 'हारमोनियम की धुन', 'गिटार की तरंग',
        'पियानो की मधुरता', 'फ्लूट की सुरीली आवाज', 'ड्रम की धड़कन', 'वायलिन की मेलोडी'
      ];
      const randomMusicalElement = musicalElements[Math.floor(Math.random() * musicalElements.length)];
      
      // Weather-based song themes
      const weatherSongThemes = weatherData.isRainy ? [
        'बारिश की रिमझिम', 'बादलों की छाया', 'सुगंधित मिट्टी', 'इंद्रधनुष की रंगत',
        'छतरी के नीचे', 'गरम चाय की महक', 'पकौड़ों की क्रिस्पीनेस'
      ] : [
        'धूप की किरणें', 'आसमान की नीलिमा', 'हवा की ठंडक', 'सूरज की गर्मी',
        'आइसक्रीम की मिठास', 'ठंडे शरबत की ताजगी', 'फलों की रंगत'
      ];
      const randomWeatherTheme = weatherSongThemes[Math.floor(Math.random() * weatherSongThemes.length)];
      
      // Food items with song-like descriptions
      const foodItems = weatherData.isRainy ? 
        ['गरम चाय की महक', 'पकौड़ों की क्रिस्पीनेस', 'समोसों की सुगंध', 'गरम सूप की ताजगी', 'खिचड़ी की गरमाहट', 'दाल चावल की सादगी'] :
        ['आइसक्रीम की मिठास', 'ठंडे शरबत की ताजगी', 'फलों की रंगत', 'सलाद की क्रंचीनेस', 'सैंडविच की फ्रेशनेस', 'बर्गर की जूसीनेस'];
      const randomFood = foodItems[Math.floor(Math.random() * foodItems.length)];
      
      // Time-based song elements
      const timeSongElements = [
        'सुबह की ताज़गी में', 'दोपहर की गर्मी में', 'शाम की ठंडक में', 'रात की शांति में',
        'सप्ताहांत के मज़े में', 'काम के दिन की व्यस्तता में', 'छुट्टी के दिन की आज़ादी में'
      ];
      const randomTimeElement = timeSongElements[Math.floor(Math.random() * timeSongElements.length)];
      
      const prompt = `
आप Pivokart के लिए एक बिल्कुल नया और अनोखा बॉलीवुड स्टाइल नोटिफिकेशन बनाएं। 

मौसम: ${weatherData.city} में ${weatherData.description}, ${weatherData.temperature}°C${weatherData.isRainy ? ', बारिश' : ''}

नियम:
1. टाइटल: बहुत छोटा (10-15 शब्द)
2. बॉडी: छोटा और मज़ेदार (20-25 शब्द)
3. Pivokart का नाम शामिल करें
4. बिल्कुल नया और अनोखा नोटिफिकेशन बनाएं (समय: ${timestamp}, सीड: ${randomSeed}, नंबर: ${randomNumber})
5. शराब का उल्लेख न करें
6. इस थीम पर आधारित बनाएं: ${randomTheme}
7. इस मूड में बनाएं: ${randomMood}
8. इस समय के अनुसार: ${randomTimeElement}
9. इस फिल्म से प्रेरणा लें: ${randomMovie}
10. इस मौसमी तत्व का उपयोग करें: ${randomWeatherElement}
11. इस खाने का उल्लेख करें: ${randomFood}
12. इन इमोजी का उपयोग करें: ${randomEmoji1} ${randomEmoji2}
13. वर्तमान समय: ${currentHour}:${currentMinute}
14. हर बार पूरी तरह अलग नोटिफिकेशन बनाएं

उदाहरण:
- टाइटल: "बारिश में गरम चाय! ☔"
- बॉडी: "मौसम बारिश का है! Pivokart से ऑर्डर करें 🌧️"

JSON फॉर्मेट में जवाब दें:
{
  "title": "टाइटल यहाँ",
  "body": "बॉडी यहाँ"
}
`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a creative assistant that generates unique and creative Bollywood song-style weather notifications in Hindi. Be imaginative and never repeat the same notification twice. Focus on creating notifications that sound like Bollywood song lyrics with musical rhythm and flow."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 1.0,
        max_tokens: 150,
        presence_penalty: 0.6,
        frequency_penalty: 0.8
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const generatedText = response.data.choices[0].message.content;
      console.log('📝 Generated text from OpenAI:', generatedText);

      // Extract JSON from response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from OpenAI response');
      }

      const notification = JSON.parse(jsonMatch[0]);
      console.log('✅ Bollywood song-style notification generated with OpenAI:', notification);
      
      // Check for uniqueness and add to history
      if (this.isNotificationUnique(notification.title, notification.body)) {
        this.addToHistory(notification.title, notification.body);
        return notification;
      } else {
        // If duplicate, regenerate with different random elements
        console.log('🔄 Regenerating due to duplicate...');
        return await this.generateBollywoodNotificationWithOpenAI(weatherData);
      }
    } catch (error) {
      console.error('❌ Error generating notification with OpenAI:', error.response?.data || error.message);
      throw new Error(`Failed to generate notification with OpenAI: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async generateBollywoodNotification(weatherData, provider = 'gemini') {
    if (provider === 'openai') {
      return this.generateBollywoodNotificationWithOpenAI(weatherData);
    } else {
      return this.generateBollywoodNotificationWithGemini(weatherData);
    }
  }

  async getWeatherAndMessage(city = 'Tanakpur', provider = 'gemini') {
    try {
      // Step 1: Get weather data from OpenWeather
      const weatherData = await this.getWeatherData(city);
      
      // Step 2: Generate Bollywood notification with specified provider
      console.log(`🤖 Using AI provider: ${provider}`);
      const notification = await this.generateBollywoodNotification(weatherData, provider);
      
      return {
        weatherInfo: weatherData,
        notification: notification,
        message: `${notification.title}\n\n${notification.body}`,
        provider: provider
      };
    } catch (error) {
      console.error('❌ Error in getWeatherAndMessage:', error);
      throw error;
    }
  }
}

module.exports = new WeatherService();