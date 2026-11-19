import { getTelemetryData, renderEventHorizon } from './lib/telemetry.mjs';

const data = await getTelemetryData();

renderEventHorizon(data);

console.log('event-horizon.svg atualizado:', data);
