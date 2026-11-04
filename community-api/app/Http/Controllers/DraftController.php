<?php

namespace App\Http\Controllers;

use App\Community\Board;
use App\Http\Requests\SaveDraftRequest;
use App\Models\Draft;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** GET · PUT · DELETE /api/community/{board}/draft — 게시판마다 한 사람 1건. 없으면 data:null */
class DraftController
{
    /** GET /api/community/drafts — 내 임시저장 전부(글쓰기 키트 「임시저장함」) */
    public function index(Request $request): JsonResponse
    {
        $all = Draft::where('user_id', $request->user()->id)->orderByDesc('updated_at')->get();
        return response()->json(['data' => $all->map(fn ($d) => $this->shape($d))->values()]);
    }

    public function show(Request $request, Board $board): JsonResponse
    {
        $d = Draft::where('user_id', $request->user()->id)->where('board', $board->value)->first();
        return response()->json(['data' => $d ? $this->shape($d) : null]);
    }

    public function update(SaveDraftRequest $request, Board $board): JsonResponse
    {
        $d = Draft::updateOrCreate(['user_id' => $request->user()->id, 'board' => $board->value], $request->validated());
        return response()->json(['data' => $this->shape($d)]);
    }

    public function destroy(Request $request, Board $board)
    {
        Draft::where('user_id', $request->user()->id)->where('board', $board->value)->delete();
        return response()->noContent();
    }

    private function shape(Draft $d): array
    {
        return ['board' => $d->board, 'model_id' => $d->model_id, 'model_name' => $d->model_name, 'payload' => $d->payload, 'updated_at' => $d->updated_at->toIso8601String()];
    }
}
