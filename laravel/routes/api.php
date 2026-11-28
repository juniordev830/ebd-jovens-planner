<?php
use App\Http\Controllers\LessonController;
use Illuminate\Support\Facades\Route;

Route::get('/lessons',[LessonController::class,'index']);
Route::get('/lessons/{id}',[LessonController::class,'show'])->whereUuid('id');
Route::put('/lessons/{id}',[LessonController::class,'store'])->whereUuid('id');
Route::delete('/lessons/{id}',[LessonController::class,'destroy'])->whereUuid('id');
