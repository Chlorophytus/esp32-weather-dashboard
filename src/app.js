import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

import mqtt from 'mqtt'
const client = mqtt.connect("ws://192.168.88.25:8080");

// Change this if your pressure reading is off
const pressure_trim = 23;

// Change this if your temperature reading is off
const temperature_trim = 0;

const ctxPressure = document.getElementById("weather-pressure");
const ctxTemperature = document.getElementById("weather-temperature");
var pressure = [];
var temperature = [];
var labels = [];
const weatherHistory = 25;

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
            label: 'Room temperature (°C)',
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

        document.getElementById("weather-time").innerText = new Date(date);

        if (labels.length > weatherHistory) {
            labels.shift();
        }
        labels.push(date);
        if (pressure.length > weatherHistory) {
            pressure.shift()
        }
        pressure.push(Math.round((json.data.pressure / 100) + pressure_trim));
        if (temperature.length > weatherHistory) {
            temperature.shift()
        }
        temperature.push(Math.round(((json.data.temperature / 100) + temperature_trim) * 10) / 10);

        chartPressure.data.labels = labels;
        chartPressure.data.datasets[0].data = pressure;
        chartPressure.update();
        chartTemperature.data.labels = labels;
        chartTemperature.data.datasets[0].data = temperature;
        chartTemperature.update();
    }
});