<?php

use App\Services\PredicateEvaluator;

it('evaluates nested predicates without executable expressions', function (): void {
    $predicate = ['op' => 'and', 'rules' => [
        ['op' => 'in', 'field' => 'status', 'value' => ['ACTIVE', 'PUBLISHED']],
        ['op' => 'gte', 'field' => 'price', 'value' => 1000],
        ['op' => 'eq', 'field' => 'custom.is_ev', 'value' => true],
    ]];
    expect((new PredicateEvaluator)->matches($predicate, ['status' => 'ACTIVE', 'price' => 4500, 'custom' => ['is_ev' => true]]))->toBeTrue();
});

it('rejects unknown operators', function (): void {
    (new PredicateEvaluator)->matches(['op' => 'sql', 'value' => '1=1'], []);
})->throws(InvalidArgumentException::class);

it('uses strict equality', function (): void {
    expect((new PredicateEvaluator)->matches(['op' => 'eq', 'field' => 'year', 'value' => '2026'], ['year' => 2026]))->toBeFalse();
});
