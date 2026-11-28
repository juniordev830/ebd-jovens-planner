<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Http\Requests\StoreLessonRequest;
use App\Http\Resources\LessonResource;
use App\Models\Lesson;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class LessonController
{
    public function index(Request $request) {
        $filters = $request->validate(['quarter'=>['sometimes','string','regex:/^[0-9]{4}-0[1-4]$/D'], 'page'=>['sometimes','integer','between:1,100000'], 'limit'=>['sometimes','integer','between:1,100']]);
        $query = Lesson::query()->orderBy('lesson_date')->orderBy('id');
        if (isset($filters['quarter'])) $query->where('quarter',$filters['quarter']);
        return LessonResource::collection($query->paginate((int)($filters['limit'] ?? 20)));
    }
    public function show(string $id) { return new LessonResource(Lesson::findOrFail($id)); }
    public function store(StoreLessonRequest $request, string $id) {
        $payload = $request->lesson();
        $revision = (int)$request->validated('revision');
        if ($revision === 0) {
            try {
                $record = DB::transaction(fn () => Lesson::create(['id'=>$id,'title'=>$payload['title'],'quarter'=>$payload['quarter'],'lesson_date'=>$payload['date'],'payload'=>$payload,'revision'=>1]));
            } catch (UniqueConstraintViolationException $error) {
                return $this->conflict();
            }
            return (new LessonResource($record))->response()->setStatusCode(201);
        }
        // A single conditional UPDATE prevents lost updates across workers.
        $changed = Lesson::whereKey($id)->where('revision',$revision)->update([
            'title'=>$payload['title'],'quarter'=>$payload['quarter'],'lesson_date'=>$payload['date'],
            'payload'=>json_encode($payload,JSON_THROW_ON_ERROR),'revision'=>$revision+1,
        ]);
        if (!$changed) return $this->conflict();
        return new LessonResource(Lesson::findOrFail($id));
    }
    public function destroy(Request $request, string $id) {
        $data = $request->validate(['revision'=>['required','integer','between:1,2147483647']]);
        if (!Lesson::whereKey($id)->where('revision',(int)$data['revision'])->delete()) return $this->conflict();
        return response()->noContent();
    }
    private function conflict() { return response()->json(['message'=>'A versão mudou. Consulte a lição antes de tentar novamente.'],409); }
}
