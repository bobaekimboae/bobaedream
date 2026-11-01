<?php
// 시험용 사용자와 토큰을 만들어 토큰만 출력한다(로컬 시험 전용). 사용: php tests/make-user.php 닉네임
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$nick = $argv[1] ?? '시험';
$u = App\Models\User::create(['nickname' => $nick, 'email' => uniqid() . '@test.local', 'password' => bin2hex(random_bytes(8))]);
echo $u->createToken('smoke')->plainTextToken;
