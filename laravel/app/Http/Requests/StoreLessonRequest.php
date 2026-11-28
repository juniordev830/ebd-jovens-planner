<?php
declare(strict_types=1);
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class StoreLessonRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'revision' => ['required','integer','between:0,2147483646'],
            'lesson' => ['required','array:id,title,theme,quarter,date,duration,objectives,references,questions,opening,development,discussion,closing,outline,taught'],
            'lesson.id' => ['required','uuid'],
            'lesson.title' => ['required','string','max:100'], 'lesson.theme' => ['required','string','max:110'],
            'lesson.quarter' => ['required','regex:/^[0-9]{4}-0[1-4]$/D'],
            'lesson.date' => ['required','date_format:Y-m-d'], 'lesson.duration' => ['required','integer','between:15,240'],
            'lesson.objectives' => ['required','string','max:4000'], 'lesson.references' => ['required','string','max:400'],
            'lesson.questions' => ['present','string','max:4000'], 'lesson.outline' => ['present','string','max:8000'],
            'lesson.opening' => ['required','integer','between:0,240'], 'lesson.development' => ['required','integer','between:0,240'],
            'lesson.discussion' => ['required','integer','between:0,240'], 'lesson.closing' => ['required','integer','between:0,240'],
            'lesson.taught' => ['required','boolean'],
        ];
    }
    public function after(): array {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) return;
            $lesson = $this->input('lesson');
            if ($lesson['id'] !== $this->route('id')) $validator->errors()->add('lesson.id','O ID deve corresponder à URL.');
            foreach (['title','theme','objectives','references'] as $field) {
                if (trim($lesson[$field]) === '') $validator->errors()->add('lesson.'.$field,'Informe um texto não vazio.');
            }
            $minutes = array_sum(array_intersect_key($lesson,array_flip(['opening','development','discussion','closing'])));
            if ($minutes > $lesson['duration']) $validator->errors()->add('lesson.duration','As etapas excedem a duração.');
        }];
    }
    public function lesson(): array {
        $lesson = $this->validated('lesson');
        foreach (['duration','opening','development','discussion','closing'] as $key) $lesson[$key] = (int) $lesson[$key];
        $lesson['taught'] = (bool) $lesson['taught'];
        return $lesson;
    }
}
