#!/usr/bin/env bash

san-ssr -t php -j '{"nsPrefix": "demo\\"}' src/index.ts > dist/index.php
