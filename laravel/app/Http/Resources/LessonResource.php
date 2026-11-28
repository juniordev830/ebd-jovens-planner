<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class LessonResource extends JsonResource
{
    public function toArray(Request $request): array {
        return ['lesson'=>$this->payload, 'revision'=>$this->revision, 'updatedAt'=>$this->updated_at->toIso8601String()];
    }
}
