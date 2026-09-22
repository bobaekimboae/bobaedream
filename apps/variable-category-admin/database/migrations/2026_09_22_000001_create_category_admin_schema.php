<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role', 32)->default('viewer')->index();
            $table->rememberToken();
            $table->timestamps();
        });
        Schema::create('password_reset_tokens', function (Blueprint $table): void {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
        Schema::create('sessions', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
        Schema::create('cache', function (Blueprint $table): void {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });
        Schema::create('cache_locks', function (Blueprint $table): void {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });
        Schema::create('jobs', function (Blueprint $table): void {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });
        Schema::create('failed_jobs', function (Blueprint $table): void {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        Schema::create('vehicle_types', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('system_key', 64)->unique();
            $table->string('name_ko', 120);
            $table->string('name_en', 120)->nullable();
            $table->string('namespace', 32)->default('VEHICLE_TYPE');
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestampsTz();
            $table->softDeletesTz();
        });
        Schema::create('category_nodes', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('vehicle_type_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('parent_id')->nullable()->references('id')->on('category_nodes')->restrictOnDelete();
            $table->string('system_key', 96)->unique();
            $table->string('name_ko', 160);
            $table->string('name_en', 160)->nullable();
            $table->unsignedSmallInteger('depth')->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_leaf')->default(false);
            $table->boolean('is_active')->default(true)->index();
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['vehicle_type_id', 'parent_id', 'sort_order']);
        });
        Schema::create('field_definitions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('system_key', 96)->unique();
            $table->string('label_ko', 160);
            $table->string('label_en', 160)->nullable();
            $table->string('data_type', 32);
            $table->string('ui_component', 32);
            $table->string('unit', 32)->nullable();
            $table->json('validation_rules')->default('{}');
            $table->json('options')->default('[]');
            $table->boolean('is_sensitive')->default(false);
            $table->boolean('is_active')->default(true)->index();
            $table->timestampsTz();
        });
        Schema::create('field_sets', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('system_key', 96);
            $table->string('name_ko', 160);
            $table->unsignedInteger('schema_version');
            $table->string('status', 24)->default('DRAFT')->index();
            $table->json('applies_to')->default('{}');
            $table->timestampTz('published_at')->nullable();
            $table->timestampsTz();
            $table->unique(['system_key', 'schema_version']);
        });
        Schema::create('field_set_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('field_set_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('field_definition_id')->constrained()->restrictOnDelete();
            $table->string('context', 24)->default('REGISTRATION');
            $table->string('required_level', 24)->default('OPTIONAL');
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('visibility_rule')->default('{}');
            $table->timestampsTz();
            $table->unique(['field_set_id', 'field_definition_id', 'context'], 'field_set_item_unique');
        });
        Schema::create('placements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('system_key', 96)->unique();
            $table->string('name_ko', 160);
            $table->string('kind', 32);
            $table->string('analytics_placement_key', 128)->unique();
            $table->boolean('is_active')->default(true)->index();
            $table->timestampsTz();
        });
        Schema::create('placement_rules', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('placement_id')->constrained()->cascadeOnDelete();
            $table->string('system_key', 128)->unique();
            $table->unsignedInteger('version');
            $table->json('predicate');
            $table->string('status', 24)->default('DRAFT')->index();
            $table->string('breaking_change', 16)->default('NONE');
            $table->timestampsTz();
            $table->unique(['placement_id', 'version']);
        });
        Schema::create('release_bundles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('version', 48)->unique();
            $table->string('status', 24)->default('DRAFT')->index();
            $table->json('manifest');
            $table->string('manifest_hash', 64);
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('qa_approved_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('published_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestampTz('qa_approved_at')->nullable();
            $table->timestampTz('published_at')->nullable();
            $table->timestampsTz();
        });
        Schema::create('release_pointers', function (Blueprint $table): void {
            $table->string('scope', 64)->primary();
            $table->foreignUuid('current_release_bundle_id')->nullable()->references('id')->on('release_bundles')->restrictOnDelete();
            $table->foreignUuid('candidate_release_bundle_id')->nullable()->references('id')->on('release_bundles')->restrictOnDelete();
            $table->foreignUuid('previous_release_bundle_id')->nullable()->references('id')->on('release_bundles')->restrictOnDelete();
            $table->timestampsTz();
        });
        Schema::create('external_code_mappings', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('source_system', 64);
            $table->string('source_namespace', 64);
            $table->string('source_code', 160);
            $table->string('target_namespace', 64);
            $table->string('target_system_key', 160);
            $table->unsignedInteger('mapping_version')->default(1);
            $table->string('status', 24)->default('ACTIVE')->index();
            $table->timestampTz('valid_from')->nullable();
            $table->timestampTz('valid_to')->nullable();
            $table->timestampsTz();
            $table->unique(['source_system', 'source_namespace', 'source_code', 'mapping_version'], 'external_mapping_unique');
        });
        Schema::create('listing_taxonomy_assignments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('listing_id', 128)->index();
            $table->foreignUuid('vehicle_type_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('primary_category_node_id')->constrained('category_nodes')->restrictOnDelete();
            $table->unsignedInteger('schema_version');
            $table->string('mapping_source', 32);
            $table->decimal('mapping_confidence', 5, 4)->nullable();
            $table->timestampsTz();
            $table->unique('listing_id');
        });
        Schema::create('listing_attribute_values', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('listing_id', 128)->index();
            $table->foreignUuid('field_definition_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('schema_version');
            $table->text('value_text')->nullable();
            $table->decimal('value_number', 20, 4)->nullable();
            $table->boolean('value_boolean')->nullable();
            $table->timestampTz('value_date')->nullable();
            $table->json('value_json')->nullable();
            $table->timestampsTz();
            $table->unique(['listing_id', 'field_definition_id', 'schema_version'], 'listing_attribute_unique');
        });
        Schema::create('listing_placement_snapshots', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('listing_id', 128)->index();
            $table->foreignUuid('placement_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('release_bundle_id')->constrained()->restrictOnDelete();
            $table->string('resolved_hash', 64)->index();
            $table->json('matched_reason');
            $table->timestampTz('resolved_at');
            $table->unique(['listing_id', 'placement_id', 'release_bundle_id'], 'listing_placement_unique');
        });
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 96);
            $table->string('subject_type', 160);
            $table->string('subject_id', 160);
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->string('previous_hash', 64)->nullable();
            $table->string('record_hash', 64)->unique();
            $table->string('request_id', 64)->nullable()->index();
            $table->timestampTz('created_at')->useCurrent();
            $table->index(['subject_type', 'subject_id', 'created_at']);
        });
        Schema::create('outbox_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('event_type', 96)->index();
            $table->string('aggregate_type', 96);
            $table->string('aggregate_id', 160);
            $table->json('payload');
            $table->timestampTz('occurred_at');
            $table->timestampTz('published_at')->nullable()->index();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestampsTz();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared(<<<'SQL'
CREATE FUNCTION prevent_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER audit_logs_immutable BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
SQL);
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_immutable ON audit_logs; DROP FUNCTION IF EXISTS prevent_audit_mutation();');
        }
        foreach ([
            'outbox_events', 'audit_logs', 'listing_placement_snapshots', 'listing_attribute_values',
            'listing_taxonomy_assignments', 'external_code_mappings', 'release_pointers', 'release_bundles',
            'placement_rules', 'placements', 'field_set_items', 'field_sets', 'field_definitions',
            'category_nodes', 'vehicle_types', 'failed_jobs', 'jobs', 'cache_locks', 'cache', 'sessions',
            'password_reset_tokens', 'users',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
