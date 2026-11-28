<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;

final class LimitJsonBody
{
    public function handle(Request $request, Closure $next) {
        if (in_array($request->method(),['PUT','DELETE'],true)) {
            if (!$request->isJson()) return response()->json(['message'=>'Envie application/json.'],415);
            if (strlen($request->getContent()) > 65536) return response()->json(['message'=>'O corpo excede 64 KiB.'],413);
        }
        return $next($request);
    }
}
