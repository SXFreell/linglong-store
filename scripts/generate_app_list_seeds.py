#!/usr/bin/env python3
"""生成应用列表 seed 数据。

直接请求匿名接口，将推荐页、全部应用默认页、榜单页和推荐轮播的前几页数据
写入 `src/services/appListCache/seeds/appListSeeds.ts`，便于首屏秒开。
"""

from __future__ import annotations

import json
import pathlib
import urllib.request
from datetime import datetime, timezone

BASE_URL = 'https://storeapi.linyaps.org.cn'
OUTPUT_PATH = pathlib.Path(__file__).resolve().parents[1] / 'src/services/appListCache/seeds/appListSeeds.ts'
DEFAULT_REPO = 'stable'
SUPPORTED_ARCHES = ['x86_64', 'arm64']
APP_MAIN_DTO_FIELDS = {
    'id',
    'appId',
    'icon',
    'zhName',
    'name',
    'categoryId',
    'categoryName',
    'channel',
    'arch',
    'description',
    'kind',
    'module',
    'repoName',
    'runtime',
    'size',
    'uabUrl',
    'user',
    'version',
    'installCount',
    'uninstallCount',
    'flag',
    'createTime',
    'updateTime',
    'isDelete',
    'isWelcomed',
    'appScreenshotList',
}


def normalize_arch(arch: str) -> str:
    if arch == 'aarch64':
        return 'arm64'
    return arch


def build_cache_key(scope: str, repo_name: str, arch: str, params: dict[str, object] | None = None) -> str:
    normalized_params = {}
    if params:
        for key in sorted(params.keys()):
            value = params[key]
            if value is not None:
                normalized_params[key] = value

    return f'{scope}|repo={repo_name}|arch={normalize_arch(arch)}|params={json.dumps(normalized_params, ensure_ascii=False, separators=(",", ":"))}'


def post_json(path: str, payload: dict[str, object]) -> dict[str, object]:
    request = urllib.request.Request(
        f'{BASE_URL}{path}',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))


def strip_none_fields(value: object) -> object:
    # seed 文件直接参与 TypeScript 编译，这里先把后端返回的 null 清洗掉，避免污染前端可选字段类型。
    if isinstance(value, dict):
        return {
            key: strip_none_fields(item)
            for key, item in value.items()
            if item is not None
        }

    if isinstance(value, list):
        return [strip_none_fields(item) for item in value]

    return value


def sanitize_app_record(record: object) -> dict[str, object]:
    # seed 仅缓存列表页已声明的字段，避免匿名接口附带扩展字段时破坏 TS 编译。
    if not isinstance(record, dict):
        return {}

    sanitized = strip_none_fields(record)
    if not isinstance(sanitized, dict):
        return {}

    return {
        key: value
        for key, value in sanitized.items()
        if key in APP_MAIN_DTO_FIELDS
    }


def fetch_paginated_seed(scope: str, path: str, arch: str, page_size: int, page_count: int, params: dict[str, object] | None = None) -> tuple[str, dict[str, object]]:
    merged_records: list[dict[str, object]] = []
    total_pages = 1

    for page_no in range(1, page_count + 1):
        payload = {
            'repoName': DEFAULT_REPO,
            'arch': arch,
            'pageNo': page_no,
            'pageSize': page_size,
        }
        if params:
            payload.update(params)

        response = post_json(path, payload)
        data = response.get('data') or {}
        if not isinstance(data, dict):
            continue

        records = data.get('records') or []
        if isinstance(records, list):
            merged_records.extend(sanitize_app_record(record) for record in records)
        total_pages = max(1, int(data.get('pages') or 1))

    cache_key = build_cache_key(scope, DEFAULT_REPO, arch, params)
    snapshot = {
        'updatedAt': datetime.now(timezone.utc).isoformat(),
        'pageSize': page_size,
        'cachedPages': page_count,
        'totalPages': total_pages,
        'records': merged_records,
    }
    return cache_key, snapshot


def fetch_list_seed(scope: str, path: str, arch: str, params: dict[str, object] | None = None) -> tuple[str, dict[str, object]]:
    payload = {
        'repoName': DEFAULT_REPO,
        'arch': arch,
    }
    if params:
        payload.update(params)

    response = post_json(path, payload)
    data = response.get('data') or []
    if not isinstance(data, list):
        data = []
    else:
        data = [sanitize_app_record(item) for item in data]

    cache_key = build_cache_key(scope, DEFAULT_REPO, arch, params)
    snapshot = {
        'updatedAt': datetime.now(timezone.utc).isoformat(),
        'pageSize': max(len(data), 1),
        'cachedPages': 1,
        'totalPages': 1,
        'records': data,
    }
    return cache_key, snapshot


def main() -> None:
    seeds: dict[str, dict[str, object]] = {}

    for arch in SUPPORTED_ARCHES:
        for cache_key, snapshot in [
            fetch_paginated_seed('recommend-main', '/visit/getWelcomeAppList', arch, 10, 3),
            fetch_list_seed('recommend-carousel', '/visit/getWelcomeCarouselList', arch),
            fetch_paginated_seed('all-apps-main', '/visit/getSearchAppList', arch, 30, 3, {'categoryId': ''}),
            fetch_paginated_seed('ranking-install', '/visit/getInstallAppList', arch, 10, 3),
            fetch_paginated_seed('ranking-new', '/visit/getNewAppList', arch, 10, 3),
        ]:
            seeds[cache_key] = snapshot

    content = [
        "import type { AppListCacheSnapshot } from '../types'",
        '',
        '// 由 scripts/generate_app_list_seeds.py 自动生成，勿手工逐项编辑。',
        'export const APP_LIST_SEEDS: Record<string, AppListCacheSnapshot> = '
        + json.dumps(seeds, ensure_ascii=False, indent=2)
        + ' as const',
        '',
    ]
    OUTPUT_PATH.write_text('\n'.join(content), encoding='utf-8')
    print(f'Wrote {OUTPUT_PATH}')


if __name__ == '__main__':
    main()
