import { getTelemetryData, renderEventHorizon, renderTelemetryPayload } from './lib/telemetry.mjs';

const data = await getTelemetryData();

renderTelemetryPayload(data);
renderEventHorizon(data);

console.log('telemetry-payload.svg e event-horizon.svg atualizados:', data);
