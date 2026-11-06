<?php

declare(strict_types=1);

namespace Drupal\example_module\Service;

class TaxCalculator
{
    public function calculateNet(float $total, float $rate): float
    {
        if ($rate < 0.0) {
            throw new \InvalidArgumentException('Tax rate cannot be negative.');
        }
        return $total / (1.0 + $rate);
    }
}
