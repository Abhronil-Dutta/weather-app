import React, { useState, useEffect } from "react";

function WeatherInfo() {
    const [city, setCity] = useState("Tempe");
    const [weatherData, setWeatherData] = useState(null);
    const [unit, setUnit] = useState("Celsius");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [weeklyData, setWeeklyData] = useState(null);
    const [currentTime, setCurrentTime] = useState("");

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

        return Object.entries(dailyData).map(([date, data]) => {
            return {
                date,
                temp: {
                    min: Math.min(...data.temps),
                    max: Math.max(...data.temps),
                },
                weather: data.weather,
                maxRainChance : data.rainChances.length > 0 ? Math.max(...data.rainChances) * 100 : null,
            };
        });
    };

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
                if (data.cod !== 200) {
                    throw new Error(data.message || "City not found. Please try again.");
                }
                console.log("Weather Data:", data);
                setWeatherData(data);
                const { lat, lon } = data.coord;
                return fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=a0d507e4b45ce304f961d6b0494a488f&units=metric`
                );
            })
            .then((response) => response.json())
            .then((data) => {
                console.log("5-Day Forecast API Response:", data);
                const aggregatedData = aggregateDailyData(data.list);
                setWeeklyData(aggregatedData);
            })
            .catch((error) => {
                console.error("Error fetching data:", error.message);
                setError(error.message);
                setWeatherData(null);
                setWeeklyData(null);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchWeather();
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleString());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

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
        <div>
            <h2>Weather Details</h2>

            <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name"
            />
            <button onClick={fetchWeather}>Search</button>

            <label>
                <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value === 1) setUnit("Celsius");
                        if (value === 2) setUnit("Fahrenheit");
                        if (value === 3) setUnit("Kelvin");
                    }}
                />
                Switch Units: (1: Celsius, 2: Fahrenheit, 3: Kelvin)
            </label>

            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : weatherData ? (
                <div>
                    {(() => {
                        //All data shown
                        const temp = weatherData?.main?.temp;
                        const minDaytemp = weatherData?.main?.temp_min;
                        const maxDaytemp = weatherData?.main?.temp_max;
                        const weatherCondition = weatherData?.weather?.[0]?.main || "Unknown";
                        const humidity = weatherData?.main?.humidity;
                        const windSpeed = weatherData?.wind?.speed || "N/A";
                        const rainLastHour = weatherData?.rain?.["1h"] ? `${weatherData.rain["1h"].toFixed(1)} mm` : "No data available";
                        const sunriseTime = weatherData?.sys?.sunrise ? new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString() : "N/A";
                        const sunsetTime = weatherData?.sys?.sunset ? new Date(weatherData.sys.sunset * 1000).toLocaleTimeString() : "N/A";
                        
                        //Converting Temperature
                        const convertedTemp = convertTemperature(temp);
                        const covertedMinTemp = convertTemperature(minDaytemp);
                        const convertedMaxTemp = convertTemperature(maxDaytemp);

                        //suggestions
                        const suggestions = generateSuggestions({temp, maxDaytemp, minDaytemp, weatherCondition, humidity, windSpeed,});

                        return (
                            <>
                                <p>Current Date & Time: {currentTime}</p>
                                <p>Moon Phase: {getMoonPhase(new Date())}</p>
                                <p>Temperature: {convertedTemp}</p>
                                <p>Max/Min: {convertedMaxTemp} / {covertedMinTemp}</p>
                                <p>Condition: {weatherCondition}</p>
                                <p>Humidity: {humidity}%</p>
                                <p>Wind Speed: {windSpeed} m/s</p>
                                <p>Rain (Last Hour): {rainLastHour}</p>
                                <p>Sunrise: {sunriseTime}</p>
                                <p>Sunset: {sunsetTime}</p>
                                <h4>Suggestions</h4>
                                <ul>
                                    {suggestions.map((suggestion, index)=> (
                                        <li key={index}>{suggestion}</li>
                                    ))}
                                </ul>
                            </>
                        );
                    })()}

                    <h3>7-Day Forecast</h3>
                    {weeklyData ? (
                        <div>
                            {weeklyData.map((day, index) => {
                                const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                const date = new Date(day.date);
                                const dayName = daysOfWeek[date.getDay()];

                                const maxTemp = convertTemperature(day.temp.max);
                                const minTemp = convertTemperature(day.temp.min);
                                const condition = day.weather?.main || "Unknown";
                                const maxRainChance = day.maxRainChance != null ? `${day.maxRainChance.toFixed(0)}%` : 'N/A';

                                return (
                                    <div key={index} style={{ marginBottom: "10px" }}>
                                        <p>
                                            <strong>{dayName}</strong>: {maxTemp} / {minTemp}
                                        </p>
                                        <p>Rain Chance: {maxRainChance}</p>
                                        <p>Condition: {condition}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p>No weekly data available.</p>
                    )}
                </div>
            ) : (
                <p>No data available. Please wait!</p>
            )}
        </div>
    );
}

export default WeatherInfo;
