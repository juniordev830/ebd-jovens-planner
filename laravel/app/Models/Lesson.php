<?php
declare(strict_types=1);
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

final class Lesson extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'title', 'quarter', 'lesson_date', 'payload', 'revision'];
    protected function casts(): array { return ['payload'=>'array', 'revision'=>'integer']; }
}
