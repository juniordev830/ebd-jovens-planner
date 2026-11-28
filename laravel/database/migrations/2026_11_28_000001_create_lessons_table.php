<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('lessons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title', 100);
            $table->char('quarter', 7);
            $table->date('lesson_date');
            $table->json('payload');
            $table->unsignedInteger('revision')->default(1);
            $table->timestamps();
            $table->index(['quarter', 'lesson_date', 'id']);
        });
    }
    public function down(): void { Schema::dropIfExists('lessons'); }
};
