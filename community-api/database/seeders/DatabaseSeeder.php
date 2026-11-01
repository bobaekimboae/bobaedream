<?php

namespace Database\Seeders;

use App\Models\VehicleModel;
use Illuminate\Database\Seeder;

/** 차종 기준표를 화면 데이터(scripts/build-data.mjs 결과)에서 채운다. 글 · 사용자는 넣지 않는다. */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $rows = json_decode(file_get_contents(database_path('data/vehicle-models.json')), true);
        foreach (array_chunk($rows, 200) as $chunk) VehicleModel::upsert($chunk, ['id']);
    }
}
