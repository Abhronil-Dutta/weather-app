import React, { useState, useEffect } from "react";

function WeatherInfo() {
    const [city, setCity] = useState("Tempe");
    const [weatherData, setWeatherData] = useState(null);
    const [unit, setUnit] = useState("Celsius");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [weeklyData, setWeeklyData] = useState(null);

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
    }, []);

    const convertTemperature = (temp) => {
        if (temp == null) return "N/A";
        if (unit === "Celsius") return temp.toFixed(1) + "°C";
        if (unit === "Fahrenheit") return ((temp * 9) / 5 + 32).toFixed(1) + "°F";
        if (unit === "Kelvin") return (temp + 273.15).toFixed(1) + "K";
    };

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
                        const temp = weatherData?.main?.temp;
                        const weatherCondition = weatherData?.weather?.[0]?.main || "Unknown";
                        const humidity = weatherData?.main?.humidity;
                        const windSpeed = weatherData?.wind?.speed || "N/A";
                        const rainLastHour = weatherData?.rain?.["1h"] ? `${weatherData.rain["1h"].toFixed(1)} mm` : "No rain";

                        let advice = "";

                        const convertedTemp = convertTemperature(temp);

                        if (weatherCondition.includes("Rain")) {
                            advice = "Take an umbrella 🌧️";
                        } else if (weatherCondition.includes("Sunny")) {
                            advice = "Wear Sunglasses!! 😎";
                        } else {
                            advice = "Wear comfortable clothes";
                        }

                        return (
                            <>
                                <p>Temperature: {convertedTemp}</p>
                                <p>Condition: {weatherCondition}</p>
                                <p>Humidity: {humidity}%</p>
                                <p>Wind Speed: {windSpeed} m/s</p>
                                <p>Rain (Last Hour): {rainLastHour}</p>
                                <p>
                                    <strong>Advice:</strong> {advice}
                                </p>
                            </>
                        );
                    })()}

                    <h3>7-Day Forecast</h3>
                    {weeklyData ? (
                        <div>
                            {weeklyData.map((day, index) => {
                                const maxTemp = convertTemperature(day.temp.max);
                                const minTemp = convertTemperature(day.temp.min);
                                const condition = day.weather?.main || "Unknown";
                                const maxRainChance = day.maxRainChance != null ? `${day.maxRainChance.toFixed(0)}%` : 'N/A';

                                return (
                                    <div key={index} style={{ marginBottom: "10px" }}>
                                        <p>
                                            <strong>Day {index + 1}</strong>: {maxTemp} / {minTemp}
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
