<?php

namespace App\Http\Controllers;

use App\Http\Resources\MeResource;
use Illuminate\Http\Request;

class MeController
{
    public function show(Request $request): MeResource
    {
        return new MeResource($request->user('sanctum'));
    }
}
