<?php

namespace Database\Seeders;

use App\Domain\Category\Enums\FieldDataType;
use App\Models\CategoryNode;
use App\Models\FieldDefinition;
use App\Models\Placement;
use App\Models\PlacementRule;
use App\Models\VehicleType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $types = [
                ['CAR', '승용차'], ['TRUCK_SPECIAL', '트럭·특장'], ['BUS', '버스'], ['CAMPING_CARAVAN', '캠핑카·카라반'],
                ['BIKE', '바이크'], ['CONSTRUCTION', '건설기계'], ['FORKLIFT_LOGISTICS', '지게차·물류장비'],
                ['AGRICULTURE', '농기계'], ['PARTS_GOODS', '부품·용품'], ['ALL_VEHICLES', '전체 차량'],
            ];
            foreach ($types as $index => [$key, $name]) {
                $type = VehicleType::query()->firstOrCreate(['system_key' => $key], ['name_ko' => $name, 'namespace' => $key === 'PARTS_GOODS' ? 'ASSET_TYPE' : 'VEHICLE_TYPE', 'sort_order' => $index * 10]);
                CategoryNode::query()->firstOrCreate(['system_key' => $key.'_ROOT'], ['vehicle_type_id' => $type->id, 'name_ko' => $name, 'depth' => 0, 'is_leaf' => false, 'sort_order' => 0]);
            }

            foreach ([
                ['PRICE', '가격', FieldDataType::Integer, 'NUMBER', '만원'],
                ['YEAR', '연식', FieldDataType::Integer, 'RANGE', '년'],
                ['MILEAGE', '주행거리', FieldDataType::Integer, 'RANGE', 'km'],
                ['FUEL_TYPE', '연료', FieldDataType::Enum, 'SELECT', null],
                ['SELLER_TYPE', '판매자 유형', FieldDataType::Enum, 'SELECT', null],
            ] as [$key, $label, $type, $component, $unit]) {
                FieldDefinition::query()->firstOrCreate(['system_key' => $key], ['label_ko' => $label, 'data_type' => $type, 'ui_component' => $component, 'unit' => $unit, 'validation_rules' => [], 'options' => []]);
            }

            $all = Placement::query()->firstOrCreate(['system_key' => 'ALL_VEHICLES'], ['name_ko' => '전체 차량', 'kind' => 'GLOBAL', 'analytics_placement_key' => 'listing.all_vehicles']);
            PlacementRule::query()->firstOrCreate(['system_key' => 'ALL_PUBLISHED_VEHICLES'], ['placement_id' => $all->id, 'version' => 1, 'predicate' => ['op' => 'in', 'field' => 'status', 'value' => ['PUBLISHED', 'ACTIVE']], 'status' => 'DRAFT', 'breaking_change' => 'NONE']);
        });
    }
}
