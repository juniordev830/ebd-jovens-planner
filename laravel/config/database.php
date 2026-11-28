<?php
return [
    'default' => env('DB_CONNECTION', 'pgsql'),
    'connections' => [
        'pgsql' => [
            'driver' => 'pgsql', 'host' => env('DB_HOST', '127.0.0.1'), 'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', 'ebd'), 'username' => env('DB_USERNAME', 'ebd'), 'password' => env('DB_PASSWORD'),
            'charset' => 'utf8', 'prefix' => '', 'search_path' => 'public', 'sslmode' => env('DB_SSLMODE', 'prefer'),
        ],
        'sqlite' => ['driver' => 'sqlite', 'database' => env('DB_DATABASE', database_path('database.sqlite')), 'prefix' => '', 'foreign_key_constraints' => true, 'busy_timeout' => 5000],
    ],
    'migrations' => ['table' => 'migrations', 'update_date_on_publish' => true],
];
