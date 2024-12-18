import React, { useState, useEffect } from "react";

function WeatherInfo(){
    const[city, setCity] = useState("Tempe");
    const [weatherData, setWeatherData] = useState(null);
    const [unit, setUnit] = useState("Celsius");
    const [error, setError] = useState(null);
    const [loading, setloading] = useState(false);
    const fetchWeather = () => {
        if (!city.trim()) {
            setError("Please enter a city name.");
            return;
        }

        setError(null);
        setloading(true);

        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=a0d507e4b45ce304f961d6b0494a488f&units=metric`)
        .then((response) => response.json())
        .then((data) => {
            if (data.cod !== 200){
                throw new Error(data.message || "City not found. Please try again.");
            }
            console.log("Weather Data:", data);
            setWeatherData(data);
        })
        .catch((error) =>{console.error("Error fetching data:", error)
            setError(error.message);
            setWeatherData(null);})
        .finally(() => {
            setloading(false);
        });

    }

    useEffect(() => {
        fetchWeather();
    }, []);

    const convertTemperature = (temp) => {
        if (temp == null) return "N/A";
        if (unit === "Celsius") return temp.toFixed() + "°C";
        if (unit === "Fahrenheit") return ((temp * 9)/5 + 32).toFixed(2) + "°F";
        if (unit === "Kelvin") return (temp + 273.15).toFixed(2) + "K";
    }  

    return (
        <div>
            <h2>Weather Details</h2>



            <input
                type="text"
                value ={city}
                onChange = {(e) => setCity(e.target.value)}
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
                        if (value === 3) setUnit("Kelvin")
                
                    }}
                    />
                        Switch Units: (1: Celsus, 2: Fahrenheit, 3: Kelvin)
            </label>

           

            {/*Weather Details*/}

            { loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p style={{color: "red"}}>{error}</p>
            ) : weatherData ? (
                <div>
                    {(() => {
                        
                        const temp = weatherData?.main?.temp;
                        const weatherCondition = weatherData?.weather?.[0]?.main;
                        let advice = "";
                        
                        //convert to the desired temperature unit
                        const convertedTemp = convertTemperature(temp);


                        if (weatherCondition?.includes("Rain")){
                            advice = "Take an umbrella 🌧️";
                        } else if (weatherCondition?.includes("Sunny")){
                            advice = "Wear Sunglasses!! 😎";
                        } else if (weatherCondition?.includes("Chilly")){
                            advice = "Take a scarf!! 🧣"
                        } else {
                            advice = "Wear comfortable clothes"
                        }

                        return (
                            <>
                                
                                <p>Temperature : {convertedTemp}</p>
                                <p>Condition : {weatherCondition}</p>
                                <p><strong>Advice :</strong> {advice}</p>
                            </>
                        );
                    })()}
                    
                </div>
            ) : (
                <p>No data available. Please wait!</p>
            )}
        </div>
    );
}

export default WeatherInfo;