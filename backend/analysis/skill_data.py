"""
Skill Data Layer for ATS Engine.
Contains synonym mappings, skill groups, and master skill list.

GUARDRAIL: Skill groups are TIGHT — only truly interchangeable skills.
Do NOT mix loosely related tech.
"""

# ═══════════════════════════════════════════════════════════════
# LAYER 1: Direct Synonyms (same skill, different names)
# Key = canonical name, Values = alternative names
# ═══════════════════════════════════════════════════════════════

SKILL_SYNONYMS = {
    # Frontend frameworks
    'react': ['react.js', 'reactjs', 'react js'],
    'angular': ['angularjs', 'angular js', 'angular.js'],
    'vue': ['vue.js', 'vuejs', 'vue js'],
    'svelte': ['svelte.js', 'sveltejs'],
    'next.js': ['nextjs', 'next js', 'next.js'],
    'nuxt': ['nuxt.js', 'nuxtjs'],

    # Backend frameworks
    'node': ['node.js', 'nodejs', 'node js'],
    'express': ['express.js', 'expressjs'],
    'django': ['django rest framework', 'drf'],
    'flask': [],
    'fastapi': ['fast api'],
    'spring boot': ['springboot', 'spring-boot'],
    'ruby on rails': ['rails', 'ror'],
    'laravel': [],
    'asp.net': ['dotnet', '.net', 'dot net'],

    # Languages
    'javascript': ['js', 'es6', 'es2015', 'ecmascript'],
    'typescript': ['ts'],
    'python': ['python3', 'python 3'],
    'java': [],
    'c#': ['csharp', 'c sharp'],
    'c++': ['cpp', 'cplusplus'],
    'go': ['golang'],
    'rust': [],
    'php': [],
    'ruby': [],
    'swift': [],
    'kotlin': [],
    'scala': [],
    'r': ['r language', 'r programming'],

    # Databases
    'postgresql': ['postgres', 'psql', 'pgsql'],
    'mysql': ['my sql'],
    'mongodb': ['mongo'],
    'redis': [],
    'sqlite': ['sq lite'],
    'sql server': ['mssql', 'ms sql'],
    'dynamodb': ['dynamo db'],
    'firebase': ['firestore'],
    'elasticsearch': ['elastic search', 'elastic'],
    'cassandra': [],

    # Cloud
    'aws': ['amazon web services'],
    'gcp': ['google cloud', 'google cloud platform'],
    'azure': ['microsoft azure'],
    'heroku': [],
    'vercel': [],
    'netlify': [],
    'digitalocean': ['digital ocean'],

    # DevOps / Infra
    'docker': [],
    'kubernetes': ['k8s'],
    'terraform': [],
    'ansible': [],
    'jenkins': [],
    'github actions': ['gh actions'],
    'gitlab ci': ['gitlab ci/cd'],
    'circleci': ['circle ci'],
    'ci/cd': ['ci cd', 'ci-cd', 'continuous integration', 'continuous deployment'],
    'nginx': [],
    'apache': [],
    'linux': ['unix'],

    # CSS / Styling
    'tailwind': ['tailwind css', 'tailwindcss'],
    'bootstrap': [],
    'material ui': ['mui', 'material-ui'],
    'sass': ['scss'],
    'styled components': ['styled-components'],
    'css3': ['css 3', 'css'],
    'html5': ['html 5', 'html'],

    # Data / ML
    'machine learning': ['ml'],
    'deep learning': ['dl'],
    'tensorflow': ['tf'],
    'pytorch': ['py torch'],
    'scikit-learn': ['sklearn', 'scikit learn'],
    'pandas': [],
    'numpy': [],
    'tableau': [],
    'power bi': ['powerbi'],
    'apache spark': ['spark', 'pyspark'],

    # Mobile
    'react native': ['react-native'],
    'flutter': [],
    'ionic': [],
    'xamarin': [],

    # Tools
    'git': [],
    'github': [],
    'gitlab': [],
    'bitbucket': [],
    'jira': [],
    'confluence': [],
    'figma': [],
    'postman': [],
    'swagger': ['openapi'],

    # APIs / Protocols
    'rest api': ['restful', 'rest', 'restful api'],
    'graphql': ['graph ql'],
    'grpc': [],
    'websocket': ['websockets', 'web socket'],

    # Testing
    'jest': [],
    'mocha': [],
    'cypress': [],
    'selenium': [],
    'pytest': [],
    'junit': [],

    # Messaging / Queue
    'rabbitmq': ['rabbit mq'],
    'kafka': ['apache kafka'],
    'celery': [],

    # Other
    'agile': ['scrum', 'kanban methodology'],
    'microservices': ['micro services'],
    'serverless': [],
    'oauth': ['oauth2', 'oauth 2.0'],
    'jwt': ['json web token'],
}


# ═══════════════════════════════════════════════════════════════
# LAYER 2: Skill Groups (related skills → partial credit)
# GUARDRAIL: TIGHT groups only. These skills can reasonably
# substitute each other in a role. Do NOT mix loosely related tech.
# Partial credit = 30% (not 100%)
# ═══════════════════════════════════════════════════════════════

SKILL_GROUPS = {
    'frontend_framework': ['react', 'angular', 'vue', 'svelte'],
    'backend_framework': ['django', 'flask', 'express', 'fastapi', 'spring boot', 'ruby on rails', 'laravel'],
    'js_runtime': ['node', 'deno', 'bun'],
    'css_framework': ['tailwind', 'bootstrap', 'material ui'],
    'relational_db': ['mysql', 'postgresql', 'sqlite', 'sql server'],
    'nosql_db': ['mongodb', 'dynamodb', 'cassandra', 'firebase'],
    'container': ['docker', 'podman'],
    'orchestration': ['kubernetes', 'docker swarm'],
    'cloud_provider': ['aws', 'gcp', 'azure'],
    'mobile_crossplatform': ['react native', 'flutter', 'ionic', 'xamarin'],
    'version_control': ['git', 'github', 'gitlab', 'bitbucket'],
    'ci_cd_tool': ['jenkins', 'github actions', 'gitlab ci', 'circleci'],
    'js_testing': ['jest', 'mocha', 'cypress'],
    'python_testing': ['pytest', 'unittest'],
    'message_queue': ['rabbitmq', 'kafka', 'celery'],
    'data_viz': ['tableau', 'power bi'],
    'ml_framework': ['tensorflow', 'pytorch', 'scikit-learn'],
    'ssr_framework': ['next.js', 'nuxt'],
}


# ═══════════════════════════════════════════════════════════════
# MASTER SKILL LIST (flat set for JD extraction in Phase 6)
# Auto-generated from synonyms + groups
# ═══════════════════════════════════════════════════════════════

def _build_known_skills():
    """Build a flat set of all known skill names (canonical + synonyms)."""
    skills = set()
    # Add all canonical skill names
    for canonical, synonyms in SKILL_SYNONYMS.items():
        skills.add(canonical.lower())
        for syn in synonyms:
            if syn:  # skip empty lists
                skills.add(syn.lower())
    # Add any group members not already covered
    for group_name, members in SKILL_GROUPS.items():
        for member in members:
            skills.add(member.lower())
    return skills

KNOWN_SKILLS = _build_known_skills()


# ═══════════════════════════════════════════════════════════════
# HELPER: Reverse lookup — given a skill name, find its canonical form
# ═══════════════════════════════════════════════════════════════

def _build_synonym_lookup():
    """Build a reverse map: any synonym → canonical name."""
    lookup = {}
    for canonical, synonyms in SKILL_SYNONYMS.items():
        canonical_lower = canonical.lower()
        lookup[canonical_lower] = canonical_lower
        for syn in synonyms:
            if syn:
                lookup[syn.lower()] = canonical_lower
    return lookup

SYNONYM_LOOKUP = _build_synonym_lookup()


def _build_group_lookup():
    """Build a reverse map: skill → group name."""
    lookup = {}
    for group_name, members in SKILL_GROUPS.items():
        for member in members:
            lookup[member.lower()] = group_name
    return lookup

GROUP_LOOKUP = _build_group_lookup()


def get_canonical_name(skill_name):
    """Get the canonical name for a skill (or return original if not found)."""
    return SYNONYM_LOOKUP.get(skill_name.lower().strip(), skill_name.lower().strip())


def get_skill_group(skill_name):
    """Get the group name for a skill (or None if not in any group)."""
    canonical = get_canonical_name(skill_name)
    return GROUP_LOOKUP.get(canonical, None)


def are_in_same_group(skill_a, skill_b):
    """Check if two skills belong to the same group."""
    group_a = get_skill_group(skill_a)
    group_b = get_skill_group(skill_b)
    if group_a is None or group_b is None:
        return False
    return group_a == group_b


# ═══════════════════════════════════════════════════════════════
# LAYER 4: Skill Prerequisites (Phase 7)
# Maps skills to their foundation skills.
# If a candidate has all prerequisites for a missing skill,
# they get higher partial credit + lower teach-time.
# ═══════════════════════════════════════════════════════════════

SKILL_PREREQUISITES = {
    # Frontend frameworks
    'react': ['javascript', 'html', 'css'],
    'angular': ['javascript', 'typescript', 'html', 'css'],
    'vue': ['javascript', 'html', 'css'],
    'next.js': ['react', 'javascript'],
    'nuxt': ['vue', 'javascript'],
    'svelte': ['javascript', 'html', 'css'],

    # Backend frameworks
    'django': ['python'],
    'flask': ['python'],
    'fastapi': ['python'],
    'express': ['node', 'javascript'],
    'spring boot': ['java'],
    'ruby on rails': ['ruby'],
    'laravel': ['php'],
    'asp.net': ['c#'],

    # DevOps / Infrastructure
    'kubernetes': ['docker', 'linux'],
    'docker': ['linux'],
    'terraform': ['cloud computing'],
    'ansible': ['linux'],
    'jenkins': ['linux', 'git'],

    # Cloud
    'aws': ['cloud computing', 'linux'],
    'azure': ['cloud computing'],
    'gcp': ['cloud computing'],

    # Databases
    'mongodb': ['javascript'],
    'redis': ['linux'],
    'elasticsearch': ['linux'],

    # Data
    'pandas': ['python'],
    'numpy': ['python'],
    'tensorflow': ['python', 'numpy'],
    'pytorch': ['python', 'numpy'],
    'spark': ['python', 'java'],

    # Mobile
    'react native': ['react', 'javascript'],
    'flutter': ['dart'],
    'swift': [],
    'kotlin': ['java'],
}
