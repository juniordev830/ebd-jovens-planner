<?php
use App\Http\Middleware\RequireApiToken;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\TrimStrings;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', health: '/up')
    ->withMiddleware(function (Middleware $middleware): void {
        // Preserve lesson text and empty optional fields across archive round trips.
        $middleware->remove([TrimStrings::class, ConvertEmptyStringsToNull::class]);
        $middleware->api(append: ['throttle:60,1', RequireApiToken::class, \App\Http\Middleware\LimitJsonBody::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn ($request) => $request->is('api/*') || $request->expectsJson());
    })->create();
