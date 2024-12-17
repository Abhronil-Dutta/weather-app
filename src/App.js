import './App.css';
import React from 'react';
import Header from './components/Header';
import WeatherInfo from './components/WeatherInfo';
import TemperatureControl from './components/TemperatureControl';

function App() {
  return (
    <div className="App">
      <Header />
      <WeatherInfo />
      <TemperatureControl />
    </div>
  );
}

export default App;
