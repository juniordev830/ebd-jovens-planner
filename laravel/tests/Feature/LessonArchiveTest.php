<?php
declare(strict_types=1);
namespace Tests\Feature;
use App\Models\Lesson;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

final class LessonArchiveTest extends TestCase
{
    use RefreshDatabase;
    private string $token;
    private const ID='018e5280-56b2-74e1-8d54-a832a2b32878';

    protected function setUp(): void {
        parent::setUp();
        $this->token=bin2hex(random_bytes(32));
        config(['api.token'=>$this->token]);
    }
    private function auth(): self { return $this->withToken($this->token); }
    private function lesson(array $changes=[]): array {
        return array_replace([
            'id'=>self::ID,'title'=>'Unidade','theme'=>'Igreja','quarter'=>'2026-04','date'=>'2026-11-22',
            'duration'=>60,'objectives'=>'Ler e discutir','references'=>'Efésios 4:1–6',
            'questions'=>'','outline'=>'','opening'=>10,'development'=>25,'discussion'=>20,'closing'=>5,'taught'=>false,
        ],$changes);
    }
    public function test_all_data_routes_require_a_token(): void {
        $this->getJson('/api/lessons')->assertUnauthorized();
        $this->getJson('/api/lessons/'.self::ID)->assertUnauthorized();
        $this->putJson('/api/lessons/'.self::ID,['revision'=>0,'lesson'=>$this->lesson()])->assertUnauthorized();
        $this->deleteJson('/api/lessons/'.self::ID,['revision'=>1])->assertUnauthorized();
        $this->assertDatabaseCount('lessons',0);
    }
    public function test_missing_or_short_server_token_fails_closed(): void {
        foreach ([null,'short'] as $token) {
            config(['api.token'=>$token]);
            $this->auth()->getJson('/api/lessons')->assertStatus(503);
        }
    }
    public function test_incorrect_token_does_not_read_or_write(): void {
        $this->withToken('incorrect')->putJson('/api/lessons/'.self::ID,['revision'=>0,'lesson'=>$this->lesson()])->assertUnauthorized();
        $this->assertDatabaseCount('lessons',0);
    }
    public function test_create_read_update_and_delete_preserve_the_frontend_contract(): void {
        $lesson=$this->lesson(['outline'=>"  Texto\ncom duas linhas  "]);
        $this->auth()->putJson('/api/lessons/'.self::ID,['revision'=>0,'lesson'=>$lesson])->assertCreated()->assertJsonPath('data.revision',1)->assertJsonPath('data.lesson',$lesson);
        $this->auth()->getJson('/api/lessons/'.self::ID)->assertOk()->assertJsonPath('data.lesson',$lesson);
        $lesson['taught']=true;
        $this->auth()->putJson('/api/lessons/'.self::ID,['revision'=>1,'lesson'=>$lesson])->assertOk()->assertJsonPath('data.revision',2)->assertJsonPath('data.lesson.taught',true);
        $this->auth()->deleteJson('/api/lessons/'.self::ID,['revision'=>2])->assertNoContent();
        $this->assertDatabaseCount('lessons',0);
    }
    public function test_stale_and_duplicate_writes_cannot_overwrite_newer_lessons(): void {
        $this->auth()->putJson('/api/lessons/'.self::ID,['revision'=>0,'lesson'=>$this->lesson()])->assertCreated();
        $this->auth()->putJson('/api/lessons/'.self::ID,['revision'=>0,'lesson'=>$this->lesson(['title'=>'Duplicada'])])->assertConflict();
        $this->auth()->putJson('/api/lessons/'.self::ID,['revision'=>1,'lesson'=>$this->lesson(['title'=>'Atualizada'])])->assertOk();
        $this->auth()->putJson('/api/lessons/'.self::ID,['revision'=>1,'lesson'=>$this->lesson(['title'=>'Antiga'])])->assertConflict();
        $this->auth()->deleteJson('/api/lessons/'.self::ID,['revision'=>1])->assertConflict();
        $this->auth()->getJson('/api/lessons/'.self::ID)->assertOk()->assertJsonPath('data.lesson.title','Atualizada')->assertJsonPath('data.revision',2);
    }
    public function test_unknown_lesson_is_not_found(): void {
        $this->auth()->getJson('/api/lessons/'.self::ID)->assertNotFound();
    }
    public function test_pagination_and_quarter_filter_are_stable(): void {
        foreach (['018e5280-56b2-74e1-8d54-a832a2b32878','018e5280-56b2-74e1-8d54-a832a2b32879'] as $id) {
            $this->auth()->putJson('/api/lessons/'.$id,['revision'=>0,'lesson'=>$this->lesson(['id'=>$id])])->assertCreated();
        }
        $this->auth()->getJson('/api/lessons?quarter=2026-04&limit=1&page=2')->assertOk()->assertJsonPath('meta.total',2)->assertJsonCount(1,'data')->assertJsonPath('data.0.lesson.id','018e5280-56b2-74e1-8d54-a832a2b32879');
        $this->auth()->getJson('/api/lessons?quarter=2026-03')->assertOk()->assertJsonCount(0,'data');
        foreach (['limit=0','limit=101','limit[]=1','page=-1','quarter[]=2026-04',"quarter=%27%20OR%201=1--"] as $query) $this->auth()->getJson('/api/lessons?'.$query)->assertUnprocessable();
    }
    public static function invalidLessons(): array {
        return [
            'empty title'=>[['title'=>'  ']], 'impossible date'=>[['date'=>'2026-02-30']], 'invalid quarter'=>[['quarter'=>'2026-05']],
            'over budget'=>[['opening'=>100]], 'negative time'=>[['discussion'=>-1]], 'fractional time'=>[['opening'=>1.2]],
            'oversized outline'=>[['outline'=>str_repeat('a',8001)]], 'object title'=>[['title'=>['bad']]],
            'unknown attribute'=>[['admin'=>true]], 'invalid id'=>[['id'=>'not-a-uuid']], 'wrong id'=>[['id'=>'018e5280-56b2-74e1-8d54-a832a2b32879']],
        ];
    }
    #[DataProvider('invalidLessons')]
    public function test_invalid_lessons_are_rejected_without_writes(array $changes): void {
        $this->auth()->putJson('/api/lessons/'.self::ID,['revision'=>0,'lesson'=>$this->lesson($changes)])->assertUnprocessable();
        $this->assertDatabaseCount('lessons',0);
    }
    public function test_json_only_and_body_limit(): void {
        $this->auth()->call('PUT','/api/lessons/'.self::ID,[],[],[],['CONTENT_TYPE'=>'text/plain','HTTP_AUTHORIZATION'=>'Bearer '.$this->token],'{}')->assertStatus(415);
        $this->auth()->call('PUT','/api/lessons/'.self::ID,[],[],[],['CONTENT_TYPE'=>'application/json','HTTP_AUTHORIZATION'=>'Bearer '.$this->token],str_repeat(' ',65537))->assertStatus(413);
        $this->auth()->call('PUT','/api/lessons/'.self::ID,[],[],[],['CONTENT_TYPE'=>'application/json','HTTP_AUTHORIZATION'=>'Bearer '.$this->token],'{')->assertStatus(422);
    }
    public function test_rate_limiting_and_public_health(): void {
        Cache::store('array')->flush();
        for ($i=0;$i<60;$i++) $this->getJson('/api/lessons')->assertUnauthorized();
        $this->getJson('/api/lessons')->assertStatus(429)->assertHeader('Retry-After');
        $this->getJson('/up')->assertOk();
    }
    public function test_unneeded_upload_routes_are_disabled(): void {
        $this->putJson('/storage/probe')->assertNotFound();
    }
}
