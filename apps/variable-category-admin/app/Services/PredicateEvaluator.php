<?php

namespace App\Services;

use InvalidArgumentException;

final class PredicateEvaluator
{
    private const OPERATORS = ['eq', 'neq', 'in', 'not_in', 'gte', 'lte', 'exists', 'and', 'or', 'not'];

    /**
     * @param  array<string, mixed>  $predicate
     * @param  array<string, mixed>  $context
     */
    public function matches(array $predicate, array $context): bool
    {
        $operator = $predicate['op'] ?? null;
        if (! is_string($operator) || ! in_array($operator, self::OPERATORS, true)) {
            throw new InvalidArgumentException('Unsupported predicate operator.');
        }

        if (in_array($operator, ['and', 'or'], true)) {
            $children = $predicate['rules'] ?? null;
            if (! is_array($children) || $children === []) {
                throw new InvalidArgumentException('Boolean predicate requires rules.');
            }
            $results = array_map(fn (mixed $child): bool => is_array($child) && $this->matches($child, $context), $children);

            return $operator === 'and' ? ! in_array(false, $results, true) : in_array(true, $results, true);
        }

        if ($operator === 'not') {
            $child = $predicate['rule'] ?? null;
            if (! is_array($child)) {
                throw new InvalidArgumentException('Not predicate requires one rule.');
            }

            return ! $this->matches($child, $context);
        }

        $field = $predicate['field'] ?? null;
        if (! is_string($field) || ! preg_match('/^[a-z][a-z0-9_.]{0,127}$/', $field)) {
            throw new InvalidArgumentException('Invalid predicate field.');
        }

        $actual = data_get($context, $field);
        $expected = $predicate['value'] ?? null;

        return match ($operator) {
            'eq' => $actual === $expected,
            'neq' => $actual !== $expected,
            'in' => is_array($expected) && in_array($actual, $expected, true),
            'not_in' => is_array($expected) && ! in_array($actual, $expected, true),
            'gte' => is_numeric($actual) && is_numeric($expected) && (float) $actual >= (float) $expected,
            'lte' => is_numeric($actual) && is_numeric($expected) && (float) $actual <= (float) $expected,
            default => (bool) $expected === ($actual !== null),
        };
    }
}
