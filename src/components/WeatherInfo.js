import React, { useState, useEffect } from "react";

function WeatherInfo() {
    const [city, setCity] = useState("Tempe");
    const [weatherData, setWeatherData] = useState(null);
    const [unit, setUnit] = useState("Celsius");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [weeklyData, setWeeklyData] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
    const [timeFormat, setTimeFormat] = useState("24-hour");
    const [currentTime, setCurrentTime] = useState("");
    
    
    
    
    // Logic for fetching and formatting weather data
    const fetchWeather = () => {
        if (!city.trim()) {
            setError("Please enter a city name.");
            setWeeklyData(null);
            setWeatherData(null);
            return;
        }
        setError(null);
        setLoading(true);
        
        fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=a0d507e4b45ce304f961d6b0494a488f&units=metric`
        )
        .then((response) => response.json())
        .then((data) => {
            if (data.cod !== 200) throw new Error(data.message || "City not found.");
            setWeatherData(data);
            const { lat, lon } = data.coord;
            
            return fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=a0d507e4b45ce304f961d6b0494a488f&units=metric`
            );
        })
        .then((response) => response.json())
        .then((forecastData) => {
            const aggregatedData = aggregateDailyData(forecastData.list);
            setWeeklyData(aggregatedData);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    };
    
    const aggregateDailyData = (list) => {
        const dailyData = {};
        list.forEach((entry) => {
            const date = new Date(entry.dt * 1000).toISOString().split("T")[0];
            if (!dailyData[date]) {
                dailyData[date] = {
                    temps: [],
                    weather: entry.weather[0],
                    rainChances: [],
                };
            }
            dailyData[date].temps.push(entry.main.temp);
            if (entry.pop != null) {
                dailyData[date].rainChances.push(entry.pop);
            }
        });
        
        return Object.entries(dailyData).map(([date, data]) => ({
            date,
            temp: { min: Math.min(...data.temps), max: Math.max(...data.temps) },
            weather: data.weather,
            maxRainChance: data.rainChances.length > 0 ? Math.max(...data.rainChances) * 100 : null,
        }));
    };
    
    useEffect(() => {
        fetchWeather();
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleString());
        }, 1000);
        document.body.className = weatherData ? weatherData.weather[0].main.toLowerCase() : 'clear';
        return () => clearInterval(interval);
    }, []);
    
    const getCityTime = (timezoneOffset) => {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000; // UTC time in ms
        const localTime = new Date(utc + timezoneOffset * 1000); // Adjust to city time
        return localTime;
    };
    
    const formatTime = (time, format) => {
        let hours = time.getHours();
        const minutes = time.getMinutes().toString().padStart(2, '0');
        
        if (format === "12-hour") {
            const suffix = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12; // Convert to 12-hour format
            return `${hours}:${minutes} ${suffix}`;
        } else if (format === "military") {
            if (hours < 10) {
                return `0${hours}${minutes}`;
            }
            return `${hours}${minutes}`;
        } else {
            // Default: 24-hour format
            return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
    };
    
    const formatCityTime = (timestamp, timezoneOffset, timeFormat) => {
        const utcTime = new Date((timestamp + 25200 + timezoneOffset) * 1000); // Adjust timestamp with timezone offset
        return formatTime(utcTime, timeFormat); // Use the formatTime function to format the adjusted time
    };
    
    const formatDate = (date, format) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
        const year = date.getFullYear();
        
        if (format === "yyyy/mm/dd") {
            return `${year}/${month}/${day}`;
        } else if (format === "mm/dd/yyyy") {
            return `${month}/${day}/${year}`;
        } else {
            // Default: dd/mm/yyyy
            return `${day}/${month}/${year}`;
        }
    };
    
    const getDayName = (date, timezoneOffset) => {
        const utcDate = new Date(date.getTime() + timezoneOffset * 1000); // Adjust for timezone
        return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(utcDate);
    };
    
    
    
    const generateSuggestions = (weatherData) => {
        const { temp, maxDaytemp, minDaytemp, weatherCondition, humidity, windSpeed } = weatherData;
        let suggestions = [];
        
        // Temperature-based suggestions
        if (temp > 30) suggestions.push("It's hot outside! Stay hydrated and avoid prolonged exposure to the sun. 🥤☀️");
        if (temp < 15) suggestions.push("It's quite chilly! Make sure to wear a coat and gloves. 🧥🧤");
        if (temp >= 15 && temp <= 30) suggestions.push("The weather is pleasant! A light jacket might be all you need. 😊");
        
        // Day temperature swings
        if ((maxDaytemp - minDaytemp) > 10) suggestions.push("Temperature swings today! Wear layers to stay comfortable. 🧥👕");
        if (maxDaytemp > 35) suggestions.push("Be prepared for a hot day ahead. Consider indoor activities. 🌡️");
        if (minDaytemp < 5) suggestions.push("Cold nights expected! Keep warm blankets and heating ready. 🛏️🔥");
        
        // Weather condition suggestions
        if (weatherCondition.includes("Rain")) suggestions.push("Rain is expected. Carry an umbrella and wear waterproof shoes. 🌧️");
        if (weatherCondition.includes("Clouds")) suggestions.push("It's cloudy today. Keep an eye out for unexpected rain. ☁️");
        if (weatherCondition.includes("Clear")) {
            if (temp > 25) suggestions.push("A clear sunny day! Don't forget sunglasses and sunscreen. 😎🧴");
            else if (temp < 10) suggestions.push("Clear skies but chilly! A perfect day for a warm drink. 🍵");
        }
        if (weatherCondition.includes("Snow")) suggestions.push("Snow is expected! Dress warmly and drive carefully. ❄️🚗");
        if (weatherCondition.includes("Fog")) suggestions.push("Visibility might be low due to fog. Drive carefully and use fog lights. 🚗💡");
        if (weatherCondition.includes("Haze")) suggestions.push("Hazy conditions detected. Visibility might be reduced; drive carefully and use headlights. 🚗💡")
        
        // Humidity-based suggestions
        if (humidity > 80) suggestions.push("High humidity! Keep cool and avoid strenuous outdoor activities. 💦");
        if (humidity < 20) suggestions.push("The air is quite dry. Use a moisturizer and stay hydrated. 💧");
        
        // Wind speed suggestions
        if (windSpeed > 10) {
            if (temp < 15) {
                suggestions.push("Wind chill might make it feel colder. Dress in layers. 🧣");
            } else {
                suggestions.push("It's windy outside! Secure loose objects if you're outdoors. 🌬️");
            }
        }
        
        return suggestions;
    };
    
    
    const convertTemperature = (temp) => {
        if (temp == null) return "N/A";
        if (unit === "Celsius") return temp.toFixed(1) + "°C";
        if (unit === "Fahrenheit") return ((temp * 9) / 5 + 32).toFixed(1) + "°F";
        if (unit === "Kelvin") return (temp + 273.15).toFixed(1) + "K";
    };
    
    
    const getMoonPhase = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; 
        const day = date.getDate();
        
        
        const lp = 2551443; 
        const newMoon = new Date(1970, 0, 7, 20, 35, 0).getTime(); 
        const phase = ((date.getTime() - newMoon) / 1000) % lp; 
        const age = Math.floor((phase / (24 * 3600))); 
        
        if (age === 0) return "New Moon 🌑";
        if (age < 7) return "Waxing Crescent 🌒";
        if (age === 7) return "First Quarter 🌓";
        if (age < 14) return "Waxing Gibbous 🌔";
        if (age === 14) return "Full Moon 🌕";
        if (age < 21) return "Waning Gibbous 🌖";
        if (age === 21) return "Last Quarter 🌗";
        return "Waning Crescent 🌘";
    }
    
    return (
    <div class="container">
        {/* Settings */}
        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} class="settings">
            Settings ⚙️
        </button>
        {isSettingsOpen && (
            <div
            style={{
            position: "absolute",
            top: "40px",
            left: "10px",
            background: "#000",
            padding: "10px",
            border: "1px solid #ccc",
            color: "white",
            
        }}
         class = "settings-box">
        <h3>Settings</h3>
        <label>
            Temperature Format: <br />
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="Celsius">Celsius</option>
                <option value="Fahrenheit">Fahrenheit</option>
                <option value="Kelvin">Kelvin</option>
            </select>
        </label>
        <br />
        <label>
            Date Format: <br />
            <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                <option value="yyyy/mm/dd">YYYY/MM/DD</option>
            </select>
        </label>
        <br />
        <label>
            Time Format: <br />
            <select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)}>
                <option value="12-hour">12-Hour</option>
                <option value="24-hour">24-Hour</option>
                <option value="military">Military Time</option>
            </select>
        </label>
        <br />
        <button onClick={() => setIsSettingsOpen(false)}>Close</button>
    </div>
    )}
    
    <div class="content">
        {/* Left Panel */}
        <div class="left_panel">
            <header>
                <h1 class = "mainHeading">Weather Advisor 🌦️</h1>
            </header>
            <div class="search">
                <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name"
                class="input"
                />
                <button onClick={fetchWeather} class="search_button">
                    Search
                </button>
            </div>
            
            {loading ? (
                <p>Loading...</p>
                ) : error ? (
                <p class = "error">{error}</p>
                ) : weatherData ? (
                <>
                <div class="condition-and-suggestions">
                    <p class="condition">{weatherData.weather[0].main || "Unknown"}</p>
                    <h4 class = "suggestion_heading">Suggestions</h4>
                    <ul>
                        {generateSuggestions({
                            temp: weatherData?.main?.temp,
                            maxDaytemp: weatherData?.main?.temp_max,
                            minDaytemp: weatherData?.main?.temp_min,
                            weatherCondition: weatherData?.weather[0].main,
                            humidity: weatherData?.main?.humidity,
                            windSpeed: weatherData?.wind?.speed,
                        }).map((suggestion, index) => (
                        <li key={index}><strong>{suggestion}</strong></li>
                        ))}
                    </ul>
                </div>
                
                <h3 class="s-day">7-Day Forecast</h3>
                <div class="seven_day_forecast">
                    {weeklyData?.map((day, index) => {
                        // Constants for day name and date
                        const cityTime = getCityTime(weatherData.timezone);
                        const forecastDate = new Date(cityTime);
                        forecastDate.setDate(cityTime.getDate() + index + 1); // Adjust date based on index
                        const dayName = getDayName(forecastDate, weatherData.timezone);
                        const formattedDate = formatDate(forecastDate, dateFormat);
                        
                        return (
                        <div key={index} class="seven-day-card">
                            <div class="first-shown">
                                <span>
                                    <p><strong>{dayName}</strong></p>
                                    <p><strong>{formattedDate}</strong></p>
                                    <p>{convertTemperature(day.temp.max)} / {convertTemperature(day.temp.min)}</p>
                                </span>
                            </div>
                            <div class="second-shown">
                                <span>
                                    <p><strong>{dayName}</strong></p>
                                    <p><strong>{formattedDate}</strong></p>
                                    <p>{convertTemperature(day.temp.max)} / {convertTemperature(day.temp.min)}</p>
                                    <p>{day.weather.main || "Unknown"}</p>
                                    <p>Rain Chance: {day.maxRainChance || "N/A"}%</p>
                                </span>
                            </div>
                        </div>
                        );
                    })}
                </div>
                
                </>
                ) : (
                <p>No data available. Please wait!</p>
                )}
            </div>
            
            {/* Right Panel */}
            <div class="right_panel">
                {weatherData && (
                    <div class="right_panel_content">
                        <div class="city_name">
                            <h2>{weatherData.name}</h2>
                        </div>
                        <div class="temp_box">
                            <p class="temp">{convertTemperature(weatherData?.main?.temp)}</p>
                        </div>
                        <div class="misc_data">
                            <div class="card">
                                <p class="misc_detail">
                                    <strong>Current Time</strong><br />
                                    {formatTime(getCityTime(weatherData.timezone), timeFormat)}
                                </p>
                            </div>
                            <div class="card">
                                <p class="misc_detail">
                                    <strong>Current Date</strong><br />
                                    {formatDate(getCityTime(weatherData.timezone), dateFormat)}
                                </p>
                            </div>
                            <div class="card">
                                <p class="misc_detail">
                                    <strong>Today is</strong><br />
                                    {getDayName(new Date(), weatherData.timezone)}
                                </p>
                            </div>
                            <div class="card">
                                <p class="misc_detail">
                                    <strong>Moon Phase</strong><br />
                                    {getMoonPhase(new Date())}
                                </p>
                            </div>
                            <div class="card">
                                <p class="misc_detail">
                                    <strong>Humidity</strong><br />
                                    {weatherData?.main?.humidity}%
                                </p>
                            </div>
                            <div class="card">
                                <p class="misc_detail">
                                    <strong>Sunrise</strong><br />
                                    {formatCityTime(weatherData.sys.sunrise, weatherData.timezone, timeFormat)}
                                </p>
                            </div>
                            <div class="card">
                                <p class="misc_detail">
                                    <strong>Sunset</strong><br />
                                    {formatCityTime(weatherData.sys.sunset, weatherData.timezone, timeFormat)}
                                </p>
                            </div>
                            <div class="card">
                                <p class="misc_detail">
                                    <strong>Wind Speed</strong><br />
                                    {weatherData?.wind?.speed || "N/A"} m/s
                                </p>
                            </div>
                            <div class="card">
                                <p class="misc_detail">
                                    <strong>Rain (Last Hour)</strong><br />
                                    {weatherData?.rain?.["1h"]
                                    ? `${weatherData.rain["1h"].toFixed(1)} mm`
                                    : "No data available"}
                                </p>
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 Weather App. All Rights Reserved.</p>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
        );
        
    }
    
    export default WeatherInfo;
