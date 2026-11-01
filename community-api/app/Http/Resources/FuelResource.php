<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 화면 lib/data.ts 의 FuelPost 모양. 저장은 km/kWh 로 하고, 화면 호환을 위해 energy 는 kWh/100km 로 내려 준다
 * (화면 fuelText 가 100 ÷ energy 로 다시 km/kWh 를 만든다).
 */
class FuelResource extends JsonResource
{
    use PostCan;

    public function toArray(Request $request): array
    {
        $d = $this->fuel;
        $pt = $this->vehicle->powertrain;
        return $this->common($request, $this->resource) + [
            'powertrain' => $pt === 'erev' ? 'phev' : $pt,
            'photo' => $this->vehicle->photo,
            'city' => $d->city,
            'odometer' => $d->odometer_km ?? 0,
            'fuel' => $d->fuel_km_per_l,
            'energy' => $d->energy_km_per_kwh ? round(100 / $d->energy_km_per_kwh, 1) : null,
            'energyKmPerKwh' => $d->energy_km_per_kwh,
            'range' => $d->full_charge_km,
            'temperature' => $d->temperature_c,
            'ownerYears' => max(1, (int) $this->author->created_at->diffInYears(now())),
        ];
    }
}
