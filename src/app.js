import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

import mqtt from 'mqtt'
const client = mqtt.connect("ws://192.168.88.25:8080");

// Change this if your pressure reading is off
const pressureTrim = 2300;

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

function roundPressure(pressure) {
    return Math.round(pressure / 100);
}
function roundTemperature(temperature) {
    return Math.round(((temperature / 100)) * 10) / 10;
}

client.subscribe('weather/status');

client.on("message", (topic, message) => {
    if (topic === 'weather/status') {
        const json = JSON.parse(message);
        const date = json.unix_time * 1000;
        const pressureValue = roundPressure(json.data.pressure + pressureTrim);
        const temperatureValue = roundTemperature(json.data.temperature + temperatureTrim);

        if (pressureValue >= 1030) {
            document.getElementById("weather-pressure-trend").innerText = "quite calm";
        } else if (pressureValue <= 1000) {
            if (pressureValue <= 920) {
                document.getElementById("weather-pressure-trend").innerText = "quite stormy";
            } else if (pressureValue <= 980) {
                document.getElementById("weather-pressure-trend").innerText = "stormy";
            } else {
                document.getElementById("weather-pressure-trend").innerText = "rainy";
            }
        } else {
            document.getElementById("weather-pressure-trend").innerText = "calm";
        }

        document.getElementById("weather-time-text").innerText = new Date(date);
        document.getElementById("weather-pressure-text").innerText = `${pressureValue} millibars`;
        document.getElementById("weather-temperature-text").innerText = `${temperatureValue} °C`;

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
        temperature.push(temperatureValue);

        const pressurePrev = json.previous.pressure;
        if (pressurePrev.length == 10) {
            var derivatives = [];
            for (let index = 1; index < pressurePrev.length; index++) {
                const y1 = pressurePrev[index - 0];
                const y0 = pressurePrev[index - 1];
                derivatives.push((y1 - y0) / 2);
            }

            var sum = derivatives.reduce((previous, current) => { return previous + current }, 0);

            document.getElementById("weather-pressure-dx").innerText = `${roundPressure(sum * 10) / 10} mbar/hour`;
            if(sum > 0.1) {
                document.getElementById("weather-pressure-dx-trend").innerText = "calm";
            } else if(sum < -0.1) {
                document.getElementById("weather-pressure-dx-trend").innerText = "stormy"
            } else {
                document.getElementById("weather-pressure-dx-trend").innerText = "steady";
            }
        }

        const temperaturePrev = json.previous.temperature;
        if (temperaturePrev.length == 10) {
            var derivatives = [];
            for (let index = 1; index < temperaturePrev.length; index++) {
                const y1 = temperaturePrev[index - 0];
                const y0 = temperaturePrev[index - 1];
                derivatives.push((y1 - y0) / 2);
            }

            var sum = derivatives.reduce((previous, current) => { return previous + current }, 0);

            document.getElementById("weather-temperature-dx").innerText = `${roundTemperature(sum)} °C/hour`;
        }

        chartPressure.data.labels = labels;
        chartPressure.data.datasets[0].data = pressure;
        chartPressure.update();
        chartTemperature.data.labels = labels;
        chartTemperature.data.datasets[0].data = temperature;
        chartTemperature.update();
    }
});