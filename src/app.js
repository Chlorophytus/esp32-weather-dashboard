import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

import mqtt from 'mqtt'
const client = mqtt.connect("ws://192.168.88.25:8080");

// Change this if your pressure reading is off
const pressureTrim = 22.5;

// Change this if your temperature reading is off
const temperatureTrim = 0;

const ctxPressure = document.getElementById("weather-pressure");
const ctxTemperature = document.getElementById("weather-temperature");
var pressure = [];
var temperature = [];
var labels = [];
const weatherHistory = 50;

const chartPressure = new Chart(ctxPressure, {
    type: 'line', data: {
        labels: labels,
        datasets: [{
            label: 'Atmospheric pressure (mbar)',
            data: pressure,
            fill: false,
            backgroundColor: 'deepskyblue',
            borderColor: 'deepskyblue',
            pointHitRadius: 16
        }]
    },
    options: {
        scales: {
            x: { type: 'timeseries', time: { unit: 'second' } },
            y: { suggestedMin: 950, suggestedMax: 1050 }
        }
    }
});
const chartTemperature = new Chart(ctxTemperature, {
    type: 'line', data: {
        labels: labels,
        datasets: [{
            label: 'Sensor temperature (°C)',
            data: temperature,
            fill: false,
            backgroundColor: 'orangered',
            borderColor: 'orangered',
            pointHitRadius: 16
        }]
    },
    options: {
        scales: {
            x: { type: 'timeseries', time: { unit: 'second' } },
            y: { suggestedMin: 0, suggestedMax: 40 },
        }
    }
});

client.subscribe('weather/status');

client.on("message", (topic, message) => {
    if (topic === 'weather/status') {
        const json = JSON.parse(message);
        const date = json.unix_time * 1000;
        const pressureValue = Math.round((json.data.pressure / 100) + pressureTrim);

        if (pressureValue >= 1030) {
            document.getElementById("weather-pressure-trend").innerText = "quite calm";
        } else if (pressureValue <= 1000) {
            if(pressureValue <= 920) {
                document.getElementById("weather-pressure-trend").innerText = "quite stormy";
            } else if(pressureValue <= 980) {
                document.getElementById("weather-pressure-trend").innerText = "stormy";
            } else {
                document.getElementById("weather-pressure-trend").innerText = "rainy";
            }
        } else {
            document.getElementById("weather-pressure-trend").innerText = "calm";
        }

        const temperatureValue_C = Math.round(((json.data.temperature / 100) + temperatureTrim) * 10) / 10;
        const temperatureValue_F = Math.round((((json.data.temperature / 100) + temperatureTrim) * (9 / 5) + 32) * 2) / 2;

        document.getElementById("weather-time-text").innerText = new Date(date);
        document.getElementById("weather-pressure-text").innerText = `${pressureValue} millibars`;
        document.getElementById("weather-temperature-text").innerText = `${temperatureValue_C}°C/${temperatureValue_F}°F`;

        if (labels.length > weatherHistory) {
            labels.shift();
        }
        labels.push(date);
        if (pressure.length > weatherHistory) {
            pressure.shift()
        }
        pressure.push(pressureValue);
        if (temperature.length > weatherHistory) {
            temperature.shift()
        }
        temperature.push(temperatureValue_C);

        chartPressure.data.labels = labels;
        chartPressure.data.datasets[0].data = pressure;
        chartPressure.update();
        chartTemperature.data.labels = labels;
        chartTemperature.data.datasets[0].data = temperature;
        chartTemperature.update();
    }
});