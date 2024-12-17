import React, { useState } from "react";

function TemperatureControl() {
    const [unit, setUnit] = useState("Celcius");
    const temp = 25;
    const convertTemperature = () => {
        if (unit === "Celcius") return temp.toFixed(2) + "°C";
        if (unit === "Fahrenheit") return ((temp * 9)/5 + 32).toFixed(2) + "°F";
        if (unit === "Kelvin") return (temp + 273.15).toFixed(2) + "K";
    }

    return (
        <div>
            <h3>Temperature Control</h3>
            <p>Current Unit: {unit}</p>
            <p>Temperature: {convertTemperature()}</p>
            <label>
            <input type = "range"
            min="1"
            max="3"
            step="1"
            onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value === 1) setUnit("Celcius");
                if (value === 2) setUnit("Fahrenheit");
                if (value === 3) setUnit("Kelvin")
                
            }}
            />
            Switch Units: (1: Celcius, 2: Fahrenheit, 3: Kelvin)
        </label>
        </div>
        
    )
}

export default TemperatureControl;